"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateVat,
  CURRENCY_OPTIONS,
  formatMoney,
  getTaxPreset,
  TAX_PRESETS,
  type CurrencyCode,
  type TaxMode,
} from "@/lib/mock-data";

export default function VatCalculatorPage() {
  const [country, setCountry] = useState("SN");
  const [amount, setAmount] = useState(100_000);
  const [rate, setRate] = useState(18);
  const [mode, setMode] = useState<TaxMode>("exclusive");
  const [currency, setCurrency] = useState<CurrencyCode>("XOF");

  const preset = getTaxPreset(country);
  const result = useMemo(
    () => calculateVat(amount, rate, mode),
    [amount, rate, mode],
  );

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Calculateur de TVA
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          Calculez HT, TVA et TTC selon le régime fiscal de votre pays.
        </p>

        <div className="mt-8 space-y-4 rounded-sm border border-line bg-paper p-5">
          <div className="space-y-1.5">
            <Label>Pays / régime</Label>
            <Select
              value={country}
              onValueChange={(v) => {
                if (!v) return;
                setCountry(v);
                const p = getTaxPreset(v);
                setRate(p.defaultRate);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_PRESETS.map((p) => (
                  <SelectItem key={p.countryCode} value={p.countryCode}>
                    {p.countryLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Taux TVA</Label>
              <Select
                value={String(rate)}
                onValueChange={(v) => v && setRate(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preset.rates.map((r) => (
                    <SelectItem key={r.rate} value={String(r.rate)}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Le montant est</Label>
              <Select
                value={mode}
                onValueChange={(v) => v && setMode(v as TaxMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Hors taxes (HT)</SelectItem>
                  <SelectItem value="inclusive">TVA incluse (TTC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 border-t border-line pt-4">
            <p className="flex justify-between text-sm">
              <span className="text-ink/60">Hors taxes</span>
              <span className="num font-medium">
                {formatMoney(result.ht, currency)}
              </span>
            </p>
            <p className="flex justify-between text-sm">
              <span className="text-ink/60">TVA ({rate} %)</span>
              <span className="num font-medium">
                {formatMoney(result.vat, currency)}
              </span>
            </p>
            <p className="flex justify-between border-t border-line pt-2">
              <span className="font-medium text-ink">Total TTC</span>
              <span className="num text-xl font-semibold text-brass">
                {formatMoney(result.ttc, currency)}
              </span>
            </p>
          </div>
        </div>
    </div>
  );
}
