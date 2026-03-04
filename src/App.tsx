import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import StudentsPage from "@/features/students/StudentsPage";
import AdmissionPage from "@/features/students/AdmissionPage";
import TeachersPage from "@/features/teachers/TeachersPage";
import ClassesPage from "@/features/academic/classes/ClassesDashboard";
import {
  ExamsPage, FeesPage,
  TimetablePage, AnnouncementsPage, ParentsPage,
  ReportsPage, SettingsPage, AuditPage,
} from "@/features/stubs/ModuleStubs";
import AttendancePage from "@/features/attendance/AttendancePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Routes */}
            <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
              <Route path="/dashboard" element={<PermissionGuard permission="dashboard:view"><DashboardPage /></PermissionGuard>} />
              <Route path="/students" element={<PermissionGuard permission="students:view"><StudentsPage /></PermissionGuard>} />
              <Route path="/students/admission" element={<PermissionGuard permission="students:create"><AdmissionPage /></PermissionGuard>} />
              <Route path="/teachers" element={<PermissionGuard permission="teachers:view"><TeachersPage /></PermissionGuard>} />
              <Route path="/classes" element={<PermissionGuard permission="classes:view"><ClassesPage /></PermissionGuard>} />
              <Route path="/attendance" element={<PermissionGuard permission="attendance:view"><AttendancePage /></PermissionGuard>} />
              <Route path="/exams" element={<PermissionGuard permission="exams:view"><ExamsPage /></PermissionGuard>} />
              <Route path="/fees" element={<PermissionGuard permission="fees:view"><FeesPage /></PermissionGuard>} />
              <Route path="/timetable" element={<PermissionGuard permission="timetable:view"><TimetablePage /></PermissionGuard>} />
              <Route path="/announcements" element={<PermissionGuard permission="announcements:view"><AnnouncementsPage /></PermissionGuard>} />
              <Route path="/parents" element={<PermissionGuard permission="parents:view"><ParentsPage /></PermissionGuard>} />
              <Route path="/reports" element={<PermissionGuard permission="reports:view"><ReportsPage /></PermissionGuard>} />
              <Route path="/settings" element={<PermissionGuard permission="settings:view"><SettingsPage /></PermissionGuard>} />
              <Route path="/audit" element={<PermissionGuard permission="audit:view"><AuditPage /></PermissionGuard>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
