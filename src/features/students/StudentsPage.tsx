import React, { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Plus, Search, X, Users, GraduationCap, UserCheck, UserX } from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "@/services/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  isActive: boolean;
  class: { id: string; name: string; grade: number };
  section: { id: string; name: string };
  fatherName: string | null;
  motherName: string | null;
  enrollmentDate: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
}

const StudentsPage: React.FC = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async (page = 1, q = debouncedSearch) => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(
        `/students?page=${page}&limit=20${q ? `&search=${encodeURIComponent(q)}` : ""}`
      );
      setStudents(res.data.data || []);
      setMeta(res.data.meta || { page, limit: 20, total: 0 });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load students." });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    fetchStudents(1, debouncedSearch);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(meta.total / meta.limit);
  const activeCount = students.filter(s => s.isActive).length;

  return (
    <>
      <AppHeader title="Students" subtitle="Manage student records and enrollment" />
      <div className="page-container space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Students", value: meta.total, icon: <Users className="h-4 w-4" />, color: "text-primary" },
            { label: "Active", value: students.filter(s => s.isActive).length, icon: <UserCheck className="h-4 w-4" />, color: "text-success" },
            { label: "Inactive", value: students.filter(s => !s.isActive).length, icon: <UserX className="h-4 w-4" />, color: "text-destructive" },
            { label: "This Page", value: students.length, icon: <GraduationCap className="h-4 w-4" />, color: "text-info" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border bg-card p-3 flex items-center gap-3 shadow-sm">
              <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, admission # ..."
              className="pl-9 pr-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Link
            to="/students/admission"
            className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Student
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-40 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-14 bg-muted rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {debouncedSearch ? `No students match "${debouncedSearch}"` : "No students enrolled yet."}
              </p>
              {!debouncedSearch && (
                <Link
                  to="/students/admission"
                  className="inline-flex items-center gap-1.5 mt-3 h-8 rounded-md border px-3 text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Enroll First Student
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Admission #</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Class</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Parent / Guardian</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Enrolled</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.admissionNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium leading-none">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{s.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-medium">{s.class?.name}</span>
                      <span className="text-muted-foreground"> · Sec {s.section?.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {s.fatherName || s.motherName || <span className="italic text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {s.enrollmentDate
                        ? new Date(s.enrollmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Page {meta.page} of {totalPages} · {meta.total} student{meta.total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => fetchStudents(meta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= totalPages}
                onClick={() => fetchStudents(meta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {!loading && students.length > 0 && totalPages <= 1 && (
          <p className="text-xs text-muted-foreground text-right">
            Showing {students.length} of {meta.total} student{meta.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
};

export default StudentsPage;
