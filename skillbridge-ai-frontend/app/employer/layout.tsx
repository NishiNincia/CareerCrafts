import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { EMPLOYER_NAV } from "@/lib/constants";
import { EmployerPortalChrome } from "@/features/employer/components/employer-portal-chrome";

export default function EmployerLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar basePath="/employer" navItems={EMPLOYER_NAV} portalLabel="Employer Portal" />
      <div className="flex min-w-0 flex-1 flex-col">
        <EmployerPortalChrome>
          <Outlet />
        </EmployerPortalChrome>
      </div>
      <MobileNav basePath="/employer" navItems={EMPLOYER_NAV} />
    </div>
  );
}
