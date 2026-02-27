# Secure Architecture Guide — SchoolERP

## 1. System Overview

SchoolERP is a modular, role-based school management system designed for production deployment in education institutions. The architecture follows a strict separation of concerns with a React + TypeScript frontend and a backend-agnostic API contract layer.

**Core principles:**
- Security by default — no data accessible without explicit permission
- API-first — all data flows through a documented service layer
- Audit-friendly — every mutation is logged
- Privacy-aware — FERPA and GDPR-compliant data handling patterns

---

## 2. Authentication Flow

```
┌──────────┐     POST /auth/login      ┌──────────┐
│  Client   │ ──────────────────────►   │  Server  │
│  (React)  │  { email, password }      │  (API)   │
│           │ ◄──────────────────────── │          │
│           │  Set-Cookie: access_token │          │
│           │  Set-Cookie: refresh_token│          │
└──────────┘  (HTTP-only, Secure,       └──────────┘
               SameSite=Strict)
```

### Flow:
1. User submits credentials via login form
2. Server validates credentials against hashed password store
3. Server generates JWT access token (15min TTL) and refresh token (7d TTL)
4. Tokens are set as **HTTP-only, Secure, SameSite=Strict** cookies
5. Client includes cookies automatically via `credentials: "include"`
6. On 401 response, client attempts silent refresh via `/auth/refresh`
7. On refresh failure, client dispatches logout event and redirects to `/login`

### Why HTTP-only cookies?
- Prevents XSS-based token theft (JavaScript cannot access the token)
- Automatic inclusion on every request (no manual header management)
- Server controls token lifecycle entirely

---

## 3. JWT Lifecycle

| Token | Storage | TTL | Rotation |
|-------|---------|-----|----------|
| Access Token | HTTP-only cookie | 15 minutes | On refresh |
| Refresh Token | HTTP-only cookie | 7 days | On use (rotate) |

### Backend requirements:
- Store refresh token hash in database (not the raw token)
- Invalidate all tokens on password change
- Maintain token blacklist for immediate revocation
- Include `jti` (JWT ID) claim for revocation tracking

---

## 4. Role & Permission Matrix

### Roles
| Role | Description |
|------|-------------|
| super_admin | Full system access, can manage roles |
| admin | All operations except role management |
| principal | Read-most, announcements, reports |
| teacher | Own classes, attendance, grading |
| accountant | Fee and payment operations |
| parent | View own children's data |
| student | View own data |

### Permission Format
Permissions follow the pattern: `resource:action`

Example: `students:view`, `students:create`, `fees:collect`

### Frontend Guards
```tsx
// Route-level: PermissionGuard component
<Route path="/students" element={
  <PermissionGuard permission="students:view">
    <StudentsPage />
  </PermissionGuard>
} />

// Inline: Can component
<Can permission="students:create">
  <Button>Add Student</Button>
</Can>
```

### Backend Validation (CRITICAL)
**Frontend guards are for UX only.** The backend MUST:
1. Extract user from JWT on every request
2. Look up user role from database (not from JWT claims alone)
3. Check permission against the role-permission matrix
4. Return 403 if unauthorized
5. Log the unauthorized attempt

---

## 5. API Contract Specification

### Base URL
```
{API_BASE_URL}/api/v1
```

### Authentication Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Authenticate user |
| POST | /auth/logout | Invalidate session |
| POST | /auth/refresh | Refresh access token |
| GET | /auth/me | Get current user profile |

