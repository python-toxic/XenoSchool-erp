import {
  LayoutDashboard, Users, GraduationCap, School, CalendarCheck,
  FileText, CreditCard, Clock, Megaphone, BarChart3, Settings,
  Shield, UserCircle,
} from "lucide-react";
import { Permission } from "@/types/models";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission: Permission;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, requiredPermission: "dashboard:view" },
  { label: "Students", path: "/students", icon: Users, requiredPermission: "students:view" },
  { label: "Teachers", path: "/teachers", icon: GraduationCap, requiredPermission: "teachers:view" },
  { label: "Classes", path: "/classes", icon: School, requiredPermission: "classes:view" },
  { label: "Attendance", path: "/attendance", icon: CalendarCheck, requiredPermission: "attendance:view" },
  { label: "Exams & Grades", path: "/exams", icon: FileText, requiredPermission: "exams:view" },
  { label: "Fees & Payments", path: "/fees", icon: CreditCard, requiredPermission: "fees:view" },
  { label: "Timetable", path: "/timetable", icon: Clock, requiredPermission: "timetable:view" },
  { label: "Announcements", path: "/announcements", icon: Megaphone, requiredPermission: "announcements:view" },
  { label: "Parents", path: "/parents", icon: UserCircle, requiredPermission: "parents:view" },
  { label: "Reports", path: "/reports", icon: BarChart3, requiredPermission: "reports:view" },
  { label: "Settings", path: "/settings", icon: Settings, requiredPermission: "settings:view" },
  { label: "Audit Logs", path: "/audit", icon: Shield, requiredPermission: "audit:view" },
];
