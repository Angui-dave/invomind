import type { ReactNode } from "react";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getCurrentOrganization } from "@/lib/dal/session";
import { activeProspectsValue } from "@/lib/dal/prospects";
import { unreadTotal } from "@/lib/dal/conversations";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ session, branding, features }, prospectStats, unread] =
    await Promise.all([
      getCurrentOrganization(),
      activeProspectsValue(),
      unreadTotal(),
    ]);

  const enabledModules = features;

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    company: session.organization.name,
    plan: session.organization.planId,
  };

  const brandingStyle = {
    ["--brand-primary" as string]: branding?.primaryColor ?? "#2563eb",
    ["--brand-accent" as string]: branding?.accentColor ?? "#10b981",
    ["--brand-font" as string]: branding?.fontFamily ?? "system-ui",
  };

  const displayName =
    branding?.displayName || session.organization.name || "InvoMind";

  const navProps = {
    user,
    enabledModules,
    prospectCount: prospectStats.count,
    unreadCount: unread,
    branding: {
      displayName,
      logoUrl: branding?.logoUrl ?? null,
    },
  };

  return (
    <div
      className="flex min-h-full flex-1 font-[family-name:var(--brand-font)]"
      style={brandingStyle}
    >
      <aside className="hidden w-[248px] shrink-0 border-r border-ink bg-ink text-paper lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarNav {...navProps} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-sm lg:hidden">
          <MobileNav {...navProps} />
          <span className="flex items-center gap-2 font-serif text-base font-semibold text-ink">
            {branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt=""
                className="size-7 rounded object-contain"
              />
            ) : null}
            {displayName}
          </span>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
