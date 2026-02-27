import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User, Permission, AppRole } from "@/types/models";
import { ROLE_PERMISSIONS } from "@/constants/permissions";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Mock user for development. In production, this would come from the API
 * via JWT token stored in HTTP-only cookies.
 */
const MOCK_USER: User = {
  id: "usr_001",
  email: "admin@school.edu",
  firstName: "Sarah",
  lastName: "Mitchell",
  role: "admin",
  permissions: ROLE_PERMISSIONS.admin,
  isActive: true,
  lastLogin: new Date().toISOString(),
  avatarUrl: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Simulate checking existing session on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // In production: call /auth/me to validate session cookie
      setState({
        user: MOCK_USER,
        isAuthenticated: true,
        isLoading: false,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for forced logout events from API client
  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = useCallback(async (_email: string, _password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    // In production: POST /auth/login, server sets HTTP-only cookie
    await new Promise(resolve => setTimeout(resolve, 800));
    setState({
      user: MOCK_USER,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    // In production: POST /auth/logout to invalidate server session
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!state.user) return false;
      return state.user.permissions.includes(permission);
    },
    [state.user]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]) => {
      if (!state.user) return false;
      return permissions.some(p => state.user!.permissions.includes(p));
    },
    [state.user]
  );

  const hasRole = useCallback(
    (role: AppRole) => {
      if (!state.user) return false;
      return state.user.role === role;
    },
    [state.user]
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission, hasAnyPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