### Resource Endpoints (RESTful)
| Resource | GET (list) | GET (single) | POST | PUT | DELETE |
|----------|-----------|--------------|------|-----|--------|
| /students | ✅ | ✅ | ✅ | ✅ | ✅ |
| /teachers | ✅ | ✅ | ✅ | ✅ | ✅ |
| /classes | ✅ | ✅ | ✅ | ✅ | ✅ |
| /attendance | ✅ | ✅ | ✅ | ✅ | ❌ |
| /exams | ✅ | ✅ | ✅ | ✅ | ✅ |
| /grades | ✅ | ✅ | ✅ | ✅ | ❌ |
| /fees | ✅ | ✅ | ✅ | ✅ | ❌ |
| /payments | ✅ | ✅ | ✅ | ❌ | ❌ |
| /announcements | ✅ | ✅ | ✅ | ✅ | ✅ |
| /audit-logs | ✅ | ✅ | ❌ | ❌ | ❌ |

### Standard Response Format
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150 },
  "error": null
}
```

---

## 6. Database Schema Proposal

### Core Tables
```sql
-- Users & Auth
users (id UUID PK, email, password_hash, first_name, last_name, is_active, last_login, timestamps)
user_roles (id UUID PK, user_id FK, role ENUM, UNIQUE(user_id, role))
refresh_tokens (id UUID PK, user_id FK, token_hash, expires_at, revoked_at)

-- Academic
students (id UUID PK, admission_number UNIQUE, first_name, last_name, dob, gender, class_id FK, section_id FK, parent_id FK, timestamps, audit_fields)
teachers (id UUID PK, employee_id UNIQUE, first_name, last_name, email, department, timestamps, audit_fields)
classes (id UUID PK, name, grade, academic_year, timestamps, audit_fields)
sections (id UUID PK, name, class_id FK, class_teacher_id FK, capacity)
parents (id UUID PK, first_name, last_name, email, phone, timestamps, audit_fields)

-- Operations
attendance_records (id UUID PK, student_id FK, class_id FK, date, status ENUM, marked_by FK, timestamps)
exams (id UUID PK, name, type ENUM, subject, class_id FK, date, total_marks, passing_marks, timestamps, audit_fields)
grades (id UUID PK, exam_id FK, student_id FK, marks_obtained, grade, graded_by FK, timestamps)

-- Finance
fee_invoices (id UUID PK, student_id FK, invoice_number UNIQUE, amount, due_date, status ENUM, timestamps, audit_fields)
payments (id UUID PK, invoice_id FK, student_id FK, amount, payment_date, payment_method ENUM, transaction_id, received_by FK, timestamps)

-- Communication
announcements (id UUID PK, title, content, priority ENUM, target_roles, is_published, timestamps, audit_fields)

-- System
audit_logs (id UUID PK, user_id FK, action, resource, resource_id, details JSONB, ip_address, user_agent, created_at)
```

---

## 7. Audit Log Schema

Every state-changing operation MUST generate an audit log entry:

```typescript
interface AuditLog {
  id: string;           // UUID
  userId: string;       // Who performed the action
  action: string;       // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  resource: string;     // students, teachers, fees, etc.
  resourceId: string;   // ID of affected resource
  details: object;      // Before/after values for updates
  ipAddress: string;    // Client IP
  userAgent: string;    // Client user agent
  createdAt: string;    // Timestamp (never updatable)
}
```

### Implementation:
- Backend middleware automatically logs all mutations
- Frontend sends `X-Request-ID` header for correlation
- Logs are append-only (no UPDATE or DELETE on audit_logs table)
- Retention: 3 years minimum for compliance

---

## 8. Secure Deployment Guidelines

### Environment Variables Required
```env
DATABASE_URL=          # PostgreSQL connection string
JWT_SECRET=            # Minimum 256-bit random secret
JWT_REFRESH_SECRET=    # Separate secret for refresh tokens
ALLOWED_ORIGINS=       # CORS whitelist
SESSION_DOMAIN=        # Cookie domain
NODE_ENV=production    # Never expose debug info in production
```

### Infrastructure Checklist
- [ ] HTTPS enforced (HSTS header)
- [ ] Database connections via SSL
- [ ] Rate limiting on auth endpoints (5 attempts/minute)
- [ ] Request size limits (10MB max)
- [ ] CORS configured for specific origins only
- [ ] CSP headers configured
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy: strict-origin-when-cross-origin

---

## 9. Environment Variable Strategy

**NEVER hardcode secrets.** All sensitive configuration must come from environment variables.

| Variable | Purpose | Example |
|----------|---------|---------|
| DATABASE_URL | DB connection | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Access token signing | Random 64-char hex |
| JWT_REFRESH_SECRET | Refresh token signing | Random 64-char hex |
| ALLOWED_ORIGINS | CORS whitelist | https://school.example.com |
| SMTP_HOST | Email service | smtp.sendgrid.net |
| SMTP_API_KEY | Email auth | SG.xxxxx |

### Frontend environment variables:
- Prefix with `VITE_` for Vite projects
- ONLY public configuration (API base URL, feature flags)
- NEVER include secrets in frontend env vars

---

## 10. Replacing Mock Services with Production APIs

The frontend uses a service abstraction layer (`src/services/api-client.ts`):

1. **Set `VITE_API_BASE_URL`** to your production API endpoint
2. **Remove mock data** from feature pages and replace with API calls using the `apiClient`
3. **Remove mock user** from `AuthContext.tsx` — the `login()` function should call the real `/auth/login` endpoint
4. **Implement real token refresh** — the `refreshToken()` method in api-client already handles the flow

### Migration steps:
```typescript
// Before (mock):
const MOCK_STUDENTS = [...];

