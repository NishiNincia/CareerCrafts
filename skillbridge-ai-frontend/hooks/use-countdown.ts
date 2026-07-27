"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseCountdownOptions {
  seconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

/** Tick-down timer in whole seconds, used for the incoming gig response window. */
export function useCountdown({ seconds, onExpire, autoStart = true }: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onExpireRef.current?.();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, running]);

  const stop = useCallback(() => setRunning(false), []);
  const reset = useCallback((next = seconds) => {
    setRemaining(next);
    setRunning(true);
  }, [seconds]);

  return { remaining, progress: remaining / seconds, stop, reset, running };
}
