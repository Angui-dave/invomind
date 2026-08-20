/**
 * Seeds plans + demo organization "Atelier Diallo".
 * Run: npm run db:seed (requires DATABASE_URL_OWNER)
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../lib/db/schema";
import { DEFAULT_EMAIL_TEMPLATES } from "../lib/billing/entitlements";

const DEMO_EMAIL = "lea@atelier-diallo.sn";
const DEMO_PASSWORD = "password123";

async function main() {
  const url =
    process.env.DATABASE_URL_OWNER ??
    process.env.DATABASE_URL ??
    "postgresql://invomind_owner:invomind_owner@localhost:5432/invomind";

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding plans…");
  await db
    .insert(schema.plans)
    .values([
      {
        id: "free",
        name: "Gratuit",
        price: 0,
        priceLabel: "0 F CFA",
        description: "Pour démarrer et tester le registre.",
        features: [
          "3 factures par mois",
          "Jusqu’à 5 clients",
          "Portail client",
          "Relances manuelles",
        ],
        limitLabel: "3 factures/mois",
        highlighted: false,
        maxInvoicesPerMonth: 3,
        maxClients: 5,
        autoReminders: false,
        onlinePayments: false,
        pipeline: false,
        conversations: false,
        reports: true,
      },
      {
        id: "pro",
        name: "Pro",
        price: 12_000,
        priceLabel: "12 000 F CFA",
        description: "Facturation illimitée, relances et paiement en ligne.",
        features: [
          "Factures et devis illimités",
          "Clients illimités",
          "Relances automatiques",
          "Paiement Mobile Money",
          "Pipeline prospects",
          "Rapports TVA",
        ],
        highlighted: true,
        maxInvoicesPerMonth: null,
        maxClients: null,
        autoReminders: true,
        onlinePayments: true,
        pipeline: true,
        conversations: true,
        reports: true,
      },
    ])
    .onConflictDoNothing();

  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_EMAIL))
    .limit(1);

  if (existingUser) {
    console.log("Demo user already exists — skipping org seed.");
    await client.end();
    return;
  }

  console.log("Seeding demo organization…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "Atelier Diallo",
      slug: "atelier-diallo-demo",
      planId: "pro",
    })
    .returning();

  const [user] = await db
    .insert(schema.users)
    .values({
      name: "Léa Diallo",
      email: DEMO_EMAIL,
      passwordHash,
    })
    .returning();

  await db.insert(schema.memberships).values({
    organizationId: org.id,
    userId: user.id,
    role: "owner",
  });

  await db.insert(schema.organizationSettings).values({
    organizationId: org.id,
    companyName: "Atelier Diallo",
    email: "contact@atelier-diallo.sn",
    phone: "+221 77 000 11 22",
    address: "Rue 10, Sacré-Cœur 3",
    city: "Dakar",
    postalCode: "BP 15000",
    country: "SN",
    taxId: "SN998877665",
    defaultCurrency: "XOF",
    defaultTaxMode: "exclusive",
    defaultTaxRate: 18,
    bankName: "CBAO Groupe Attijariwafa Bank",
    iban: "SN08 SN01 0012 3456 7890 1234 5678",
    bic: "CBAOSNDA",
    mobileMoneyProvider: "wave",
    mobileMoneyNumber: "+221 77 000 11 22",
    legalMentions:
      "SARL au capital de 1 000 000 F CFA — NINEA SN998877665 — RCCM SN-DKR-2020-B-1234",
    paymentConnected: true,
  });

  await db.insert(schema.organizationBranding).values({
    organizationId: org.id,
    displayName: "Atelier Diallo",
    primaryColor: "#2563eb",
    accentColor: "#10b981",
  });

  await db.insert(schema.organizationFeatures).values({
    organizationId: org.id,
  });

  await db.insert(schema.subscriptions).values({
    organizationId: org.id,
    planId: "pro",
    status: "active",
  });

  await db.insert(schema.emailTemplates).values(
    DEFAULT_EMAIL_TEMPLATES.map((t) => ({
      organizationId: org.id,
      channel: "email",
      event: `reminder_${t.milestone}`,
      label: t.label,
      subject: t.subject,
      body: t.body,
    })),
  );

  await db.insert(schema.subscriptionInvoices).values([
    {
      organizationId: org.id,
      date: "2026-08-01",
      description: "Abonnement Pro — août 2026",
      amount: "12000",
      currency: "XOF",
      status: "paid",
    },
    {
      organizationId: org.id,
      date: "2026-07-01",
      description: "Abonnement Pro — juillet 2026",
      amount: "12000",
      currency: "XOF",
      status: "paid",
    },
  ]);

  await db.insert(schema.webhookConfigs).values({
    organizationId: org.id,
    url: process.env.CONVERSATIONS_WEBHOOK_URL ?? "",
    secret: process.env.CONVERSATIONS_WEBHOOK_SECRET ?? "",
    enabled: Boolean(process.env.CONVERSATIONS_WEBHOOK_URL),
  });

  // Sample clients
  const clientRows = await db
    .insert(schema.clients)
    .values([
      {
        organizationId: org.id,
        name: "Aminata Diallo",
        company: "Diallo & Fils SARL",
        email: "aminata@diallo-fils.sn",
        phone: "+221 77 123 45 67",
        city: "Dakar",
        country: "SN",
        currency: "XOF",
        paymentTermDays: 30,
        remindersEnabled: true,
        portalToken: "cli-aminata-diallo",
      },
      {
        organizationId: org.id,
        name: "Kofi Mensah",
        company: "Mensah Digital",
        email: "kofi@mensah-digital.ci",
        phone: "+225 07 00 11 22 33",
        city: "Abidjan",
        country: "CI",
        currency: "XOF",
        paymentTermDays: 15,
        remindersEnabled: true,
        portalToken: "cli-kofi-mensah",
      },
    ])
    .returning();

  const [cli1, cli2] = clientRows;

  await db.insert(schema.expenseCategories).values([
    { organizationId: org.id, name: "Loyer", color: "#16213E" },
    { organizationId: org.id, name: "Logiciels", color: "#2F6E5B" },
    { organizationId: org.id, name: "Transport", color: "#B08D57" },
  ]);

  await db.insert(schema.catalogItems).values([
    {
      organizationId: org.id,
      name: "Conception site web",
      description: "Design et développement",
      unitPrice: "850000",
      currency: "XOF",
      taxRate: "18",
      unit: "forfait",
      kind: "service",
    },
    {
      organizationId: org.id,
      name: "Maintenance mensuelle",
      description: "Support et mises à jour",
      unitPrice: "150000",
      currency: "XOF",
      taxRate: "18",
      unit: "mois",
      kind: "service",
    },
  ]);

  const issueDate = new Date().toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 30);
  const dueDate = due.toISOString().slice(0, 10);

  const [inv] = await db
    .insert(schema.documents)
    .values({
      organizationId: org.id,
      kind: "invoice",
      number: `FAC-${new Date().getFullYear()}-001`,
      clientId: cli1.id,
      clientName: cli1.name,
      status: "sent",
      currency: "XOF",
      taxMode: "exclusive",
      issueDate,
      dueDate,
      total: "1003000",
      subtotalHt: "850000",
      taxTotal: "153000",
      onlinePaymentEnabled: true,
      remindersEnabled: true,
      portalToken: `pt_demo_${org.id.slice(0, 8)}`,
    })
    .returning();

  await db.insert(schema.documentLines).values({
    organizationId: org.id,
    documentId: inv.id,
    description: "Conception site web",
    quantity: "1",
    unitPrice: "850000",
    taxRate: "18",
    position: 0,
  });

  await db.insert(schema.prospects).values([
    {
      organizationId: org.id,
      name: "Marie Dupont",
      company: "Boulangerie Dupont",
      estimatedValue: "400000",
      stage: "nouveau",
      lastInteractionAt: issueDate,
    },
    {
      organizationId: org.id,
      name: "Karim Benali",
      company: "Benali Tech",
      estimatedValue: "1800000",
      stage: "qualifie",
      lastInteractionAt: issueDate,
    },
  ]);

  console.log("Demo credentials:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  portal:   /f/${inv.portalToken}`);

  await client.end();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
