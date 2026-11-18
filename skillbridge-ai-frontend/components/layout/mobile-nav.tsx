"use client";

import { NavLink, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants";

interface MobileNavProps {
  basePath: string;
  navItems: NavItem[];
}

/** Keep every portal route reachable on small screens with a horizontally scrollable tab bar. */
export function MobileNav({ basePath, navItems }: MobileNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav className="glass-solid fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto overscroll-x-contain px-1 py-2 lg:hidden" aria-label="Primary">
      {navItems.map((item) => {
        const href = `${basePath}${item.href}`;
        const active = pathname === href;
        const Icon = Icons[item.icon as keyof typeof Icons] as LucideIcon;
        return (
          <NavLink
            key={item.href}
            to={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-[72px] flex-none flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
