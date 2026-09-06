"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { PageEmptyState } from "@/components/dashboard/page-empty-state";
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
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import { createExpenseCategory } from "@/lib/actions/expense-categories";
import type { Expense, ExpenseCategory } from "@/lib/data/expenses";
import { isValidatedExpense } from "@/lib/data/derive";
import type { Supplier } from "@/lib/data/suppliers";
import { calculateVat } from "@/lib/tax";
import { todayIso } from "@/lib/date";
import { formatDateFr } from "@/lib/formatters";
import { formatMoney, type CurrencyCode } from "@/lib/money";

function supplierLabel(s: Pick<Supplier, "company" | "name">): string {
  return (s.company || s.name || "").trim() || "Fournisseur";
}

/** Formulaire dépense : `amount` = TTC saisi (converti en HT à l’enregistrement). */
type ExpenseFormValues = {
  date: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  supplierId?: string | null;
  supplierName?: string | null;
  taxRate: number;
  taxDeductible: boolean;
  taxAmount: number;
  notes?: string | null;
  paymentMethod?: string | null;
};

type ExpensesPageClientProps = {
  initialExpenses: Expense[];
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  defaultCurrency: CurrencyCode;
};

export function ExpensesPageClient({
  initialExpenses,
  categories: initialCategories,
  suppliers,
  defaultCurrency,
}: ExpensesPageClientProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [categories, setCategories] =
    useState<ExpenseCategory[]>(initialCategories);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return expenses;
    return expenses.filter((e) => e.categoryId === categoryFilter);
  }, [expenses, categoryFilter]);

  const total = useMemo(
    () =>
      filtered
        .filter(isValidatedExpense)
        .reduce((s, e) => s + e.amountTtc, 0),
    [filtered],
  );

  function categoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/60">
          Charges de l’entreprise ·{" "}
          <span className="num font-medium text-brick">
            {formatMoney(total, defaultCurrency)}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setCategoryDialogOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            Nouvelle catégorie
          </Button>
          <Button
            type="button"
            className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Nouvelle dépense
          </Button>
        </div>
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
            key={cat.id || cat.name}
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

      {expenses.length === 0 ? (
        <PageEmptyState
          icon={Receipt}
          title="Aucune dépense"
          description="Créez votre première charge pour suivre les coûts de l’entreprise."
          action={
            <Button
              type="button"
              className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Nouvelle dépense
            </Button>
          }
        />
      ) : (
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-ink/55"
                >
                  Aucune dépense ne correspond à ces critères.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setEditing(expense);
                    setOpen(true);
                  }}
                >
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
                    {formatMoney(expense.amountTtc, expense.currency)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <ExpenseDialog
        open={open}
        onOpenChange={setOpen}
        expense={editing}
        categories={categories}
        suppliers={suppliers}
        defaultCurrency={defaultCurrency}
        pendingCategoryId={pendingCategoryId}
        onPendingCategoryConsumed={() => setPendingCategoryId(null)}
        onRequestNewCategory={() => setCategoryDialogOpen(true)}
        onSave={async (values) => {
          const resolvedSupplierName =
            values.supplierName ??
            (() => {
              const match = suppliers.find((s) => s.id === values.supplierId);
              return match ? supplierLabel(match) : undefined;
            })();
          const vat = calculateVat(values.amount, values.taxRate, "inclusive");
          const expenseAmounts = {
            amountHt: vat.ht,
            amountTtc: values.amount,
            taxAmount: values.taxDeductible ? vat.vat : 0,
          };
          if (editing) {
            const result = await updateExpense(editing.id, values);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setExpenses((prev) =>
              prev.map((e) =>
                e.id === editing.id
                  ? {
                      ...e,
                      date: values.date,
                      description: values.description,
                      currency: values.currency as CurrencyCode,
                      categoryId: values.categoryId,
                      supplierId: values.supplierId ?? undefined,
                      supplierName: resolvedSupplierName,
                      taxRate: values.taxRate,
                      taxDeductible: values.taxDeductible,
                      notes: values.notes ?? undefined,
                      paymentMethod: values.paymentMethod ?? undefined,
                      statut: e.statut ?? "validee",
                      ...expenseAmounts,
                    }
                  : e,
              ),
            );
            toast.success("Dépense modifiée");
            router.refresh();
          } else {
            const result = await createExpense(values);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setExpenses((prev) => [
              {
                id: result.id!,
                date: values.date,
                description: values.description,
                currency: values.currency as CurrencyCode,
                categoryId: values.categoryId,
                supplierId: values.supplierId ?? undefined,
                supplierName: resolvedSupplierName,
                taxRate: values.taxRate,
                taxDeductible: values.taxDeductible,
                notes: values.notes ?? undefined,
                paymentMethod: values.paymentMethod ?? undefined,
                statut: "validee",
                ...expenseAmounts,
              },
              ...prev,
            ]);
            toast.success("Dépense enregistrée");
            router.refresh();
          }
          setOpen(false);
        }}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSave={async (values) => {
          const result = await createExpenseCategory(values);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          if (result.category) {
            setCategories((prev) => [...prev, result.category!]);
            setPendingCategoryId(result.category.id);
          }
          toast.success("Catégorie ajoutée");
          setCategoryDialogOpen(false);
        }}
      />
    </div>
  );
}

