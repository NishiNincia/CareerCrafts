"use client";

import { motion } from "framer-motion";
import { BarChart3, Brain, Info, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AnalysisMode = "FULL_JOB_DESCRIPTION" | "ROLE_ONLY" | "NO_JOB_CONTEXT";

interface ResumeAnalysisCardProps {
  analysisProvider?: string;
  metrics: {
    atsScore: number;
    resumeScore: number;
    profileCompletion: number;
    skillStrength: number;
    analysisMode?: AnalysisMode;
    jobDescriptionProvided?: boolean;
    missingKeywords: string[];
    missingSkills: string[];
    structureScore?: number | null;
    compatibilityScore?: number | null;
    employerCompatibilityScore?: number | null;
    estimatedRoleCompatibilityScore?: number | null;
    generalImprovementSuggestions?: string[];
    jobRequirements?: Array<{
      skillName: string;
      skillId?: string;
      category: string;
      importance: string;
      requirementType?: string;
      description?: string;
      relevanceReason?: string;
      sourceEvidence?: string;
      expectation?: "essential" | "preferred";
      matchStatus: "MATCHED" | "PARTIALLY_MATCHED" | "MISSING" | "UNVERIFIABLE" | "matched" | "partial" | "missing" | "unverifiable";
      supportingEvidence: string;
      explanation: string;
      suggestedImprovement: string;
    }>;
    roleCompetencyProfile?: {
      roleTitle: string;
      expectedExperienceLevel: string;
      technicalSkills: string[];
      coreCompetencies: string[];
      toolsAndFrameworks: string[];
      educationalExpectations: string[];
      typicalResponsibilities: string[];
    } | null;
    keywordAnalysis?: {
      present: string[];
      missingImportant: string[];
      presentWithoutEvidence: string[];
      shouldHighlight: string[];
      requireAcquisition: string[];
    } | null;
  };
}

const metricHelp: Record<string, string> = {
  "ATS Score": "Percentage of five detected sections present: contact, summary, experience, education, and skills. This is not an employer ATS result.",
  "Resume Score": "Weighted score: 50% ATS + 30% profile completion + 20% skill strength.",
  "Profile Completion": "Percentage of six detected fields present: name, summary, experience, education, skills, and projects.",
  "Skill Strength": "10 points per distinct skill identified from your resume, capped at 100.",
  "Resume Structure": "Backend score for section organization, ATS readability, consistency, clarity, and grammar based on extracted text.",
  "Employer-Specific Job Compatibility": "Weighted match against requirements extracted from the provided employer job description.",
  "ESTIMATED ROLE COMPATIBILITY": "Estimated match against common industry expectations for this role; actual employer requirements may differ.",
};

const MATCH_GROUPS = [
  { status: "MATCHED", label: "Matched" },
  { status: "PARTIALLY_MATCHED", label: "Partially matched" },
  { status: "MISSING", label: "Missing" },
  { status: "UNVERIFIABLE", label: "Unverifiable" },
] as const;

function normalizeMatchStatus(status: string) {
  const normalized = status.toUpperCase();
  return normalized === "PARTIAL" ? "PARTIALLY_MATCHED" : normalized;
}

export function ResumeAnalysisCard({ metrics, analysisProvider }: ResumeAnalysisCardProps) {
  const isParserFallback = analysisProvider === "Local Resume Parser";
  const mode = metrics.analysisMode || (metrics.jobDescriptionProvided
    ? "FULL_JOB_DESCRIPTION"
    : "NO_JOB_CONTEXT");
  const employerMatchingUnavailable = isParserFallback && mode === "FULL_JOB_DESCRIPTION";
  const modeDescription = mode === "FULL_JOB_DESCRIPTION"
    ? employerMatchingUnavailable
      ? "Resume extracted locally. Employer-specific matching is unavailable because job requirements could not be analyzed."
      : "Matched against the provided job description."
    : mode === "ROLE_ONLY"
      ? "Estimated match based on common industry expectations for this role. Actual employer requirements may differ."
      : "Resume-only evaluation. Job compatibility is unavailable without a target role or job description.";
  const compatibilityLabel = mode === "FULL_JOB_DESCRIPTION"
    ? "Employer-Specific Job Compatibility"
    : "ESTIMATED ROLE COMPATIBILITY";
  const compatibilityScore = mode === "FULL_JOB_DESCRIPTION"
    ? metrics.employerCompatibilityScore ?? metrics.compatibilityScore
    : metrics.estimatedRoleCompatibilityScore ?? metrics.compatibilityScore;
  const independentScores = [
    { label: "Resume Structure", score: metrics.structureScore, description: "Independent resume structure score" },
    ...(mode === "NO_JOB_CONTEXT"
      ? []
      : [{
        label: compatibilityLabel,
        score: compatibilityScore,
        description: mode === "FULL_JOB_DESCRIPTION"
          ? "Employer-specific requirement match"
          : "Estimated match against common role expectations",
      }]),
  ];
  const statCards = [
    { label: "ATS Score", score: metrics.atsScore, description: "Presence of five resume sections", icon: Target },
    { label: "Resume Score", score: metrics.resumeScore, description: "Weighted completeness and skill score", icon: Sparkles },
    { label: "Profile Completion", score: metrics.profileCompletion, description: "Six profile fields detected", icon: BarChart3 },
    { label: "Skill Strength", score: metrics.skillStrength, description: "10 points per distinct skill", icon: Brain },
  ];
  const jobRequirements = Array.isArray(metrics.jobRequirements) ? metrics.jobRequirements : [];
  const keywordGroups = mode !== "NO_JOB_CONTEXT" && !employerMatchingUnavailable && metrics.keywordAnalysis
    ? [
      ["Present", metrics.keywordAnalysis.present],
      ["Missing Important", metrics.keywordAnalysis.missingImportant],
      ["Present Without Evidence", metrics.keywordAnalysis.presentWithoutEvidence],
      ["Should Highlight", metrics.keywordAnalysis.shouldHighlight],
      ["Requires Acquisition", metrics.keywordAnalysis.requireAcquisition],
    ] as const
    : [];
  const generalSuggestions = Array.isArray(metrics.generalImprovementSuggestions)
    ? metrics.generalImprovementSuggestions
    : [];
  const roleProfile = mode === "ROLE_ONLY" ? metrics.roleCompetencyProfile : null;
  const roleProfileGroups = roleProfile
    ? [
      ["Common technical skills", roleProfile.technicalSkills],
      ["Core competencies", roleProfile.coreCompetencies],
      ["Tools and frameworks", roleProfile.toolsAndFrameworks],
      ["Educational expectations", roleProfile.educationalExpectations],
      ["Typical responsibilities", roleProfile.typicalResponsibilities],
    ] as const
    : [];

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm font-medium">{modeDescription}</p>
            {mode === "ROLE_ONLY" && <Badge variant="signal">ESTIMATED ROLE COMPATIBILITY</Badge>}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {independentScores.map((item) => (
            <Card key={item.label} className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label={`About ${item.label}`} className="text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{metricHelp[item.label] || item.description}</TooltipContent>
                  </Tooltip>
                </div>
                <p className="mt-2 font-display text-3xl font-semibold">
                  {item.score === null || item.score === undefined ? "N/A" : `${item.score}%`}
                </p>
                <Progress value={item.score ?? 0} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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
                          <button type="button" aria-label={`About ${item.label}`} className="text-muted-foreground">
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{metricHelp[item.label]}</TooltipContent>
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

        {roleProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Common Role Competency Profile: {roleProfile.roleTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">{roleProfile.expectedExperienceLevel}</p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roleProfileGroups.map(([label, values]) => (
                <div key={label} className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm font-medium">{label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {values.map((value) => <Badge key={value} variant="outline">{value}</Badge>)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {jobRequirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{mode === "ROLE_ONLY" ? "Estimated Role Competency Match" : "Employer Requirement Match"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {MATCH_GROUPS.map(({ status, label }) => {
                const matchingRequirements = jobRequirements.filter((item) => normalizeMatchStatus(item.matchStatus) === status);
                return (
                  <div key={status} className="rounded-lg border border-border/60 p-3">
                    <p className="mb-2 text-sm font-semibold">{label}</p>
                    <div className="space-y-2">
                      {matchingRequirements.map((item) => (
                        <div key={`${item.skillId || item.skillName}-${item.importance}`} className="rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">{item.skillName}</span>
                            <div className="flex gap-1">
                              <Badge variant="outline">{item.importance}</Badge>
                              {item.expectation && <Badge variant="secondary">{item.expectation}</Badge>}
                            </div>
                          </div>
                          {item.description && <p className="mt-1 text-xs">{item.description}</p>}
                          {item.relevanceReason && <p className="mt-1 text-xs text-muted-foreground">{item.relevanceReason}</p>}
                          {item.sourceEvidence && <p className="mt-1 text-xs text-muted-foreground">Job source: {item.sourceEvidence}</p>}
                          {item.supportingEvidence && <p className="mt-1 text-xs text-muted-foreground">{item.supportingEvidence}</p>}
                          {item.explanation && <p className="mt-1 text-xs">{item.explanation}</p>}
                          {item.suggestedImprovement && <p className="mt-1 text-xs text-primary">{item.suggestedImprovement}</p>}
                        </div>
                      ))}
                      {!matchingRequirements.length && <p className="text-xs text-muted-foreground">No {label.toLowerCase()} requirements identified.</p>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {keywordGroups.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Requirement Keyword Analysis</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {keywordGroups.map(([label, values]) => {
                const safeValues = Array.isArray(values) ? values : [];
                return (
                  <div key={label} className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-sm font-medium">{label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {safeValues.length
                        ? safeValues.map((value) => <Badge key={value} variant="outline">{value}</Badge>)
                        : <span className="text-xs text-muted-foreground">None identified</span>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {mode === "NO_JOB_CONTEXT" ? (
          <Card>
            <CardHeader><CardTitle>General Improvement Suggestions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {generalSuggestions.map((suggestion) => (
                <p key={suggestion} className="rounded-lg bg-secondary/70 px-3 py-2 text-sm">{suggestion}</p>
              ))}
            </CardContent>
          </Card>
        ) : employerMatchingUnavailable ? null : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Requirement Gaps</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {metrics.missingKeywords.length
                  ? metrics.missingKeywords.map((keyword) => (
                    <div key={keyword} className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-sm">
                      <span className="pr-3">{keyword}</span>
                      <Badge variant="signal">Review</Badge>
                    </div>
                  ))
                  : <p className="text-sm text-muted-foreground">No unmatched requirements identified.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Skills to Build</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {metrics.missingSkills.length
                  ? metrics.missingSkills.map((skill) => (
                    <div key={skill} className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-sm">
                      <span>{skill}</span>
                      <Badge variant="outline">Priority</Badge>
                    </div>
                  ))
                  : <p className="text-sm text-muted-foreground">No missing skills identified.</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
