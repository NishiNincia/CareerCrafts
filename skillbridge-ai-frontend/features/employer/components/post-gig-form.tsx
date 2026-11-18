"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { gigMarketplaceService } from "@/services/gig-marketplace.service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  title: z.string().trim().min(3, "Enter a gig title").max(180),
  description: z.string().trim().min(10, "Describe the expected work").max(10000),
  requiredSkills: z.string().trim().min(2, "List at least one required skill"),
  budget: z.coerce.number().finite().positive("Enter a positive budget"),
  deadline: z.string().min(1, "Choose a deadline"),
  workMode: z.enum(["online", "on_site"]),
  locationAddress: z.string(),
  latitude: z.string(),
  longitude: z.string(),
}).superRefine((values, context) => {
  if (values.workMode !== "on_site") return;
  const lat = Number(values.latitude);
  const lng = Number(values.longitude);
  if (values.locationAddress.trim().length < 4) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["locationAddress"], message: "Enter the on-site address" });
  }
  if (values.latitude.trim() === "" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["latitude"], message: "Enter a valid latitude" });
  }
  if (values.longitude.trim() === "" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["longitude"], message: "Enter a valid longitude" });
  }
});

type FormValues = z.infer<typeof schema>;

export function PostGigForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { workMode: "online", locationAddress: "", latitude: "", longitude: "" },
  });
  const workMode = watch("workMode");

  const mutation = useMutation({
    mutationFn: (values: FormValues) => gigMarketplaceService.create({
      title: values.title,
      description: values.description,
      requiredSkills: values.requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
      budget: values.budget,
      deadline: values.deadline,
      workMode: values.workMode,
      ...(values.workMode === "on_site" ? {
        locationAddress: values.locationAddress.trim(),
        geo: { lat: Number(values.latitude), lng: Number(values.longitude) },
      } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer", "marketplace-gigs"] });
      toast({ title: "Gig published", description: "Workers can now find it and send proposals.", variant: "success" });
      reset();
      navigate("/employer/gigs");
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Gig details</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div className="space-y-1.5">
            <Label htmlFor="gig-title">Title</Label>
            <Input id="gig-title" placeholder="Repair the office air-conditioning system" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gig-description">Description</Label>
            <Textarea id="gig-description" rows={5} placeholder="Describe the scope, expected deliverables, and any relevant context." {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gig-skills">Required skills (comma separated)</Label>
            <Input id="gig-skills" placeholder="HVAC repair, electrical safety" {...register("requiredSkills")} />
            {errors.requiredSkills && <p className="text-xs text-destructive">{errors.requiredSkills.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gig-budget">Budget (₹)</Label>
              <Input id="gig-budget" type="number" min="1" step="0.01" {...register("budget")} />
              {errors.budget && <p className="text-xs text-destructive">{errors.budget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gig-deadline">Deadline</Label>
              <Input id="gig-deadline" type="date" min={new Date().toISOString().slice(0, 10)} {...register("deadline")} />
              {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gig-work-mode">Work mode</Label>
            <select id="gig-work-mode" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...register("workMode")}>
              <option value="online">Online / remote</option>
              <option value="on_site">On-site / offline</option>
            </select>
          </div>
          {workMode === "on_site" && (
            <div className="space-y-4 rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" />Work location</div>
              <div className="space-y-1.5">
                <Label htmlFor="gig-location">Address</Label>
                <Input id="gig-location" placeholder="Street address, city" {...register("locationAddress")} />
                {errors.locationAddress && <p className="text-xs text-destructive">{errors.locationAddress.message}</p>}
              </div>
              <p className="text-xs text-muted-foreground">Coordinates are used to show the accepted worker the location and directions.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gig-latitude">Latitude</Label>
                  <Input id="gig-latitude" type="number" step="any" placeholder="19.0760" {...register("latitude")} />
                  {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gig-longitude">Longitude</Label>
                  <Input id="gig-longitude" type="number" step="any" placeholder="72.8777" {...register("longitude")} />
                  {errors.longitude && <p className="text-xs text-destructive">{errors.longitude.message}</p>}
                </div>
              </div>
            </div>
          )}
          {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish gig
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
