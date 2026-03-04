import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Users, FileText, Upload, Plus, Trash2, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useToast } from "@/components/ui/use-toast";

const STEPS = [
    { id: "basic", title: "Basic Info", icon: <User className="h-4 w-4" /> },
    { id: "family", title: "Family Details", icon: <Users className="h-4 w-4" /> },
    { id: "academic", title: "Academic & More", icon: <FileText className="h-4 w-4" /> },
    { id: "documents", title: "Documentation", icon: <Upload className="h-4 w-4" /> },
];

const AdmissionPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        classId: "",
        sectionId: "",
        fatherName: "",
        motherName: "",
        emergencyPhone: "",
        address: "",
        phone: "",
        email: "",
        previousSchool: "",
        medicalInfo: "",
        otherInfo: "",
    });

    const [docs, setDocs] = useState<{ name: string; file: File | null }[]>([
        { name: "Passport Size Photo", file: null },
        { name: "Birth Certificate", file: null },
    ]);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (formData.classId) {
            fetchSections(formData.classId);
        }
    }, [formData.classId]);

    const fetchClasses = async () => {
        try {
            const res = await apiClient.get<any>("/classes");
            setClasses(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch classes", err);
        }
    };

    const fetchSections = async (classId: string) => {
        try {
            const res = await apiClient.get<any>(`/classes/${classId}`);
            setSections(res.data.data.sections || []);
        } catch (err) {
            console.error("Failed to fetch sections", err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (index: number, file: File | null) => {
        const newDocs = [...docs];
        newDocs[index].file = file;
        setDocs(newDocs);
    };

    const addDocRow = () => {
        setDocs([...docs, { name: "", file: null }]);
    };

    const removeDocRow = (index: number) => {
        if (docs.length > 1) {
            setDocs(docs.filter((_, i) => i !== index));
        }
    };

    const validateStep = (step: number) => {
        if (step === 0) {
            const requiredColumns = ["firstName", "lastName", "dateOfBirth", "gender", "classId", "sectionId"];
            const missing = requiredColumns.filter(field => !formData[field as keyof typeof formData]);
            if (missing.length > 0) {
                toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all mandatory fields (*) in this step." });
                return false;
            }
        } else if (step === 1) {
            const requiredColumns = ["fatherName", "emergencyPhone", "address"];
            const missing = requiredColumns.filter(field => !formData[field as keyof typeof formData]);
            if (missing.length > 0) {
                toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all mandatory fields (*) in this step." });
                return false;
            }

            // Mobile number validation
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(formData.emergencyPhone)) {
                toast({ variant: "destructive", title: "Invalid Phone Number", description: "Emergency number must be exactly 10 digits." });
                return false;
            }
            if (formData.phone && !phoneRegex.test(formData.phone)) {
                toast({ variant: "destructive", title: "Invalid Phone Number", description: "Student/Parent mobile must be exactly 10 digits." });
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(activeStep)) {
            setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };
    const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        if (!validateStep(activeStep)) return;
        setLoading(true);
        try {
            const submissionData = new FormData();

            // Append fields
            Object.entries(formData).forEach(([key, value]) => {
                submissionData.append(key, value);
            });

            // Append documents
            docs.forEach((doc, index) => {
                if (doc.file) {
                    submissionData.append(doc.name || `doc_${index}`, doc.file);
                }
            });

            await apiClient.postMultipart("/students", submissionData);

            toast({
                title: "Admission Successful",
                description: `${formData.firstName} ${formData.lastName} has been enrolled.`,
            });

            navigate("/students");
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Admission Failed",
                description: err.message || "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen">
            <AppHeader title="Student Admission" subtitle="Register a new student to the school system" />

            <div className="page-container max-w-4xl py-6">
                {/* Progress Stepper */}
                <div className="mb-8 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[600px] px-2">
                        {STEPS.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div
                                    className={`flex flex-col items-center gap-2 group cursor-pointer ${index <= activeStep ? 'text-primary' : 'text-muted-foreground'}`}
                                    onClick={() => index < activeStep && setActiveStep(index)}
                                >
                                    <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all ${index < activeStep ? 'bg-primary border-primary text-primary-foreground' :
                                        index === activeStep ? 'border-primary ring-4 ring-primary/10' : 'border-muted'
                                        }`}>
                                        {index < activeStep ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                                    </div>
                                    <span className="text-xs font-medium uppercase tracking-wider">{step.title}</span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-4 transition-colors ${index < activeStep ? 'bg-primary' : 'bg-muted'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <Card className="border-none shadow-premium-lg overflow-hidden glass-morphism">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-6">
                        <CardTitle className="text-xl flex items-center gap-2">
                            {STEPS[activeStep].icon} {STEPS[activeStep].title}
                        </CardTitle>
                        <CardDescription>
                            Step {activeStep + 1} of {STEPS.length}: Enter the required details below.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        {activeStep === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="e.g. Rahul" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g. Sharma" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                    <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender *</Label>
                                    <Select onValueChange={(v) => handleSelectChange("gender", v)} value={formData.gender}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="classId">Class *</Label>
                                    <Select onValueChange={(v) => handleSelectChange("classId", v)} value={formData.classId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name} (Grade {c.grade})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sectionId">Section *</Label>
                                    <Select onValueChange={(v) => handleSelectChange("sectionId", v)} value={formData.sectionId} disabled={!formData.classId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {activeStep === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div className="space-y-2">
                                    <Label htmlFor="fatherName">Father's Name *</Label>
                                    <Input id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Enter father's name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="motherName">Mother's Name</Label>
                                    <Input id="motherName" name="motherName" value={formData.motherName} onChange={handleChange} placeholder="Enter mother's name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergencyPhone">Emergency Contact Number *</Label>
                                    <Input id="emergencyPhone" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} placeholder="e.g. +91 9876543210" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Student/Parent Mobile</Label>
                                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Mobile number" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Full residential address" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="student@example.com" />
                                </div>
                            </div>
                        )}

                        {activeStep === 2 && (
                            <div className="grid grid-cols-1 gap-6 animate-fade-in">
                                <div className="space-y-2">
                                    <Label htmlFor="previousSchool">Previous School Name</Label>
                                    <Input id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} placeholder="Where did they study before?" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="medicalInfo">Medical Information (Allergies, conditions, etc.)</Label>
                                    <textarea
                                        id="medicalInfo"
                                        name="medicalInfo"
                                        value={formData.medicalInfo}
                                        onChange={handleChange}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Enter any medical notes..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="otherInfo">Other Information</Label>
                                    <textarea
                                        id="otherInfo"
                                        name="otherInfo"
                                        value={formData.otherInfo}
                                        onChange={handleChange}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Any other details the school should know..."
                                    />
                                </div>
                            </div>
                        )}

                        {activeStep === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-secondary/20 p-4 rounded-lg border border-dashed border-primary/20">
                                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-primary">
                                        <Upload className="h-4 w-4" /> Upload Student Documents
                                    </h4>
                                    <div className="space-y-4">
                                        {docs.map((doc, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-background p-3 rounded-md border">
                                                <div className="flex-1 w-full">
                                                    <Input
                                                        placeholder="Document Name (e.g. Grade Report)"
                                                        value={doc.name}
                                                        onChange={(e) => {
                                                            const newDocs = [...docs];
                                                            newDocs[index].name = e.target.value;
                                                            setDocs(newDocs);
                                                        }}
                                                        className="h-8 text-xs mb-2 sm:mb-0"
                                                    />
                                                </div>
                                                <div className="relative flex-1 w-full">
                                                    <Input
                                                        type="file"
                                                        onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                                        className="h-8 text-xs cursor-pointer file:text-[10px]"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive h-8 w-8"
                                                    onClick={() => removeDocRow(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-dashed"
                                            onClick={addDocRow}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add More Documentation
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-info/5 border border-info/20 rounded-lg text-xs text-muted-foreground">
                                    <FileText className="h-4 w-4 text-info mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-foreground mb-1">Upload Guidelines:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Max file size: 5MB</li>
                                            <li>Supported formats: JPG, PNG, PDF</li>
                                            <li>Make sure the photo is clear and passport sized</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="bg-secondary/30 border-t p-6 flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={activeStep === 0 || loading}
                            className="px-6"
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>

                        {activeStep === STEPS.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 bg-success hover:bg-success/90 text-white"
                            >
                                {loading ? "Processing..." : "Finish Enrollment"} <CheckCircle2 className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                disabled={loading}
                                className="px-8 shadow-sm"
                            >
                                Next Step <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default AdmissionPage;
