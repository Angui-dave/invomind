"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
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
import type { CurrentUser, EnabledModules } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  module?: keyof EnabledModules;
  badgeCount?: number;
};

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
};

export function SidebarNav({
  onNavigate,
  className,
  user,
  enabledModules,
  prospectCount = 0,
  unreadCount = 0,
  branding,
}: SidebarNavProps) {
  const pathname = usePathname();

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
        { href: "/quotes", label: "Devis", icon: FileText },
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
          className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-paper transition-ledger hover:text-paper/80"
        >
          {branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt=""
              className="size-8 rounded object-contain bg-paper/10"
            />
          ) : null}
          <span className="truncate">
            {branding?.displayName || "InvoMind"}
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
              <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-paper/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const count = item.badgeCount ?? 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-ledger",
                        active
                          ? "bg-paper/12 text-paper font-medium"
                          : "text-paper/70 hover:bg-paper/8 hover:text-paper",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <span className="num rounded-sm bg-brass/90 px-1.5 py-0.5 text-[10px] font-medium text-ink">
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-paper/15 px-4 py-4">
        <p className="truncate text-sm font-medium text-paper">{user.name}</p>
        <p className="truncate text-xs text-paper/55">{user.email}</p>
        <form action={logout}>
          <button
            type="submit"
            onClick={onNavigate}
            className="mt-3 inline-flex items-center gap-2 text-xs text-paper/60 transition-ledger hover:text-paper"
          >
            <LogOut className="size-3.5" aria-hidden />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