// After (production):
import { apiClient } from "@/services/api-client";
const { data: students } = await apiClient.get<Student[]>("/students");
```

---

## 11. Scaling Strategy

### Horizontal Scaling
- Stateless JWT authentication enables horizontal API scaling
- Database connection pooling (PgBouncer recommended)
- Redis for session blacklist and rate limiting

### Performance
- Pagination on all list endpoints (default: 20, max: 100)
- Database indexes on foreign keys and frequently queried columns
- Lazy-loaded frontend routes for code splitting

### Multi-tenancy (future)
- Schema-per-tenant or tenant_id column approach
- RLS policies scoped to tenant

---

## 12. Data Privacy Considerations

### FERPA Compliance (US)
- Student education records are protected
- Only authorized school officials should access student data
- Parents have right to inspect and review records
- Implement data access logging for all student record views

### GDPR Compliance (EU)
- Implement data export functionality (right to portability)
- Support data deletion requests (right to erasure)
- Consent management for data processing
- Data retention policies with automatic purging
- Privacy by design — minimize data collection

### Implementation:
- All PII fields encrypted at rest
- Access to student/parent data logged in audit trail
- Role-based data visibility (teachers see only their classes)
- Data export API endpoint for compliance requests

---

## 13. Logging & Monitoring Strategy

### Application Logging
- Structured JSON logging (timestamp, level, message, context)
- Log levels: ERROR, WARN, INFO, DEBUG
- No PII in logs (mask email, phone numbers)
- Correlation IDs across request lifecycle

### Monitoring
- Health check endpoint: `GET /health`
- Metrics: request count, latency p50/p95/p99, error rate
- Alerts: auth failure spikes, 5xx rate > 1%, DB connection failures

### Tools (recommended)
- Logging: ELK Stack or CloudWatch
- Monitoring: Prometheus + Grafana or Datadog
- Error tracking: Sentry
- Uptime: Pingdom or Better Uptime

---

## 14. CSRF Mitigation

- **SameSite=Strict** cookies prevent cross-origin cookie submission
- **CSRF meta tag** included in HTML, sent as `X-CSRF-Token` header
- Backend validates CSRF token on all state-changing requests (POST, PUT, DELETE)
- Double-submit cookie pattern as fallback

## 15. XSS Prevention

- React's default JSX escaping prevents most XSS
- **No `dangerouslySetInnerHTML`** without DOMPurify sanitization
- CSP headers restrict inline scripts and eval
- Input validation with Zod schemas on all forms
- Output encoding for any user-generated content displayed in the UI
