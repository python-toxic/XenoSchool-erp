// ─── Base Types ──────────────────────────────────────────────

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Auditable {
  createdBy: string;
  updatedBy: string;
}

// ─── Auth & RBAC ─────────────────────────────────────────────

export type AppRole =
  | "super_admin"
  | "admin"
  | "principal"
  | "teacher"
  | "accountant"
  | "parent"
  | "student";

export type Permission =
  | "dashboard:view"
  | "students:view"
  | "students:create"
  | "students:edit"
  | "students:delete"
  | "teachers:view"
  | "teachers:create"
  | "teachers:edit"
  | "teachers:delete"
  | "classes:view"
  | "classes:create"
  | "classes:edit"
  | "classes:delete"
  | "attendance:view"
  | "attendance:mark"
  | "attendance:edit"
  | "exams:view"
  | "exams:create"
  | "exams:edit"
  | "exams:grade"
  | "fees:view"
  | "fees:create"
  | "fees:collect"
  | "fees:report"
  | "timetable:view"
  | "timetable:create"
  | "timetable:edit"
  | "announcements:view"
  | "announcements:create"
  | "announcements:edit"
  | "announcements:delete"
  | "reports:view"
  | "reports:export"
  | "settings:view"
  | "settings:edit"
  | "roles:manage"
  | "audit:view"
  | "parents:view"
  | "parents:create"
  | "parents:edit";

export interface User extends Timestamps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin: string | null;
  avatarUrl: string | null;
}

// ─── Domain Models ───────────────────────────────────────────

export interface Student extends Timestamps, Auditable {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  email: string | null;
  phone: string | null;
  address: string;
  classId: string;
  sectionId: string;
  parentId: string;
  isActive: boolean;
  enrollmentDate: string;
}

export interface Parent extends Timestamps, Auditable {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  occupation: string | null;
  studentIds: string[];
}

export interface Teacher extends Timestamps, Auditable {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  qualification: string;
  subjects: string[];
  dateOfJoining: string;
  isActive: boolean;
}

export interface SchoolClass extends Timestamps, Auditable {
  id: string;
  name: string;
  grade: number;
  sections: Section[];
  academicYear: string;
}

export interface Section extends Timestamps {
  id: string;
  name: string;
  classId: string;
  classTeacherId: string | null;
  capacity: number;
  currentStrength: number;
}

export interface AttendanceRecord extends Timestamps {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  markedBy: string;
  remarks: string | null;
}

export interface Exam extends Timestamps, Auditable {
  id: string;
  name: string;
  type: "midterm" | "final" | "quiz" | "assignment";
  subject: string;
  classId: string;
  date: string;
  totalMarks: number;
  passingMarks: number;
}

export interface Grade extends Timestamps {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  grade: string;
  remarks: string | null;
  gradedBy: string;
}

export interface FeeInvoice extends Timestamps, Auditable {
  id: string;
  studentId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "partial";
  description: string;
  academicYear: string;
}

export interface Payment extends Timestamps {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "bank_transfer" | "online" | "cheque";
  transactionId: string | null;
  receivedBy: string;
}

export interface Announcement extends Timestamps, Auditable {
  id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high" | "urgent";
  targetRoles: AppRole[];
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
}

export interface AuditLog extends Timestamps {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  feeCollectionRate: number;
  pendingFees: number;
  upcomingExams: number;
  recentAnnouncements: number;
}
