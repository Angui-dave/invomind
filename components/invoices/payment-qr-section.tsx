"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { LedgerCard } from "@/components/ledger-card";
import type { BusinessDocument } from "@/lib/documents";
import type { Client } from "@/lib/data/clients";
import type { OrgSettings } from "@/lib/data/settings";
import {
  buildEmvQrPayload,
  providerLabel,
  type MobileMoneyProvider,
} from "@/lib/qr/emv-qr";
import { buildSwissQrData } from "@/lib/qr/swiss-qr";

type PaymentQrSectionProps = {
  document: BusinessDocument;
  orgSettings: OrgSettings;
  client?: Client | null;
  className?: string;
};

export function PaymentQrSection({
  document,
  orgSettings,
  client,
}: PaymentQrSectionProps) {
  const isSwiss = orgSettings.country === "CH";
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [swissSvgHtml, setSwissSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      setError(null);
      try {
        if (isSwiss) {
          const data = buildSwissQrData(
            document,
            orgSettings,
            client ?? undefined,
          );
          try {
            const { SwissQRBill } = await import("swissqrbill/svg");
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
          const provider = (orgSettings.mobileMoneyProvider ??
            "wave") as MobileMoneyProvider;
          const payload = buildEmvQrPayload({
            merchantName: orgSettings.companyName,
            merchantCity: orgSettings.city,
            merchantPhone:
              orgSettings.mobileMoneyNumber ?? orgSettings.phone,
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
  }, [document, isSwiss, orgSettings, client]);

  const title = isSwiss
    ? "QR-facture suisse"
    : `QR ${providerLabel((orgSettings.mobileMoneyProvider ?? "wave") as MobileMoneyProvider)}`;

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
            {orgSettings.country === "CH" && orgSettings.twintNumber && (
              <p className="text-xs text-ink/60">
                TWINT : {orgSettings.twintNumber}
              </p>
            )}
            {!isSwiss && orgSettings.mobileMoneyNumber && (
              <p className="num text-xs text-ink/60">
                {orgSettings.mobileMoneyNumber}
              </p>
            )}
          </div>
        )}
      </div>
    </LedgerCard>
  );
}
