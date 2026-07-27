"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CalendarClock, FileCheck2, Landmark, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GovtScheme } from "@/types/job";

interface SchemeCardProps {
  scheme: GovtScheme;
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bridge-500/10 text-bridge-600 dark:text-bridge-300">
              <Landmark className="h-5 w-5" />
            </div>
            <Badge variant="secondary">{scheme.category}</Badge>
          </div>
          <div className="mt-3">
            <p className="font-display text-sm font-semibold">{scheme.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{scheme.department}</p>
          </div>
          <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
            <div className="flex items-center gap-2 text-success">
              <BadgeCheck className="h-4 w-4" />
              <span className="font-medium">{scheme.benefit}</span>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Eligibility: {scheme.eligibility}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              <span>Documents: Aadhaar, caste/income proof, bank passbook</span>
            </div>
            {scheme.deadline ? (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-signal-500" />
                <span>Status: Apply before {scheme.deadline}</span>
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Badge variant="outline">Open</Badge>
            <Button size="sm">Apply now</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
