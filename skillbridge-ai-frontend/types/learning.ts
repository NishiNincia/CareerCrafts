export interface LearningQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface LearningAssessment {
  id: string;
  moduleId: string | null;
  type: "module" | "final";
  title: string;
  passScore: number;
  questions: LearningQuestion[];
  latestAttempt: {
    score: number;
    passed: boolean;
    attemptedAt: string;
  } | null;
}

export interface LearningModule {
  id: string;
  order: number;
  title: string;
  skill: string;
  description: string;
  lessons: Array<{ id: string; order: number; title: string; content: string }>;
  exercises: Array<{ id: string; title: string; instructions: string }>;
  progress: {
    completedLessons: string[];
    completedExercises: string[];
    mastered: boolean;
  };
  assessment: LearningAssessment | null;
}

export interface LearningProject {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  status: "not_started" | "in_progress" | "submitted" | "completed";
}

export interface LearningRoadmap {
  id: string;
  resumeId: string | null;
  targetRole: string;
  title: string;
  overview: string;
  existingSkills: string[];
  skillGaps: string[];
  status: "active" | "completed";
  createdAt: string;
  updatedAt: string;
  modules: LearningModule[];
  finalAssessment: LearningAssessment | null;
  projects: LearningProject[];
}

export interface AssessmentResult {
  score: number;
  passed: boolean;
  passScore: number;
}

export interface LearningResumeContext {
  id: string;
  filename: string;
  title: string;
  skills: string[];
  missingSkills: string[];
}
