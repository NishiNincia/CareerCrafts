"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Medal, Sparkles, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResumePreviewCardProps {
  parsedResume: {
    name: string;
    title: string;
    summary: string;
    education: Array<{ school: string; degree: string; year: string }>;
    experience: Array<{ role: string; company: string; period: string; bullets: string[] }>;
    skills: string[];
    projects: Array<{ name: string; description: string }>;
    certifications: string[];
  };
}

export function ResumePreviewCard({ parsedResume }: ResumePreviewCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-signal-500" /> Parsed Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-display text-xl font-semibold">{parsedResume.name}</h3>
            <p className="text-sm text-muted-foreground">{parsedResume.title}</p>
          </div>
          <p className="rounded-xl bg-secondary/70 p-4 text-sm text-muted-foreground">{parsedResume.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-bridge-500" /> Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parsedResume.education.map((item) => (
              <div key={`${item.school}-${item.year}`} className="rounded-lg border border-border/60 p-3">
                <p className="font-medium">{item.degree}</p>
                <p className="text-sm text-muted-foreground">{item.school}</p>
                <p className="mt-1 text-xs text-primary">{item.year}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-signal-500" /> Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parsedResume.experience.map((item) => (
              <div key={`${item.company}-${item.role}`} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.role}</p>
                  <span className="text-xs text-muted-foreground">{item.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.company}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="h-4 w-4 text-success" /> Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {parsedResume.skills.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Medal className="h-4 w-4 text-bridge-500" /> Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {parsedResume.certifications.map((cert) => (
                <Badge key={cert} variant="outline">{cert}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {parsedResume.projects.map((project) => (
            <div key={project.name} className="rounded-lg border border-border/60 p-3">
              <p className="font-medium">{project.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
