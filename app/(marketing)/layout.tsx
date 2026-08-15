import type { ReactNode } from "react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/site-chrome";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </>
  );
}
