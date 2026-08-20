"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PortalPdfButton } from "@/components/portal/portal-pdf-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startPortalCheckout } from "@/lib/actions/portal";
import { isAllowedCheckoutUrl } from "@/lib/security/safe-redirect";
import type { PortalPaymentStatus } from "@/lib/documents";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { cn } from "@/lib/utils";

type PaymentPhase =
  | "idle"
  | "form"
  | "redirecting"
  | "processing"
  | "paid"
  | "failed";

type MethodHint = "wave" | "orange_money" | "mtn" | "moov" | "card";

const METHODS: { value: MethodHint; label: string; needsPhone: boolean }[] = [
  { value: "wave", label: "Wave", needsPhone: true },
  { value: "orange_money", label: "Orange Money", needsPhone: true },
  { value: "mtn", label: "MTN", needsPhone: true },
  { value: "moov", label: "Moov", needsPhone: true },
  { value: "card", label: "Carte", needsPhone: false },
];

const POLL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;

type PaymentFlowProps = {
  token: string;
  amount: number;
  currency?: CurrencyCode;
  alreadyPaid?: boolean;
  paidAtLabel?: string;
  initialStatus?: PortalPaymentStatus;
  returningFromPsp?: boolean;
};

function initialPhase(
  alreadyPaid: boolean,
  returningFromPsp: boolean,
  initialStatus: PortalPaymentStatus,
): PaymentPhase {
  if (alreadyPaid || initialStatus === "paid") return "paid";
  if (returningFromPsp || initialStatus === "processing") return "processing";
  if (initialStatus === "failed") return "failed";
  return "idle";
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function PaymentFlow({
  token,
  amount,
  currency = "XOF",
  alreadyPaid = false,
  paidAtLabel,
  initialStatus = "unpaid",
  returningFromPsp = false,
}: PaymentFlowProps) {
  const [phase, setPhase] = useState<PaymentPhase>(() =>
    initialPhase(alreadyPaid, returningFromPsp, initialStatus),
  );
  const [method, setMethod] = useState<MethodHint>("wave");
  const [phone, setPhone] = useState("");
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const selected = METHODS.find((item) => item.value === method) ?? METHODS[0];

  useEffect(() => {
    if (phase !== "processing") return;

    let cancelled = false;
    const startedAt = Date.now();

    async function tick() {
      try {
        const response = await fetch(`/api/portal/${token}/status`, {
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as {
          payment_status?: PortalPaymentStatus;
        };
        if (data.payment_status === "paid") {
          setPhase("paid");
          setAwaitingConfirm(false);
          return;
        }
        if (data.payment_status === "failed") {
          setPhase("failed");
          setAwaitingConfirm(false);
        }
      } catch {
        /* keep polling */
      }

      if (!cancelled && Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setAwaitingConfirm(true);
      }
    }

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [phase, token]);

  async function confirmPayment() {
    if (selected.needsPhone && phoneDigits(phone).length < 8) {
      toast.error("Indiquez un numéro de téléphone valide.");
      return;
    }

    setPhase("redirecting");
    try {
      const result = await startPortalCheckout({
        token,
        methodHint: method,
        customerPhone: selected.needsPhone ? phone.trim() : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        setPhase("form");
        return;
      }
      if (!isAllowedCheckoutUrl(result.checkoutUrl)) {
        toast.error("URL de paiement invalide.");
        setPhase("form");
        return;
      }
      window.location.assign(result.checkoutUrl);
    } catch {
      toast.error("Échec du paiement");
      setPhase("form");
    }
  }

  if (phase === "paid") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-brass/35 bg-brass/10 px-4 py-3">
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-brass animate-in zoom-in-50 fade-in duration-200"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-brass">Paiement confirmé</p>
            {paidAtLabel ? (
              <p className="mt-0.5 text-xs text-brass/80">{paidAtLabel}</p>
            ) : (
              <p className="mt-0.5 text-xs text-brass/80">
                {formatMoney(amount, currency)} réglés avec succès
              </p>
            )}
          </div>
        </div>
        <PortalPdfButton
          href={`/api/portal/${token}/receipt`}
          label="Télécharger le reçu"
        />
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="space-y-3 rounded-2xl border border-line bg-card/70 px-4 py-5 text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-ledger" aria-hidden />
        <p className="text-sm font-medium text-ink">
          Confirmation du paiement en cours…
        </p>
        <p className="text-xs text-ink/60">
          {awaitingConfirm
            ? "La confirmation peut prendre un instant. Le reçu apparaîtra dès validation du paiement. Vous pouvez actualiser la page."
            : "Ne fermez pas cette page, nous attendons la confirmation du prestataire."}
        </p>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-brick/30 bg-brick/10 px-4 py-3">
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-brick"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-brick">Paiement non abouti</p>
            <p className="mt-0.5 text-xs text-brick/80">
              Aucun encaissement n’a été enregistré. Vous pouvez réessayer.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="h-12 w-full rounded-full bg-ledger text-base text-paper hover:bg-ledger/90"
          onClick={() => setPhase("form")}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        type="button"
        className="h-12 w-full rounded-full bg-ledger text-base text-paper hover:bg-ledger/90"
        onClick={() => setPhase("form")}
        disabled={phase === "redirecting"}
      >
        Payer maintenant
      </Button>

      <CheckoutDialog
        open={phase === "form" || phase === "redirecting"}
        phase={phase}
        amount={amount}
        currency={currency}
        method={method}
        phone={phone}
        selected={selected}
        onOpenChange={(open) => {
          if (!open && phase !== "redirecting") setPhase("idle");
        }}
        onMethodChange={setMethod}
        onPhoneChange={setPhone}
        onConfirm={() => void confirmPayment()}
      />
    </>
  );
}

function CheckoutDialog({
  open,
  phase,
  amount,
  currency,
  method,
  phone,
  selected,
  onOpenChange,
  onMethodChange,
  onPhoneChange,
  onConfirm,
}: {
  open: boolean;
  phase: PaymentPhase;
  amount: number;
  currency: CurrencyCode;
  method: MethodHint;
  phone: string;
  selected: (typeof METHODS)[number];
  onOpenChange: (open: boolean) => void;
  onMethodChange: (value: MethodHint) => void;
  onPhoneChange: (value: string) => void;
  onConfirm: () => void;
}) {
  const busy = phase === "redirecting";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle className="font-serif">Payer maintenant</DialogTitle>
          <DialogDescription>
            Montant à régler :{" "}
            <span className="num font-medium text-ink">
              {formatMoney(amount, currency)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={method}
          onValueChange={(value) => onMethodChange(value as MethodHint)}
        >
          <TabsList className="h-auto w-full flex-wrap rounded-full p-1">
            {METHODS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="flex-1 rounded-full"
                disabled={busy}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {selected.needsPhone ? (
          <div className="space-y-1.5">
            <Label htmlFor="psp-phone">Numéro {selected.label}</Label>
            <Input
              id="psp-phone"
              className="num"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+221 77 123 45 67"
              value={phone}
              disabled={busy}
              onChange={(event) => onPhoneChange(event.target.value)}
            />
          </div>
        ) : (
          <p className="text-sm text-ink/65">
            Vous serez redirigé vers la page de paiement sécurisée pour régler
            par carte.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            className={cn(
              "w-full bg-ledger text-paper hover:bg-ledger/90",
              busy && "opacity-90",
            )}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Redirection…
              </>
            ) : (
              `Continuer · ${formatMoney(amount, currency)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
