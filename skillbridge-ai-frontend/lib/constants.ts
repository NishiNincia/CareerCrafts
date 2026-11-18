import * as Icons from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Icons;
};

export const APP_NAME = "SkillBridge AI";

export const WORKER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Nearby Jobs", href: "/jobs", icon: "MapPin" },
  { label: "Hourly Gigs", href: "/gigs", icon: "Zap" },
  { label: "My Projects", href: "/projects", icon: "ClipboardCheck" },
  { label: "Resume AI", href: "/resume-ai", icon: "FileText" },
  { label: "Learning Hub", href: "/learning", icon: "GraduationCap" },
  { label: "Messages", href: "/messages", icon: "MessageSquare" },
  { label: "Notifications", href: "/notifications", icon: "Bell" },
  { label: "Profile", href: "/profile", icon: "UserCircle" },
];

export const EMPLOYER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Post a Job", href: "/post-job", icon: "Briefcase" },
  { label: "Post a Gig", href: "/post-gig", icon: "PlusSquare" },
  { label: "Manage Gigs", href: "/gigs", icon: "BriefcaseBusiness" },
  { label: "Candidates", href: "/candidates", icon: "Users" },
  { label: "Small Business Schemes", href: "/schemes", icon: "Landmark" },
  { label: "Live Tracking", href: "/tracking", icon: "Radar" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
  { label: "Payments", href: "/payments", icon: "Wallet" },
  { label: "Reviews", href: "/reviews", icon: "Star" },
];

export const GIG_RESPONSE_WINDOW_SECONDS = 20;
