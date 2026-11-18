import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthLayout from "@/app/(auth)/layout";
import EmployerLayout from "@/app/employer/layout";
import WorkerLayout from "@/app/worker/layout";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import EmployerDashboardPage from "@/app/employer/dashboard/page";
import EmployerGigsPage from "@/app/employer/gigs/page";
import EmployerAnalyticsPage from "@/app/employer/analytics/page";
import EmployerCandidatesPage from "@/app/employer/candidates/page";
import EmployerPaymentsPage from "@/app/employer/payments/page";
import EmployerPostGigPage from "@/app/employer/post-gig/page";
import EmployerPostJobPage from "@/app/employer/post-job/page";
import EmployerReviewsPage from "@/app/employer/reviews/page";
import EmployerTrackingPage from "@/app/employer/tracking/page";
import WorkerDashboardPage from "@/app/worker/dashboard/page";
import WorkerGigsPage from "@/app/worker/gigs/page";
import WorkerJobsPage from "@/app/worker/jobs/page";
import WorkerLearningPage from "@/app/worker/learning/page";
import WorkerMessagesPage from "@/app/worker/messages/page";
import WorkerNotificationsPage from "@/app/worker/notifications/page";
import WorkerProfilePage from "@/app/worker/profile/page";
import WorkerProjectsPage from "@/app/worker/projects/page";
import WorkerResumeAIPage from "@/app/worker/resume-ai/page";
import EmployerSchemesPage from "@/app/employer/schemes/page";
import { useAuthStore } from "@/store/auth-store";

function RequireRole({ role, children }: { role: "worker" | "employer"; children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeRole = useAuthStore((state) => state.activeRole);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (activeRole !== role) {
    return <Navigate to={`/${activeRole}/dashboard`} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={200}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route
              path="/employer"
              element={
                <RequireRole role="employer">
                  <EmployerLayout />
                </RequireRole>
              }
            >
              <Route index element={<Navigate to="/employer/dashboard" replace />} />
              <Route path="dashboard" element={<EmployerDashboardPage />} />
              <Route path="gigs" element={<EmployerGigsPage />} />
              <Route path="analytics" element={<EmployerAnalyticsPage />} />
              <Route path="candidates" element={<EmployerCandidatesPage />} />
              <Route path="payments" element={<EmployerPaymentsPage />} />
              <Route path="post-gig" element={<EmployerPostGigPage />} />
              <Route path="post-job" element={<EmployerPostJobPage />} />
              <Route path="reviews" element={<EmployerReviewsPage />} />
              <Route path="schemes" element={<EmployerSchemesPage />} />
              <Route path="tracking" element={<EmployerTrackingPage />} />
            </Route>

            <Route
              path="/worker"
              element={
                <RequireRole role="worker">
                  <WorkerLayout />
                </RequireRole>
              }
            >
              <Route index element={<Navigate to="/worker/dashboard" replace />} />
              <Route path="dashboard" element={<WorkerDashboardPage />} />
              <Route path="gigs" element={<WorkerGigsPage />} />
              <Route path="jobs" element={<WorkerJobsPage />} />
              <Route path="learning" element={<WorkerLearningPage />} />
              <Route path="messages" element={<WorkerMessagesPage />} />
              <Route path="notifications" element={<WorkerNotificationsPage />} />
              <Route path="profile" element={<WorkerProfilePage />} />
              <Route path="projects" element={<WorkerProjectsPage />} />
              <Route path="resume-ai" element={<WorkerResumeAIPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
