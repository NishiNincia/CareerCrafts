"use client";

import { useState } from "react";
import { BookOpen, ClipboardList, GraduationCap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TabsPanelProps {
  items: Array<{ id: string; label: string; description: string }>;
}

export function TabsPanel({ items }: TabsPanelProps) {
  const [active, setActive] = useState(items[0]?.id ?? "recommended");

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                active === item.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              )}
            >
              {item.id === "recommended" ? <GraduationCap className="h-4 w-4" /> : item.id === "paths" ? <BookOpen className="h-4 w-4" /> : item.id === "certificates" ? <ShieldCheck className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
          {items.find((item) => item.id === active)?.description}
        </div>
      </CardContent>
    </Card>
  );
}
