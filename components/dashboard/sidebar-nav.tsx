"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  FileText,
  LayoutDashboard,
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
  QUOTE_STATUS_LABELS,
  type CurrentUser,
  type EnabledModules,
  type QuoteStatus,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type NavChild = {
  href: string;
  label: string;
  status?: QuoteStatus;
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

function QuoteStatusSubnav({
  onNavigate,
  activeStatus,
}: {
  onNavigate?: () => void;
  activeStatus?: string | null;
}) {
  const pathname = usePathname();
  return (
    <div className="mt-0.5 ml-4 space-y-0.5 border-l border-white/12 pl-2">
      {QUOTE_STATUS_LINKS.map((child) => {
        const childActive =
          pathname === "/quotes" &&
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

function QuoteStatusSubnavWithParams({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  return (
    <QuoteStatusSubnav
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
  prospectCount?: number;
  unreadCount?: number;
  branding?: {
    displayName: string;
    logoUrl: string | null;
  };
  /** Active tenant name from session (URL is shared; org comes from cookie) */
  organizationName?: string;
};

export function SidebarNav({
  onNavigate,
  className,
  user,
  enabledModules,
  prospectCount = 0,
  unreadCount = 0,
  branding,
  organizationName,
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [quotesOpen, setQuotesOpen] = useState(false);
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
        { href: "/invoices", label: "Factures", icon: Receipt },
        {
          href: "/clients",
          label: "Clients",
          icon: Users,
          badgeCount: enabledModules.pipeline ? prospectCount : undefined,
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
        { href: "/settings", label: "Paramètres", icon: Settings },
      ],
    },
  ];

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
        className="flex-1 space-y-4 overflow-y-auto px-2 pb-4"
        aria-label="Navigation principale"
      >
        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !item.module || enabledModules[item.module],
          );
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-navy-fg/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const count = item.badgeCount ?? 0;
                  const hasChildren = Boolean(item.children?.length);
                  const itemClassName = cn(
                    "relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-ledger",
                    active
                      ? "bg-white/15 font-medium text-navy-fg before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-brass before:to-ledger"
                      : "text-navy-fg/70 hover:bg-white/8 hover:text-navy-fg",
                  );

                  return (
                    <div key={item.href}>
                      {hasChildren ? (
                        <button
                          type="button"
                          aria-expanded={quotesOpen}
                          aria-controls="quotes-status-nav"
                          onClick={() => {
                            const next = !quotesOpen;
                            setQuotesOpen(next);
                            if (
                              next &&
                              pathname !== item.href &&
                              !pathname.startsWith(`${item.href}/`)
                            ) {
                              router.push(item.href);
                            }
                          }}
                          className={itemClassName}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "size-4 shrink-0 transition-transform",
                              quotesOpen && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={itemClassName}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="flex-1">{item.label}</span>
                          {count > 0 && (
                            <span className="num rounded-full bg-brass px-1.5 py-0.5 text-[10px] font-medium text-navy">
                              {count}
                            </span>
                          )}
                        </Link>
                      )}
                      {hasChildren && quotesOpen && (
                        <div id="quotes-status-nav">
                          <Suspense
                            fallback={
                              <QuoteStatusSubnav onNavigate={onNavigate} />
                            }
                          >
                            <QuoteStatusSubnavWithParams
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
