import React, { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Plus, Search, Filter, Edit, Trash2, MoreVertical,
  GraduationCap, Phone, Briefcase, Calendar, X, Users
} from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  qualification: string | null;
  dateOfJoining: string;
  isActive: boolean;
  sections: { id: string; name: string; class: { name: string } }[];
}

const DEPARTMENTS = [
  "Mathematics", "Science", "English", "Social Studies",
  "Hindi", "Computer Science", "Physical Education", "Arts & Crafts",
  "Music", "Commerce", "Biology", "Chemistry", "Physics", "Other"
];

const emptyForm = {
  employeeId: "",
  firstName: "",
  lastName: "",
  department: "",
  qualification: "",
  dateOfJoining: new Date().toISOString().split("T")[0],
};

const TeachersPage: React.FC = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>("/teachers");
      setTeachers(res.data.data || []);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load teachers." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      department: teacher.department,
      qualification: teacher.qualification || "",
      dateOfJoining: teacher.dateOfJoining
        ? new Date(teacher.dateOfJoining).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.firstName || !formData.lastName || !formData.department) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill all required fields." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        qualification: formData.qualification || null,
      };
      if (editingTeacher) {
        await apiClient.put(`/teachers/${editingTeacher.id}`, payload);
        toast({ title: "Updated", description: `${formData.firstName} ${formData.lastName}'s profile updated.` });
      } else {
        await apiClient.post("/teachers", payload);
        toast({ title: "Teacher Added", description: `${formData.firstName} ${formData.lastName} has been registered.` });
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message || "Could not save teacher data." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`Remove ${teacher.firstName} ${teacher.lastName} from the system?`)) return;
    try {
      await apiClient.delete(`/teachers/${teacher.id}`);
      toast({ title: "Removed", description: "Teacher has been deleted." });
      fetchTeachers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message || "Could not delete teacher." });
    }
  };

  const departments = Array.from(new Set(teachers.map(t => t.department)));
  const filtered = teachers.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
      t.employeeId.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q);
    const matchesDept = deptFilter === "all" || t.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <>
      <AppHeader title="Teachers" subtitle="Manage teaching staff, departments and class assignments" />
      <div className="page-container space-y-5">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or department..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="h-9 pl-8 pr-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="all">All Depts</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <Button onClick={openAddModal} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" /> Add Teacher
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Staff", value: teachers.length, icon: <Users className="h-4 w-4" />, color: "text-primary" },
            { label: "Active Now", value: teachers.filter(t => t.isActive).length, icon: <GraduationCap className="h-4 w-4" />, color: "text-success" },
            { label: "Departments", value: departments.length, icon: <Briefcase className="h-4 w-4" />, color: "text-info" },
            { label: "With Classes", value: teachers.filter(t => t.sections?.length > 0).length, icon: <Calendar className="h-4 w-4" />, color: "text-warning" },
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

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-0 divide-y">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-36 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {searchQuery || deptFilter !== "all" ? "No teachers match your filters." : "No teachers added yet."}
              </p>
              {!searchQuery && deptFilter === "all" && (
                <Button variant="outline" size="sm" className="mt-3" onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-1.5" /> Add First Teacher
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Qualification</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Sections</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.employeeId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {t.firstName[0]}{t.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium leading-none">{t.firstName} {t.lastName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 md:hidden">{t.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="secondary" className="font-normal">{t.department}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {t.qualification || <span className="italic text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                      {t.dateOfJoining ? new Date(t.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {t.sections?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.sections.slice(0, 2).map(s => (
                            <span key={s.id} className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5">
                              {s.class?.name} {s.name}
                            </span>
                          ))}
                          {t.sections.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{t.sections.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                        }`}>
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(t)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Remove Teacher
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Showing {filtered.length} of {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {editingTeacher ? "Edit Teacher Profile" : "Register New Teacher"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Employee ID */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                name="employeeId"
                placeholder="e.g. TCH-001"
                value={formData.employeeId}
                onChange={handleChange}
              />
            </div>

            {/* First Name */}
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="e.g. Rahul"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="e.g. Sharma"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            {/* Department */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="department">Department *</Label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select department...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Qualification */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                name="qualification"
                placeholder="e.g. B.Ed, M.Sc Mathematics"
                value={formData.qualification}
                onChange={handleChange}
              />
            </div>

            {/* Date of Joining */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="dateOfJoining">Date of Joining</Label>
              <Input
                id="dateOfJoining"
                name="dateOfJoining"
                type="date"
                value={formData.dateOfJoining}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingTeacher ? "Save Changes" : "Register Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeachersPage;
