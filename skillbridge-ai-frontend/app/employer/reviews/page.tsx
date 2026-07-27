"use client";

import { Star } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard } from "@/features/employer/components/review-card";
import { useEmployerReviews, useEmployerProfile } from "@/features/employer/hooks/use-employer-data";

export default function ReviewsPage() {
  const { data: reviews, isLoading } = useEmployerReviews();
  const { data: profile } = useEmployerProfile();

  return (
    <div>
      <PageHeader title="Reviews" description="Feedback from workers who've completed jobs and gigs with you." />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Overall Rating" value={profile ? profile.rating.toFixed(1) : "—"} icon={Star} accent="signal" />
        <StatCard label="Total Reviews" value={reviews ? `${reviews.length}` : "—"} icon={Star} accent="bridge" />
        <StatCard label="Response Rate" value="94%" icon={Star} accent="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          : reviews?.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  );
}
