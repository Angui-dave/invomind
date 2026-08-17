"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createExpense } from "@/lib/actions/expenses";
import type { Expense, ExpenseCategory } from "@/lib/data/expenses";
import type { Supplier } from "@/lib/data/suppliers";
import { calculateVat } from "@/lib/tax";
import { todayIso } from "@/lib/date";
import { formatDateFr, formatMoney } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/money";

type ExpensesPageClientProps = {
  initialExpenses: Expense[];
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  defaultCurrency: CurrencyCode;
};

export function ExpensesPageClient({
  initialExpenses,
  categories,
  suppliers,
  defaultCurrency,
}: ExpensesPageClientProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return expenses;
    return expenses.filter((e) => e.categoryId === categoryFilter);
  }, [expenses, categoryFilter]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  function categoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Dépenses
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Charges de l’entreprise ·{" "}
            <span className="num font-medium text-brick">
              {formatMoney(total, defaultCurrency)}
            </span>
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Nouvelle dépense
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={categoryFilter === "all" ? "default" : "outline"}
          className={
            categoryFilter === "all"
              ? "bg-ledger text-paper hover:bg-ledger/90"
              : ""
          }
          onClick={() => setCategoryFilter("all")}
        >
          Toutes
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            type="button"
            size="sm"
            variant={categoryFilter === cat.id ? "default" : "outline"}
            className={
              categoryFilter === cat.id
                ? "bg-ledger text-paper hover:bg-ledger/90"
                : ""
            }
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>TVA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="num">
                  {formatDateFr(expense.date)}
                </TableCell>
                <TableCell className="font-medium text-ink">
                  {expense.description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {categoryName(expense.categoryId)}
                  </Badge>
                </TableCell>
                <TableCell className="text-ink/70">
                  {expense.supplierName ?? "—"}
                </TableCell>
                <TableCell className="num text-right font-medium">
                  {formatMoney(expense.amount, expense.currency)}
                </TableCell>
                <TableCell>
                  {expense.taxDeductible ? (
                    <span className="num text-xs text-ledger">
                      {formatMoney(expense.taxAmount, expense.currency)}
                    </span>
                  ) : (
                    <span className="text-xs text-ink/40">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExpenseDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        suppliers={suppliers}
        defaultCurrency={defaultCurrency}
        onSave={async (values) => {
          const result = await createExpense(values);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          setExpenses((prev) => [
            {
              id: result.id!,
              ...values,
              supplierName:
                values.supplierName ??
                suppliers.find((s) => s.id === values.supplierId)?.company,
            },
            ...prev,
          ]);
          toast.success("Dépense enregistrée");
          setOpen(false);
        }}
      />
    </div>
  );
}

function ExpenseDialog({
  open,
  onOpenChange,
  onSave,
  categories,
  suppliers,
  defaultCurrency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (e: Omit<Expense, "id">) => Promise<void>;
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  defaultCurrency: CurrencyCode;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [supplierId, setSupplierId] = useState<string>("");
  const [taxRate, setTaxRate] = useState(18);
  const [taxDeductible, setTaxDeductible] = useState(true);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Nouvelle dépense</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!categoryId) {
              toast.error("Choisissez une catégorie");
              return;
            }
            const supplier = suppliers.find((s) => s.id === supplierId);
            const vat = calculateVat(amount, taxRate, "inclusive");
            setSaving(true);
            try {
              await onSave({
                date,
                description: description.trim() || "Dépense",
                amount,
                currency: defaultCurrency,
                categoryId,
                supplierId: supplier?.id,
                supplierName: supplier?.company,
                taxRate,
                taxDeductible,
                taxAmount: taxDeductible ? vat.vat : 0,
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Montant TTC</Label>
              <Input
                type="number"
                className="num"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => v && setCategoryId(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fournisseur</Label>
            <Select
              value={supplierId || "__none"}
              onValueChange={(v) =>
                setSupplierId(v === "__none" ? "" : (v ?? ""))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Optionnel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Aucun</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Taux TVA %</Label>
              <Input
                type="number"
                className="num"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={taxDeductible}
                  onCheckedChange={setTaxDeductible}
                />
                TVA déductible
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-line bg-muted/40 px-4 py-6 text-center">
            <p className="text-sm font-medium text-ink">Justificatif</p>
            <p className="mt-1 text-xs text-ink/55">
              Glissez un reçu PDF ou image ici — bientôt disponible.
            </p>
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
