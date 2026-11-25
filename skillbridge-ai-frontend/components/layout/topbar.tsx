"use client";

import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { notificationService } from "@/services/notification.service";

interface TopbarProps {
  basePath: string;
  title: string;
}

export function Topbar({ basePath, title }: TopbarProps) {
  const navigate = useNavigate();
  const userName = useAuthStore((s) => s.userName);
  const logout = useAuthStore((s) => s.logout);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationService.unreadCount,
    enabled: Boolean(accessToken),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 px-4 lg:px-6">
      <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs, candidates…" className="w-64 pl-9" aria-label="Search" />
        </div>

        <Button variant="ghost" size="icon" asChild aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}>
          <NavLink to={`${basePath}/notifications`} className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-signal-400" />}
          </NavLink>
        </Button>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Sign out"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>

        <NavLink to={`${basePath}/profile`} aria-label="Your profile">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </NavLink>
      </div>
    </header>
  );
}
