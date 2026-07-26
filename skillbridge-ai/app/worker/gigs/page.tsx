"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, MapPin, Sparkles, Wallet, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MapView } from "@/components/shared/map-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { GigCard } from "@/features/worker/components/gig-card";
import { useIncomingGig } from "@/features/worker/hooks/use-incoming-gig";
import { useGigs, useWorkerProfile } from "@/features/worker/hooks/use-worker-data";
import { formatCurrency } from "@/lib/utils";

export default function GigsPage() {
  const { data: gigs, isLoading } = useGigs();
  const { data: profile, isLoading: profileLoading } = useWorkerProfile();
  const { simulate } = useIncomingGig();
  const [online, setOnline] = useState(true);

  const completedValue = useMemo(() => (gigs ?? []).filter((gig) => gig.status === "completed").reduce((total, gig) => total + gig.payment, 0), [gigs]);
  const activeMatches = gigs?.filter((gig) => gig.status !== "completed") ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hyperlocal Gigs"
        description="Stay online, accept nearby jobs fast, and keep every step of the delivery flow in one place."
        action={
          <Button variant="signal" onClick={simulate}>
            <Zap className="h-4 w-4" /> Simulate incoming gig
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-3xl border border-signal-200/70 bg-gradient-to-br from-signal-500/10 via-background to-bridge-500/10 p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={online ? "signal" : "secondary"}>{online ? "Live for gigs" : "Paused"}</Badge>
              <Badge variant="outline">Fast dispatch</Badge>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold">{online ? "You are ready to accept nearby service requests." : "You are offline for new requests."}</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Nearby businesses can ping you instantly. Keep your availability toggled on to stay competitive and earn faster.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/70 px-3 py-2">
            <Switch checked={online} onCheckedChange={setOnline} />
            <span className="text-sm font-medium">{online ? "Online" : "Offline"}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active matches</p>
              <div className="flex items-center gap-1 text-signal-600 dark:text-signal-300">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">{activeMatches.length}</span>
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{activeMatches.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Open gigs waiting for your acceptance.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Earnings ready</p>
              <Wallet className="h-4 w-4 text-success" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{formatCurrency(completedValue + 1800)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Projected payout from completed and pending gigs.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Average response</p>
              <Clock3 className="h-4 w-4 text-bridge-600" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">6 min</p>
            <p className="mt-1 text-sm text-muted-foreground">Most gigs are accepted within a few minutes.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Live route map</CardTitle>
            <Badge variant="outline">{online ? "Live now" : "Offline"}</Badge>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <Skeleton className="h-80 w-full rounded-2xl" />
            ) : profile ? (
              <MapView
                height={300}
                pins={[
                  { id: "me", geo: profile.geo, label: "You are here", variant: "success", center: true },
                  { id: "gig-1", geo: { lat: profile.geo.lat + 0.008, lng: profile.geo.lng + 0.006 }, label: "Nearby pickup", variant: "signal", sublabel: "2 min away" },
                  { id: "gig-2", geo: { lat: profile.geo.lat - 0.005, lng: profile.geo.lng + 0.004 }, label: "Service hub", variant: "primary", sublabel: "Quick handoff" },
                ]}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nearby gig queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-xl" />)
            ) : (
              gigs?.slice(0, 3).map((gig) => <GigCard key={gig.id} gig={gig} />)
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gig history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-xl" />)
          ) : (
            gigs?.map((gig) => <GigCard key={gig.id} gig={gig} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
