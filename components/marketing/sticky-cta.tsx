"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Mobile sticky CTA — appears after scrolling past the hero.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.15 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-paper/95 p-3 backdrop-blur-md transition-transform duration-300 sm:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <Link
        href="/register"
        tabIndex={visible ? 0 : -1}
        className={cn(
          buttonVariants({ size: "lg" }),
          "glow-cta h-11 w-full justify-center rounded-full bg-ledger text-sm text-paper hover:bg-ledger/90",
        )}
      >
        Créer mon compte gratuit
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
