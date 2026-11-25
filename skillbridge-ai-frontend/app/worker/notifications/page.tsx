"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, MapPin, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NotificationCard } from "@/features/worker/components/notifications/notification-card";
import {
  notificationService,
  type AppNotification,
  type NotificationPreferences,
} from "@/services/notification.service";
import { useAuthStore } from "@/store/auth-store";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  gigRadiusKm: 10,
  latitude: null,
  longitude: null,
};

function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location services are not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => reject(new Error("Location permission was denied. Allow location access to receive nearby gig alerts.")),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeRole = useAuthStore((state) => state.activeRole);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const [items, savedPreferences] = await Promise.all([
          notificationService.getAll(),
          activeRole === "worker" ? notificationService.getPreferences() : Promise.resolve(DEFAULT_PREFERENCES),
        ]);
        if (!active) return;
        setNotifications(items);
        setPreferences(savedPreferences);
        await notificationService.markAllRead();
        if (!active) return;
        setNotifications(items.map((item) => ({ ...item, unread: false })));
        queryClient.setQueryData(["notifications", "unread-count"], 0);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load notifications.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadPage();
    return () => {
      active = false;
    };
  }, [activeRole, queryClient]);

  const savePreferences = useCallback(async (next: NotificationPreferences) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await notificationService.savePreferences(next);
      setPreferences(saved);
      setNotice("Gig notification preferences saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save notification preferences.");
    } finally {
      setSaving(false);
    }
  }, []);

  const enableLocation = useCallback(async () => {
    setError(null);
    setNotice(null);
    try {
      const coordinates = await getCurrentCoordinates();
      await savePreferences({ ...preferences, ...coordinates });
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : "Could not access your location.");
    }
  }, [preferences, savePreferences]);

  const openNotification = useCallback(async (item: AppNotification) => {
    try {
      if (item.unread) await notificationService.markRead(item.id);
      setNotifications((current) => current.map((notification) =>
        notification.id === item.id ? { ...notification, unread: false } : notification
      ));
      queryClient.setQueryData(["notifications", "unread-count"], 0);
      const route = item.route.startsWith("/") && !item.route.startsWith("//")
        ? item.route
        : "/worker/notifications";
      navigate(route);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Could not open this notification.");
    }
  }, [navigate, queryClient]);

  return (
    <div>
      <PageHeader title="Notifications" description="Manage nearby gig alerts and follow updates for your jobs and messages." />
      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">{notice}</p>}

      {activeRole === "worker" && <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Gig notification radius</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-medium" htmlFor="gig-radius">
            Radius in kilometers
            <Input
              id="gig-radius"
              className="mt-2 max-w-48"
              type="number"
              min={1}
              max={100}
              step={1}
              value={preferences.gigRadiusKm}
              onChange={(event) => setPreferences((current) => ({
                ...current,
                gigRadiusKm: Number(event.target.value),
              }))}
              disabled={saving}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={enableLocation} disabled={saving}>
              {preferences.latitude === null ? "Enable location" : "Update location"}
            </Button>
            <Button
              type="button"
              onClick={() => void savePreferences(preferences)}
              disabled={saving || preferences.gigRadiusKm < 1 || preferences.gigRadiusKm > 100}
            >
              {saving ? "Saving..." : "Save radius"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground sm:max-w-56">
            On-site gig alerts use this radius. Online gigs and all new job alerts are not distance-limited.
            {preferences.latitude === null && " Enable location to receive on-site gig alerts."}
          </p>
        </CardContent>
      </Card>}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-bridge-500" /> Activity feed</CardTitle>
          <Badge variant="outline">{notifications.filter((item) => item.unread).length} new</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading your notifications...</p>
          ) : notifications.length ? (
            notifications.map((item) => (
              <NotificationCard key={item.id} item={item} onOpen={openNotification} />
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <BellRing className="h-8 w-8" />
              <p className="font-medium">You’re all caught up</p>
              <p className="text-sm">New job, gig, and message alerts will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
