"use client";

import { motion } from "framer-motion";
import { BarChart3, Brain, Info, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResumeAnalysisCardProps {
  metrics: {
    atsScore: number;
    resumeScore: number;
    profileCompletion: number;
    skillStrength: number;
    jobDescriptionProvided?: boolean;
    missingKeywords: string[];
    missingSkills: string[];
  };
}

const metricHelp = {
  "ATS Score": "Percentage of five detected sections present: contact, summary, experience, education, and skills. This is not an employer ATS result.",
  "Resume Score": "Weighted score: 50% ATS + 30% profile completion + 20% skill strength.",
  "Profile Completion": "Percentage of six detected fields present: name, summary, experience, education, skills, and projects.",
  "Skill Strength": "10 points per distinct skill identified from your resume, capped at 100.",
};

export function ResumeAnalysisCard({ metrics }: ResumeAnalysisCardProps) {
  const statCards = [
    { label: "ATS Score", score: metrics.atsScore, description: "Presence of five resume sections", icon: Target },
    { label: "Resume Score", score: metrics.resumeScore, description: "Weighted completeness and skill score", icon: Sparkles },
    { label: "Profile Completion", score: metrics.profileCompletion, description: "Six profile fields detected", icon: BarChart3 },
    { label: "Skill Strength", score: metrics.skillStrength, description: "10 points per distinct skill", icon: Brain },
  ];

  const missingKeywords = metrics.missingKeywords?.length
    ? metrics.missingKeywords
    : [metrics.jobDescriptionProvided ? "No role-specific missing keywords identified." : "Add a job description to see role-specific missing keywords."];
  const missingSkills = metrics.missingSkills?.length ? metrics.missingSkills : ["No major skill gaps flagged from the current resume."];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <TooltipProvider>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{metricHelp[item.label as keyof typeof metricHelp]}</TooltipContent>
                      </Tooltip>
                    </div>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold">{item.score}%</p>
                  <Progress value={item.score} className="mt-3" />
                  <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TooltipProvider>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Missing Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingKeywords.map((keyword) => (
              <div key={keyword} className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-sm">
                <span className="pr-3">{keyword}</span>
                <Badge variant="signal">{keyword.includes("Select a job") ? "General" : "Priority"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Missing Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingSkills.map((skill) => (
              <div key={skill} className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-sm">
                <span>{skill}</span>
                <Badge variant="outline">{skill.includes("No major") ? "Status" : "Priority"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );
}
