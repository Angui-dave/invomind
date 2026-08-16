import { listSuppliers } from "@/lib/dal/suppliers";
import { SuppliersPageClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();
  return <SuppliersPageClient initialSuppliers={suppliers} />;
}
