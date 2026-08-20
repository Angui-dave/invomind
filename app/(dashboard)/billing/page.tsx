import { assertAdminTenant } from "@/lib/rbac/guards";
import { BillingPlans } from "@/components/billing/billing-plans";
import { getCurrentOrganization } from "@/lib/dal/session";
import { getBillingHistory } from "@/lib/dal/settings";
import { PRICING_PLANS } from "@/lib/data/settings";

export default async function BillingPage() {
  await assertAdminTenant();
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
    <BillingPlans
      currentPlan={currentPlan}
      plans={PRICING_PLANS}
      billingHistory={billingHistory}
    />
  );
}
