"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SchemeCard } from "@/features/worker/components/learning-hub/scheme-card";
import { SchemeFilters } from "@/features/worker/components/learning-hub/scheme-filters";
import { useSchemes } from "@/features/worker/hooks/use-worker-data";

export default function SchemesPage() {
  const { data: schemes, isLoading } = useSchemes();

  return (
    <div className="space-y-4">
      <PageHeader title="Government Schemes" description="Explore government-backed support programs with eligibility, documents, and status details." />
      <SchemeFilters />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)
          : schemes?.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)}
      </div>
    </div>
  );
}
