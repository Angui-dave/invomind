"use client";

import { useState } from "react";
import Link from "next/link";
import { LedgerCard } from "@/components/ledger-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateBankingSettings,
  updateBranding,
  updateCompanySettings,
  updateEmailTemplate,
  updateEnabledModules,
  updatePaymentSettings,
  updateRemindersSettings,
  updateTaxSettings,
} from "@/lib/actions/settings";
import type {
  EnabledModules,
  OrgBranding,
  OrgSettingsExtras,
} from "@/lib/data/settings";
import {
  CURRENCY_OPTIONS,
  getTaxPreset,
  PAYMENT_METHOD_LABELS,
  REMINDER_DEFAULTS,
  REMINDER_MILESTONE_LABELS,
  TAX_PRESETS,
  TEMPLATE_VARIABLES,
  type CurrentUser,
  type CurrencyCode,
  type EmailTemplate,
  type OrgSettings,
  type PaymentMethod,
  type PricingPlan,
  type ReminderMilestone,
  type TaxMode,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WebhookSettings } from "@/components/settings/webhook-settings";

type InitialOrg = OrgSettings & OrgSettingsExtras;

const SETTINGS_TABS = [
  "company",
  "appearance",
  "tax",
  "banking",
  "billing",
  "reminders",
  "payments",
  "channels",
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

function parseSettingsTab(value: string | null): SettingsTab {
  if (value && SETTINGS_TABS.includes(value as SettingsTab)) {
    return value as SettingsTab;
  }
  return "company";
}

type SettingsPageClientProps = {
  user: CurrentUser;
  plan: PricingPlan;
  planLimits: {
    maxInvoicesPerMonth: number | null;
    maxClients: number | null;
    pipeline: boolean;
    conversations: boolean;
    importTool: boolean;
  };
  initialOrg: InitialOrg;
  initialTemplates: EmailTemplate[];
  branding: OrgBranding | null;
  enabledModules: EnabledModules;
  initialTab?: string;
};

export function SettingsPageClient({
  plan,
  planLimits,
  initialOrg,
  initialTemplates,
  branding: initialBranding,
  enabledModules: initialModules,
  initialTab,
}: SettingsPageClientProps) {
  const settingsTab = parseSettingsTab(initialTab ?? null);
  const [remindersOn, setRemindersOn] = useState(initialOrg.remindersEnabled);
  const [cadence, setCadence] = useState<ReminderMilestone[]>(
    (initialOrg.reminderCadence?.length
      ? initialOrg.reminderCadence
      : [...REMINDER_DEFAULTS]) as ReminderMilestone[],
  );
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTemplate, setActiveTemplate] = useState(
    initialTemplates[0]?.id,
  );
  const [connected, setConnected] = useState(initialOrg.payment.connected);
  const [methods, setMethods] = useState<PaymentMethod[]>([
    ...initialOrg.payment.acceptedMethods,
  ]);
  const [org, setOrg] = useState<OrgSettings>({ ...initialOrg });
  const [branding, setBranding] = useState<OrgBranding>(
    initialBranding ?? {
      displayName: org.companyName,
      logoUrl: null,
      primaryColor: "#2563eb",
      accentColor: "#10b981",
      fontFamily: "system-ui",
      documentTemplate: "classic",
      locale: "fr",
      currency: "XOF",
    },
  );
  const [modules, setModules] = useState<EnabledModules>(initialModules);

  const currentTemplate = templates.find((t) => t.id === activeTemplate);
  const taxPreset = getTaxPreset(org.country);

  function toggleCadence(milestone: ReminderMilestone, checked: boolean) {
    setCadence((prev) =>
      checked
        ? [...prev, milestone]
        : prev.filter((item) => item !== milestone),
    );
  }

  function toggleMethod(method: PaymentMethod, checked: boolean) {
    setMethods((prev) =>
      checked ? [...prev, method] : prev.filter((item) => item !== method),
    );
  }

  function patchOrg(patch: Partial<OrgSettings>) {
    setOrg((prev) => ({ ...prev, ...patch }));
  }

  async function saveCompany() {
    const result = await updateCompanySettings({
      companyName: org.companyName,
      email: org.email,
      phone: org.phone,
      address: org.address,
      city: org.city,
      postalCode: org.postalCode,
      country: org.country,
      taxId: org.taxId,
      legalMentions: org.legalMentions,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Profil entreprise enregistré");
  }

  async function saveTax() {
    const result = await updateTaxSettings({
      defaultCurrency: org.defaultCurrency,
      defaultTaxMode: org.defaultTaxMode,
      defaultTaxRate: org.defaultTaxRate,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Paramètres fiscaux enregistrés");
  }

  async function saveBanking() {
    const result = await updateBankingSettings({
      bankName: org.bankName,
      iban: org.iban,
      bic: org.bic,
      qrIban: org.qrIban,
      twintNumber: org.twintNumber,
      mobileMoneyProvider: org.mobileMoneyProvider,
      mobileMoneyNumber: org.mobileMoneyNumber,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Coordonnées bancaires enregistrées");
  }

  async function saveReminders() {
    const result = await updateRemindersSettings({
      remindersEnabled: remindersOn,
      reminderCadence: cadence,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (currentTemplate) {
      const tplResult = await updateEmailTemplate(currentTemplate.id, {
        subject: currentTemplate.subject,
        body: currentTemplate.body,
        label: currentTemplate.label,
      });
      if (!tplResult.ok) {
        toast.error(tplResult.error);
        return;
      }
    }
    toast.success("Relances enregistrées");
  }

  async function savePayments() {
    const result = await updatePaymentSettings({
      paymentConnected: connected,
      acceptedPaymentMethods: methods,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Paramètres de paiement enregistrés");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Entreprise, fiscalité, abonnement, relances, paiements et canaux
        </p>
      </header>

      <Tabs defaultValue={settingsTab}>
        <TabsList
          variant="default"
          className="h-auto flex-wrap rounded-full bg-muted/80 p-1"
        >
          <TabsTrigger value="company" className="rounded-full">Entreprise</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-full">Apparence</TabsTrigger>
          <TabsTrigger value="tax" className="rounded-full">TVA &amp; devise</TabsTrigger>
          <TabsTrigger value="banking" className="rounded-full">Mobile Money</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-full">Abonnement</TabsTrigger>
          <TabsTrigger value="reminders" className="rounded-full">Relances</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-full">Paiement en ligne</TabsTrigger>
          <TabsTrigger value="channels" className="rounded-full">Canaux &amp; webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Raison sociale</Label>
              <Input
                value={org.companyName}
                onChange={(e) => patchOrg({ companyName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                value={org.email}
                onChange={(e) => patchOrg({ email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={org.phone}
                onChange={(e) => patchOrg({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Adresse</Label>
              <Input
                value={org.address}
                onChange={(e) => patchOrg({ address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Input
                value={org.city}
                onChange={(e) => patchOrg({ city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Code postal</Label>
              <Input
                value={org.postalCode}
                onChange={(e) => patchOrg({ postalCode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pays</Label>
              <Select
                value={org.country}
                onValueChange={(v) => {
                  if (!v) return;
                  const preset = getTaxPreset(v);
                  patchOrg({
                    country: v,
                    defaultTaxRate: preset.defaultRate,
                  });
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
            <div className="space-y-1.5">
              <Label>N° fiscal / NINEA</Label>
              <Input
                value={org.taxId}
                onChange={(e) => patchOrg({ taxId: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Mentions légales</Label>
              <Textarea
                rows={3}
                value={org.legalMentions}
                onChange={(e) => patchOrg({ legalMentions: e.target.value })}
              />
            </div>
          </div>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={saveCompany}
          >
            Enregistrer
          </Button>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-6">
          <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nom affiché</Label>
              <Input
                value={branding.displayName ?? ""}
                onChange={(e) =>
                  setBranding((b) => ({
                    ...b,
                    displayName: e.target.value || null,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>URL du logo</Label>
              <Input
                value={branding.logoUrl ?? ""}
                placeholder="https://…"
                onChange={(e) =>
                  setBranding((b) => ({
                    ...b,
                    logoUrl: e.target.value || null,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Couleur primaire</Label>
              <Input
                type="color"
                value={branding.primaryColor}
                onChange={(e) =>
                  setBranding((b) => ({
                    ...b,
                    primaryColor: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Couleur accent</Label>
              <Input
                type="color"
                value={branding.accentColor}
                onChange={(e) =>
                  setBranding((b) => ({
                    ...b,
                    accentColor: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Police</Label>
              <Select
                value={branding.fontFamily}
                onValueChange={(v) =>
                  v && setBranding((b) => ({ ...b, fontFamily: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system-ui">Système</SelectItem>
                  <SelectItem value="Georgia, serif">Serif</SelectItem>
                  <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                  <SelectItem value="'Segoe UI', sans-serif">Segoe UI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Modèle de document</Label>
              <Select
                value={branding.documentTemplate}
                onValueChange={(v) =>
                  v &&
                  setBranding((b) => ({
                    ...b,
                    documentTemplate: v as OrgBranding["documentTemplate"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classique</SelectItem>
                  <SelectItem value="modern">Moderne</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Locale</Label>
              <Input
                value={branding.locale}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, locale: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Devise branding</Label>
              <Select
                value={branding.currency}
                onValueChange={(v) =>
                  v &&
                  setBranding((b) => ({
                    ...b,
                    currency: v as CurrencyCode,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={async () => {
              const result = await updateBranding(branding);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Apparence enregistrée");
            }}
          >
            Enregistrer l’apparence
          </Button>

          <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
            <h2 className="font-serif text-base font-semibold text-ink">
              Modules visibles
            </h2>
            <p className="text-sm text-ink/60">
              Activez les modules pour votre espace. Les modules non inclus dans
              votre plan restent visibles avec un badge Pro et mènent à l’écran
              de mise à niveau.
            </p>
            {(
              [
                ["pipeline", "Pipeline prospects", planLimits.pipeline],
                ["conversations", "Conversations", planLimits.conversations],
                ["expenses", "Dépenses", true],
                ["catalog", "Catalogue", true],
                ["reports", "Rapports", true],
                ["importTool", "Import CSV", planLimits.importTool],
              ] as const
            ).map(([key, label, planOk]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Checkbox
                    checked={modules[key]}
                    disabled={!planOk}
                    onCheckedChange={(c) =>
                      setModules((m) => ({ ...m, [key]: Boolean(c) }))
                    }
                  />
                  {label}
                </span>
                {!planOk ? (
                  <Badge className="border-line bg-transparent text-xs text-ink/60">
                    Plan supérieur
                  </Badge>
                ) : null}
              </label>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const result = await updateEnabledModules(modules);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Modules enregistrés");
              }}
            >
              Enregistrer les modules
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="tax" className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Devise par défaut</Label>
              <Select
                value={org.defaultCurrency}
                onValueChange={(v) =>
                  v && patchOrg({ defaultCurrency: v as CurrencyCode })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mode TVA par défaut</Label>
              <Select
                value={org.defaultTaxMode}
                onValueChange={(v) =>
                  v && patchOrg({ defaultTaxMode: v as TaxMode })
                }
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
            <div className="space-y-1.5">
              <Label>Taux TVA par défaut</Label>
              <Select
                value={String(org.defaultTaxRate)}
                onValueChange={(v) =>
                  v && patchOrg({ defaultTaxRate: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taxPreset.rates.map((r) => (
                    <SelectItem key={r.rate} value={String(r.rate)}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="sm:col-span-2 text-sm text-ink/60">
              Régime actuel : {taxPreset.countryLabel}. Le module QR-facture
              suisse et TWINT s’active automatiquement si le pays est Suisse
              (CH).
            </p>
          </div>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={saveTax}
          >
            Enregistrer
          </Button>
        </TabsContent>

        <TabsContent value="banking" className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Banque</Label>
              <Input
                value={org.bankName}
                onChange={(e) => patchOrg({ bankName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>IBAN</Label>
              <Input
                className="num"
                value={org.iban}
                onChange={(e) => patchOrg({ iban: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>BIC / SWIFT</Label>
              <Input
                className="num"
                value={org.bic}
                onChange={(e) => patchOrg({ bic: e.target.value })}
              />
            </div>
            {org.country === "CH" && (
              <>
                <div className="space-y-1.5">
                  <Label>QR-IBAN</Label>
                  <Input
                    className="num"
                    value={org.qrIban ?? ""}
                    onChange={(e) => patchOrg({ qrIban: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Numéro TWINT</Label>
                  <Input
                    value={org.twintNumber ?? ""}
                    onChange={(e) => patchOrg({ twintNumber: e.target.value })}
                  />
                </div>
              </>
            )}
            {org.country !== "CH" && (
              <>
                <div className="space-y-1.5">
                  <Label>Mobile Money</Label>
                  <Select
                    value={org.mobileMoneyProvider ?? "wave"}
                    onValueChange={(v) =>
                      v &&
                      patchOrg({
                        mobileMoneyProvider:
                          v as OrgSettings["mobileMoneyProvider"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wave">Wave</SelectItem>
                      <SelectItem value="orange_money">Orange Money</SelectItem>
                      <SelectItem value="mtn">MTN MoMo</SelectItem>
                      <SelectItem value="moov">Moov Money</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>N° Mobile Money</Label>
                  <Input
                    value={org.mobileMoneyNumber ?? ""}
                    onChange={(e) =>
                      patchOrg({ mobileMoneyNumber: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={saveBanking}
          >
            Enregistrer
          </Button>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          <LedgerCard className="max-w-md">
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Plan {plan.name}
                </h2>
                <Badge className="bg-ledger/15 text-ledger border-ledger/30">
                  Actuel
                </Badge>
              </div>
              <p className="text-sm text-ink/60">{plan.description}</p>
              <p className="num text-2xl font-semibold text-brass">
                {plan.priceLabel}
                <span className="text-sm font-sans font-normal text-ink/55">
                  {" "}
                  / mois
                </span>
              </p>
              <Link
                href="/billing"
                className={cn(buttonVariants(), "w-full")}
              >
                Voir les formules
              </Link>
            </div>
          </LedgerCard>
        </TabsContent>

        <TabsContent value="reminders" className="mt-6 space-y-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">
                Relances automatiques
              </p>
              <p className="text-xs text-ink/55">
                Active les jalons par défaut sur les nouvelles factures
              </p>
            </div>
            <Switch
              checked={remindersOn}
              onCheckedChange={setRemindersOn}
              aria-label="Activer les relances automatiques"
            />
          </div>

          <fieldset disabled={!remindersOn} className="space-y-3">
            <legend className="font-serif text-base font-semibold text-ink">
              Cadence par défaut
            </legend>
            <ul className="space-y-2">
              {REMINDER_DEFAULTS.map((milestone) => (
                <li
                  key={milestone}
                  className="flex items-center gap-3 rounded-sm border border-line px-3 py-2"
                >
                  <Checkbox
                    id={`cadence-${milestone}`}
                    checked={cadence.includes(milestone)}
                    onCheckedChange={(checked) =>
                      toggleCadence(milestone, Boolean(checked))
                    }
                  />
                  <Label htmlFor={`cadence-${milestone}`} className="text-sm">
                    {REMINDER_MILESTONE_LABELS[milestone]}
                  </Label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="space-y-3">
            <h3 className="font-serif text-base font-semibold text-ink">
              Templates d’e-mail
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((variable) => (
                <span
                  key={variable}
                  className="num rounded-2xl border border-line bg-card px-2 py-0.5 text-xs text-ink/70"
                >
                  {variable}
                </span>
              ))}
            </div>
            {templates.length > 0 && (
              <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
                <TabsList className="h-auto flex-wrap">
                  {templates.map((tpl) => (
                    <TabsTrigger key={tpl.id} value={tpl.id} className="text-xs">
                      {tpl.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {currentTemplate && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-line bg-card p-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-subject">Objet</Label>
                      <Textarea
                        id="tpl-subject"
                        rows={2}
                        value={currentTemplate.subject}
                        onChange={(e) =>
                          setTemplates((prev) =>
                            prev.map((tpl) =>
                              tpl.id === currentTemplate.id
                                ? { ...tpl, subject: e.target.value }
                                : tpl,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-body">Corps</Label>
                      <Textarea
                        id="tpl-body"
                        rows={8}
                        value={currentTemplate.body}
                        onChange={(e) =>
                          setTemplates((prev) =>
                            prev.map((tpl) =>
                              tpl.id === currentTemplate.id
                                ? { ...tpl, body: e.target.value }
                                : tpl,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </Tabs>
            )}
          </div>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={saveReminders}
          >
            Enregistrer
          </Button>
        </TabsContent>

        <TabsContent value="payments" className="mt-6 space-y-6">
          <div className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  Prestataire de paiement
                </h3>
                <p className="text-xs text-ink/55">Stripe / Mobile Money</p>
              </div>
              {connected ? (
                <div className="flex items-center gap-2">
                  <Badge className="border-ledger/40 bg-ledger/15 text-ledger">
                    Connecté
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConnected(false)}
                  >
                    Déconnecter
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  className="bg-ledger text-paper hover:bg-ledger/90"
                  onClick={() => setConnected(true)}
                >
                  Connecter
                </Button>
              )}
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="font-serif text-base font-semibold text-ink">
              Moyens de paiement acceptés
            </legend>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
              (method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 rounded-sm border border-line px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={methods.includes(method)}
                    onCheckedChange={(checked) =>
                      toggleMethod(method, Boolean(checked))
                    }
                    disabled={!connected}
                  />
                  {PAYMENT_METHOD_LABELS[method]}
                </label>
              ),
            )}
          </fieldset>

          <p className="rounded-sm border border-line bg-muted/50 px-4 py-3 text-sm text-ink/70">
            {initialOrg.payment.feeNote}
          </p>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={savePayments}
          >
            Enregistrer
          </Button>
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <WebhookSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
