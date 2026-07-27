"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseCard } from "@/features/worker/components/course-card";
import type { Course } from "@/types/job";

interface LearningRecommendationsCardProps {
  courses: Course[];
}

export function LearningRecommendationsCard({ courses }: LearningRecommendationsCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-bridge-500" /> Learning Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
