import { assertAdminTenant } from "@/lib/rbac/guards";
import { BillingPlans } from "@/components/billing/billing-plans";
import { getCurrentOrganization } from "@/lib/dal/session";
import { getBillingHistory } from "@/lib/dal/settings";
import { PRICING_PLANS } from "@/lib/data/settings";

type BillingPageProps = {
  searchParams: Promise<{ paid?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  await assertAdminTenant();
  const params = await searchParams;
  const [{ plan }, billingHistory] = await Promise.all([
    getCurrentOrganization(),
    getBillingHistory(),
  ]);

  const currentPlan = {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    priceLabel: plan.priceLabel,
    description: plan.description,
    features: plan.features,
    ...(plan.limitLabel ? { limitLabel: plan.limitLabel } : {}),
    ...(plan.highlighted ? { highlighted: plan.highlighted } : {}),
  };

  return (
    <div className="space-y-4">
      {params.paid === "1" ? (
        <p className="rounded-xl border border-brass/35 bg-brass/10 px-3 py-2 text-sm text-brass">
          Paiement reçu. Votre plan sera mis à jour dès confirmation CinetPay
          (quelques secondes). Rechargez la page si le plan n’a pas encore
          changé.
        </p>
      ) : null}
      <BillingPlans
        currentPlan={currentPlan}
        plans={PRICING_PLANS}
        billingHistory={billingHistory}
      />
    </div>
  );
}
