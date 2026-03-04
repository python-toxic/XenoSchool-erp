import React, { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
    Plus,
    Users,
    MoreVertical,
    Edit,
    Trash2,
    User as UserIcon,
    ChevronRight,
    LayoutGrid,
    Search,
    BookOpen
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/services/api-client";
import { useToast } from "@/components/ui/use-toast";

interface ClassData {
    id: string;
    name: string;
    grade: number;
    academicYear: string;
    sections: any[];
    _count: {
        students: number;
    };
}

const ClassesDashboard: React.FC = () => {
    const { toast } = useToast();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [editingSection, setEditingSection] = useState<any>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    // Form states
    const [classForm, setClassForm] = useState({
        name: "",
        grade: "",
        academicYear: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString().slice(2)
    });
    const [sectionForm, setSectionForm] = useState({
        name: "",
        capacity: "30",
        classTeacherId: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [classesRes, teachersRes] = await Promise.all([
                apiClient.get<any>("/classes"),
                apiClient.get<any>("/teachers")
            ]);
            setClasses(classesRes.data.data || []);
            setTeachers(teachersRes.data.data || []);
        } catch (err) {
            toast({ variant: "destructive", title: "Fetch Error", description: "Failed to load academic data." });
        } finally {
            setLoading(false);
        }
    };

    const handleClassSubmit = async () => {
        try {
            const payload = { ...classForm, grade: parseInt(classForm.grade) };
            if (editingClass) {
                await apiClient.put(`/classes/${editingClass.id}`, payload);
                toast({ title: "Success", description: "Class updated successfully." });
            } else {
                await apiClient.post("/classes", payload);
                toast({ title: "Success", description: "New class created." });
            }
            setIsClassModalOpen(false);
            setEditingClass(null);
            fetchData();
        } catch (err) {
            toast({ variant: "destructive", title: "Operation Failed", description: "Could not save class data." });
        }
    };

    const handleSectionSubmit = async () => {
        try {
            const teacherId = sectionForm.classTeacherId && sectionForm.classTeacherId !== "none"
                ? sectionForm.classTeacherId
                : null;
            const payload = {
                name: sectionForm.name,
                capacity: parseInt(sectionForm.capacity),
                classId: selectedClassId,
                classTeacherId: teacherId,
            };
            if (editingSection) {
                await apiClient.put(`/classes/sections/${editingSection.id}`, payload);
                toast({ title: "Success", description: "Section updated." });
            } else {
                await apiClient.post("/classes/sections", payload);
                toast({ title: "Success", description: "Section added." });
            }
            setIsSectionModalOpen(false);
            setEditingSection(null);
            fetchData();
        } catch (err) {
            toast({ variant: "destructive", title: "Operation Failed", description: "Could not save section data." });
        }
    };

    const deleteClass = async (id: string) => {
        if (!confirm("Are you sure? This will delete the class if it has no students.")) return;
        try {
            await apiClient.delete(`/classes/${id}`);
            toast({ title: "Deleted", description: "Class removed successfully." });
            fetchData();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Delete Error", description: err.message || "Could not delete class." });
        }
    };

    const deleteSection = async (id: string) => {
        if (!confirm("Remove this section?")) return;
        try {
            await apiClient.delete(`/classes/sections/${id}`);
            toast({ title: "Deleted", description: "Section removed." });
            fetchData();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Delete Error", description: err.message || "Could not delete section." });
        }
    };

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.grade.toString().includes(searchQuery)
    );

    return (
        <div className="flex-1 flex flex-col min-h-screen">
            <AppHeader title="Classes & Sections" subtitle="Organize academic grades, manage sections and assign class teachers" />

            <div className="page-container py-6 space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search classes..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => {
                        setEditingClass(null);
                        setClassForm({ name: "", grade: "", academicYear: classForm.academicYear });
                        setIsClassModalOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Add New Class
                    </Button>
                </div>

                {/* Grid View */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl border animate-pulse bg-muted" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((item) => (
                            <Card key={item.id} className="border-none shadow-premium-lg overflow-hidden glass-morphism group">
                                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                                <CardDescription>Academic Year {item.academicYear}</CardDescription>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingClass(item);
                                                    setClassForm({
                                                        name: item.name,
                                                        grade: item.grade.toString(),
                                                        academicYear: item.academicYear
                                                    });
                                                    setIsClassModalOpen(true);
                                                }}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit Class
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => deleteClass(item.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Class
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Total Students</span>
                                        <span className="font-semibold text-foreground">{item._count.students}</span>
                                    </div>

                                    {/* Sections List */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Sections</h4>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                {item.sections.length} Local
                                            </Badge>
                                        </div>
                                        {item.sections.length > 0 ? (
                                            <div className="space-y-3">
                                                {item.sections.map((sec) => (
                                                    <div key={sec.id} className="p-3 rounded-lg border bg-secondary/20 group/sec relative">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm">Section {sec.name}</span>
                                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                    <UserIcon className="h-2.5 w-2.5" />
                                                                    {sec.classTeacher ? `${sec.classTeacher.firstName} ${sec.classTeacher.lastName}` : "No Teacher"}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                                    setEditingSection(sec);
                                                                    setSelectedClassId(item.id);
                                                                    setSectionForm({
                                                                        name: sec.name,
                                                                        capacity: sec.capacity.toString(),
                                                                        classTeacherId: sec.classTeacherId || ""
                                                                    });
                                                                    setIsSectionModalOpen(true);
                                                                }}>
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSection(sec.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[10px] mb-1">
                                                                <span>Enrollment</span>
                                                                <span>{sec._count.students} / {sec.capacity}</span>
                                                            </div>
                                                            <Progress value={(sec._count.students / sec.capacity) * 100} className="h-1" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border border-dashed rounded-lg bg-secondary/10">
                                                <p className="text-[10px] text-muted-foreground italic">No sections created for this grade</p>
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs h-8 border-dashed"
                                            onClick={() => {
                                                setSelectedClassId(item.id);
                                                setEditingSection(null);
                                                setSectionForm({ name: "", capacity: "30", classTeacherId: "" });
                                                setIsSectionModalOpen(true);
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Section
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Class Dialog */}
            <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClass ? "Edit Class" : "Create New Class Grade"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Class Name *</Label>
                            <Input
                                placeholder="e.g. Grade 10, Kindergarten"
                                value={classForm.name}
                                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Numeric Grade (1-12) *</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={classForm.grade}
                                    onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Academic Year *</Label>
                                <Input
                                    placeholder="2024-25"
                                    value={classForm.academicYear}
                                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleClassSubmit}>{editingClass ? "Update" : "Create Class"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Section Dialog */}
            <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Section Name *</Label>
                            <Input
                                placeholder="e.g. A, Maple, Beta"
                                value={sectionForm.name}
                                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Capacity *</Label>
                            <Input
                                type="number"
                                value={sectionForm.capacity}
                                onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Class Teacher</Label>
                            <Select
                                value={sectionForm.classTeacherId}
                                onValueChange={(v) => setSectionForm({ ...sectionForm, classTeacherId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Assign a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.employeeId})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSectionModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSectionSubmit}>{editingSection ? "Save Section" : "Create Section"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClassesDashboard;
