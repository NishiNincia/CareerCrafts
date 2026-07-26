import { PageHeader } from "@/components/shared/page-header";
import { PostGigForm } from "@/features/employer/components/post-gig-form";

export default function PostGigPage() {
  return (
    <div>
      <PageHeader title="Post a Gig" description="Broadcast an hourly gig to available workers nearby, Rapido-style." />
      <div className="max-w-2xl">
        <PostGigForm />
      </div>
    </div>
  );
}
