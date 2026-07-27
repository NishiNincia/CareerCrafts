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
import WorkerMapsPage from "@/app/worker/maps/page";
import WorkerMessagesPage from "@/app/worker/messages/page";
import WorkerNotificationsPage from "@/app/worker/notifications/page";
import WorkerProfilePage from "@/app/worker/profile/page";
import WorkerResumeAIPage from "@/app/worker/resume-ai/page";
import WorkerSchemesPage from "@/app/worker/schemes/page";
import { useAuthStore } from "@/store/auth-store";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
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
                <RequireAuth>
                  <EmployerLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/employer/dashboard" replace />} />
              <Route path="dashboard" element={<EmployerDashboardPage />} />
              <Route path="analytics" element={<EmployerAnalyticsPage />} />
              <Route path="candidates" element={<EmployerCandidatesPage />} />
              <Route path="payments" element={<EmployerPaymentsPage />} />
              <Route path="post-gig" element={<EmployerPostGigPage />} />
              <Route path="post-job" element={<EmployerPostJobPage />} />
              <Route path="reviews" element={<EmployerReviewsPage />} />
              <Route path="tracking" element={<EmployerTrackingPage />} />
            </Route>

            <Route
              path="/worker"
              element={
                <RequireAuth>
                  <WorkerLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/worker/dashboard" replace />} />
              <Route path="dashboard" element={<WorkerDashboardPage />} />
              <Route path="gigs" element={<WorkerGigsPage />} />
              <Route path="jobs" element={<WorkerJobsPage />} />
              <Route path="maps" element={<WorkerMapsPage />} />
              <Route path="learning" element={<WorkerLearningPage />} />
              <Route path="messages" element={<WorkerMessagesPage />} />
              <Route path="notifications" element={<WorkerNotificationsPage />} />
              <Route path="profile" element={<WorkerProfilePage />} />
              <Route path="resume-ai" element={<WorkerResumeAIPage />} />
              <Route path="schemes" element={<WorkerSchemesPage />} />
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
