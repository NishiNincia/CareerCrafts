"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Brain, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ResumeAnalysisCardProps {
  metrics: {
    atsScore: number;
    resumeScore: number;
    profileCompletion: number;
    skillStrength: number;
    missingKeywords: string[];
    missingSkills: string[];
  };
}

export function ResumeAnalysisCard({ metrics }: ResumeAnalysisCardProps) {
  const statCards = [
    { label: "ATS Score", value: `${metrics.atsScore}%`, icon: Target },
    { label: "Resume Score", value: `${metrics.resumeScore}%`, icon: Sparkles },
    { label: "Profile Completion", value: `${metrics.profileCompletion}%`, icon: BarChart3 },
    { label: "Skill Strength", value: `${metrics.skillStrength}%`, icon: Brain },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-3 font-display text-2xl font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Missing Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.missingKeywords.map((keyword) => (
              <div key={keyword} className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-sm">
                <span>{keyword}</span>
                <Badge variant="signal">Suggested</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missing Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.missingSkills.map((skill) => (
              <div key={skill} className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-sm">
                <span>{skill}</span>
                <Badge variant="outline">Priority</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Resume Strength <ArrowUpRight className="h-4 w-4 text-primary" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Experience depth", value: 84 },
            { label: "Skill alignment", value: 78 },
            { label: "Formatting clarity", value: 92 },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
