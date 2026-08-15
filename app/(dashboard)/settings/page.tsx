"use client";

import { useState } from "react";
import { LedgerCard } from "@/components/ledger-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  EMAIL_TEMPLATES,
  formatDateFr,
  formatEuro,
  PAYMENT_METHOD_LABELS,
  PAYMENT_PROVIDER,
  PRICING_PLANS,
  REMINDER_DEFAULTS,
  REMINDER_MILESTONE_LABELS,
  TEMPLATE_VARIABLES,
  type PaymentMethod,
  type ReminderMilestone,
} from "@/lib/mock-data";
import { toast } from "sonner";

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

  const currentTemplate = templates.find((t) => t.id === activeTemplate);

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Abonnement, relances et paiement en ligne
        </p>
      </header>

      <Tabs defaultValue="billing">
        <TabsList variant="line" className="h-auto flex-wrap">
          <TabsTrigger value="billing">Abonnement</TabsTrigger>
          <TabsTrigger value="reminders">Relances automatiques</TabsTrigger>
          <TabsTrigger value="payments">Paiement en ligne</TabsTrigger>
        </TabsList>

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
                  toast.message("Portail Stripe (mock)", {
                    description: "Aucune intégration réelle à ce stade.",
                  })
                }
              >
                Gérer dans le portail Stripe
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
                        {formatEuro(item.amount)}
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
            <Tabs
              value={activeTemplate}
              onValueChange={setActiveTemplate}
            >
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
                <p className="text-xs text-ink/55">Stripe</p>
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
                      toast.message("Stripe déconnecté (mock)");
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
                    toast.success("Stripe connecté (mock)");
                  }}
                >
                  Connecter Stripe
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
      </Tabs>
    </div>
  );
}
