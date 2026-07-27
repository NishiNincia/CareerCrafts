import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WORKER_NAV } from "@/lib/constants";
import { WorkerPortalChrome } from "@/features/worker/components/worker-portal-chrome";

export default function WorkerLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar basePath="/worker" navItems={WORKER_NAV} portalLabel="Worker Portal" />
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkerPortalChrome>
          <Outlet />
        </WorkerPortalChrome>
      </div>
      <MobileNav basePath="/worker" navItems={WORKER_NAV} />
    </div>
  );
}
