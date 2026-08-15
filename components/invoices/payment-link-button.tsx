"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { portalUrl } from "@/lib/mock-data";

type PaymentLinkButtonProps = {
  token: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
};

export function PaymentLinkButton({
  token,
  variant = "outline",
  className,
}: PaymentLinkButtonProps) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(portalUrl(token));
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={copy}
      className={className}
    >
      <Link2 className="size-4" aria-hidden />
      Copier le lien du portail client
    </Button>
  );
}
