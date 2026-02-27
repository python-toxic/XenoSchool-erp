import React from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Plus, Search, Filter } from "lucide-react";

const MOCK_TEACHERS = [
  { id: "1", employeeId: "TCH-001", name: "Mr. Kapoor", department: "Mathematics", subjects: "Math, Statistics", status: "Active" },
  { id: "2", employeeId: "TCH-002", name: "Ms. Desai", department: "Science", subjects: "Physics, Chemistry", status: "Active" },
  { id: "3", employeeId: "TCH-003", name: "Mr. Singh", department: "English", subjects: "English Literature", status: "Active" },
  { id: "4", employeeId: "TCH-004", name: "Mrs. Kumar", department: "Social Studies", subjects: "History, Geography", status: "On Leave" },
];

const TeachersPage: React.FC = () => {
  return (
    <>
      <AppHeader title="Teachers" subtitle="Manage teaching staff and departments" />
      <div className="page-container space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search teachers..." className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button className="flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
          </div>
          <button className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Teacher
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subjects</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MOCK_TEACHERS.map(t => (
                <tr key={t.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{t.employeeId}</td>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.subjects}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.status === "Active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-primary hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TeachersPage;
