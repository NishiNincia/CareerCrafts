"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, LocateFixed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { employerService } from "@/services/employer.service";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@/types/job";

const schema = z.object({
  title: z.string().min(3, "Enter a job title"),
  location: z.string().min(2, "Enter a location"),
  latitude: z.number().finite().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().finite().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  type: z.enum(["full-time", "part-time", "contract"]),
  salaryMin: z.coerce.number().min(1, "Enter minimum salary"),
  salaryMax: z.coerce.number().min(1, "Enter maximum salary"),
  skills: z.string().min(2, "List at least one required skill"),
  description: z.string().min(20, "Description should be at least 20 characters"),
}).refine((values) => values.salaryMax >= values.salaryMin, {
  path: ["salaryMax"],
  message: "Maximum salary must be at least the minimum salary",
});
type FormValues = z.infer<typeof schema>;

interface PostJobFormProps {
  job?: Job;
  onCancel?: () => void;
  onSaved?: () => void;
}

function getDefaultValues(job?: Job): Partial<FormValues> {
  if (!job) return { type: "full-time" };
  return {
    title: job.title,
    location: job.location,
    latitude: job.geo?.lat ?? 0,
    longitude: job.geo?.lng ?? 0,
    type: job.type,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    skills: job.skills.join(", "),
    description: job.description,
  };
}

export function PostJobForm({ job, onCancel, onSaved }: PostJobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [locationError, setLocationError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(job),
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        skills: values.skills.split(",").map((s) => s.trim()),
      };
      return job
        ? employerService.updateJob(job.id, payload)
        : employerService.postJob(payload);
    },
    onError: (error) => {
      toast({
        title: job ? "Could not update job" : "Could not post job",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (savedJob) => {
      void queryClient.invalidateQueries({ queryKey: ["employer", "active-jobs"] });
      toast({
        title: job ? "Job updated successfully" : "Job posted successfully",
        description: "Your job is saved and visible to workers nearby.",
        variant: "success",
      });
      reset(getDefaultValues(job ? savedJob : undefined));
      onSaved?.();
    },
  });

  const useCurrentLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location access is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue("latitude", Number(coords.latitude.toFixed(6)), { shouldValidate: true });
        setValue("longitude", Number(coords.longitude.toFixed(6)), { shouldValidate: true });
      },
      () => setLocationError("Could not read your location. Enter the coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{job ? "Edit Job Details" : "Job Details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" placeholder="Site Electrician" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Powai, Mumbai" {...register("location")} />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Job coordinates</p>
                <p className="text-xs text-muted-foreground">Used to show this job within workers’ selected search radius.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation}>
                <LocateFixed className="h-4 w-4" /> Use current location
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" placeholder="19.0760" {...register("latitude", { valueAsNumber: true })} />
                {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" placeholder="72.8777" {...register("longitude", { valueAsNumber: true })} />
                {errors.longitude && <p className="text-xs text-destructive">{errors.longitude.message}</p>}
              </div>
            </div>
            {locationError && <p role="alert" className="text-xs text-destructive">{locationError}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Employment type</Label>
              <select id="type" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register("type")}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaryMin">Min salary (₹/mo)</Label>
              <Input id="salaryMin" type="number" placeholder="18000" {...register("salaryMin")} />
              {errors.salaryMin && <p className="text-xs text-destructive">{errors.salaryMin.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaryMax">Max salary (₹/mo)</Label>
              <Input id="salaryMax" type="number" placeholder="24000" {...register("salaryMax")} />
              {errors.salaryMax && <p className="text-xs text-destructive">{errors.salaryMax.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skills">Required skills (comma separated)</Label>
            <Input id="skills" placeholder="Electrical Wiring, Panel Installation" {...register("skills")} />
            {errors.skills && <p className="text-xs text-destructive">{errors.skills.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Job description</Label>
            <Textarea id="description" rows={5} placeholder="Describe responsibilities, site details, and requirements…" {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isSuccess && !mutation.isPending && <CheckCircle2 className="h-4 w-4" />}
            {job ? "Save changes" : "Post job"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
