"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { employerService } from "@/services/employer.service";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  category: z.string().min(3, "Enter a gig category"),
  durationHours: z.coerce.number().min(0.5, "Enter expected duration"),
  payment: z.coerce.number().min(1, "Enter payment amount"),
  radius: z.coerce.number().min(1, "Enter a search radius"),
});
type FormValues = z.infer<typeof schema>;

export function PostGigForm() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      employerService.postGig({
        category: values.category,
        durationHours: values.durationHours,
        payment: values.payment,
        distanceKm: 0,
        etaMinutes: 0,
        employerRating: 4.5,
        status: "pending",
        expiresInSeconds: 20,
      }),
    onSuccess: () => {
      toast({ title: "Gig broadcast to nearby workers", description: "You'll be notified as workers respond in real time.", variant: "success" });
      reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gig Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <div className="space-y-1.5">
            <Label htmlFor="category">Gig category</Label>
            <Input id="category" placeholder="AC Repair Visit" {...register("category")} />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="durationHours">Duration (hrs)</Label>
              <Input id="durationHours" type="number" step="0.5" placeholder="2" {...register("durationHours")} />
              {errors.durationHours && <p className="text-xs text-destructive">{errors.durationHours.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment">Payment (₹)</Label>
              <Input id="payment" type="number" placeholder="650" {...register("payment")} />
              {errors.payment && <p className="text-xs text-destructive">{errors.payment.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="radius">Search radius (km)</Label>
              <Input id="radius" type="number" placeholder="5" {...register("radius")} />
              {errors.radius && <p className="text-xs text-destructive">{errors.radius.message}</p>}
            </div>
          </div>

          <Button type="submit" variant="signal" size="lg" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isSuccess && !mutation.isPending && <CheckCircle2 className="h-4 w-4" />}
            Broadcast gig to nearby workers
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
