"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SUPPLIERS, type Supplier } from "@/lib/mock-data";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Fournisseurs
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Contacts et données fournisseurs
          </p>
        </div>
        <Button
          type="button"
          className="bg-ledger text-paper hover:bg-ledger/90"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Button>
      </div>

      <div className="rounded-sm border border-line bg-paper">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Entreprise</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Ville</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => {
                  setEditing(s);
                  setOpen(true);
                }}
              >
                <TableCell className="font-medium text-ink">
                  {s.company}
                </TableCell>
                <TableCell className="text-ink/70">{s.name}</TableCell>
                <TableCell className="text-ink/70">{s.email}</TableCell>
                <TableCell className="num text-ink/70">
                  {s.phone ?? "—"}
                </TableCell>
                <TableCell className="text-ink/70">{s.city ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SupplierDialog
        open={open}
        onOpenChange={setOpen}
        supplier={editing}
        onSave={(values) => {
          if (editing) {
            setSuppliers((prev) =>
              prev.map((s) =>
                s.id === editing.id ? { ...s, ...values } : s,
              ),
            );
            toast.success("Fournisseur modifié");
          } else {
            setSuppliers((prev) => [
              {
                id: `sup_${Math.random().toString(36).slice(2, 8)}`,
                ...values,
              },
              ...prev,
            ]);
            toast.success("Fournisseur ajouté");
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
  onSave: (v: Omit<Supplier, "id">) => void;
}) {
  const formKey = open ? `${supplier?.id ?? "new"}` : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {supplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <SupplierForm
            key={formKey}
            supplier={supplier}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SupplierForm({
  supplier,
  onCancel,
  onSave,
}: {
  supplier: Supplier | null;
  onCancel: () => void;
  onSave: (v: Omit<Supplier, "id">) => void;
}) {
  const [name, setName] = useState(supplier?.name ?? "");
  const [company, setCompany] = useState(supplier?.company ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [city, setCity] = useState(supplier?.city ?? "");
  const [country, setCountry] = useState(supplier?.country ?? "SN");
  const [taxId, setTaxId] = useState(supplier?.taxId ?? "");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          country,
          taxId: taxId.trim() || undefined,
        });
      }}
    >
      <div className="space-y-1.5">
        <Label>Entreprise</Label>
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Contact</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Téléphone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ville</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Pays (code)</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>N° fiscal</Label>
          <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          className="bg-ledger text-paper hover:bg-ledger/90"
        >
          Enregistrer
        </Button>
      </DialogFooter>
    </form>
  );
}
