import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Shield, User, GraduationCap, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

type LoginRole = "admin" | "student" | "teacher";

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<LoginRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: LoginRole; label: string; icon: React.ReactNode }[] = [
    { id: "admin", label: "Admin", icon: <UserCog className="h-4 w-4" /> },
    { id: "teacher", label: "Teacher", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "student", label: "Student", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4 border border-primary/20 shadow-inner">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Guardian School</h1>
          <p className="text-sm text-muted-foreground">Secure Management Portal</p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-1 bg-muted/50 rounded-xl border border-border/50">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-1 rounded-lg transition-all duration-200 gap-1.5",
                selectedRole === role.id
                  ? "bg-background text-primary shadow-sm border border-border/50 scale-[1.02]"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              {role.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wider">{role.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder={`Enter ${selectedRole} email`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 h-10 w-full px-4 py-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              `Login as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
            )}
          </button>
        </form>

        <div className="pt-2">
          <p className="text-center text-[11px] text-muted-foreground/60">
            Powered by Guardian School Security • v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
