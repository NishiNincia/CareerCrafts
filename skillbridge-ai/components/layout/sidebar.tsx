"use client";

import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { ChevronsLeft, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import type { NavItem } from "@/lib/constants";
import { APP_NAME } from "@/lib/constants";

interface SidebarProps {
  basePath: string;
  navItems: NavItem[];
  portalLabel: string;
}

export function Sidebar({ basePath, navItems, portalLabel }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-[width] duration-300 lg:flex",
        sidebarCollapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-bridge-500 to-signal-400 font-display text-sm font-bold text-white">
          SB
        </div>
        {!sidebarCollapsed && (
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">{portalLabel}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const href = `${basePath}${item.href}`;
          const active = pathname === href;
          const Icon = Icons[item.icon as keyof typeof Icons] as LucideIcon;
          return (
            <NavLink
              key={item.href}
              to={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId={`sidebar-active-${basePath}`}
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
              {!sidebarCollapsed && <span className="relative z-10">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronsLeft className={cn("h-[18px] w-[18px] transition-transform", sidebarCollapsed && "rotate-180")} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
        <NavLink
          to="/login"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </NavLink>
      </div>
    </aside>
  );
}
