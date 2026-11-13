"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Landmark, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { companySchemesService, type CompanySize } from "@/services/company-schemes.service";
import type { GovtScheme } from "@/types/job";

const sizes: { value: CompanySize; label: string }[] = [
  { value: "micro", label: "Micro" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

function BusinessSchemeCard({ scheme }: { scheme: GovtScheme }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{scheme.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{scheme.department}</p>
          </div>
          <Landmark className="h-5 w-5 shrink-0 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{scheme.benefit}</p>
        <p className="text-sm text-muted-foreground">Eligibility: {scheme.eligibility}</p>
        {scheme.officialUrl && (
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Check official scheme details
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default function EmployerSchemesPage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["employer", "company-eligibility"],
    queryFn: companySchemesService.getProfile,
  });
  const schemesQuery = useQuery({
    queryKey: ["employer", "small-business-schemes"],
    queryFn: companySchemesService.getSchemes,
    enabled: profileQuery.data?.eligible === true,
  });
  const [companySize, setCompanySize] = useState<CompanySize | "">("");
  const [turnover, setTurnover] = useState("");

  useEffect(() => {
    if (profileQuery.data) {
      setCompanySize(profileQuery.data.companySize ?? "");
      setTurnover(profileQuery.data.annualTurnoverCr?.toString() ?? "");
    }
  }, [profileQuery.data]);

  const saveProfile = useMutation({
    mutationFn: companySchemesService.updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["employer", "company-eligibility"], profile);
      queryClient.invalidateQueries({ queryKey: ["employer", "small-business-schemes"] });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companySize || turnover === "") return;
    saveProfile.mutate({ companySize, annualTurnoverCr: Number(turnover) });
  };

  return (
    <div>
      <PageHeader
        title="Government schemes for small businesses"
        description="Declare your company size and annual turnover to check access to small-business scheme information."
      />

      {profileQuery.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : profileQuery.isError ? (
        <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
          {profileQuery.error.message}
        </p>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Company eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="company-size">Company size</Label>
                  <select
                    id="company-size"
                    required
                    value={companySize}
                    onChange={(event) => setCompanySize(event.target.value as CompanySize | "")}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>Select company size</option>
                    {sizes.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual-turnover">Annual turnover (₹ crore)</Label>
                  <Input
                    id="annual-turnover"
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    required
                    value={turnover}
                    onChange={(event) => setTurnover(event.target.value)}
                    placeholder="e.g. 8.5"
                  />
                </div>
                <Button type="submit" disabled={saveProfile.isPending || !companySize || turnover === ""}>
                  {saveProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save and check
                </Button>
              </form>
              {saveProfile.isError && <p role="alert" className="mt-3 text-sm text-destructive">{saveProfile.error.message}</p>}
              {saveProfile.isSuccess && (
                <p className="mt-3 text-sm text-success">Company eligibility details saved.</p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Access is limited to declared micro companies with turnover up to ₹10 crore or small companies up to ₹100 crore. Company size is self-declared and not independently verified here; scheme-specific rules may differ, so confirm details on each official portal.
              </p>
            </CardContent>
          </Card>

          {profileQuery.data?.eligible ? (
            <section aria-labelledby="available-schemes">
              <h2 id="available-schemes" className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
                <BadgeCheck className="h-5 w-5 text-success" /> Schemes for eligible small companies
              </h2>
              {schemesQuery.isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-52 rounded-xl" />)}
                </div>
              ) : schemesQuery.isError ? (
                <p role="alert" className="text-sm text-destructive">{schemesQuery.error.message}</p>
              ) : (
                schemesQuery.data ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {schemesQuery.data.map((scheme) => <BusinessSchemeCard key={scheme.id} scheme={scheme} />)}
                  </div>
                ) : (
                  <p role="alert" className="text-sm text-destructive">No scheme data was returned by the backend.</p>
                )
              )}
            </section>
          ) : (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Scheme information is available to micro and small companies within the turnover limits above. Your current declaration does not meet those limits.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
