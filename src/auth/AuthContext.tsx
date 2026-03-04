import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { User, Permission, AppRole } from "@/types/models";
import { ROLE_PERMISSIONS } from "@/constants/permissions";
import { apiClient } from "@/services/api-client";
import { ENDPOINTS } from "@/config/api";
import { ApiError } from "@/services/api-client";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const mapUserResponse = useCallback((userData: any): User => {
    const role = userData.roles[0] as AppRole;
    return {
      ...userData,
      role,
      permissions: ROLE_PERMISSIONS[role] || [],
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatarUrl: userData.avatarUrl || null,
    };
  }, []);

  // Use a ref so that mapUserResponse never appears in the effect deps
  const mapUserResponseRef = useRef(mapUserResponse);
  mapUserResponseRef.current = mapUserResponse;

  // Check existing session ONCE on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiClient.get<any>(ENDPOINTS.AUTH.ME);
        setState({
          user: mapUserResponseRef.current(response.data.data),
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        // Only clear auth state on a real auth failure (401/403).
        // A network error (status 0) should NOT log the user out.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        } else {
          // Network or unknown error — keep whatever state we had, just stop loading
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Listen for forced logout events
  useEffect(() => {
    const handleLogout = () => {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (state.isLoading && state.isAuthenticated) return; // Prevent loop if already logged in or loading

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await apiClient.post<any>(ENDPOINTS.AUTH.LOGIN, { email, password });
      setState({
        user: mapUserResponse(response.data.data.user),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, user: null, isAuthenticated: false }));
      throw error;
    }
  }, [mapUserResponse, state.isLoading, state.isAuthenticated]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } finally {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
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
