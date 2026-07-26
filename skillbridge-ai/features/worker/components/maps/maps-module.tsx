"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, Compass, MapPin, Navigation, Route, Sparkles, TrendingUp, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MapView } from "@/components/shared/map-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import mockMapsData from "@/mock/maps.json";
import { formatCurrency, formatDistance } from "@/lib/utils";
import type { GeoPoint } from "@/types/common";

interface MapsModuleProps {
  title?: string;
}

interface MapItem {
  id: string;
  label: string;
  sublabel: string;
  geo: GeoPoint;
  variant: "primary" | "signal" | "success" | "muted";
}

export function MapsModule({ title = "Maps Module" }: MapsModuleProps) {
  const [radiusKm, setRadiusKm] = useState(8);
  const [liveTracking, setLiveTracking] = useState(true);
  const [routeMode, setRouteMode] = useState(true);
  const [trackingStep, setTrackingStep] = useState(0);

  const { worker, employer, jobs, gigs, routePoints, trackingPoints } = mockMapsData as {
    worker: { id: string; name: string; geo: GeoPoint; status: string; etaMinutes: number };
    employer: { id: string; name: string; geo: GeoPoint; etaMinutes: number; address: string };
    jobs: Array<{ id: string; title: string; company: string; geo: GeoPoint; distanceKm: number; matchScore: number }>;
    gigs: Array<{ id: string; businessName: string; category: string; geo: GeoPoint; distanceKm: number; etaMinutes: number; payment: number }>;
    routePoints: GeoPoint[];
    trackingPoints: GeoPoint[];
  };

  const filteredJobs = useMemo(() => jobs.filter((job) => job.distanceKm <= radiusKm), [jobs, radiusKm]);
  const filteredGigs = useMemo(() => gigs.filter((gig) => gig.distanceKm <= radiusKm), [gigs, radiusKm]);

  useEffect(() => {
    if (!liveTracking) return;
    const interval = window.setInterval(() => {
      setTrackingStep((current) => (current + 1) % trackingPoints.length);
    }, 900);
    return () => window.clearInterval(interval);
  }, [liveTracking, trackingPoints.length]);

  const activeTrackingPoint = trackingPoints[trackingStep] ?? trackingPoints[0];
  const routePins = useMemo<MapItem[]>(() => {
    const pins: MapItem[] = [
      { id: "worker", label: `${worker.name} • ${worker.status}`, sublabel: `ETA ${worker.etaMinutes} min`, geo: worker.geo, variant: "success" },
      { id: "employer", label: employer.name, sublabel: employer.address, geo: employer.geo, variant: "primary" },
    ];
    filteredJobs.forEach((job) => pins.push({ id: job.id, label: job.title, sublabel: `${job.company} • ${job.matchScore}% match`, geo: job.geo, variant: "signal" }));
    filteredGigs.forEach((gig) => pins.push({ id: gig.id, label: gig.businessName, sublabel: `${gig.category} • ${formatCurrency(gig.payment)}`, geo: gig.geo, variant: "muted" }));
    return pins;
  }, [worker, employer, filteredJobs, filteredGigs]);

  return (
    <div className="space-y-4">
      <PageHeader title={title} description="Interactive maps with mock worker, employer, jobs, gigs, routing, and live tracking overlays." />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border/70 bg-gradient-to-br from-bridge-500/10 via-background to-signal-400/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="signal">Worker live</Badge>
              <Badge variant="outline">Route preview</Badge>
              <Badge variant="outline">ETA shown</Badge>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold">Mock Mapbox-style experience with animated navigation.</h3>
            <p className="mt-1 text-sm text-muted-foreground">Use the radius control to focus nearby jobs and gigs, and toggle live tracking to simulate movement.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={routeMode ? "signal" : "outline"} size="sm" onClick={() => setRouteMode((value) => !value)}>
              <Route className="mr-2 h-4 w-4" /> {routeMode ? "Route on" : "Route off"}
            </Button>
            <Button variant={liveTracking ? "signal" : "outline"} size="sm" onClick={() => setLiveTracking((value) => !value)}>
              <TrendingUp className="mr-2 h-4 w-4" /> {liveTracking ? "Tracking live" : "Tracking paused"}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Compass className="h-4 w-4 text-bridge-500" /> Live map</CardTitle>
            <Badge variant="outline">{radiusKm} km radius</Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-3">
              <Label htmlFor="radius" className="text-sm font-medium">Radius filter</Label>
              <Input id="radius" type="range" min="2" max="15" step="1" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} className="h-2 flex-1" />
              <span className="min-w-12 text-right text-sm font-semibold text-bridge-600">{radiusKm} km</span>
            </div>
            <MapView
              height={380}
              pins={[
                { id: "worker", geo: worker.geo, label: `${worker.name} • ${worker.status}`, sublabel: `ETA ${worker.etaMinutes} min`, variant: "success", center: true },
                { id: "employer", geo: employer.geo, label: employer.name, sublabel: employer.address, variant: "primary" },
                ...filteredJobs.map((job) => ({ id: job.id, geo: job.geo, label: job.title, sublabel: `${job.company} • ${job.matchScore}% match`, variant: "signal" as const })),
                ...filteredGigs.map((gig) => ({ id: gig.id, geo: gig.geo, label: gig.businessName, sublabel: `${gig.category} • ${formatCurrency(gig.payment)}`, variant: "muted" as const })),
              ]}
            />
            {routeMode ? (
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-bridge-600">
                  <Navigation className="h-4 w-4" /> Animated route preview
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {routePoints.map((point, index) => (
                    <motion.span
                      key={`${point.lat}-${point.lng}`}
                      initial={{ opacity: 0.3, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                      className="h-2.5 flex-1 rounded-full bg-gradient-to-r from-bridge-500 to-signal-400"
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">The route animates in real time as the worker moves toward the employer cluster and nearby opportunities.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4 text-signal-500" /> Live status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                <p className="text-sm text-muted-foreground">Worker location</p>
                <p className="mt-1 font-display text-lg font-semibold">{worker.name}</p>
                <p className="text-sm text-muted-foreground">{worker.status} • ETA {worker.etaMinutes} min</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                <p className="text-sm text-muted-foreground">Employer location</p>
                <p className="mt-1 font-display text-lg font-semibold">{employer.name}</p>
                <p className="text-sm text-muted-foreground">{employer.address} • {employer.etaMinutes} min away</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                <p className="text-sm text-muted-foreground">Live tracking</p>
                <p className="mt-1 font-display text-lg font-semibold">{liveTracking ? "Moving toward target" : "Paused"}</p>
                <p className="text-sm text-muted-foreground">Current point: {activeTrackingPoint.lat.toFixed(3)}, {activeTrackingPoint.lng.toFixed(3)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-success" /> Nearby opportunities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredJobs.length === 0 && filteredGigs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No nearby jobs or gigs in this radius. Increase the filter to widen the search.</p>
              ) : (
                <>
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <Badge variant="signal">{job.matchScore}%</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {formatDistance(job.distanceKm)}</p>
                    </div>
                  ))}
                  {filteredGigs.map((gig) => (
                    <div key={gig.id} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{gig.businessName}</p>
                          <p className="text-sm text-muted-foreground">{gig.category}</p>
                        </div>
                        <Badge variant="outline">{formatCurrency(gig.payment)}</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {formatDistance(gig.distanceKm)} • {gig.etaMinutes} min</p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
