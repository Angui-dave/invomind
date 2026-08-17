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
import { createCatalogItem, updateCatalogItem } from "@/lib/actions/catalog";
import type { CatalogItem } from "@/lib/data/catalog";
import { formatMoney } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/money";

type CatalogPageClientProps = {
  initialItems: CatalogItem[];
  defaultCurrency: CurrencyCode;
};

export function CatalogPageClient({
  initialItems,
  defaultCurrency,
}: CatalogPageClientProps) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Catalogue
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Prestations et articles réutilisables
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-right">TVA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer"
                onClick={() => {
                  setEditing(item);
                  setOpen(true);
                }}
              >
                <TableCell>
                  <span className="font-medium text-ink">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-ink/50">
                    {item.description}
                  </span>
                </TableCell>
                <TableCell className="capitalize text-ink/70">
                  {item.kind === "service" ? "Prestation" : "Article"}
                </TableCell>
                <TableCell className="text-ink/70">{item.unit}</TableCell>
                <TableCell className="num text-right font-medium">
                  {formatMoney(item.unitPrice, item.currency)}
                </TableCell>
                <TableCell className="num text-right text-ink/70">
                  {item.taxRate} %
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CatalogDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        item={editing}
        onSave={async (values) => {
          if (editing) {
            const result = await updateCatalogItem(editing.id, {
              ...values,
              currency: editing.currency,
            });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setItems((prev) =>
              prev.map((i) =>
                i.id === editing.id ? { ...i, ...values } : i,
              ),
            );
            toast.success("Élément modifié");
          } else {
            const result = await createCatalogItem({
              ...values,
              currency: defaultCurrency,
            });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setItems((prev) => [
              {
                id: result.id!,
                currency: defaultCurrency,
                ...values,
              },
              ...prev,
            ]);
            toast.success("Élément ajouté");
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

function CatalogDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: CatalogItem | null;
  onSave: (values: Omit<CatalogItem, "id" | "currency">) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [unitPrice, setUnitPrice] = useState(item?.unitPrice ?? 0);
  const [taxRate, setTaxRate] = useState(item?.taxRate ?? 18);
  const [unit, setUnit] = useState(item?.unit ?? "forfait");
  const [kind, setKind] = useState<"service" | "product">(
    item?.kind ?? "service",
  );
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {item ? "Modifier l’élément" : "Nouvel élément"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await onSave({
                name: name.trim() || "Sans nom",
                description: description.trim(),
                unitPrice,
                taxRate,
                unit,
                kind,
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix unitaire</Label>
              <Input
                type="number"
                className="num"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>TVA %</Label>
              <Input
                type="number"
                className="num"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unité</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={kind}
                onValueChange={(v) => v && setKind(v as "service" | "product")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Prestation</SelectItem>
                  <SelectItem value="product">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-ledger text-paper hover:bg-ledger/90"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
