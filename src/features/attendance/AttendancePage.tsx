import React from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/auth/AuthContext";
import TeacherAttendanceView from "./TeacherAttendanceView";
import AdminAttendanceView from "./AdminAttendanceView";
import StudentAttendanceView from "./StudentAttendanceView";
import { CalendarCheck } from "lucide-react";

const AttendancePage: React.FC = () => {
    const { user, hasRole } = useAuth();

    const isTeacher = hasRole("teacher");
    const isStudent = hasRole("student");
    // Admin, super_admin, principal all get the admin overview
    const isAdmin = hasRole("admin") || hasRole("super_admin") || hasRole("principal");

    const subtitle = isTeacher
        ? "Mark and manage class attendance"
        : isStudent
            ? "Your personal attendance record"
            : "School-wide attendance overview";

    return (
        <div className="flex-1 flex flex-col min-h-screen">
            <AppHeader
                title="Attendance"
                subtitle={subtitle}
            />
            <div className="page-container py-6">
                {isTeacher && user && (
                    <TeacherAttendanceView
                        markedBy={`${user.firstName} ${user.lastName}`}
                    />
                )}
                {isAdmin && <AdminAttendanceView />}
                {isStudent && <StudentAttendanceView />}
                {!isTeacher && !isAdmin && !isStudent && (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <CalendarCheck className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-base font-medium">No attendance view for your role.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendancePage;
