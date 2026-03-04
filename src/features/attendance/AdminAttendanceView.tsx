import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Users, CheckCircle2, XCircle, BarChart2 } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClassSummary {
    classId: string;
    className: string;
    grade: number;
    totalStudents: number;
    sectionCount: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    percentage: number;
}

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const AdminAttendanceView: React.FC = () => {
    const { toast } = useToast();
    const [data, setData] = useState<ClassSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState(() => {
        const d = new Date(); d.setDate(1); return toInputDate(d);
    });
    const [to, setTo] = useState(toInputDate(new Date()));

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<any>(`/attendance/summary?from=${from}&to=${to}`);
            setData(res.data.data || []);
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not load attendance summary." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSummary(); }, [from, to]);

    const totalStudents = data.reduce((a, c) => a + c.totalStudents, 0);
    const totalPresent = data.reduce((a, c) => a + c.present + c.late, 0);
    const totalRecords = data.reduce((a, c) => a + c.total, 0);
    const schoolAvg = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    // Previous/next month navigation
    const shiftMonth = (delta: number) => {
        const f = new Date(from); f.setMonth(f.getMonth() + delta);
        const t = new Date(f); t.setMonth(t.getMonth() + 1); t.setDate(0);
        setFrom(toInputDate(f));
        setTo(toInputDate(t > new Date() ? new Date() : t));
    };

    return (
        <div className="space-y-6">
            {/* Date range */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                    <Label>From</Label>
                    <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
                </div>
                <div className="space-y-1.5">
                    <Label>To</Label>
                    <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" max={toInputDate(new Date())} />
                </div>
                <div className="flex gap-1 pb-0.5">
                    <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev Month
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => shiftMonth(0)}>
                        This Month
                    </Button>
                </div>
            </div>

            {/* School-wide stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "School Avg", value: `${schoolAvg}%`, icon: <TrendingUp className="h-4 w-4" />, color: schoolAvg >= 75 ? "text-success" : "text-destructive" },
                    { label: "Total Students", value: totalStudents, icon: <Users className="h-4 w-4" />, color: "text-primary" },
                    { label: "Total Records", value: totalRecords, icon: <BarChart2 className="h-4 w-4" />, color: "text-info" },
                    { label: "Classes", value: data.length, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-warning" },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border bg-card p-3 flex items-center gap-3 shadow-sm">
                        <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${s.color}`}>{s.icon}</div>
                        <div>
                            <p className="text-2xl font-bold leading-none">{s.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Per-class table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {loading ? (
                    <div className="divide-y">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-16 px-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                                <div className="h-2 w-full bg-muted rounded animate-pulse" />
                            </div>
                        </div>)}
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>No attendance data for this period.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-secondary/40">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Class</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Students</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">P / A / L / E</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendance %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.map(cls => (
                                <tr key={cls.classId} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold ${cls.percentage >= 90 ? "bg-success/15 text-success" :
                                                    cls.percentage >= 75 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                                                }`}>
                                                {cls.grade}
                                            </div>
                                            <div>
                                                <p className="font-medium">{cls.className}</p>
                                                <p className="text-xs text-muted-foreground">{cls.sectionCount} section{cls.sectionCount !== 1 ? "s" : ""}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{cls.totalStudents}</td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-success font-medium">{cls.present}P</span>
                                            <span className="text-destructive font-medium">{cls.absent}A</span>
                                            <span className="text-warning font-medium">{cls.late}L</span>
                                            <span className="text-muted-foreground">{cls.excused}E</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {cls.total === 0 ? (
                                            <span className="text-xs text-muted-foreground italic">No records</span>
                                        ) : (
                                            <div className="flex items-center gap-2 min-w-[120px]">
                                                <Progress value={cls.percentage} className="h-2 flex-1"
                                                    style={{ ["--progress-color" as any]: cls.percentage >= 90 ? "var(--success)" : cls.percentage >= 75 ? "var(--warning)" : "var(--destructive)" }} />
                                                <span className={`text-sm font-bold w-10 text-right ${cls.percentage >= 90 ? "text-success" : cls.percentage >= 75 ? "text-warning" : "text-destructive"
                                                    }`}>{cls.percentage}%</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminAttendanceView;
