"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Flag,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  Target,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearningRoadmap, useLearningResumeContext } from "@/features/worker/hooks/use-learning-roadmap";
import { learningService } from "@/services/learning.service";
import type { LearningAssessment, LearningRoadmap } from "@/types/learning";

type LearningAction =
  | { type: "lesson"; moduleId: string; lessonId: string }
  | { type: "exercise"; moduleId: string; exerciseId: string }
  | { type: "assessment"; assessmentId: string; answers: number[] }
  | { type: "project"; projectId: string; status: "in_progress" | "submitted" };

function getRoadmapProgress(roadmap: LearningRoadmap) {
  const taskCount = roadmap.modules.reduce(
    (total, module) => total + module.lessons.length + module.exercises.length + 1,
    0,
  ) + 2;
  const completedTasks = roadmap.modules.reduce(
    (total, module) =>
      total
      + module.progress.completedLessons.length
      + module.progress.completedExercises.length
      + (module.progress.mastered ? 1 : 0),
    0,
  )
    + (roadmap.finalAssessment?.latestAttempt?.passed ? 1 : 0)
    + (roadmap.projects.some((project) => project.status === "submitted" || project.status === "completed") ? 1 : 0);
  return taskCount ? Math.min(100, Math.round(completedTasks * 100 / taskCount)) : 0;
}

