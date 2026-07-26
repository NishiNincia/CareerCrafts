"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { employerService } from "@/services/employer.service";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(3, "Enter a job title"),
  location: z.string().min(2, "Enter a location"),
  type: z.enum(["full-time", "part-time", "contract"]),
  salaryMin: z.coerce.number().min(1, "Enter minimum salary"),
  salaryMax: z.coerce.number().min(1, "Enter maximum salary"),
  skills: z.string().min(2, "List at least one required skill"),
  description: z.string().min(20, "Description should be at least 20 characters"),
});
type FormValues = z.infer<typeof schema>;

export function PostJobForm() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "full-time" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      employerService.postJob({
        ...values,
        skills: values.skills.split(",").map((s) => s.trim()),
      }),
    onSuccess: () => {
      toast({ title: "Job posted successfully", description: "AI matching will begin surfacing candidates shortly.", variant: "success" });
      reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
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
            Post job
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