function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSave,
  categories,
  suppliers,
  defaultCurrency,
  pendingCategoryId,
  onPendingCategoryConsumed,
  onRequestNewCategory,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense: Expense | null;
  onSave: (e: ExpenseFormValues) => Promise<void>;
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  defaultCurrency: CurrencyCode;
  pendingCategoryId: string | null;
  onPendingCategoryConsumed: () => void;
  onRequestNewCategory: () => void;
}) {
  const formKey = open ? `${expense?.id ?? "new"}` : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {expense ? "Modifier la dépense" : "Nouvelle dépense"}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <ExpenseForm
            key={formKey}
            expense={expense}
            categories={categories}
            suppliers={suppliers}
            defaultCurrency={defaultCurrency}
            pendingCategoryId={pendingCategoryId}
            onPendingCategoryConsumed={onPendingCategoryConsumed}
            onRequestNewCategory={onRequestNewCategory}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({
  expense,
  categories,
  suppliers,
  defaultCurrency,
  pendingCategoryId,
  onPendingCategoryConsumed,
  onRequestNewCategory,
  onCancel,
  onSave,
}: {
  expense: Expense | null;
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  defaultCurrency: CurrencyCode;
  pendingCategoryId: string | null;
  onPendingCategoryConsumed: () => void;
  onRequestNewCategory: () => void;
  onCancel: () => void;
  onSave: (e: ExpenseFormValues) => Promise<void>;
}) {
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amountTtc ?? 0);
  const [date, setDate] = useState(expense?.date ?? todayIso());
  const [categoryId, setCategoryId] = useState(
    expense?.categoryId ?? categories[0]?.id ?? "",
  );
  const [supplierId, setSupplierId] = useState<string>(
    expense?.supplierId ?? "",
  );
  const [taxRate, setTaxRate] = useState(expense?.taxRate ?? 18);
  const [taxDeductible, setTaxDeductible] = useState(
    expense?.taxDeductible ?? true,
  );
  const [saving, setSaving] = useState(false);

  const categoryItems = useMemo(
    () =>
      categories
        .filter((c) => c.id && c.name)
        .map((c) => ({ value: String(c.id), label: c.name })),
    [categories],
  );

  const supplierItems = useMemo(
    () => [
      { value: "__none", label: "Aucun fournisseur" },
      ...suppliers
        .filter((s) => s.id)
        .map((s) => ({
          value: String(s.id),
          label: supplierLabel(s),
        })),
    ],
    [suppliers],
  );

  useEffect(() => {
    if (pendingCategoryId && categories.some((c) => c.id === pendingCategoryId)) {
      setCategoryId(pendingCategoryId);
      onPendingCategoryConsumed();
      return;
    }
    if (!categoryId && categories[0]?.id) {
      setCategoryId(String(categories[0].id));
    }
  }, [
    pendingCategoryId,
    categories,
    categoryId,
    onPendingCategoryConsumed,
  ]);

  const selectedCategoryLabel =
    categoryItems.find((c) => c.value === categoryId)?.label ?? null;
  const selectedSupplierLabel =
    supplierItems.find((s) => s.value === (supplierId || "__none"))?.label ??
    null;

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (categories.length === 0) {
          toast.error("Créez d’abord une catégorie de dépense");
          onRequestNewCategory();
          return;
        }
        if (!categoryId) {
          toast.error("Choisissez une catégorie");
          return;
        }
        const supplier = suppliers.find((s) => String(s.id) === supplierId);
        const vat = calculateVat(amount, taxRate, "inclusive");
        setSaving(true);
        try {
          await onSave({
            date,
            description: description.trim() || "Dépense",
            amount,
            currency: expense?.currency ?? defaultCurrency,
            categoryId: String(categoryId),
            supplierId: supplier?.id,
            supplierName: supplier ? supplierLabel(supplier) : undefined,
            taxRate,
            taxDeductible,
            taxAmount: taxDeductible ? vat.vat : 0,
            notes: expense?.notes,
            paymentMethod: expense?.paymentMethod,
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
        <div className="flex items-center justify-between gap-2">
          <Label>Catégorie</Label>
          <button
            type="button"
            className="text-xs font-medium text-ledger hover:underline"
            onClick={onRequestNewCategory}
          >
            + Nouvelle
          </button>
        </div>
        {categoryItems.length === 0 ? (
          <button
            type="button"
            onClick={onRequestNewCategory}
            className="flex w-full items-center justify-center rounded-lg border border-dashed border-line bg-muted/40 px-3 py-3 text-sm text-ink/65 hover:border-ledger/40 hover:text-ledger"
          >
            Aucune catégorie — cliquez pour en créer une
          </button>
        ) : (
          <Select
            items={categoryItems}
            value={categoryId || null}
            onValueChange={(v) => {
              if (typeof v === "string" && v.length > 0) setCategoryId(v);
            }}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Choisir une catégorie">
                {() => selectedCategoryLabel ?? "Choisir une catégorie"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {categoryItems.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Fournisseur</Label>
        <Select
          items={supplierItems}
          value={supplierId || "__none"}
          onValueChange={(v) => {
            if (v == null || v === "__none") {
              setSupplierId("");
              return;
            }
            if (typeof v === "string") setSupplierId(v);
          }}
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="Aucun fournisseur">
              {() => selectedSupplierLabel ?? "Aucun fournisseur"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {supplierItems.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {suppliers.length === 0 ? (
          <p className="text-xs text-ink/50">
            Aucun fournisseur enregistré — optionnel, ou ajoutez-en dans
            Fournisseurs.
          </p>
        ) : null}
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={saving || categories.length === 0}
          className="bg-ledger text-paper hover:bg-ledger/90"
        >
          Enregistrer
        </Button>
      </DialogFooter>
    </form>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (v: { name: string; color: string }) => Promise<void>;
}) {
  const formKey = open ? "open" : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Nouvelle catégorie</DialogTitle>
        </DialogHeader>
        {open && (
          <CategoryForm
            key={formKey}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (v: { name: string; color: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2F6E5B");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) {
          toast.error("Indiquez un nom de catégorie");
          return;
        }
        setSaving(true);
        try {
          await onSave({ name: name.trim(), color });
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
          placeholder="Ex. Assurances"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Couleur</Label>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            className="h-10 w-14 cursor-pointer p-1"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="num font-mono uppercase"
            maxLength={7}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-ledger text-paper hover:bg-ledger/90"
        >
          Ajouter
        </Button>
      </DialogFooter>
    </form>
  );
}
