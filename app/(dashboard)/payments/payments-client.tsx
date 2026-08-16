"use client";

import { useMemo, useState } from "react";
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
import { createPayment } from "@/lib/actions/payments";
import {
  formatDateFr,
  formatMoney,
  PAYMENT_METHOD_LABELS,
  sumByCurrency,
  TODAY,
  type BusinessDocument,
  type CurrencyCode,
  type Payment,
  type PaymentMethod,
} from "@/lib/mock-data";

type UnpaidInvoice = BusinessDocument & { balanceDue: number };

type PaymentsPageClientProps = {
  initialPayments: Payment[];
  unpaidInvoices: UnpaidInvoice[];
  defaultCurrency: CurrencyCode;
};

export function PaymentsPageClient({
  initialPayments,
  unpaidInvoices,
  defaultCurrency,
}: PaymentsPageClientProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [open, setOpen] = useState(false);

  const totalsByCurrency = useMemo(
    () =>
      sumByCurrency(
        payments.map((p) => ({ amount: p.amount, currency: p.currency })),
      ),
    [payments],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Paiements
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Encaissements enregistrés ·{" "}
            {totalsByCurrency.map((row, i) => (
              <span key={row.currency} className="num text-brass font-medium">
                {i > 0 ? " · " : ""}
                {formatMoney(row.amount, row.currency)}
              </span>
            ))}
          </p>
        </div>
        <Button
          type="button"
          className="bg-ledger text-paper hover:bg-ledger/90"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Enregistrer un paiement
        </Button>
      </div>

      <div className="rounded-sm border border-line bg-paper">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Facture</TableHead>
              <TableHead>Moyen</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="num">
                  {formatDateFr(payment.paidAt)}
                </TableCell>
                <TableCell className="font-medium text-ink">
                  {payment.clientName}
                </TableCell>
                <TableCell className="num text-ink/70">
                  {payment.documentNumber}
                </TableCell>
                <TableCell className="text-ink/70">
                  {PAYMENT_METHOD_LABELS[payment.method]}
                  {payment.reference && (
                    <span className="num ml-1 text-xs text-ink/45">
                      ({payment.reference})
                    </span>
                  )}
                </TableCell>
                <TableCell className="num text-right font-medium text-brass">
                  {formatMoney(payment.amount, payment.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaymentDialog
        open={open}
        onOpenChange={setOpen}
        unpaid={unpaidInvoices}
        defaultCurrency={defaultCurrency}
        onSave={async (input) => {
          const result = await createPayment(input);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          const inv = unpaidInvoices.find((i) => i.id === input.documentId);
          if (inv) {
            setPayments((prev) => [
              {
                id: result.id!,
                documentId: inv.id,
                documentNumber: inv.number,
                clientId: inv.clientId,
                clientName: inv.clientName,
                amount: input.amount,
                currency: inv.currency,
                method: input.method as PaymentMethod,
                paidAt: input.paidAt ?? TODAY,
                reference: input.reference,
              },
              ...prev,
            ]);
          }
          toast.success("Paiement enregistré");
          setOpen(false);
        }}
      />
    </div>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  unpaid,
  defaultCurrency,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unpaid: UnpaidInvoice[];
  defaultCurrency: CurrencyCode;
  onSave: (input: {
    documentId: string;
    amount: number;
    method: string;
    paidAt?: string;
    reference?: string;
  }) => Promise<void>;
}) {
  const first = unpaid[0];
  const [documentId, setDocumentId] = useState(first?.id ?? "");
  const [amount, setAmount] = useState(first?.balanceDue ?? 0);
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(TODAY);

  const selected = unpaid.find((i) => i.id === documentId) ?? first;
  const due = selected?.balanceDue ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            Enregistrer un paiement
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const inv = unpaid.find((i) => i.id === documentId);
            if (!inv) {
              toast.error("Sélectionnez une facture");
              return;
            }
            const max = inv.balanceDue;
            if (amount <= 0 || amount > max + 0.01) {
              toast.error(
                `Le montant doit être entre 1 et ${formatMoney(max, inv.currency)}`,
              );
              return;
            }
            await onSave({
              documentId: inv.id,
              amount: Math.min(amount, max),
              method,
              paidAt,
              reference: reference || undefined,
            });
          }}
        >
          <div className="space-y-1.5">
            <Label>Facture</Label>
            <Select
              value={documentId}
              onValueChange={(v) => {
                if (!v) return;
                setDocumentId(v);
                const inv = unpaid.find((i) => i.id === v);
                if (inv) setAmount(inv.balanceDue);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {unpaid.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.number} — {inv.clientName} (reste{" "}
                    {formatMoney(inv.balanceDue, inv.currency)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Montant (max{" "}
                {formatMoney(due, selected?.currency ?? defaultCurrency)})
              </Label>
              <Input
                type="number"
                className="num"
                max={due}
                min={0}
                value={amount}
                onChange={(e) => {
                  const next = Number(e.target.value) || 0;
                  setAmount(Math.min(next, due));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Moyen de paiement</Label>
            <Select
              value={method}
              onValueChange={(v) => v && setMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                  (m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Référence</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex. WAVE-12345"
            />
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
