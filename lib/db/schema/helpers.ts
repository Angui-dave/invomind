import { sql, type SQL } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/** SQL expression matching the current transaction's organization_id GUC. */
export function orgMatch(column: AnyPgColumn): SQL {
  return sql`${column} = nullif(current_setting('app.organization_id', true), '')::uuid`;
}

/** Tenant isolation policy for tables with organization_id. */
export function tenantPolicy(organizationIdColumn: AnyPgColumn) {
  return pgPolicy("tenant_isolation", {
    as: "permissive",
    for: "all",
    to: "invomind_app",
    using: orgMatch(organizationIdColumn),
    withCheck: orgMatch(organizationIdColumn),
  });
}

/** Public portal access by document portal_token GUC. */
export function portalTokenPolicy(portalTokenColumn: AnyPgColumn) {
  return pgPolicy("portal_token_access", {
    as: "permissive",
    for: "select",
    to: "invomind_app",
    using: sql`${portalTokenColumn} = nullif(current_setting('app.portal_token', true), '')`,
  });
}
