"use client";

import { motion } from "framer-motion";
import { Bell, Briefcase, Landmark, Wallet, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    category: "gig" | "job" | "interview" | "payment" | "scheme" | "message" | "system";
    route: string;
  };
  onOpen: (item: NotificationCardProps["item"]) => void;
}

const ICONS = {
  gig: Bell,
  job: Briefcase,
  interview: Briefcase,
  payment: Wallet,
  scheme: Landmark,
  message: MessageCircle,
  system: Settings,
};

export function NotificationCard({ item, onOpen }: NotificationCardProps) {
  const Icon = ICONS[item.category] ?? Bell;
  return (
    <motion.button type="button" onClick={() => onOpen(item)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-secondary/60", item.unread ? "border-signal-400/40 bg-signal-400/10" : "border-border bg-background/70")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bridge-500/10 text-bridge-600 dark:text-bridge-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">{new Date(item.time).toLocaleString()}</p>
      </div>
      {item.unread ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-signal-400" /> : null}
    </motion.button>
  );
}
