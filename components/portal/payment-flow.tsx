"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recordPortalPayment } from "@/lib/actions/portal";
import { formatMoney, type CurrencyCode } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type PaymentPhase = "idle" | "form" | "processing" | "paid";

type PaymentFlowProps = {
  token: string;
  amount: number;
  currency?: CurrencyCode;
  alreadyPaid?: boolean;
  paidAtLabel?: string;
};

export function PaymentFlow({
  token,
  amount,
  currency = "XOF",
  alreadyPaid = false,
  paidAtLabel,
}: PaymentFlowProps) {
  const [phase, setPhase] = useState<PaymentPhase>(
    alreadyPaid ? "paid" : "idle",
  );
  const [method, setMethod] = useState("card");

  async function confirmPayment() {
    setPhase("processing");
    try {
      const result = await recordPortalPayment({
        token,
        method: method === "card" ? "card" : "mobile_money",
        amount,
      });
      if (!result.ok) {
        toast.error(result.error);
        setPhase("form");
        return;
      }
      setPhase("paid");
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
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            /* receipt download stub */
          }}
        >
          Télécharger le reçu
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
        disabled={phase === "processing"}
      >
        Payer maintenant
      </Button>

      <Dialog
        open={phase === "form" || phase === "processing"}
        onOpenChange={(open) => {
          if (!open && phase !== "processing") setPhase("idle");
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={phase !== "processing"}>
          <DialogHeader>
            <DialogTitle className="font-serif">Payer maintenant</DialogTitle>
            <DialogDescription>
              Montant à régler :{" "}
              <span className="num font-medium text-ink">
                {formatMoney(amount, currency)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={method} onValueChange={setMethod}>
            <TabsList className="h-auto w-full flex-wrap rounded-full p-1">
              <TabsTrigger value="card" className="flex-1 rounded-full">
                Carte
              </TabsTrigger>
              <TabsTrigger value="mobile_money" className="flex-1 rounded-full">
                Wave
              </TabsTrigger>
              <TabsTrigger value="orange" className="flex-1 rounded-full">
                Orange Money
              </TabsTrigger>
              <TabsTrigger value="mtn" className="flex-1 rounded-full">
                MTN
              </TabsTrigger>
            </TabsList>
            <TabsContent value="card" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-number">Numéro de carte</Label>
                <Input
                  id="card-number"
                  className="num"
                  placeholder="4242 4242 4242 4242"
                  disabled={phase === "processing"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="card-exp">Expiration</Label>
                  <Input
                    id="card-exp"
                    className="num"
                    placeholder="08/28"
                    disabled={phase === "processing"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-cvc">CVC</Label>
                  <Input
                    id="card-cvc"
                    className="num"
                    placeholder="123"
                    disabled={phase === "processing"}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="mobile_money" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mm-phone">Numéro Wave</Label>
                <Input
                  id="mm-phone"
                  className="num"
                  placeholder="+221 77 123 45 67"
                  disabled={phase === "processing"}
                />
              </div>
            </TabsContent>
            <TabsContent value="orange" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="om-phone">Numéro Orange Money</Label>
                <Input
                  id="om-phone"
                  className="num"
                  placeholder="+221 77 123 45 67"
                  disabled={phase === "processing"}
                />
              </div>
            </TabsContent>
            <TabsContent value="mtn" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mtn-phone">Numéro MTN MoMo</Label>
                <Input
                  id="mtn-phone"
                  className="num"
                  placeholder="+225 07 00 00 00"
                  disabled={phase === "processing"}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              className={cn(
                "w-full bg-ledger text-paper hover:bg-ledger/90",
                phase === "processing" && "opacity-90",
              )}
              disabled={phase === "processing"}
              onClick={() => void confirmPayment()}
            >
              {phase === "processing" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Traitement en cours…
                </>
              ) : (
                `Payer ${formatMoney(amount, currency)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
