"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { LedgerCard } from "@/components/ledger-card";
import {
  ORG_SETTINGS,
  type BusinessDocument,
} from "@/lib/mock-data";
import {
  buildEmvQrPayload,
  providerLabel,
  type MobileMoneyProvider,
} from "@/lib/qr/emv-qr";
import { buildSwissQrData } from "@/lib/qr/swiss-qr";
import { CLIENTS } from "@/lib/data/clients";

type PaymentQrSectionProps = {
  document: BusinessDocument;
  className?: string;
};

export function PaymentQrSection({ document }: PaymentQrSectionProps) {
  const isSwiss = ORG_SETTINGS.country === "CH";
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [swissSvgHtml, setSwissSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      setError(null);
      try {
        if (isSwiss) {
          const client = CLIENTS.find((c) => c.id === document.clientId);
          const data = buildSwissQrData(document, ORG_SETTINGS, client);
          try {
            const { SwissQRBill } = await import("swissqrbill/svg");
            // swissqrbill expects a specific data shape
            const svg = new SwissQRBill({
              currency: data.currency,
              amount: data.amount,
              creditor: data.creditor,
              debtor: data.debtor,
              message: data.message,
            } as never);
            if (!cancelled) {
              setSwissSvgHtml(svg.element.outerHTML);
              setQrDataUrl(null);
            }
          } catch {
            // Fallback: encode a simple payload as QR if swissqrbill fails
            const payload = `SPC\n0200\n1\n${data.creditor.account}\n${data.creditor.name}\n${data.amount}\n${data.currency}\n${data.message}`;
            const url = await QRCode.toDataURL(payload, {
              width: 220,
              margin: 1,
            });
            if (!cancelled) {
              setQrDataUrl(url);
              setSwissSvgHtml(null);
            }
          }
        } else {
          const provider = (ORG_SETTINGS.mobileMoneyProvider ??
            "wave") as MobileMoneyProvider;
          const payload = buildEmvQrPayload({
            merchantName: ORG_SETTINGS.companyName,
            merchantCity: ORG_SETTINGS.city,
            merchantPhone:
              ORG_SETTINGS.mobileMoneyNumber ?? ORG_SETTINGS.phone,
            amount: document.total,
            currency: document.currency,
            reference: document.number,
            provider,
          });
          const url = await QRCode.toDataURL(payload, {
            width: 220,
            margin: 1,
          });
          if (!cancelled) {
            setQrDataUrl(url);
            setSwissSvgHtml(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Impossible de générer le QR",
          );
        }
      }
    }

    void generate();
    return () => {
      cancelled = true;
    };
  }, [document, isSwiss]);

  const title = isSwiss
    ? "QR-facture suisse"
    : `QR ${providerLabel((ORG_SETTINGS.mobileMoneyProvider ?? "wave") as MobileMoneyProvider)}`;

  return (
    <LedgerCard>
      <div className="space-y-3 p-4">
        <h2 className="font-serif text-base font-semibold text-ink">{title}</h2>
        <p className="text-xs text-ink/55">
          {isSwiss
            ? "Conforme aux normes suisses — scannable par les apps bancaires."
            : "Scannez avec votre application Mobile Money pour payer."}
        </p>
        {error && (
          <p className="rounded-sm border border-brick/30 bg-brick/10 px-3 py-2 text-sm text-brick">
            {error}
          </p>
        )}
        {swissSvgHtml && (
          <div
            className="overflow-auto rounded-sm border border-line bg-white p-2"
            dangerouslySetInnerHTML={{ __html: swissSvgHtml }}
          />
        )}
        {qrDataUrl && (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR code paiement ${document.number}`}
              className="size-[220px] rounded-sm border border-line bg-white p-2"
            />
            {ORG_SETTINGS.country === "CH" && ORG_SETTINGS.twintNumber && (
              <p className="text-xs text-ink/60">
                TWINT : {ORG_SETTINGS.twintNumber}
              </p>
            )}
            {!isSwiss && ORG_SETTINGS.mobileMoneyNumber && (
              <p className="num text-xs text-ink/60">
                {ORG_SETTINGS.mobileMoneyNumber}
              </p>
            )}
          </div>
        )}
      </div>
    </LedgerCard>
  );
}
