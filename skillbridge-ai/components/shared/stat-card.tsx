import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: "bridge" | "signal" | "success";
}

const ACCENTS = {
  bridge: "bg-bridge-500/10 text-bridge-600 dark:text-bridge-300",
  signal: "bg-signal-400/15 text-signal-600 dark:text-signal-300",
  success: "bg-success/10 text-success",
};

export function StatCard({ label, value, icon: Icon, trend, trendUp, accent = "bridge" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", ACCENTS[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-semibold leading-tight">{value}</p>
          {trend && (
            <p className={cn("text-xs font-medium", trendUp ? "text-success" : "text-destructive")}>
              {trend}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
