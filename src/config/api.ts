/**
 * API Configuration
 * 
 * In production, these values should come from environment variables.
 * The base URL should point to your backend API server.
 * 
 * NEVER store secrets here. Only public configuration.
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  TOKEN_REFRESH_THRESHOLD: 300, // seconds before expiry to trigger refresh
} as const;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
  },
  STUDENTS: "/students",
  TEACHERS: "/teachers",
  CLASSES: "/classes",
  SECTIONS: "/sections",
  ATTENDANCE: "/attendance",
  EXAMS: "/exams",
  GRADES: "/grades",
  FEES: "/fees",
  PAYMENTS: "/payments",
  ANNOUNCEMENTS: "/announcements",
  REPORTS: "/reports",
  AUDIT: "/audit-logs",
  SETTINGS: "/settings",
  USERS: "/users",
} as const;
