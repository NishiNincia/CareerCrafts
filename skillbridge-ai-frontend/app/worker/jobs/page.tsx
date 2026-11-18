"use client";

import { useState, type FormEvent } from "react";
import { LocateFixed, MapPin, Search, SearchX } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MapView } from "@/components/shared/map-view";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NearbyJobCard } from "@/features/worker/components/nearby-job-card";
import { useNearbyJobs } from "@/features/worker/hooks/use-worker-data";
import { EmptyState } from "@/components/shared/empty-state";
import type { NearbyJobsSearch } from "@/services/job.service";
import type { JobType } from "@/types/job";

export default function NearbyJobsPage() {
  const [locationMode, setLocationMode] = useState<"current" | "manual">("manual");
  const [searchPoint, setSearchPoint] = useState<(NearbyJobsSearch & { label: string }) | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { data: jobs, isLoading, isError, error } = useNearbyJobs(
    searchPoint ? { lat: searchPoint.lat, lng: searchPoint.lng, radiusKm } : undefined
  );
  const [filter, setFilter] = useState<JobType | "all">("all");

  const filtered = jobs?.filter((j) => filter === "all" || j.type === filter) ?? [];

  const useCurrentLocation = () => {
    setLocationMode("current");
    setLocationError(null);
    setIsLocating(true);
    const showManualLocationFallback = (message: string) => {
      setLocationMode("manual");
      setLocationError(message);
      setIsLocating(false);
    };

    if (!window.isSecureContext) {
      showManualLocationFallback("Current location requires HTTPS or localhost. Enter coordinates instead.");
      return;
    }
    if (!navigator.geolocation) {
      showManualLocationFallback("Location access is not available in this browser. Enter coordinates instead.");
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const lat = Number(coords.latitude.toFixed(6));
          const lng = Number(coords.longitude.toFixed(6));
          const label = `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setLatitude(String(lat));
          setLongitude(String(lng));
          setLocationLabel("Current location");
          setSearchPoint({ lat, lng, radiusKm, label });
          setIsLocating(false);
        },
        (error) => {
          const message = error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access or enter coordinates."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Your current location is unavailable. Try again or enter coordinates."
              : "Location lookup timed out. Try again or enter coordinates.";
          showManualLocationFallback(message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    } catch {
      showManualLocationFallback("Could not read your location. Enter coordinates instead.");
    }
  };

  const searchManualLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      !latitude.trim() || !longitude.trim() ||
      !Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lng) || lng < -180 || lng > 180
    ) {
      setLocationError("Enter a valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }

    setLocationError(null);
    setSearchPoint({
      lat,
      lng,
      radiusKm,
      label: locationLabel.trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
  };

  return (
    <div>
      <PageHeader title="Nearby Jobs" description="Find live job listings near your current or chosen location, and adjust how far you want to search." />

      <Card className="mb-4">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={locationMode === "current" ? "default" : "outline"}
              disabled={isLocating}
              aria-busy={isLocating}
              onClick={useCurrentLocation}
            >
              <LocateFixed className={`h-4 w-4 ${isLocating ? "animate-pulse" : ""}`} />
              {isLocating ? "Finding your location..." : "Use current location"}
            </Button>
            <Button
              type="button"
              variant={locationMode === "manual" ? "default" : "outline"}
              onClick={() => {
                setLocationMode("manual");
                setLocationError(null);
              }}
            >
              <MapPin className="h-4 w-4" /> Enter coordinates
            </Button>
          </div>

          {locationMode === "manual" && (
            <form onSubmit={searchManualLocation} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <Input
                aria-label="Location name"
                placeholder="Location name (optional)"
                value={locationLabel}
                onChange={(event) => setLocationLabel(event.target.value)}
              />
              <Input
                aria-label="Latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                required
                placeholder="Latitude"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
              <Input
                aria-label="Longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                required
                placeholder="Longitude"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
              <Button type="submit"><Search className="h-4 w-4" /> Find jobs</Button>
            </form>
          )}

          <div className="grid gap-2 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-center">
            <label htmlFor="job-radius" className="text-sm font-medium">
              Search radius: {radiusKm} km
            </label>
            <input
              id="job-radius"
              type="range"
              min="1"
              max="100"
              step="1"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="w-full accent-primary"
            />
          </div>
          {searchPoint && (
            <p className="text-xs text-muted-foreground">
              Searching within {radiusKm} km of {searchPoint.label}.
            </p>
          )}
          {locationError && <p role="alert" className="text-sm text-destructive">{locationError}</p>}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-3">
          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : isError ? (
            <div role="alert" className="flex h-72 items-center justify-center rounded-xl bg-destructive/5 px-4 text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load nearby jobs."}
            </div>
          ) : !searchPoint ? (
            <div className="flex h-72 items-center justify-center rounded-xl bg-secondary/40 px-4 text-center text-sm text-muted-foreground">
              Choose your current location or enter coordinates to see nearby job locations.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-xl bg-secondary/40 text-sm text-muted-foreground">
              No job locations to show for this filter.
            </div>
          ) : (
            <MapView
              height={280}
              pins={[
                ...filtered.flatMap((job) => job.geo ? [{
                  id: job.id,
                  geo: job.geo,
                  label: job.title,
                  sublabel: `${job.company} · ${job.matchScore ?? 0}% resume match`,
                  variant: "primary" as const,
                }] : []),
                { id: "search-location", geo: { lat: searchPoint.lat, lng: searchPoint.lng }, label: "Search location", sublabel: searchPoint.label, variant: "success" as const, center: true },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as JobType | "all")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="full-time">Full-time</TabsTrigger>
          <TabsTrigger value="part-time">Part-time</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>}

      {filtered.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((job) => <NearbyJobCard key={job.id} job={job} />)}
      </div>}

      {!isLoading && !isError && searchPoint && filtered.length === 0 && (
        <EmptyState icon={SearchX} title="No jobs found nearby" description="Increase the radius or try another location to find more jobs." />
      )}
    </div>
  );
}
