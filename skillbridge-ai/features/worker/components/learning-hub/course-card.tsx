"use client";

import { motion } from "framer-motion";
import { BookOpen, Clock3, GraduationCap, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/types/job";

interface LearningCourseCardProps {
  course: Course;
}

const THUMB_CLASS: Record<string, string> = {
  bridge: "from-bridge-500 to-bridge-700",
  signal: "from-signal-400 to-signal-600",
  emerald: "from-emerald-400 to-emerald-600",
};

export function LearningCourseCard({ course }: LearningCourseCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-border/60">
        <div className={`h-24 bg-gradient-to-br ${THUMB_CLASS[course.thumbnailColor] ?? THUMB_CLASS.bridge} flex items-end justify-between p-4`}>
          <div className="rounded-full bg-white/15 p-2 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
            {course.level}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm font-semibold leading-snug">{course.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{course.provider}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1">
              <Star className="h-3.5 w-3.5 text-signal-500" /> 4.8 rating
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1">
              <Clock3 className="h-3.5 w-3.5" /> {course.durationHours} hrs
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{course.matchReason}</p>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Progress</span>
              <span>{course.progress ?? 0}%</span>
            </div>
            <Progress value={course.progress ?? 0} />
          </div>
          <Button className="mt-4 w-full" variant={course.progress && course.progress > 0 ? "outline" : "default"}>
            {course.progress && course.progress > 0 ? "Continue" : "Enroll now"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