function AssessmentCard({
  assessment,
  disabled,
  answers,
  onAnswer,
  onSubmit,
  isSubmitting,
  feedback,
}: {
  assessment: LearningAssessment;
  disabled: boolean;
  answers: number[];
  onAnswer: (questionIndex: number, optionIndex: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  feedback?: { score: number; passed: boolean };
}) {
  const allAnswered = answers.length === assessment.questions.length && answers.every((answer) => answer >= 0);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          {assessment.title}
          <Badge variant="outline" className="ml-auto">Pass: {assessment.passScore}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {assessment.questions.map((question, questionIndex) => (
          <fieldset key={question.id} className="space-y-2" disabled={disabled || isSubmitting}>
            <legend className="mb-2 text-sm font-medium">{questionIndex + 1}. {question.prompt}</legend>
            {question.options.map((option, optionIndex) => (
              <label
                key={`${question.id}-${optionIndex}`}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  answers[questionIndex] === optionIndex ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  className="mt-0.5 accent-primary"
                  checked={answers[questionIndex] === optionIndex}
                  onChange={() => onAnswer(questionIndex, optionIndex)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        ))}
        {feedback && (
          <p role="status" className={`text-sm font-medium ${feedback.passed ? "text-success" : "text-destructive"}`}>
            {feedback.passed ? "Assessment passed" : "Not mastered yet"} — {feedback.score}%.
            {feedback.passed ? " You can move on to the next topic." : " Review the lessons and try again."}
          </p>
        )}

        {assessment.latestAttempt && !feedback && (
          <p className="text-sm text-muted-foreground">
            Latest attempt: {assessment.latestAttempt.score}% · {assessment.latestAttempt.passed ? "Mastered" : "Not passed"}
          </p>
        )}
        <Button
          type="button"
          disabled={disabled || isSubmitting || !allAnswered}
          onClick={onSubmit}
        >
          {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Submit assessment
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LearningHubPage() {
  const queryClient = useQueryClient();
  const { data: roadmap, isLoading, isError, error } = useLearningRoadmap();
  const { data: resumeContext, isLoading: resumeLoading, isError: resumeError, error: resumeLoadError } = useLearningResumeContext();
  const [targetRole, setTargetRole] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [feedback, setFeedback] = useState<Record<string, { score: number; passed: boolean }>>({});

  const invalidateRoadmap = () =>
    queryClient.invalidateQueries({ queryKey: ["worker", "learning-roadmap"] });
  const createRoadmap = useMutation({
    mutationFn: learningService.createRoadmap,
    onSuccess: invalidateRoadmap,
  });
  const progressMutation = useMutation({
    mutationFn: async (action: LearningAction) => {
      if (!roadmap) throw new Error("Generate a roadmap before saving progress.");
      if (action.type === "lesson") {
        return learningService.completeLesson(roadmap.id, action.moduleId, action.lessonId);
      }
      if (action.type === "exercise") {
        return learningService.completeExercise(roadmap.id, action.moduleId, action.exerciseId);
      }
      if (action.type === "assessment") {
        return learningService.submitAssessment(roadmap.id, action.assessmentId, action.answers);
      }
      return learningService.updateProject(roadmap.id, action.projectId, action.status);
    },
    onSuccess: async (result, action) => {
      if (action.type === "assessment" && "result" in result) {
        setFeedback((previous) => ({ ...previous, [action.assessmentId]: result.result }));
      }
      await invalidateRoadmap();
    },
  });

  const generate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback({});
    createRoadmap.mutate(targetRole.trim(), {
      onSuccess: () => setShowCreateForm(false),
    });
  };
  const submitAssessment = (assessment: LearningAssessment) => {
    progressMutation.mutate({
      type: "assessment",
      assessmentId: assessment.id,
      answers: answers[assessment.id] ?? [],
    });
  };

  const errorMessage = createRoadmap.error instanceof Error
    ? createRoadmap.error.message
    : progressMutation.error instanceof Error
      ? progressMutation.error.message
      : null;

  if (isLoading || resumeLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Learning Hub" description="Build a personalized learning roadmap from your resume." />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <p role="alert" className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load your learning roadmap."}</p>;
  }

  const roadmapComplete = roadmap?.status === "completed";
  const allModulesMastered = Boolean(roadmap?.modules.length)
    && roadmap!.modules.every((module) => module.progress.mastered);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Learning Hub"
        description="Turn your resume into a role-focused path with AI lessons, practice, and skill assessments."
      />

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {roadmap && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowCreateForm((show) => !show)}>
            <Sparkles className="h-4 w-4" /> {showCreateForm ? "Cancel new roadmap" : "Create another roadmap"}
          </Button>
        </div>
      )}

      {roadmap && showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Choose another target role</CardTitle>
            <p className="text-sm text-muted-foreground">Your current roadmap and progress will remain saved.</p>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={generate}>
              <Input
                aria-label="New target job role"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="e.g. Data Analyst"
                maxLength={120}
                required
              />
              <Button type="submit" disabled={createRoadmap.isPending || !targetRole.trim()}>
                {createRoadmap.isPending
                  ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Generating</>
                  : "Generate roadmap"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!roadmap ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-signal-500" /> Create your learning roadmap
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              We use your latest analyzed resume to identify current skills and gaps, then generate lessons and practice for your target role.
              This roadmap does not depend on the course catalog.
            </p>
          </CardHeader>
          <CardContent>
            {resumeError ? (
              <p role="alert" className="text-sm text-destructive">
                {resumeLoadError instanceof Error ? resumeLoadError.message : "Could not load resume data for learning."}
              </p>
            ) : !resumeContext ? (
              <EmptyState
                icon={FileText}
                title="Analyze a resume first"
                description="A saved resume analysis is needed to identify your existing skills and skill gaps."
                action={<Button asChild><NavLink to="/worker/resume-ai">Analyze resume</NavLink></Button>}
              />
            ) : (
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={generate}>
                <div className="flex-1">
                  <label htmlFor="target-role" className="mb-1.5 block text-sm font-medium">Target job role</label>
                  <Input
                    id="target-role"
                    value={targetRole}
                    onChange={(event) => setTargetRole(event.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    maxLength={120}
                    required
                  />
                </div>
                <Button type="submit" className="self-end" disabled={createRoadmap.isPending || !targetRole.trim()}>
                  {createRoadmap.isPending
                    ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Generating</>
                    : <><Sparkles className="h-4 w-4" /> Generate roadmap</>}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge variant={roadmapComplete ? "success" : "signal"}>
                    {roadmapComplete ? "Career-ready" : "Target role: " + roadmap.targetRole}
                  </Badge>
                  <h2 className="mt-3 font-display text-2xl font-semibold">{roadmap.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{roadmap.overview}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>Roadmap progress</span>
                  <span>{getRoadmapProgress(roadmap)}%</span>
                </div>
                <Progress value={getRoadmapProgress(roadmap)} />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Existing skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.existingSkills.length
                      ? roadmap.existingSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)
                      : <span className="text-sm text-muted-foreground">No skills detected in the resume.</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills to build</p>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.skillGaps.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Learning roadmap</h2>
            {roadmap.modules.map((module, index) => {
              const unlocked = index === 0 || roadmap.modules[index - 1].progress.mastered;
              const lessonsComplete = module.lessons.every((lesson) => module.progress.completedLessons.includes(lesson.id));
              const exercisesComplete = module.exercises.every((exercise) => module.progress.completedExercises.includes(exercise.id));
              return (
                <Card key={module.id} className={!unlocked ? "opacity-70" : undefined}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Topic {module.order}</Badge>
                          <Badge variant={module.progress.mastered ? "success" : "secondary"}>
                            {module.progress.mastered ? "Mastered" : unlocked ? module.skill : "Locked"}
                          </Badge>
                        </div>
                        <CardTitle className="mt-2 text-lg">{module.title}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                      </div>
                      {!unlocked && <LockKeyhole className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                  {unlocked && (
                    <CardContent className="space-y-4">
                      <section className="space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4" /> AI-generated lessons</h3>
                        {module.lessons.map((lesson) => {
                          const complete = module.progress.completedLessons.includes(lesson.id);
                          return (
                            <div key={lesson.id} className="rounded-lg border p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{lesson.title}</p>
                                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{lesson.content}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={complete ? "secondary" : "outline"}
                                  disabled={complete || progressMutation.isPending || roadmapComplete}
                                  onClick={() => progressMutation.mutate({ type: "lesson", moduleId: module.id, lessonId: lesson.id })}
                                >
                                  {complete ? <><Check className="h-4 w-4" /> Done</> : "Mark complete"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </section>

                      <section className="space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold"><Flag className="h-4 w-4" /> Practice exercises</h3>
                        {module.exercises.map((exercise) => {
                          const complete = module.progress.completedExercises.includes(exercise.id);
                          return (
                            <div key={exercise.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                              <div>
                                <p className="font-medium">{exercise.title}</p>
                                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{exercise.instructions}</p>
                              </div>
                              <Button
                                size="sm"
                                variant={complete ? "secondary" : "outline"}
                                disabled={!lessonsComplete || complete || progressMutation.isPending || roadmapComplete}
                                onClick={() => progressMutation.mutate({ type: "exercise", moduleId: module.id, exerciseId: exercise.id })}
                              >
                                {complete ? <><Check className="h-4 w-4" /> Done</> : "Mark practiced"}
                              </Button>
                            </div>
                          );
                        })}
                      </section>

                      {module.assessment && (
                        <AssessmentCard
                          assessment={module.assessment}
                          disabled={!lessonsComplete || !exercisesComplete || roadmapComplete}
                          answers={answers[module.assessment.id] ?? Array(module.assessment.questions.length).fill(-1)}
                          onAnswer={(questionIndex, optionIndex) => setAnswers((previous) => {
                            const nextAnswers = [...(previous[module.assessment!.id] ?? Array(module.assessment!.questions.length).fill(-1))];
                            nextAnswers[questionIndex] = optionIndex;
                            return { ...previous, [module.assessment!.id]: nextAnswers };
                          })}
                          onSubmit={() => submitAssessment(module.assessment!)}
                          isSubmitting={progressMutation.isPending}
                          feedback={feedback[module.assessment.id]}
                        />
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {roadmap.finalAssessment && (
            <AssessmentCard
              assessment={roadmap.finalAssessment}
              disabled={!allModulesMastered || roadmapComplete}
              answers={answers[roadmap.finalAssessment.id] ?? Array(roadmap.finalAssessment.questions.length).fill(-1)}
              onAnswer={(questionIndex, optionIndex) => setAnswers((previous) => {
                const nextAnswers = [...(previous[roadmap.finalAssessment!.id] ?? Array(roadmap.finalAssessment!.questions.length).fill(-1))];
                nextAnswers[questionIndex] = optionIndex;
                return { ...previous, [roadmap.finalAssessment!.id]: nextAnswers };
              })}
              onSubmit={() => submitAssessment(roadmap.finalAssessment!)}
              isSubmitting={progressMutation.isPending}
              feedback={feedback[roadmap.finalAssessment.id]}
            />
          )}

          {roadmap.projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleHelp className="h-5 w-5 text-primary" /> Capstone project
                  <Badge variant={project.status === "submitted" || project.status === "completed" ? "success" : "outline"} className="ml-auto">
                    {project.status.replace("_", " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">{project.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {project.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.status === "not_started" && (
                    <Button
                      disabled={progressMutation.isPending || roadmapComplete}
                      onClick={() => progressMutation.mutate({ type: "project", projectId: project.id, status: "in_progress" })}
                    >
                      Start project <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                  {project.status === "in_progress" && (
                    <Button
                      disabled={progressMutation.isPending || roadmapComplete}
                      onClick={() => progressMutation.mutate({ type: "project", projectId: project.id, status: "submitted" })}
                    >
                      Mark project submitted <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
