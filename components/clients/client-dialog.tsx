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
import type { Client } from "@/lib/mock-data";
import { toast } from "sonner";

export type ClientFormValues = {
  name: string;
  company: string;
  email: string;
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
    ? `${client?.id ?? "new"}-${initialValues?.name ?? ""}-${initialValues?.company ?? ""}`
    : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {client ? "Modifier le client" : "Ajouter un client"}
          </DialogTitle>
          <DialogDescription>
            Les informations apparaissent sur les factures et le portail.
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
      remindersEnabled,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
