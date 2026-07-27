"use client";

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResumeScoreCardProps {
  score: number;
}

export function ResumeScoreCard({ score }: ResumeScoreCardProps) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const tier = score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 50 ? "Fair" : "Needs work";

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-bridge-500/10 blur-2xl" />
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-signal-500" />
          AI Resume Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <svg width={112} height={112} className="-rotate-90">
            <circle cx={56} cy={56} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={8} />
            <motion.circle
              cx={56}
              cy={56}
              r={radius}
              fill="none"
              stroke="url(#resume-gradient)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="resume-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2451B8" />
                <stop offset="100%" stopColor="#F5A623" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-2xl font-bold">{score}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", score >= 70 ? "text-success" : "text-signal-600 dark:text-signal-300")}>
            {tier}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add 2 more certifications to reach 90+ and unlock premium job matches.
          </p>
          <NavLink to="/worker/resume-ai" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Improve my score <ArrowUpRight className="h-3 w-3" />
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
