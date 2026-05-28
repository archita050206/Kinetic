'use client'
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAuth } from "@/app/providers";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";


const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Dummy icon components for illustration; replace with your actual icons or imports
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
      <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
      <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
      <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  );
}

function GuestsIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="6.5" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="13.5" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 16C2 13 5 11 9 11C13 11 16 13 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 11C7.5 11 6.5 12 6.5 13.5C6.5 15 7.5 16 9 16C10.5 16 11.5 15 11.5 13.5C11.5 12 10.5 11 9 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13.5 11C12 11 11 12 11 13.5C11 15 12 16 13.5 16C15 16 16 15 16 13.5C16 12 15 11 13.5 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    );
}

function EventsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <polyline points="2,15 7,9 11,12 18,5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ResearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75V9.75L2.25 11.25V12H15.75V11.25L14.25 9.75V6.75C14.25 3.85 11.9 1.5 9 1.5Z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7.5 12C7.5 12.83 8.17 13.5 9 13.5C9.83 13.5 10.5 12.83 10.5 12" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 1.5V3M9 15V16.5M1.5 9H3M15 9H16.5M3.2 3.2L4.4 4.4M13.6 13.6L14.8 14.8M3.2 14.8L4.4 13.6M13.6 4.4L14.8 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 16C2 13 5 11 9 11C13 11 16 13 16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M5.5 4.2A7 7 0 1 0 12.5 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  );
}



function SideRailButton({
  icon,
  label,
  router,
  pathname,
  route,
}: {
  icon: React.ReactNode;
  label: string;
  router: ReturnType<typeof useRouter>;
  pathname: string;
  route: string;
}) {
  const eventMatch = pathname.match(/^\/portal\/events\/([^/]+)/);
  const eventId = eventMatch?.[1];
  const targetPath =
    route === "/"
      ? eventId
        ? `/portal/events/${eventId}`
        : "/portal"
      : route === "/events"
        ? "/portal"
        : eventId
          ? `/portal/events/${eventId}${route}`
          : "/portal";
  const active =
  route === "/"
    ? pathname === "/portal" ||
      /^\/portal\/events\/[^/]+$/.test(pathname)
    : pathname.includes(route);

  return (
    <button
      type="button"
      aria-label={label}
      className={`flex flex-col items-center gap-1.5 w-full py-2 rounded-xl transition ${
        active
          ? "text-[#ffb77b]"
          : "text-[#6b5c54] hover:text-[#ffb77b]"
      }`}
      onClick={() => router.push(targetPath)}
    >
      {icon}
      <span className="text-[8px] tracking-[0.18em] font-semibold">{label}</span>
    </button>
  );
}


export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    async function handleLogout() {
        await logout();
        router.replace("/login");
      }
      const { status, isBusy, logout } = useAuth();

      
      useEffect(() => {
          if (status === "unauthenticated") {
              router.replace("/login?next=/portal");
            }
        }, [router, status]);
    if (status === "loading") {
        return (
        <main className={`${uiFont.className} min-h-screen bg-[#E6D5A4] dark:bg-[#131314] px-6 py-12 text-[#68220D] dark:text-[#e5e2e3]`}>
            <div className="mx-auto w-full max-w-6xl text-sm tracking-[0.14em] text-gray-700 dark:text-[#bbaaa2]">VERIFYING SESSION...</div>
        </main>
        );
    }

  return (
    <div className={`${uiFont.className} min-h-screen flex flex-col bg-[#E6D5A4] dark:bg-[#090b10] text-[#68220D] dark:text-[#e5e2e3]`}>
      {/* NAVBAR */}
      <header className="w-full z-40 border-b border-[#3b3430]/40 dark:border-[#3b3430]/80 bg-[#fcfbfa] dark:bg-[#0f1218]/95 px-0 py-0 backdrop-blur sticky top-0">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-3 text-[10px] tracking-[0.16em] sm:h-16 sm:px-6 sm:text-[11px] sm:tracking-[0.2em] lg:px-8">
          <div className="flex h-full items-center text-slate-800 dark:text-[#8f8078] lg:gap-10">
            <Link href="/portal"><span className="text-lg font-bold tracking-[0.14em] text-slate-800 dark:text-[#ffb77b]">KINETIC_LABS</span></Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                className="grid h-9 w-9 place-items-center rounded-lg text-[#68220D] dark:text-[#9f8e86] hover:opacity-70 transition"
              >
                <BellIcon />
              </button>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                disabled={isBusy}
                aria-label="User / Logout"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#68220D]/40 dark:border-[#ffb77b]/40 text-[#68220D] dark:text-[#ffb77b] hover:bg-[#68220D]/10 dark:hover:bg-[#ffb77b]/10 transition disabled:opacity-60"
              >
                <UserIcon />
              </button>
            </div>
        </div>
      </header>

      {/* BODY: Sidebar + Main Content */}
      <div className="flex flex-1 pb-16 lg:pb-0">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col items-center w-18 shrink-0 border-r border-[#3b3430]/20 dark:border-[#3b3430]/60 bg-gray-100 dark:bg-[#0d1016]/90 py-5 gap-1 sticky top-15 h-[calc(100vh-60px)]">
          {/* <button onClick={() => router.push(`/portal/events/${eventId}`)}><div className="mb-4 text-[10px] font-bold tracking-[0.3em] text-[#ffb77b]">KL</div></button> */}
          <SideRailButton icon={<AnalyticsIcon />} label="TERMINAL" router={router} pathname={pathname} route="/" />
          <SideRailButton icon={<EventsIcon />} label="IMAGES" router={router} pathname={pathname} route="/images" />
          <SideRailButton icon={<GridIcon />} label="SCHEDULE" router={router} pathname={pathname} route="/schedule" />
          <SideRailButton icon={<GuestsIcon />} label="GUESTS" router={router} pathname={pathname} route="/guests" />
          <div className="mt-auto">
            <button
              type="button"
              aria-label="Power / Logout"
              className="grid h-10 w-10 place-items-center rounded-xl text-[#6b5c54] hover:text-black dark:hover:text-[#ffb77b] transition"
            >
              <PowerIcon />
            </button>
          </div>
        </aside>
        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 border-l border-[#3b3430]/40">
          {children}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#3b3430]/20 dark:border-[#3b3430]/80 bg-[#E6D5A4]/95 dark:bg-[#0d1016]/95 px-3 py-2 text-[#68220D] dark:text-[#6b5c54] lg:hidden">
        <SideRailButton icon={<EventsIcon />} label="IMAGES" router={router} pathname={pathname} route="/images" />
          <SideRailButton icon={<GridIcon />} label="GRID" router={router} pathname={pathname} route="/" />
          <SideRailButton icon={<GuestsIcon />} label="GUESTS" router={router} pathname={pathname} route="/guests" />
          {/* <SideRailButton icon={<AnalyticsIcon />} label="ANALYTICS" router={router} pathname={pathname} route="/analytics" /> */}
          <SideRailButton icon={<ResearchIcon />} label="SCHEDULE" router={router} pathname={pathname} route="/schedule" />
      </nav>
    </div>
  );
}
