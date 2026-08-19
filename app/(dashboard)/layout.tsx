import type { ReactNode } from "react";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentOrganization } from "@/lib/dal/session";
import { activeProspectsValue } from "@/lib/dal/prospects";
import { unreadTotal } from "@/lib/dal/conversations";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ session, branding, features, enabledModules }, prospectStats, unread] =
    await Promise.all([
      getCurrentOrganization(),
      activeProspectsValue(),
      unreadTotal(),
    ]);

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

  const appRole = mapTenantRoleToAppRole(session.role);

  const navProps = {
    user,
    enabledModules,
    features,
    prospectCount: prospectStats.count,
    unreadCount: unread,
    organizationName: session.organization.name,
    branding: {
      displayName,
      logoUrl: branding?.logoUrl ?? null,
    },
    appRole,
  };

  return (
    <div
      className="flex min-h-full flex-1 font-[family-name:var(--brand-font)]"
      style={brandingStyle}
    >
      <aside className="relative z-40 hidden w-[248px] shrink-0 border-r border-white/10 bg-navy text-navy-fg lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brass/10 to-transparent"
        />
        <SidebarNav className="relative z-10" {...navProps} />
      </aside>

      <div className="relative z-0 flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <div
          aria-hidden
          className="hero-mesh pointer-events-none absolute inset-x-0 top-0 h-72 opacity-80"
        />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-lg lg:hidden">
          <MobileNav {...navProps} />
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt=""
                className="size-7 shrink-0 rounded object-contain"
              />
            ) : null}
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-serif text-base font-semibold text-ink">
                {displayName}
              </span>
              <span className="truncate text-[10px] uppercase tracking-wider text-ink/45">
                Espace actif · InvoMind
              </span>
            </span>
          </span>
          <ThemeToggle className="ml-auto" />
        </header>
        <div className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
