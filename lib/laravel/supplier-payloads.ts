/**
 * Map UI supplier fields to Laravel `fournisseurs` payload.
 */

export type LaravelSupplierInput = {
  name?: string;
  company: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
  notes?: string | null;
};

export function toLaravelSupplierBody(data: LaravelSupplierInput) {
  return {
    name_company: data.company.trim(),
    contact: data.name?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone || null,
    adresse: data.address || null,
    ville: data.city || null,
    country: data.country || null,
    numero_fiscal: data.taxId || null,
    notes: data.notes ?? null,
  };
}
