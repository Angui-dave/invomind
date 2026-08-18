"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CatalogItem } from "@/lib/data/catalog";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type CatalogPickerProps = {
  open: boolean;
  items: CatalogItem[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (items: CatalogItem[]) => void;
};

export function CatalogPicker({
  open,
  items,
  onOpenChange,
  onConfirm,
}: CatalogPickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.name, item.description, item.unit]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [items, query]);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((itemId) => itemId !== id),
    );
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setSelected([]);
    }
  }

  function handleConfirm() {
    const chosen = items.filter((item) => selected.includes(item.id));
    onConfirm(chosen);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Catalogue</DialogTitle>
          <DialogDescription>
            Sélectionnez une ou plusieurs prestations à ajouter au devis.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/40"
            aria-hidden
          />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Rechercher une prestation"
              className="pl-8"
            />
        </div>
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-ink/50">
              {items.length === 0
                ? "Aucune prestation dans le catalogue"
                : "Aucun résultat"}
            </li>
          ) : (
            filtered.map((item) => {
              const checked = selected.includes(item.id);
              return (
                <li key={item.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-ledger hover:bg-muted/60",
                      checked && "bg-ledger/8",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggle(item.id, value === true)
                      }
                      aria-label={`Sélectionner ${item.name}`}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-ink">{item.name}</span>
                        <span className="num shrink-0 text-xs text-brass">
                          {formatMoney(item.unitPrice, item.currency)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-ink/50">
                        {item.unit}
                        {item.description ? ` · ${item.description}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            disabled={selected.length === 0}
            onClick={handleConfirm}
          >
            Ajouter ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
