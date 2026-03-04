import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

type Status = "present" | "absent" | "late" | "excused";

interface AttendanceRecord {
    id: string;
    date: string;
    status: Status;
}

interface Summary {
    present: number; absent: number; late: number; excused: number;
    total: number; percentage: number;
}

interface StudentInfo {
    id: string; firstName: string; lastName: string; admissionNumber: string;
}

const STATUS_STYLE: Record<Status, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    present: { color: "text-success", bg: "bg-success", label: "Present", icon: <CheckCircle2 className="h-3 w-3" /> },
    absent: { color: "text-destructive", bg: "bg-destructive", label: "Absent", icon: <XCircle className="h-3 w-3" /> },
    late: { color: "text-warning", bg: "bg-warning", label: "Late", icon: <Clock className="h-3 w-3" /> },
    excused: { color: "text-muted-foreground", bg: "bg-muted-foreground", label: "Excused", icon: <AlertCircle className="h-3 w-3" /> },
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const StudentAttendanceView: React.FC = () => {
    const { toast } = useToast();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async (y: number, m: number) => {
        setLoading(true);
        const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(y, m + 1, 0).getDate();
        const to = `${y}-${String(m + 1).padStart(2, "0")}-${lastDay}`;
        try {
            const res = await apiClient.get<any>(`/attendance/student/me?from=${from}&to=${to}`);
            setStudent(res.data.data.student);
            setRecords(res.data.data.records || []);
            setSummary(res.data.data.summary);
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not load your attendance." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(year, month); }, [year, month]);

    const shiftMonth = (delta: number) => {
        let m = month + delta;
        let y = year;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setMonth(m); setYear(y);
    };

    // Build calendar grid
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const recordMap: Record<number, Status> = {};
    records.forEach(r => {
        const d = new Date(r.date);
        recordMap[d.getDate()] = r.status;
    });

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="text-center">
                    <h2 className="text-xl font-bold">{MONTH_NAMES[month]} {year}</h2>
                    {student && <p className="text-xs text-muted-foreground">{student.firstName} {student.lastName} · {student.admissionNumber}</p>}
                </div>
                <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}
                    disabled={year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth())}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {loading ? (
                <div className="h-64 rounded-xl bg-muted animate-pulse" />
            ) : (
                <>
                    {/* Summary cards */}
                    {summary && (
                        <div className="grid grid-cols-5 gap-2">
                            {[
                                { label: "Present", count: summary.present, status: "present" as Status },
                                { label: "Absent", count: summary.absent, status: "absent" as Status },
                                { label: "Late", count: summary.late, status: "late" as Status },
                                { label: "Excused", count: summary.excused, status: "excused" as Status },
                                { label: "Overall", count: `${summary.percentage}%`, status: null },
                            ].map(s => (
                                <div key={s.label} className={`rounded-xl p-3 text-center border ${s.status === null
                                        ? summary.percentage >= 75 ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"
                                        : "bg-card"
                                    }`}>
                                    <p className={`text-2xl font-bold ${s.status ? STATUS_STYLE[s.status].color : summary.percentage >= 75 ? "text-success" : "text-destructive"}`}>
                                        {s.count}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Calendar grid */}
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase py-1">{d}</div>
                            ))}
                        </div>
                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells before first day */}
                            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                            {/* Day cells */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const status = recordMap[day];
                                const isToday = isCurrentMonth && today.getDate() === day;
                                const isFuture = isCurrentMonth && day > today.getDate();
                                return (
                                    <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                    ${isFuture ? "opacity-30" : ""}
                    ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                    ${status === "present" ? "bg-success/20 text-success" :
                                            status === "absent" ? "bg-destructive/20 text-destructive" :
                                                status === "late" ? "bg-warning/20 text-warning" :
                                                    status === "excused" ? "bg-muted text-muted-foreground" :
                                                        "hover:bg-secondary/50"}`}>
                                        <span>{day}</span>
                                        {status && (
                                            <span className={`text-[8px] leading-none mt-0.5 ${STATUS_STYLE[status].color}`}>
                                                {STATUS_STYLE[status].label[0]}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t">
                            {(Object.keys(STATUS_STYLE) as Status[]).map(s => (
                                <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className={`h-3 w-3 rounded-sm ${STATUS_STYLE[s].bg} opacity-60`} />
                                    {STATUS_STYLE[s].label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detail list */}
                    {records.length > 0 && (
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b bg-secondary/30">
                                <h3 className="text-sm font-semibold">Daily Log — {MONTH_NAMES[month]} {year}</h3>
                            </div>
                            <div className="divide-y max-h-64 overflow-y-auto">
                                {records.map(r => {
                                    const d = new Date(r.date);
                                    const s = STATUS_STYLE[r.status];
                                    return (
                                        <div key={r.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/10">
                                            <span className="text-sm text-muted-foreground">
                                                {d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                            </span>
                                            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${r.status === "present" ? "bg-success/10 text-success" :
                                                    r.status === "absent" ? "bg-destructive/10 text-destructive" :
                                                        r.status === "late" ? "bg-warning/10 text-warning" :
                                                            "bg-muted text-muted-foreground"
                                                }`}>
                                                {s.icon} {s.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {records.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">
                            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No attendance records for this month.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentAttendanceView;
