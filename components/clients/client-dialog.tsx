"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCY_OPTIONS,
  TAX_PRESETS,
  type Client,
  type CurrencyCode,
} from "@/lib/mock-data";
import { toast } from "sonner";

export type ClientFormValues = {
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  currency?: CurrencyCode;
  paymentTermDays?: number;
  remindersEnabled: boolean;
};

type ClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  initialValues?: Partial<ClientFormValues>;
  onSave?: (values: ClientFormValues) => void;
};

export function ClientDialog({
  open,
  onOpenChange,
  client,
  initialValues,
  onSave,
}: ClientDialogProps) {
  const formKey = open
    ? `${client?.id ?? "new"}-${initialValues?.name ?? ""}`
    : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {client ? "Modifier le client" : "Ajouter un client"}
          </DialogTitle>
          <DialogDescription>
            Coordonnées et détails de facturation.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ClientFormFields
            key={formKey}
            client={client}
            initialValues={initialValues}
            onSave={(values) => {
              onSave?.(values);
              toast.success(client ? "Client modifié" : "Client créé");
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClientFormFields({
  client,
  initialValues,
  onSave,
  onCancel,
}: {
  client?: Client | null;
  initialValues?: Partial<ClientFormValues>;
  onSave: (values: ClientFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(client?.name ?? initialValues?.name ?? "");
  const [company, setCompany] = useState(
    client?.company ?? initialValues?.company ?? "",
  );
  const [email, setEmail] = useState(
    client?.email ?? initialValues?.email ?? "",
  );
  const [phone, setPhone] = useState(
    client?.phone ?? initialValues?.phone ?? "",
  );
  const [address, setAddress] = useState(
    client?.address ?? initialValues?.address ?? "",
  );
  const [city, setCity] = useState(client?.city ?? initialValues?.city ?? "");
  const [postalCode, setPostalCode] = useState(
    client?.postalCode ?? initialValues?.postalCode ?? "",
  );
  const [country, setCountry] = useState(
    client?.country ?? initialValues?.country ?? "SN",
  );
  const [taxId, setTaxId] = useState(
    client?.taxId ?? initialValues?.taxId ?? "",
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    client?.currency ?? initialValues?.currency ?? "XOF",
  );
  const [paymentTermDays, setPaymentTermDays] = useState(
    client?.paymentTermDays ?? initialValues?.paymentTermDays ?? 30,
  );
  const [remindersEnabled, setRemindersEnabled] = useState(
    client?.remindersEnabled ?? initialValues?.remindersEnabled ?? true,
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Saisissez une adresse e-mail valide");
      return;
    }
    onSave({
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      country,
      taxId: taxId.trim() || undefined,
      currency,
      paymentTermDays,
      remindersEnabled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="client-name">Nom</Label>
          <Input
            id="client-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client-company">Entreprise</Label>
          <Input
            id="client-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="client-email">E-mail</Label>
          <Input
            id="client-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client-phone">Téléphone</Label>
          <Input
            id="client-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client-address">Adresse de facturation</Label>
        <Input
          id="client-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Code postal</Label>
          <Input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Ville</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Pays</Label>
          <Select value={country} onValueChange={(v) => v && setCountry(v)}>
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
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>N° TVA / NINEA</Label>
          <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
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
        <div className="space-y-1.5">
          <Label>Délai (jours)</Label>
          <Input
            type="number"
            className="num"
            value={paymentTermDays}
            onChange={(e) => setPaymentTermDays(Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-sm border border-line px-3 py-2">
        <Label htmlFor="client-reminders" className="text-sm">
          Relances activées
        </Label>
        <Switch
          id="client-reminders"
          checked={remindersEnabled}
          onCheckedChange={setRemindersEnabled}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          className="bg-ledger text-paper hover:bg-ledger/90"
        >
          {client ? "Enregistrer" : "Ajouter le client"}
        </Button>
      </DialogFooter>
    </form>
  );
}
