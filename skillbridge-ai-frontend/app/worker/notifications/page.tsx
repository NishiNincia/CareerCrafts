"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationCard } from "@/features/worker/components/notifications/notification-card";
import notificationsData from "@/mock/notifications.json";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  category: "gig" | "job" | "interview" | "payment" | "scheme";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(notificationsData as NotificationItem[]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNotifications((current) => {
        if (current.find((item) => item.id === "n-live")) return current;
        return [
          {
            id: "n-live",
            title: "Live gig alert",
            description: "A new nearby pay-per-hour request just arrived.",
            time: "Just now",
            unread: true,
            category: "gig",
          },
          ...current,
        ];
      });
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader title="Notifications" description="Stay updated on gigs, jobs, interviews, payments, and policy alerts." />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-3xl border border-border/70 bg-gradient-to-br from-signal-500/10 via-background to-bridge-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-signal-600">
            <BellRing className="h-4 w-4" /> Real-time center
          </div>
          <Badge variant="signal">Mock live events</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">The notification center simulates realtime updates so you can preview a modern SaaS experience without any backend.</p>
      </motion.div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-bridge-500" /> Activity feed</CardTitle>
          <Badge variant="outline">{notifications.filter((item) => item.unread).length} unread</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((item) => <NotificationCard key={item.id} item={item} />)}
        </CardContent>
      </Card>
    </div>
  );
}
