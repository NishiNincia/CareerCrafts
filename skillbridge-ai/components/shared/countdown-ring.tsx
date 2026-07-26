"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CountdownRingProps {
  progress: number; // 0 to 1
  remaining: number; // seconds left, shown in the center
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Radial "radar sweep" countdown: gradient ring (bridge blue -> signal amber)
 * drains clockwise as the response window closes. Center shows seconds left.
 */
export function CountdownRing({ progress, remaining, size = 88, strokeWidth = 6, className }: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  const urgent = progress < 0.3;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2451B8" />
            <stop offset="100%" stopColor="#F5A623" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={urgent ? "#E5484D" : "url(#ring-gradient)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("font-mono text-xl font-semibold tabular-nums", urgent && "text-destructive")}>{remaining}</span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">seconds</span>
      </div>
    </div>
  );
}
