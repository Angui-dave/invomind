"use client";

import { useState } from "react";
import { LedgerCard } from "@/components/ledger-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BILLING_HISTORY,
  CURRENT_USER,
  CURRENCY_OPTIONS,
  EMAIL_TEMPLATES,
  formatDateFr,
  formatMoney,
  getTaxPreset,
  ORG_SETTINGS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_PROVIDER,
  PRICING_PLANS,
  REMINDER_DEFAULTS,
  REMINDER_MILESTONE_LABELS,
  TAX_PRESETS,
  TEMPLATE_VARIABLES,
  type CurrencyCode,
  type OrgSettings,
  type PaymentMethod,
  type ReminderMilestone,
  type TaxMode,
} from "@/lib/mock-data";
import { toast } from "sonner";
import { WebhookSettings } from "@/components/settings/webhook-settings";

export default function SettingsPage() {
  const plan = PRICING_PLANS.find((p) => p.id === CURRENT_USER.plan)!;
  const [remindersOn, setRemindersOn] = useState(true);
  const [cadence, setCadence] = useState<ReminderMilestone[]>([
    ...REMINDER_DEFAULTS,
  ]);
  const [templates, setTemplates] = useState(EMAIL_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState(EMAIL_TEMPLATES[0]?.id);
  const [connected, setConnected] = useState(PAYMENT_PROVIDER.connected);
  const [methods, setMethods] = useState<PaymentMethod[]>([
    ...PAYMENT_PROVIDER.acceptedMethods,
  ]);
  const [org, setOrg] = useState<OrgSettings>({ ...ORG_SETTINGS });

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

      <Tabs defaultValue="company">
        <TabsList variant="line" className="h-auto flex-wrap">
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="tax">Fiscalité</TabsTrigger>
          <TabsTrigger value="banking">Banque & QR</TabsTrigger>
          <TabsTrigger value="billing">Abonnement</TabsTrigger>
          <TabsTrigger value="reminders">Relances</TabsTrigger>
          <TabsTrigger value="payments">Paiement en ligne</TabsTrigger>
          <TabsTrigger value="channels">Canaux & webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-sm border border-line bg-paper p-4 sm:grid-cols-2">
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
            onClick={() => toast.success("Profil entreprise enregistré")}
          >
            Enregistrer
          </Button>
        </TabsContent>

        <TabsContent value="tax" className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-sm border border-line bg-paper p-4 sm:grid-cols-2">
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
            onClick={() => toast.success("Paramètres fiscaux enregistrés")}
          >
            Enregistrer
          </Button>
        </TabsContent>

        <TabsContent value="banking" className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-sm border border-line bg-paper p-4 sm:grid-cols-2">
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
                        mobileMoneyProvider: v as OrgSettings["mobileMoneyProvider"],
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
            onClick={() => toast.success("Coordonnées bancaires enregistrées")}
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
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  toast.message("Portail de facturation (mock)", {
                    description: "Aucune intégration réelle à ce stade.",
                  })
                }
              >
                Gérer l’abonnement
              </Button>
            </div>
          </LedgerCard>

          <div>
            <h3 className="mb-3 font-serif text-base font-semibold text-ink">
              Historique de facturation
            </h3>
            <div className="rounded-sm border border-line bg-paper">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BILLING_HISTORY.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="num">
                        {formatDateFr(item.date)}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="num text-right">
                        {formatMoney(item.amount, item.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-ledger/40 bg-ledger/10 text-ledger"
                        >
                          Payée
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reminders" className="mt-6 space-y-6">
          <div className="flex items-center justify-between gap-3 rounded-sm border border-line bg-paper px-4 py-3">
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
                  className="num rounded-sm border border-line bg-paper px-2 py-0.5 text-xs text-ink/70"
                >
                  {variable}
                </span>
              ))}
            </div>
            <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
              <TabsList className="h-auto flex-wrap">
                {templates.map((tpl) => (
                  <TabsTrigger key={tpl.id} value={tpl.id} className="text-xs">
                    {tpl.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {currentTemplate && (
                <div className="mt-3 space-y-3 rounded-sm border border-line bg-paper p-4">
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
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6 space-y-6">
          <div className="rounded-sm border border-line bg-paper p-4">
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
                    onClick={() => {
                      setConnected(false);
                      toast.message("Prestataire déconnecté (mock)");
                    }}
                  >
                    Déconnecter
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  className="bg-ledger text-paper hover:bg-ledger/90"
                  onClick={() => {
                    setConnected(true);
                    toast.success("Prestataire connecté (mock)");
                  }}
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
            {PAYMENT_PROVIDER.feeNote}
          </p>
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <WebhookSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
