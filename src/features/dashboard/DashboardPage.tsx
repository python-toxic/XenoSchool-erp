import React from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_LABELS } from "@/constants/permissions";
import {
  Users, GraduationCap, School, CalendarCheck,
  CreditCard, FileText, Megaphone, TrendingUp, TrendingDown, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardMetrics } from "@/types/models";

const MOCK_METRICS: DashboardMetrics = {
  totalStudents: 1247,
  totalTeachers: 68,
  totalClasses: 42,
  attendanceRate: 94.2,
  feeCollectionRate: 87.5,
  pendingFees: 156800,
  upcomingExams: 3,
  recentAnnouncements: 5,
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; positive: boolean };
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, href }) => (
  <div className="stat-card animate-fade-in">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.positive ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={trend.positive ? "text-success" : "text-destructive"}>
              {trend.positive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
    {href && (
      <Link to={href} className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
        View details <ArrowRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);

const RecentActivity: React.FC = () => {
  const activities = [
    { id: 1, action: "New student enrolled", detail: "Aisha Patel — Class 10-A", time: "2 min ago" },
    { id: 2, action: "Fee payment received", detail: "₹12,500 from Rahul Sharma", time: "15 min ago" },
    { id: 3, action: "Attendance marked", detail: "Class 8-B by Mr. Kapoor", time: "1 hour ago" },
    { id: 4, action: "Exam scheduled", detail: "Midterm — Mathematics Class 9", time: "2 hours ago" },
    { id: 5, action: "Announcement published", detail: "Annual Day preparations update", time: "3 hours ago" },
  ];

  return (
    <div className="bg-card border rounded-lg animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-semibold text-sm">Recent Activity</h3>
        <Link to="/audit" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="divide-y">
        {activities.map(a => (
          <div key={a.id} className="flex items-start justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium">{a.action}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UpcomingEvents: React.FC = () => {
  const events = [
    { id: 1, title: "Midterm Examinations", date: "Mar 15–22", type: "Exam" },
    { id: 2, title: "Parent-Teacher Meeting", date: "Mar 28", type: "Event" },
    { id: 3, title: "Fee Deadline — Q2", date: "Apr 1", type: "Fee" },
  ];

  return (
    <div className="bg-card border rounded-lg animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-semibold text-sm">Upcoming</h3>
      </div>
      <div className="divide-y">
        {events.map(e => (
          <div key={e.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{e.date}</p>
            </div>
            <span className="text-xs rounded-full bg-secondary px-2.5 py-0.5 font-medium">{e.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const m = MOCK_METRICS;

  return (
    <>
      <AppHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.firstName}. Here's your school overview.`}
      />
      <div className="page-container space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={m.totalStudents.toLocaleString()} icon={Users} trend={{ value: 2.4, positive: true }} href="/students" />
          <StatCard label="Total Teachers" value={m.totalTeachers} icon={GraduationCap} trend={{ value: 1.1, positive: true }} href="/teachers" />
          <StatCard label="Attendance Rate" value={`${m.attendanceRate}%`} icon={CalendarCheck} trend={{ value: 0.8, positive: true }} href="/attendance" />
          <StatCard label="Fee Collection" value={`${m.feeCollectionRate}%`} icon={CreditCard} trend={{ value: -1.2, positive: false }} href="/fees" />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Active Classes" value={m.totalClasses} icon={School} href="/classes" />
          <StatCard label="Upcoming Exams" value={m.upcomingExams} icon={FileText} href="/exams" />
          <StatCard label="Announcements" value={m.recentAnnouncements} icon={Megaphone} href="/announcements" />
        </div>

        {/* Activity & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <UpcomingEvents />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
