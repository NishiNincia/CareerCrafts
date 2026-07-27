import { GraduationCap, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/job";

const THUMB_CLASS: Record<string, string> = {
  bridge: "from-bridge-500 to-bridge-700",
  signal: "from-signal-400 to-signal-600",
  emerald: "from-emerald-400 to-emerald-600",
};

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-20 bg-gradient-to-br", THUMB_CLASS[course.thumbnailColor] ?? THUMB_CLASS.bridge, "flex items-center justify-end p-4")}>
        <GraduationCap className="h-8 w-8 text-white/70" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-semibold leading-snug">{course.title}</p>
          <Badge variant="outline" className="shrink-0">{course.level}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{course.provider}</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" /> {course.durationHours} hrs
        </div>
        <p className="mt-2 text-xs text-signal-600 dark:text-signal-300">{course.matchReason}</p>
        {typeof course.progress === "number" && course.progress > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
