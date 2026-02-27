import React from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Users, Plus, Search, Filter } from "lucide-react";

const MOCK_STUDENTS = [
  { id: "1", admissionNumber: "STU-2024-001", name: "Aisha Patel", class: "10-A", parent: "Rajesh Patel", status: "Active" },
  { id: "2", admissionNumber: "STU-2024-002", name: "Rahul Sharma", class: "10-B", parent: "Vikram Sharma", status: "Active" },
  { id: "3", admissionNumber: "STU-2024-003", name: "Priya Nair", class: "9-A", parent: "Suresh Nair", status: "Active" },
  { id: "4", admissionNumber: "STU-2024-004", name: "Arjun Mehta", class: "9-B", parent: "Dinesh Mehta", status: "Inactive" },
  { id: "5", admissionNumber: "STU-2024-005", name: "Sanya Gupta", class: "8-A", parent: "Amit Gupta", status: "Active" },
];

const StudentsPage: React.FC = () => {
  return (
    <>
      <AppHeader title="Students" subtitle="Manage student records and enrollment" />
      <div className="page-container space-y-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full h-9 pl-9 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
          </div>
          <button className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admission #</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Class</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Parent</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MOCK_STUDENTS.map(s => (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{s.admissionNumber}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.class}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.parent}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {s.status}
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

export default StudentsPage;
