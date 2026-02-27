import React from "react";
import { useAuth } from "@/auth/AuthContext";
import { Bell, Search } from "lucide-react";
import { ROLE_LABELS } from "@/constants/permissions";

export const AppHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary transition-colors">
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary transition-colors relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
        <div className="ml-2 hidden sm:flex items-center gap-2 pl-3 border-l">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground">{user?.role ? ROLE_LABELS[user.role] : ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
