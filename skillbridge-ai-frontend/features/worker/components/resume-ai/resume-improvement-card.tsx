"use client";

import { motion } from "framer-motion";
import { Lightbulb, PenTool, Sparkles, TextSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResumeImprovementCardProps {
  suggestions: Array<{ title: string; detail: string }>;
  rewriteSummary: string;
  experienceTips: string[];
  projectTips: string[];
  keywords: string[];
}

export function ResumeImprovementCard({ suggestions, rewriteSummary, experienceTips, projectTips, keywords }: ResumeImprovementCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-signal-500" /> AI Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((item) => (
            <div key={item.title} className="rounded-lg border border-border/60 p-3">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PenTool className="h-4 w-4 text-bridge-500" /> Rewrite Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl bg-secondary/70 p-4 text-sm text-muted-foreground">{rewriteSummary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-success" /> Improve Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {experienceTips.map((tip) => <div key={tip} className="rounded-lg bg-secondary/70 px-3 py-2 text-sm">{tip}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TextSearch className="h-4 w-4 text-primary" /> Improve Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {projectTips.map((tip) => <div key={tip} className="rounded-lg bg-secondary/70 px-3 py-2 text-sm">{tip}</div>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
