import { assertAdminTenant } from "@/lib/rbac/guards";
import { BillingPlans } from "@/components/billing/billing-plans";
import { getCurrentOrganization } from "@/lib/dal/session";
import { getBillingHistory } from "@/lib/dal/settings";
import { PRICING_PLANS } from "@/lib/mock-data";

export default async function BillingPage() {
  await assertAdminTenant();
  const [{ session }, billingHistory] = await Promise.all([
    getCurrentOrganization(),
    getBillingHistory(),
  ]);

  const currentPlan =
    PRICING_PLANS.find((p) => p.id === session.organization.planId) ??
    PRICING_PLANS[0];

  return (
    <BillingPlans
      currentPlan={currentPlan}
      plans={PRICING_PLANS}
      billingHistory={billingHistory}
    />
  );
}
