import { PageHeader } from "@/components/shared/page-header";
import { PostGigForm } from "@/features/employer/components/post-gig-form";

export default function PostGigPage() {
  return (
    <div>
      <PageHeader title="Post a Gig" description="Describe the project, required skills, budget, deadline, and whether the work is online or on-site." />
      <div className="max-w-2xl">
        <PostGigForm />
      </div>
    </div>
  );
}
