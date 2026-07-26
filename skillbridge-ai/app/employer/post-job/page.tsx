import { PageHeader } from "@/components/shared/page-header";
import { PostJobForm } from "@/features/employer/components/post-job-form";

export default function PostJobPage() {
  return (
    <div>
      <PageHeader title="Post a Job" description="AI will start matching qualified candidates as soon as this goes live." />
      <div className="max-w-3xl">
        <PostJobForm />
      </div>
    </div>
  );
}
