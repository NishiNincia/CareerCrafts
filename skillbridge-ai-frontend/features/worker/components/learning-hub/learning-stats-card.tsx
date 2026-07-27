"use client";

import { BookOpen, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LearningStatsCardProps {
  title: string;
  value: string;
  hint: string;
  icon: "book" | "trophy" | "trend";
}

export function LearningStatsCard({ title, value, hint, icon }: LearningStatsCardProps) {
  const iconMap = {
    book: <BookOpen className="h-5 w-5" />,
    trophy: <Trophy className="h-5 w-5" />,
    trend: <TrendingUp className="h-5 w-5" />,
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="rounded-full bg-primary/10 p-2 text-primary">{iconMap[icon]}</div>
        </div>
        <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
