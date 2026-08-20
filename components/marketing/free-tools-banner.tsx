"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Download,
  Globe2,
  QrCode,
  Sparkles,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionShell } from "@/components/marketing/section-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateVat,
  CURRENCY_OPTIONS,
  formatMoney,
  TAX_PRESETS,
  type CurrencyCode,
  type TaxMode,
} from "@/lib/mock-data";
import {
  buildEmvQrPayload,
  providerLabel,
  type MobileMoneyProvider,
} from "@/lib/qr/emv-qr";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PROVIDERS: { id: MobileMoneyProvider; label: string; bg: string }[] = [
  { id: "wave", label: "Wave", bg: "bg-ledger text-paper" },
  { id: "orange_money", label: "Orange Money", bg: "bg-orange-500 text-paper" },
  { id: "mtn", label: "MTN MoMo", bg: "bg-amber text-ink font-bold" },
  { id: "moov", label: "Moov Money", bg: "bg-blue-600 text-paper" },
  { id: "twint", label: "TWINT (CH)", bg: "bg-ink text-paper" },
];

export function FreeToolsBanner() {
  const [activeTab, setActiveTab] = useState("all");

  /* --- State for TVA Calculator --- */
  const [country, setCountry] = useState("SN");
  const [amount, setAmount] = useState(100_000);
  const [rate, setRate] = useState(18);
  const [mode, setMode] = useState<TaxMode>("exclusive");
  const [currency, setCurrency] = useState<CurrencyCode>("XOF");

  const vatResult = useMemo(
    () => calculateVat(amount, rate, mode),
    [amount, rate, mode],
  );

  /* --- State for QR Generator --- */
  const [merchantName, setMerchantName] = useState("Mon Entreprise");
  const [merchantCity, setMerchantCity] = useState("Dakar");
  const [phone, setPhone] = useState("+221 77 000 00 00");
  const [qrAmount, setQrAmount] = useState(50_000);
  const [qrCurrency, setQrCurrency] = useState<CurrencyCode>("XOF");
  const [reference, setReference] = useState("FAC-2026-001");
  const [provider, setProvider] = useState<MobileMoneyProvider>("wave");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const payload = buildEmvQrPayload({
      merchantName,
      merchantCity,
      merchantPhone: phone,
      amount: qrAmount,
      currency: qrCurrency,
      reference,
      provider,
    });
    void QRCode.toDataURL(payload, { width: 260, margin: 1 }).then(setQrUrl);
  }, [merchantName, merchantCity, phone, qrAmount, qrCurrency, reference, provider]);

  /* --- State for Quick Currency Converter --- */
  const [convAmount, setQrConvAmount] = useState(100);
  const [fromCurr, setFromCurr] = useState<CurrencyCode>("EUR");

  const EUR_RATES: Record<CurrencyCode, number> = {
    EUR: 1,
    XOF: 655.957,
    XAF: 655.957,
    USD: 1.09,
    GBP: 0.86,
    CHF: 0.95,
    MAD: 10.85,
    NGN: 1765,
    GHS: 13.7,
    KES: 144.5,
    CAD: 1.49,
  };

  const convertedValue = (toCode: CurrencyCode) => {
    const amountInEur = convAmount / (EUR_RATES[fromCurr] || 1);
    return amountInEur * (EUR_RATES[toCode] || 1);
  };

  return (
    <SectionShell
      id="outils"
      eyebrow="Outils gratuits"
      title="Utilisez InvoMind avant même de vous inscrire"
      description="Mini-outils gratuits et instantanés pour facturer, calculer vos taxes et encaisser dès aujourd'hui."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Interactive Filter Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList
            variant="default"
            className="inline-flex h-auto w-auto flex-wrap items-center justify-start gap-1.5 rounded-full border border-line/80 bg-muted/60 p-1.5 shadow-inner"
          >
            <TabsTrigger
              value="all"
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <Sparkles className="size-3.5 text-brass" />
              <span>Tous les outils</span>
            </TabsTrigger>

            <TabsTrigger
              value="tva"
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <Calculator className="size-3.5 text-ledger" />
              <span>Calculateur TVA</span>
              <span className="ml-1 rounded-full bg-ledger/10 px-2 py-0.5 text-[10px] font-bold text-ledger">
                Live
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="qr"
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <QrCode className="size-3.5 text-brass" />
              <span>Générateur QR</span>
              <span className="ml-1 rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-bold text-brass">
                EMV / Wave
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="devises"
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <Globe2 className="size-3.5 text-amber" />
              <span>Convertisseur Devises</span>
            </TabsTrigger>
          </TabsList>

          <span className="inline-flex items-center gap-1.5 text-xs text-ink/55 bg-paper border border-line px-3 py-1 rounded-full shadow-sm">
            <Zap className="size-3.5 text-brass fill-brass" /> 100% gratuit • Sans inscription
          </span>
        </div>

        {/* Tab Content 1: ALL TOOLS (Grid of 3 interactive cards) */}
        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: TVA Calculator */}
            <div className="glass-card flex flex-col justify-between rounded-3xl border border-line/80 bg-paper p-5 shadow-sm transition-all hover:border-ledger/50 hover:shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-ledger/10 text-ledger">
                    <Calculator className="size-5" />
                  </div>
                  <span className="rounded-full bg-ledger/10 px-2.5 py-0.5 text-[10px] font-bold text-ledger">
                    Calcul Direct
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-lg font-bold text-ink">
                  Calculateur de TVA
                </h3>
                <p className="mt-1 text-xs text-ink/65 leading-relaxed">
                  Calculez HT, TVA et TTC selon les régimes Sénégal, Côte d&apos;Ivoire, France, Suisse, Maroc...
                </p>

                {/* Mini Country Selector Pills */}
                <div className="mt-4 space-y-3 rounded-2xl border border-line/70 bg-muted/30 p-3 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {TAX_PRESETS.map((p) => (
                      <button
                        key={p.countryCode}
                        type="button"
                        onClick={() => {
                          setCountry(p.countryCode);
                          setRate(p.defaultRate);
                          if (p.countryCode === "SN" || p.countryCode === "CI") setCurrency("XOF");
                          else if (p.countryCode === "FR") setCurrency("EUR");
                          else if (p.countryCode === "CH") setCurrency("CHF");
                        }}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all",
                          country === p.countryCode
                            ? "bg-ledger text-paper shadow-xs"
                            : "bg-paper text-ink/70 hover:bg-slate-200 dark:hover:bg-slate-700",
                        )}
                      >
                        {p.countryCode} ({p.defaultRate}%)
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-ink/50 uppercase font-semibold">HT</span>
                      <Input
                        type="number"
                        className="h-8 text-xs num font-semibold"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink/50 uppercase font-semibold">TTC ({rate}%)</span>
                      <div className="h-8 flex items-center px-2.5 rounded-md border border-line bg-paper text-xs num font-bold text-brass">
                        {formatMoney(vatResult.ttc, currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-ink/50">TVA: {formatMoney(vatResult.vat, currency)}</span>
                <Link
                  href="/outils/calculateur-tva"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-full text-xs font-semibold hover:border-ledger hover:text-ledger",
                  )}
                >
                  Ouvrir l&apos;outil <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: QR Generator */}
            <div className="glass-card flex flex-col justify-between rounded-3xl border border-line/80 bg-paper p-5 shadow-sm transition-all hover:border-brass/50 hover:shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-brass/15 text-brass">
                    <QrCode className="size-5" />
                  </div>
                  <span className="rounded-full bg-brass/15 px-2.5 py-0.5 text-[10px] font-bold text-brass">
                    Mobile Money
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-lg font-bold text-ink">
                  Générateur QR Facture
                </h3>
                <p className="mt-1 text-xs text-ink/65 leading-relaxed">
                  Générez un QR Code EMV scannable pour Wave, Orange Money, MTN, Moov et TWINT.
                </p>

                {/* Mini Provider selector & live QR */}
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line/70 bg-muted/30 p-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {PROVIDERS.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProvider(p.id)}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all",
                            provider === p.id
                              ? "bg-ink text-paper"
                              : "bg-paper text-ink/70 hover:bg-slate-200 dark:hover:bg-slate-700",
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="text-[11px] font-medium text-ink">
                      Montant : <span className="num font-bold text-brass">{formatMoney(qrAmount, qrCurrency)}</span>
                    </div>
                  </div>

                  {qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrUrl}
                      alt="QR Code aperçu"
                      className="size-16 rounded-lg border border-line bg-white p-1 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="size-16 rounded-lg bg-line/40 animate-pulse shrink-0" />
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-ink/50">Téléchargeable en PNG</span>
                <Link
                  href="/outils/generateur-qr-facture"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-full text-xs font-semibold hover:border-brass hover:text-brass",
                  )}
                >
                  Ouvrir l&apos;outil <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Multi-Currency & Invoice Preview */}
            <div className="glass-card flex flex-col justify-between rounded-3xl border border-line/80 bg-paper p-5 shadow-sm transition-all hover:border-amber/50 hover:shadow-xl md:col-span-2 lg:col-span-1">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-amber/15 text-amber">
                    <Globe2 className="size-5" />
                  </div>
                  <span className="rounded-full bg-amber/15 px-2.5 py-0.5 text-[10px] font-bold text-amber">
                    Devises African &amp; Global
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-lg font-bold text-ink">
                  Convertisseur de Devises
                </h3>
                <p className="mt-1 text-xs text-ink/65 leading-relaxed">
                  Taux de conversion instantanés XOF, XAF, EUR, USD, CHF, MAD pour vos factures internationales.
                </p>

                <div className="mt-4 space-y-2 rounded-2xl border border-line/70 bg-muted/30 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-8 text-xs num font-semibold w-24"
                      value={convAmount}
                      onChange={(e) => setQrConvAmount(Number(e.target.value) || 0)}
                    />
                    <span className="font-bold text-ink">{fromCurr}</span>
                    <span className="text-ink/40 font-bold">=</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    <div className="rounded-lg bg-paper p-1.5 border border-line/60 flex justify-between">
                      <span className="text-ink/50 font-medium">XOF / XAF</span>
                      <span className="num font-bold text-ink">
                        {new Intl.NumberFormat("fr-FR").format(
                          Math.round(convertedValue("XOF")),
                        )}{" "}
                        F
                      </span>
                    </div>
                    <div className="rounded-lg bg-paper p-1.5 border border-line/60 flex justify-between">
                      <span className="text-ink/50 font-medium">USD</span>
                      <span className="num font-bold text-ink">${convertedValue("USD").toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs text-ink/50">Mise à jour automatique</span>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-full text-xs font-semibold hover:border-amber hover:text-amber",
                  )}
                >
                  Tester InvoMind <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab Content 2: FULL LIVE TVA CALCULATOR */}
        <TabsContent value="tva" className="glass-card rounded-3xl border border-line/80 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-line/70 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink">
                Calculateur de TVA en Direct
              </h3>
              <p className="text-xs text-ink/60 mt-0.5">
                Régimes fiscaux préconfigurés : Sénégal, Côte d&apos;Ivoire, Cameroun, France, Suisse, Maroc.
              </p>
            </div>
            <Link
              href="/outils/calculateur-tva"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full text-xs",
              )}
            >
              Page dédiée <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-start">
            <div className="space-y-4 rounded-2xl border border-line/70 bg-paper p-4">
              <div>
                <label className="text-xs font-bold text-ink/70">1. Sélectionnez le Pays / Régime</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TAX_PRESETS.map((p) => (
                    <button
                      key={p.countryCode}
                      type="button"
                      onClick={() => {
                        setCountry(p.countryCode);
                        setRate(p.defaultRate);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                        country === p.countryCode
                          ? "bg-ledger text-paper shadow-sm"
                          : "border border-line bg-muted/40 text-ink/70 hover:bg-muted",
                      )}
                    >
                      {p.countryLabel} ({p.defaultRate}%)
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink/70">Montant ({currency})</label>
                  <Input
                    type="number"
                    className="mt-1 num text-sm font-semibold"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink/70">Mode de Calcul</label>
                  <div className="mt-1 flex rounded-lg border border-line bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setMode("exclusive")}
                      className={cn(
                        "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                        mode === "exclusive" ? "bg-paper text-ink shadow-xs" : "text-ink/60",
                      )}
                    >
                      Hors Taxe (HT)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("inclusive")}
                      className={cn(
                        "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                        mode === "inclusive" ? "bg-paper text-ink shadow-xs" : "text-ink/60",
                      )}
                    >
                      TVA Incluse (TTC)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-line/70 bg-paper p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Résultat du calcul</p>
              <div className="space-y-2 border-b border-line pb-3">
                <div className="flex justify-between text-sm text-ink/70">
                  <span>Montant Hors Taxe (HT)</span>
                  <span className="num font-semibold text-ink">{formatMoney(vatResult.ht, currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-ink/70">
                  <span>Montant de la TVA ({rate}%)</span>
                  <span className="num font-semibold text-ledger">{formatMoney(vatResult.vat, currency)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-ink">Total TTC</span>
                <span className="num text-2xl font-bold text-brass">{formatMoney(vatResult.ttc, currency)}</span>
              </div>
              <p className="text-[11px] text-ink/50 flex items-center gap-1 pt-1">
                <CheckCircle2 className="size-3.5 text-ledger" /> Conforme aux directives de la loi de finances locale.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab Content 3: FULL LIVE QR GENERATOR */}
        <TabsContent value="qr" className="glass-card rounded-3xl border border-line/80 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-line/70 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink">
                Générateur de QR Code de Paiement EMV
              </h3>
              <p className="text-xs text-ink/60 mt-0.5">
                Générez votre QR scannable gratuitement pour Mobile Money (Wave, Orange Money, MTN, Moov) ou TWINT.
              </p>
            </div>
            <Link
              href="/outils/generateur-qr-facture"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full text-xs",
              )}
            >
              Page dédiée <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-4 rounded-2xl border border-line/70 bg-paper p-4">
              <div>
                <label className="text-xs font-bold text-ink/70">Opérateur de Paiement</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                        provider === p.id
                          ? p.bg + " shadow-sm"
                          : "border border-line bg-muted/40 text-ink/70 hover:bg-muted",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink/70">Nom Marchand</label>
                  <Input
                    className="mt-1 text-xs"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink/70">Ville</label>
                  <Input
                    className="mt-1 text-xs"
                    value={merchantCity}
                    onChange={(e) => setMerchantCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink/70">Téléphone</label>
                  <Input
                    className="mt-1 text-xs"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink/70">Montant</label>
                  <Input
                    type="number"
                    className="mt-1 num text-xs font-semibold"
                    value={qrAmount}
                    onChange={(e) => setQrAmount(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink/70">Devise</label>
                  <select
                    className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5 text-xs font-bold text-ink"
                    value={qrCurrency}
                    onChange={(e) => setQrCurrency(e.target.value as CurrencyCode)}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-ink/70">Référence</label>
                  <Input
                    className="mt-1 text-xs font-mono"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* QR Result Box */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-line/70 bg-paper shadow-sm gap-3 text-center">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="size-44 rounded-xl border border-line bg-white p-2 shadow-sm"
                />
              ) : (
                <div className="size-44 rounded-xl bg-line/40 animate-pulse" />
              )}
              <div>
                <p className="text-sm font-bold text-ink">
                  {providerLabel(provider)} • {formatMoney(qrAmount, qrCurrency)}
                </p>
                <p className="text-xs text-ink/50 font-mono mt-0.5">Réf: {reference}</p>
              </div>

              <button
                type="button"
                disabled={!qrUrl}
                onClick={() => {
                  if (!qrUrl) return;
                  const a = document.createElement("a");
                  a.href = qrUrl;
                  a.download = `qr-${reference}.png`;
                  a.click();
                  toast.success("QR Code téléchargé au format PNG");
                }}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "glow-cta mt-1 rounded-full bg-ledger text-paper hover:bg-ledger/90 text-xs font-semibold px-5",
                )}
              >
                <Download className="mr-1.5 size-3.5" /> Télécharger en PNG
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Tab Content 4: CURRENCY CONVERTER */}
        <TabsContent value="devises" className="glass-card rounded-3xl border border-line/80 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-line/70 pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink">
                Convertisseur de Devises Multi-Pays
              </h3>
              <p className="text-xs text-ink/60 mt-0.5">
                Convertissez instantanément vos montants entre XOF (UEMOA), XAF (CEMAC), EUR, USD, CHF et MAD.
              </p>
            </div>
            <span className="rounded-full bg-amber/15 px-3 py-1 text-xs font-semibold text-amber">
              Taux Moyen du Marché
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] items-center">
            <div className="space-y-4 rounded-2xl border border-line/70 bg-paper p-4">
              <div>
                <label className="text-xs font-bold text-ink/70">Montant d&apos;origine</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    type="number"
                    className="num text-sm font-bold flex-1"
                    value={convAmount}
                    onChange={(e) => setQrConvAmount(Number(e.target.value) || 0)}
                  />
                  <select
                    className="rounded-md border border-line bg-paper px-3 py-1 text-xs font-bold text-ink"
                    value={fromCurr}
                    onChange={(e) => setFromCurr(e.target.value as CurrencyCode)}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.value} ({c.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["XOF", "EUR", "USD", "CHF", "XAF", "MAD"] as CurrencyCode[]).map((code) => (
                <div
                  key={code}
                  className="rounded-2xl border border-line/70 bg-paper p-3 shadow-xs space-y-0.5"
                >
                  <p className="text-[10px] font-bold text-ink/50 uppercase">{code}</p>
                  <p className="num text-base font-bold text-brass">
                    {formatMoney(convertedValue(code), code)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </SectionShell>
  );
}
