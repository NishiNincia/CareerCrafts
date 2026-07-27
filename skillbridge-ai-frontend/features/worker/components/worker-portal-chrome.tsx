"use client";

import { useLocation } from "react-router-dom";
import { Topbar } from "@/components/layout/topbar";
import { WORKER_NAV } from "@/lib/constants";
import { IncomingGigModal } from "@/features/worker/components/incoming-gig-modal";

export function WorkerPortalChrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;
  const active = WORKER_NAV.find((item) => pathname === `/worker${item.href}`);

  return (
    <>
      <Topbar basePath="/worker" title={active?.label ?? "Worker Portal"} />
      <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">{children}</main>
      <IncomingGigModal />
    </>
  );
}
