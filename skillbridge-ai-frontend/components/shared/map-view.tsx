"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeoPoint } from "@/types/common";

export interface MapPin_ {
  id: string;
  geo: GeoPoint;
  label: string;
  sublabel?: string;
  variant?: "primary" | "signal" | "success" | "muted";
  center?: boolean;
}

interface MapViewProps {
  pins: MapPin_[];
  className?: string;
  height?: number;
}

const VARIANT_CLASS: Record<NonNullable<MapPin_["variant"]>, string> = {
  primary: "bg-bridge-500 text-white",
  signal: "bg-signal-400 text-bridge-900",
  success: "bg-success text-white",
  muted: "bg-muted-foreground text-white",
};

/**
 * Lightweight, dependency-free "map": projects lat/lng onto a stylized grid
 * canvas so the app doesn't require a Google Maps API key for this build.
 * Swap for react-map-gl / @vis.gl/react-google-maps in production, keeping
 * the same `pins` prop shape.
 */
export function MapView({ pins, className, height = 320 }: MapViewProps) {
  if (pins.length === 0) return null;

  const lats = pins.map((p) => p.geo.lat);
  const lngs = pins.map((p) => p.geo.lng);
  const minLat = Math.min(...lats) - 0.01;
  const maxLat = Math.max(...lats) + 0.01;
  const minLng = Math.min(...lngs) - 0.01;
  const maxLng = Math.max(...lngs) + 0.01;

  const project = (geo: GeoPoint) => {
    const x = ((geo.lng - minLng) / (maxLng - minLng || 1)) * 100;
    const y = 100 - ((geo.lat - minLat) / (maxLat - minLat || 1)) * 100;
    return { x, y };
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border bg-[linear-gradient(rgba(36,81,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(36,81,184,0.06)_1px,transparent_1px)] bg-[size:28px_28px] dark:bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]",
        className
      )}
      style={{ height }}
      role="img"
      aria-label="Map showing nearby locations"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-bridge-50/60 to-transparent dark:from-bridge-900/40" />
      {pins.map((pin) => {
        const { x, y } = project(pin.geo);
        const variant = pin.variant ?? "primary";
        return (
          <motion.div
            key={pin.id}
            className="group absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative flex flex-col items-center">
              {pin.center && (
                <span className="absolute -bottom-1 h-3 w-3 animate-pulse-ring rounded-full bg-signal-400" />
              )}
              <div className={cn("z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md ring-2 ring-white dark:ring-card", VARIANT_CLASS[variant])}>
                <MapPin className="h-4 w-4" fill="currentColor" />
              </div>
              <div className="pointer-events-none absolute top-9 hidden w-max max-w-[160px] -translate-x-1/2 left-1/2 rounded-lg bg-foreground px-2 py-1 text-center text-[10px] font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:block">
                {pin.label}
                {pin.sublabel && <span className="block text-[9px] opacity-70">{pin.sublabel}</span>}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
