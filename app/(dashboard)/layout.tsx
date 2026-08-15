import type { ReactNode } from "react";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-[248px] shrink-0 border-r border-ink bg-ink text-paper lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-sm lg:hidden">
          <MobileNav />
          <span className="font-serif text-base font-semibold text-ink">
            InvoMind
          </span>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
