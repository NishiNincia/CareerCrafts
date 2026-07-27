import { NavLink, Outlet } from "react-router-dom";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(36,81,184,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(245,166,35,0.12),transparent_45%)] px-4 py-10">
      <NavLink to="/" className="absolute left-6 top-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-bridge-500 to-signal-400 font-display text-xs font-bold text-white">SB</div>
        <span className="font-display text-sm font-semibold">{APP_NAME}</span>
      </NavLink>
      <Outlet />
    </div>
  );
}
