import { Landmark, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GovtScheme } from "@/types/job";

export function SchemeCard({ scheme }: { scheme: GovtScheme }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bridge-500/10 text-bridge-600 dark:text-bridge-300">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-sm font-semibold leading-snug">{scheme.name}</p>
            <Badge variant="secondary" className="shrink-0">{scheme.category}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{scheme.department}</p>
          <p className="mt-2 text-sm font-medium text-success">{scheme.benefit}</p>
          <p className="mt-1 text-xs text-muted-foreground">Eligibility: {scheme.eligibility}</p>
          {scheme.deadline && (
            <p className="mt-1 flex items-center gap-1 text-xs text-signal-600 dark:text-signal-300">
              <CalendarClock className="h-3.5 w-3.5" /> Apply before {scheme.deadline}
            </p>
          )}
          <Button size="sm" variant="outline" className="mt-3">
            Check eligibility
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
