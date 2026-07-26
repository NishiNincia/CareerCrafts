"use client";

import { NavLink } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

interface TopbarProps {
  basePath: string;
  title: string;
}

export function Topbar({ basePath, title }: TopbarProps) {
  const userName = useAuthStore((s) => s.userName);

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 px-4 lg:px-6">
      <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs, candidates…" className="w-64 pl-9" aria-label="Search" />
        </div>

        <Button variant="ghost" size="icon" asChild aria-label="Notifications">
          <NavLink to={`${basePath}/notifications`} className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-signal-400" />
          </NavLink>
        </Button>

        <ThemeToggle />

        <NavLink to={`${basePath}/profile`} aria-label="Your profile">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </NavLink>
      </div>
    </header>
  );
}
