"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CheckCircle2, CircleDollarSign, Clock3, Loader2, MapPin, Navigation, ShieldCheck, Smartphone, Timer, Wallet, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGigStore } from "@/store/gig-store";
import { useCountdown } from "@/hooks/use-countdown";
import { useIncomingGig } from "@/features/worker/hooks/use-incoming-gig";
import { CountdownRing } from "@/components/shared/countdown-ring";
import { RatingStars } from "@/components/shared/rating-stars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { GIG_RESPONSE_WINDOW_SECONDS } from "@/lib/constants";
import type { GigJourneyStep } from "@/types/gig";

const JOURNEY_STEPS: Array<{ key: GigJourneyStep; title: string; description: string; icon: LucideIcon }> = [
  { key: "route", title: "Find route", description: "Review the fastest path to the customer.", icon: Navigation },
  { key: "navigation", title: "Navigate", description: "Follow live instructions with turn cues.", icon: MapPin },
  { key: "employer", title: "Meet employer", description: "Confirm the site and collect key info.", icon: BadgeCheck },
  { key: "otp", title: "Verify OTP", description: "Share the one-time code to start work.", icon: Smartphone },
  { key: "started", title: "Work started", description: "Kick off the service and track progress.", icon: ShieldCheck },
  { key: "completed", title: "Work complete", description: "Wrap up and confirm completion with the client.", icon: CheckCircle2 },
  { key: "payment", title: "Payment success", description: "Receive confirmation and settle instantly.", icon: CircleDollarSign },
];

export function IncomingGigModal() {
  const { incomingGig, lastOutcome, clearOutcome, journeyStep, advanceJourney } = useGigStore();
  const { accept, decline } = useIncomingGig();

  const { remaining, progress, stop } = useCountdown({
    seconds: incomingGig?.expiresInSeconds || GIG_RESPONSE_WINDOW_SECONDS,
    autoStart: !!incomingGig && !lastOutcome,
    onExpire: () => {
      if (incomingGig && !lastOutcome) decline.mutate(incomingGig.id);
    },
  });

  if (!incomingGig) return null;

  const handleAccept = () => {
    stop();
    accept.mutate(incomingGig.id);
  };
  const handleDecline = () => {
    stop();
    decline.mutate(incomingGig.id);
  };

  return (
    <AnimatePresence>
      {incomingGig && (
        <motion.div
          key="gig-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Incoming gig offer"
        >
          <motion.div
            key="gig-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="glass-solid w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
          >
            {!lastOutcome && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal-500" />
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wide text-signal-600 dark:text-signal-300">
                      New gig request
                    </p>
                  </div>
                  <CountdownRing progress={progress} remaining={remaining} size={56} strokeWidth={4} />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bridge-500/10 font-display font-semibold text-bridge-600 dark:text-bridge-300">
                    {incomingGig.businessName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">{incomingGig.businessName}</p>
                    <p className="text-sm text-muted-foreground">{incomingGig.category}</p>
                  </div>
                  <div className="ml-auto">
                    <RatingStars rating={incomingGig.employerRating} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoTile icon={MapPin} label="Distance" value={`${incomingGig.distanceKm.toFixed(1)} km`} />
                  <InfoTile icon={Clock3} label="Travel time" value={`${incomingGig.etaMinutes} min`} />
                  <InfoTile icon={Timer} label="Duration" value={`${incomingGig.durationHours} hrs`} />
                  <InfoTile icon={Wallet} label="Payment" value={formatCurrency(incomingGig.payment)} accent />
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleDecline}
                    disabled={decline.isPending || accept.isPending}
                  >
                    {decline.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline"}
                  </Button>
                  <Button
                    variant="signal"
                    size="lg"
                    className="flex-1"
                    onClick={handleAccept}
                    disabled={accept.isPending || decline.isPending}
                  >
                    {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept gig"}
                  </Button>
                </div>
              </>
            )}

            {lastOutcome === "accepted" && (
              <JourneyState
                gig={incomingGig}
                step={journeyStep}
                onAdvance={() => {
                  if (journeyStep === "payment") {
                    clearOutcome();
                    return;
                  }
                  advanceJourney();
                }}
                onClose={clearOutcome}
              />
            )}

            {lastOutcome === "declined" && (
              <ResultState
                icon={XCircle}
                iconClass="text-muted-foreground"
                title="Gig declined"
                description="No problem — we'll route this to another nearby worker."
                onDone={clearOutcome}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-1 font-display text-lg font-semibold ${accent ? "text-signal-600 dark:text-signal-300" : ""}`}>{value}</p>
    </div>
  );
}

function JourneyState({
  gig,
  step,
  onAdvance,
  onClose,
}: {
  gig: NonNullable<ReturnType<typeof useGigStore.getState>["incomingGig"]>;
  step: GigJourneyStep;
  onAdvance: () => void;
  onClose: () => void;
}) {
  const currentStep = JOURNEY_STEPS.find((item) => item.key === step) ?? JOURNEY_STEPS[0];
  const currentIndex = JOURNEY_STEPS.findIndex((item) => item.key === step);
  const isFinal = step === "payment";

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-signal-600 dark:text-signal-300">Live dispatch</p>
          <p className="mt-1 font-display text-lg font-semibold">{gig.businessName}</p>
        </div>
        <Badge variant="signal">Step {Math.max(currentIndex + 1, 1)} / {JOURNEY_STEPS.length}</Badge>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold">{currentStep.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentStep.description}</p>
          </div>
          <div className="rounded-2xl bg-signal-500/10 p-3 text-signal-600 dark:text-signal-300">
            <currentStep.icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {JOURNEY_STEPS.map((item, index) => {
            const isActive = item.key === step;
            const isDone = index < (currentIndex >= 0 ? currentIndex : 0);
            return (
              <div key={item.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${isActive ? "border-signal-400 bg-signal-500/10" : isDone ? "border-success/30 bg-success/10" : "border-border bg-background/40"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isActive ? "bg-signal-500 text-white" : isDone ? "bg-success text-white" : "bg-muted/50 text-muted-foreground"}`}>
                  {index + 1}
                </span>
                <span className="flex-1">{item.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
        <Button variant="signal" className="flex-1" onClick={onAdvance}>
          {isFinal ? "Done" : "Continue"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ResultState({
  icon: Icon,
  iconClass,
  title,
  description,
  onDone,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  description: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
      >
        <Icon className={`h-16 w-16 ${iconClass}`} strokeWidth={1.5} />
      </motion.div>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      <Button className="mt-6 w-full" size="lg" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
