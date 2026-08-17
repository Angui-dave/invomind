import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="hero-mesh flex min-h-full flex-1 flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}
