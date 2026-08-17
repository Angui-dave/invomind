"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_OPTIONS, type CurrencyCode } from "@/lib/mock-data";
import {
  buildEmvQrPayload,
  providerLabel,
  type MobileMoneyProvider,
} from "@/lib/qr/emv-qr";
import { toast } from "sonner";

const PROVIDERS: MobileMoneyProvider[] = [
  "wave",
  "orange_money",
  "mtn",
  "moov",
  "mpesa",
  "twint",
];

export default function QrGeneratorPage() {
  const [merchantName, setMerchantName] = useState("Mon entreprise");
  const [merchantCity, setMerchantCity] = useState("Dakar");
  const [phone, setPhone] = useState("+221 77 000 00 00");
  const [amount, setAmount] = useState(50_000);
  const [currency, setCurrency] = useState<CurrencyCode>("XOF");
  const [reference, setReference] = useState("FAC-2026-001");
  const [provider, setProvider] = useState<MobileMoneyProvider>("wave");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const payload = buildEmvQrPayload({
      merchantName,
      merchantCity,
      merchantPhone: phone,
      amount,
      currency,
      reference,
      provider,
    });
    void QRCode.toDataURL(payload, { width: 280, margin: 1 }).then(setQrUrl);
  }, [merchantName, merchantCity, phone, amount, currency, reference, provider]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Générateur de QR Facture
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          Créez gratuitement un QR code de paiement (Mobile Money / TWINT).
          Pour les QR-factures suisses conformes, configurez le pays « Suisse »
          dans les paramètres InvoMind.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-sm border border-line bg-paper p-5">
            <div className="space-y-1.5">
              <Label>Nom du commerçant</Label>
              <Input
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Input
                value={merchantCity}
                onChange={(e) => setMerchantCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone / compte</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Montant</Label>
                <Input
                  type="number"
                  className="num"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Devise</Label>
                <Select
                  value={currency}
                  onValueChange={(v) => v && setCurrency(v as CurrencyCode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Référence</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fournisseur de paiement</Label>
              <Select
                value={provider}
                onValueChange={(v) =>
                  v && setProvider(v as MobileMoneyProvider)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {providerLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-sm border border-line bg-paper p-5">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QR code de paiement"
                className="size-[280px] rounded-sm border border-line bg-white p-2"
              />
            ) : (
              <div className="size-[280px] animate-pulse rounded-sm bg-line/40" />
            )}
            <p className="text-center text-sm text-ink/60">
              {providerLabel(provider)} · {reference}
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={!qrUrl}
              onClick={() => {
                if (!qrUrl) return;
                const a = document.createElement("a");
                a.href = qrUrl;
                a.download = `qr-${reference}.png`;
                a.click();
                toast.success("QR téléchargé");
              }}
            >
              Télécharger le PNG
            </Button>
          </div>
        </div>
    </div>
  );
}
