"use client";

import { useForm } from "react-hook-form";
import { MapPin, Star, Briefcase, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/shared/rating-stars";
import { getInitials } from "@/lib/utils";
import { useWorkerProfile } from "@/features/worker/hooks/use-worker-data";
import { useToast } from "@/hooks/use-toast";

interface ProfileForm {
  title: string;
  location: string;
  bio: string;
}

export default function WorkerProfilePage() {
  const { data: profile, isLoading } = useWorkerProfile();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<ProfileForm>({
    values: profile ? { title: profile.title, location: profile.location, bio: "" } : undefined,
  });

  const onSubmit = () => {
    toast({ title: "Profile updated", variant: "success" });
  };

  if (isLoading || !profile) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <div>
      <PageHeader title="Profile" description="This is how employers see you across SkillBridge AI." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-20 w-20 text-lg">
              <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <p className="mt-3 font-display text-lg font-semibold">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.title}</p>
            <div className="mt-2">
              <RatingStars rating={profile.rating} />
            </div>

            <div className="mt-5 grid w-full grid-cols-1 gap-2 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {profile.location}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" /> {profile.totalJobsCompleted} jobs completed
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Member since {profile.memberSince}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <Label htmlFor="title">Professional title</Label>
                <Input id="title" {...register("title")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register("location")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">About you</Label>
                <Textarea id="bio" placeholder="Tell employers about your experience…" {...register("bio")} />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
