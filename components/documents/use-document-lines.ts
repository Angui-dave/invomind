"use client";

import { useCallback, useState } from "react";
import type { CatalogItem } from "@/lib/data/catalog";
import { emptyLine, type DocumentLine } from "@/lib/documents";

export function isBlankLine(line: DocumentLine): boolean {
  return !line.description.trim() && line.unitPrice === 0;
}

export function useDocumentLines(initialLines: DocumentLine[]) {
  const [lines, setLines] = useState<DocumentLine[]>(initialLines);

  const updateLine = useCallback((id: string, patch: Partial<DocumentLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }, []);

  const addLine = useCallback((taxRate: number) => {
    setLines((prev) => [...prev, emptyLine(taxRate)]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const duplicateLine = useCallback((id: string) => {
    setLines((prev) => {
      const index = prev.findIndex((line) => line.id === id);
      if (index < 0) return prev;
      const copy: DocumentLine = {
        ...prev[index],
        id: `line_${Math.random().toString(36).slice(2, 8)}`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }, []);

  const moveLine = useCallback((id: string, direction: -1 | 1) => {
    setLines((prev) => {
      const index = prev.findIndex((line) => line.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }, []);

  const reorderLine = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setLines((prev) => {
      const from = prev.findIndex((line) => line.id === fromId);
      const to = prev.findIndex((line) => line.id === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const insertCatalogItems = useCallback(
    (items: CatalogItem[], taxRate: number) => {
      if (items.length === 0) return;
      const added: DocumentLine[] = items.map((item) => ({
        id: `line_${Math.random().toString(36).slice(2, 8)}`,
        description: item.description || item.name,
        quantity: 1,
        unitPrice: item.unitPrice,
        taxRate,
        catalogItemId: item.id,
        unit: item.unit,
      }));
      setLines((prev) => {
        const kept = prev.filter((line) => !isBlankLine(line));
        return [...kept, ...added];
      });
    },
    [],
  );

  const applyTaxRate = useCallback((taxRate: number) => {
    setLines((prev) => prev.map((line) => ({ ...line, taxRate })));
  }, []);

  const mapTaxRates = useCallback(
    (mapRate: (current: number) => number) => {
      setLines((prev) =>
        prev.map((line) => ({ ...line, taxRate: mapRate(line.taxRate) })),
      );
    },
    [],
  );

  return {
    lines,
    setLines,
    updateLine,
    addLine,
    removeLine,
    duplicateLine,
    moveLine,
    reorderLine,
    insertCatalogItems,
    applyTaxRate,
    mapTaxRates,
  };
}
