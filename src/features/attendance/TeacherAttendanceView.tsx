import React, { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Users, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertCircle, Send, RefreshCw } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface RosterEntry {
    studentId: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    gender: string;
    record: { id: string; status: AttendanceStatus } | null;
}

interface ClassData { id: string; name: string; grade: number; sections: any[] }

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; short: string; color: string; icon: React.ReactNode }> = {
    present: { label: "Present", short: "P", color: "bg-success text-white hover:bg-success/90", icon: <CheckCircle2 className="h-3 w-3" /> },
    absent: { label: "Absent", short: "A", color: "bg-destructive text-white hover:bg-destructive/90", icon: <XCircle className="h-3 w-3" /> },
    late: { label: "Late", short: "L", color: "bg-warning text-white hover:bg-warning/90", icon: <Clock className="h-3 w-3" /> },
    excused: { label: "Excused", short: "E", color: "bg-muted-foreground text-white hover:bg-muted-foreground/90", icon: <AlertCircle className="h-3 w-3" /> },
};

const toDateInput = (d: Date) => d.toISOString().split("T")[0];

interface Props { markedBy: string }

const TeacherAttendanceView: React.FC<Props> = ({ markedBy }) => {
    const { toast } = useToast();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [classId, setClassId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [date, setDate] = useState(toDateInput(new Date()));
    const [roster, setRoster] = useState<RosterEntry[]>([]);
    const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Load classes on mount
    useEffect(() => {
        apiClient.get<any>("/classes").then(r => setClasses(r.data.data || [])).catch(() => { });
    }, []);

    const selectedClass = classes.find(c => c.id === classId);
    const sections = selectedClass?.sections ?? [];
    const selectedSection = sections.find((s: any) => s.id === sectionId);

    // Fetch roster whenever class/section/date changes
    const fetchRoster = useCallback(async () => {
        if (!sectionId || !date) return;
        setLoadingRoster(true);
        setSubmitted(false);
        try {
            const res = await apiClient.get<any>(`/attendance/class?sectionId=${sectionId}&date=${date}`);
            const data: RosterEntry[] = res.data.data;
            setRoster(data);
            // Pre-fill existing statuses
            const init: Record<string, AttendanceStatus> = {};
            data.forEach(s => { if (s.record) init[s.studentId] = s.record.status; });
            setStatuses(init);
            if (data.some(s => s.record)) setSubmitted(true);
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not load class roster." });
        } finally {
            setLoadingRoster(false);
        }
    }, [sectionId, date, toast]);

    useEffect(() => { fetchRoster(); }, [fetchRoster]);

    const setAll = (status: AttendanceStatus) => {
        const next: Record<string, AttendanceStatus> = {};
        roster.forEach(s => { next[s.studentId] = status; });
        setStatuses(next);
    };

    const handleSubmit = async () => {
        const records = roster.map(s => ({ studentId: s.studentId, status: statuses[s.studentId] ?? "absent" }));
        setSubmitting(true);
        try {
            await apiClient.post("/attendance/bulk", { sectionId, date, markedBy, records });
            toast({ title: submitted ? "Attendance Updated" : "Attendance Submitted", description: `${records.length} records saved.` });
            setSubmitted(true);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Failed", description: err.message || "Could not save attendance." });
        } finally {
            setSubmitting(false);
        }
    };

    const changeDate = (delta: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + delta);
        setDate(toDateInput(d));
    };

    const presentCount = Object.values(statuses).filter(s => s === "present").length;
    const absentCount = Object.values(statuses).filter(s => s === "absent").length;
    const markedCount = Object.keys(statuses).length;

    return (
        <div className="space-y-6">
            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label>Class</Label>
                    <Select value={classId} onValueChange={v => { setClassId(v); setSectionId(""); setRoster([]); }}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (Gr {c.grade})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Section</Label>
                    <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                        <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                        <SelectContent>
                            {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>Section {s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Date</Label>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => changeDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" max={toDateInput(new Date())} />
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => changeDate(1)} disabled={date >= toDateInput(new Date())}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>

            {/* Roster */}
            {!sectionId ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
                    <CalendarCheck className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">Select a class and section to begin</p>
                </div>
            ) : loadingRoster ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
                </div>
            ) : roster.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No active students in this section.</p>
                </div>
            ) : (
                <>
                    {/* Summary + bulk actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{roster.length} students</span>
                            {submitted && <Badge variant="outline" className="text-success border-success/30 bg-success/5">Attendance recorded</Badge>}
                            {markedCount > 0 && <span className="text-xs text-muted-foreground">P:{presentCount} A:{absentCount} Marked:{markedCount}/{roster.length}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground mr-1">Mark all:</span>
                            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                                <button key={s} onClick={() => setAll(s)}
                                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${STATUS_CONFIG[s].color}`}>
                                    {STATUS_CONFIG[s].short}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Student rows */}
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-secondary/40">
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {roster.map((s, idx) => {
                                    const current = statuses[s.studentId];
                                    return (
                                        <tr key={s.studentId} className="hover:bg-secondary/10 transition-colors">
                                            <td className="px-4 py-2.5 text-muted-foreground text-xs w-10">{idx + 1}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                        {s.firstName[0]}{s.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium leading-none">{s.firstName} {s.lastName}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{s.admissionNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(st => (
                                                        <button key={st} onClick={() => setStatuses(prev => ({ ...prev, [s.studentId]: st }))}
                                                            title={STATUS_CONFIG[st].label}
                                                            className={`h-8 w-8 rounded-md text-xs font-bold flex items-center justify-center transition-all border-2 ${current === st
                                                                    ? `${STATUS_CONFIG[st].color} border-transparent shadow-sm scale-110`
                                                                    : "bg-background border-border text-muted-foreground hover:border-primary/40"
                                                                }`}>
                                                            {STATUS_CONFIG[st].short}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="px-8">
                            {submitting ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</> : submitted
                                ? <><RefreshCw className="h-4 w-4 mr-2" />Update Attendance</>
                                : <><Send className="h-4 w-4 mr-2" />Submit Attendance</>}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherAttendanceView;
