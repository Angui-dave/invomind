"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import {
  activeProspectsValue,
  CURRENT_USER,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Factures", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users, badge: true },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();
  const prospectCount = activeProspectsValue().count;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="px-4 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="font-serif text-lg font-semibold tracking-tight text-paper transition-ledger hover:text-paper/80"
        >
          InvoMind
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-2" aria-label="Navigation principale">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
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
              {"badge" in item && item.badge && prospectCount > 0 && (
                <span className="num rounded-sm bg-brass/90 px-1.5 py-0.5 text-[10px] font-medium text-ink">
                  {prospectCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-paper/15 px-4 py-4">
        <p className="truncate text-sm font-medium text-paper">
          {CURRENT_USER.name}
        </p>
        <p className="truncate text-xs text-paper/55">{CURRENT_USER.email}</p>
        <Link
          href="/login"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-2 text-xs text-paper/60 transition-ledger hover:text-paper"
        >
          <LogOut className="size-3.5" aria-hidden />
          Se déconnecter
        </Link>
      </div>
    </div>
  );
}
