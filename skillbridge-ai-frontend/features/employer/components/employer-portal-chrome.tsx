"use client";

import { useLocation } from "react-router-dom";
import { Topbar } from "@/components/layout/topbar";
import { EMPLOYER_NAV } from "@/lib/constants";

export function EmployerPortalChrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;
  const active = EMPLOYER_NAV.find((item) => pathname === `/employer${item.href}`);

  return (
    <>
      <Topbar basePath="/employer" title={active?.label ?? "Employer Portal"} />
      <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">{children}</main>
    </>
  );
}
