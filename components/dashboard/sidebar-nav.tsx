"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  MessagesSquare,
  Package,
  PieChart,
  Receipt,
  Settings,
  ShoppingCart,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  INVOICE_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  type CurrentUser,
  type EnabledModules,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/rbac/types";
import { ADMIN_ONLY_ROUTES } from "@/lib/rbac/policy";

type NavChild = {
  href: string;
  label: string;
  status?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  module?: keyof EnabledModules;
  badgeCount?: number;
  children?: NavChild[];
};

const QUOTE_STATUS_LINKS: NavChild[] = (
  ["draft", "sent", "accepted", "refused", "expired"] as const
).map((status) => ({
  href: `/quotes?status=${status}`,
  label: QUOTE_STATUS_LABELS[status],
  status,
}));

const INVOICE_STATUS_LINKS: NavChild[] = (
  [
    "draft",
    "sent",
    "partially_paid",
    "paid",
    "overdue",
    "cancelled",
  ] as const
).map((status) => ({
  href: `/invoices?status=${status}`,
  label: INVOICE_STATUS_LABELS[status],
  status,
}));

function slugifyNavId(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function StatusSubnav({
  links,
  basePath,
  onNavigate,
  activeStatus,
}: {
  links: NavChild[];
  basePath: string;
  onNavigate?: () => void;
  activeStatus?: string | null;
}) {
  const pathname = usePathname();
  return (
    <div className="mt-0.5 ml-4 space-y-0.5 border-l border-white/12 pl-2">
      {links.map((child) => {
        const childActive =
          pathname === basePath &&
          Boolean(child.status) &&
          activeStatus === child.status;
        return (
          <Link
            key={child.href}
            href={child.href}
            onClick={onNavigate}
            className={cn(
              "block rounded-lg px-3 py-1.5 text-[13px] transition-ledger",
              childActive
                ? "bg-white/15 font-medium text-navy-fg"
                : "text-navy-fg/60 hover:bg-white/8 hover:text-navy-fg",
            )}
          >
            {child.label}
          </Link>
        );
      })}
    </div>
  );
}

function StatusSubnavWithParams({
  links,
  basePath,
  onNavigate,
}: {
  links: NavChild[];
  basePath: string;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  return (
    <StatusSubnav
      links={links}
      basePath={basePath}
      onNavigate={onNavigate}
      activeStatus={searchParams.get("status")}
    />
  );
}

type NavGroup = {
  label: string;
  items: NavItem[];
};

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
  user: CurrentUser;
  enabledModules: EnabledModules;
  features: EnabledModules;
  prospectCount?: number;
  unreadCount?: number;
  branding?: {
    displayName: string;
    logoUrl: string | null;
  };
  /** Active tenant name from session (URL is shared; org comes from cookie) */
  organizationName?: string;
  appRole?: AppRole;
};

export function SidebarNav({
  onNavigate,
  className,
  user,
  enabledModules,
  features,
  prospectCount = 0,
  unreadCount = 0,
  branding,
  organizationName,
  appRole = "ADMIN_TENANT",
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const orgLabel =
    organizationName || branding?.displayName || user.company || "Organisation";

  const navGroups: NavGroup[] = [
    {
      label: "Vue d’ensemble",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Ventes",
      items: [
        {
          href: "/quotes",
          label: "Devis",
          icon: FileText,
          children: QUOTE_STATUS_LINKS,
        },
        {
          href: "/invoices",
          label: "Factures",
          icon: Receipt,
          children: INVOICE_STATUS_LINKS,
        },
        {
          href: "/clients",
          label: "Clients",
          icon: Users,
          badgeCount: features.pipeline ? prospectCount : undefined,
        },
        {
          href: "/conversations",
          label: "Conversations",
          icon: MessagesSquare,
          module: "conversations",
          badgeCount: unreadCount,
        },
        { href: "/payments", label: "Paiements", icon: Wallet },
        {
          href: "/catalog",
          label: "Catalogue",
          icon: Package,
          module: "catalog",
        },
      ],
    },
    {
      label: "Achats",
      items: [
        {
          href: "/expenses",
          label: "Dépenses",
          icon: ShoppingCart,
          module: "expenses",
        },
        { href: "/suppliers", label: "Fournisseurs", icon: BookOpen },
      ],
    },
    {
      label: "Analyse",
      items: [
        {
          href: "/reports",
          label: "Rapports",
          icon: PieChart,
          module: "reports",
        },
      ],
    },
    {
      label: "Outils",
      items: [
        {
          href: "/import",
          label: "Import",
          icon: Upload,
          module: "importTool",
        },
        { href: "/agents", label: "Agents", icon: Users },
        { href: "/settings", label: "Paramètres", icon: Settings },
      ],
    },
  ];

  const isAgent = appRole === "AGENT";
  if (isAgent) {
    const adminPaths = ADMIN_ONLY_ROUTES as readonly string[];
    for (const group of navGroups) {
      group.items = group.items.filter(
        (item) => !adminPaths.includes(item.href),
      );
    }
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="px-4 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 transition-ledger hover:opacity-90"
        >
          {branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt=""
              className="size-8 shrink-0 rounded object-contain bg-paper/10"
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brass to-ledger font-serif text-sm font-semibold text-paper">
              {orgLabel.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-serif text-base font-semibold tracking-tight text-navy-fg">
              {orgLabel}
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-wider text-navy-fg/45">
              Espace actif · InvoMind
            </span>
          </span>
        </Link>
      </div>

      <nav
        className="scrollbar-sidebar min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-4"
        aria-label="Navigation principale"
      >
        {navGroups.map((group) => {
          const items = group.items.filter((item) => {
            if (item.module && !enabledModules[item.module]) return false;
            if (isAgent && item.module && !features[item.module]) return false;
            return true;
          });
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-navy-fg/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const locked = Boolean(
                    item.module && !features[item.module],
                  );
                  const href = locked
                    ? isAgent
                      ? item.href
                      : "/billing"
                    : item.href;
                  const active =
                    !locked &&
                    (pathname === item.href ||
                      pathname.startsWith(`${item.href}/`));
                  const count = locked ? 0 : (item.badgeCount ?? 0);
                  const hasChildren = Boolean(item.children?.length);
                  const isOpen = openMenus[item.href] ?? active;
                  const statusNavId = `${slugifyNavId(item.label)}-status-nav`;
                  const itemClassName = cn(
                    "relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-ledger",
                    active
                      ? "bg-white/15 font-medium text-navy-fg before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-brass before:to-ledger"
                      : locked
                        ? "text-navy-fg/55 hover:bg-white/8 hover:text-navy-fg"
                        : "text-navy-fg/70 hover:bg-white/8 hover:text-navy-fg",
                  );
                  const proBadge = locked ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-brass/45 bg-brass/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass">
                      <Lock className="size-2.5" aria-hidden />
                      Pro
                    </span>
                  ) : null;

                  return (
                    <div key={item.href}>
                      {hasChildren ? (
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={statusNavId}
                          onClick={() => {
                            const next = !isOpen;
                            setOpenMenus((prev) => ({
                              ...prev,
                              [item.href]: next,
                            }));
                            if (
                              next &&
                              pathname !== item.href &&
                              !pathname.startsWith(`${item.href}/`)
                            ) {
                              router.push(href);
                            }
                          }}
                          className={itemClassName}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="flex-1 text-left">{item.label}</span>
                          {proBadge}
                          <ChevronDown
                            className={cn(
                              "size-4 shrink-0 transition-transform",
                              isOpen && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                      ) : (
                        <Link
                          href={href}
                          onClick={onNavigate}
                          aria-label={
                            locked
                              ? `${item.label}, plan Pro requis`
                              : undefined
                          }
                          className={itemClassName}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="flex-1">{item.label}</span>
                          {proBadge}
                          {count > 0 && (
                            <span className="num rounded-full bg-brass px-1.5 py-0.5 text-[10px] font-medium text-navy">
                              {count}
                            </span>
                          )}
                        </Link>
                      )}
                      {hasChildren && isOpen && item.children && (
                        <div id={statusNavId}>
                          <Suspense
                            fallback={
                              <StatusSubnav
                                links={item.children}
                                basePath={item.href}
                                onNavigate={onNavigate}
                              />
                            }
                          >
                            <StatusSubnavWithParams
                              links={item.children}
                              basePath={item.href}
                              onNavigate={onNavigate}
                            />
                          </Suspense>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/12 px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-navy-fg">{user.name}</p>
          <ThemeToggle className="text-navy-fg/70 hover:bg-white/10 hover:text-navy-fg" />
        </div>
        <p className="truncate text-xs text-navy-fg/55">{user.email}</p>
        <form action={logout}>
          <button
            type="submit"
            onClick={onNavigate}
            className="mt-3 inline-flex items-center gap-2 text-xs text-navy-fg/60 transition-ledger hover:text-navy-fg"
          >
            <LogOut className="size-3.5" aria-hidden />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
