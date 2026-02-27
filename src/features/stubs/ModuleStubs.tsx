import React from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Construction } from "lucide-react";

interface ModuleStubProps {
  title: string;
  subtitle: string;
}

const ModuleStub: React.FC<ModuleStubProps> = ({ title, subtitle }) => (
  <>
    <AppHeader title={title} subtitle={subtitle} />
    <div className="page-container">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary mb-4">
          <Construction className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">{title} Module</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          This module is under development. The architecture and API contracts are ready for backend integration.
        </p>
      </div>
    </div>
  </>
);

export const ClassesPage = () => <ModuleStub title="Classes & Sections" subtitle="Manage class structure and sections" />;
export const AttendancePage = () => <ModuleStub title="Attendance" subtitle="Track and manage daily attendance" />;
export const ExamsPage = () => <ModuleStub title="Exams & Grades" subtitle="Manage examinations and grading" />;
export const FeesPage = () => <ModuleStub title="Fees & Payments" subtitle="Fee management and payment tracking" />;
export const TimetablePage = () => <ModuleStub title="Timetable" subtitle="Class schedules and timetable management" />;
export const AnnouncementsPage = () => <ModuleStub title="Announcements" subtitle="Publish and manage school announcements" />;
export const ParentsPage = () => <ModuleStub title="Parent Portal" subtitle="Parent accounts and communication" />;
export const ReportsPage = () => <ModuleStub title="Reports & Analytics" subtitle="Generate and export reports" />;
export const SettingsPage = () => <ModuleStub title="Settings" subtitle="System settings and role permissions" />;
export const AuditPage = () => <ModuleStub title="Audit Logs" subtitle="Track all system activities" />;
