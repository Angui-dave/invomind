<?php

namespace App\Services;

use App\Contracts\PspGateway;
use App\Exceptions\InvalidPspAmountException;
use App\Models\Organization;
use App\Models\PaymentIntent;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SubscriptionBillingService
{
    public function __construct(
        private PspGateway $gateway,
    ) {}

    /**
     * Start a prepaid 30-day SaaS checkout for Pro/Business.
     */
    public function createCheckout(string $organizationId, string $planId, array $options = []): PaymentIntent
    {
        $plan = Plan::find($planId);
        if (! $plan || (float) $plan->price <= 0) {
            throw new HttpException(422, 'Seuls les plans payants Pro et Business passent par CinetPay.');
        }

        $amount = bcadd((string) $plan->price, '0', 2);

        $intent = DB::transaction(function () use ($organizationId, $plan, $amount, $options) {
            $open = PaymentIntent::query()
                ->where('organization_id', $organizationId)
                ->where('purpose', PaymentIntent::PURPOSE_SAAS_PLAN)
                ->where('plan_id', $plan->id)
                ->whereIn('status', [PaymentIntent::STATUS_PENDING, PaymentIntent::STATUS_PROCESSING])
                ->where('amount', $amount)
                ->lockForUpdate()
                ->latest('created_at')
                ->first();

            if ($open) {
                $open->fill([
                    'method_hint' => $options['method_hint'] ?? $open->method_hint,
                    'customer_phone' => $options['customer_phone'] ?? $open->customer_phone,
                ])->save();

                return $open;
            }

            $attempt = PaymentIntent::query()
                ->where('organization_id', $organizationId)
                ->where('purpose', PaymentIntent::PURPOSE_SAAS_PLAN)
                ->count() + 1;

            return PaymentIntent::query()->create([
                'organization_id' => $organizationId,
                'document_id' => null,
                'purpose' => PaymentIntent::PURPOSE_SAAS_PLAN,
                'plan_id' => $plan->id,
                'amount' => $amount,
                'currency' => 'XOF',
                'provider' => PaymentIntent::PROVIDER_CINETPAY,
                'status' => PaymentIntent::STATUS_PENDING,
                'method_hint' => $options['method_hint'] ?? null,
                'customer_phone' => $options['customer_phone'] ?? null,
                'idempotency_key' => sprintf(
                    'saas:%s:%s:%s:%d',
                    $organizationId,
                    $plan->id,
                    $amount,
                    $attempt,
                ),
            ]);
        });

        return $this->ensureCheckout($intent);
    }

    private function ensureCheckout(PaymentIntent $intent): PaymentIntent
    {
        if (filled($intent->checkout_url)) {
            return $intent;
        }

        $result = $this->gateway->createCheckout($intent, null);

        $intent->update([
            'checkout_url' => $result->checkoutUrl,
            'provider_transaction_id' => $result->providerTransactionId ?: $intent->id,
            'status' => PaymentIntent::STATUS_PROCESSING,
            'raw_payload' => $result->raw,
        ]);

        return $intent->fresh();
    }

    /**
     * Apply a succeeded CinetPay webhook for a SaaS plan intent.
     *
     * @return array{activated: bool, organization: Organization}
     */
    public function applySucceededWebhook(
        string $provider,
        string $providerTransactionId,
        string $amount,
        array $payload,
        ?string $intentId = null,
    ): array {
        return DB::transaction(function () use ($provider, $providerTransactionId, $amount, $payload, $intentId) {
            $intent = PaymentIntent::query()
                ->where('purpose', PaymentIntent::PURPOSE_SAAS_PLAN)
                ->where('provider', $provider)
                ->where(function ($q) use ($providerTransactionId, $intentId) {
                    $q->where('provider_transaction_id', $providerTransactionId);
                    if ($intentId) {
                        $q->orWhere('id', $intentId);
                    }
                    if (preg_match('/^[0-9a-f-]{36}$/i', $providerTransactionId)) {
                        $q->orWhere('id', $providerTransactionId);
                    }
                })
                ->lockForUpdate()
                ->firstOrFail();

            $org = Organization::query()->lockForUpdate()->findOrFail($intent->organization_id);

            if ($intent->status === PaymentIntent::STATUS_SUCCEEDED) {
                return ['activated' => false, 'organization' => $org];
            }

            if (bccomp((string) $intent->amount, $amount, 2) !== 0) {
                throw new InvalidPspAmountException;
            }

            $plan = Plan::findOrFail($intent->plan_id);

            $intent->update([
                'provider' => $provider,
                'provider_transaction_id' => $providerTransactionId,
                'status' => PaymentIntent::STATUS_SUCCEEDED,
                'raw_payload' => $payload,
                'paid_at' => now(),
            ]);

            $periodStart = now();
            $periodEnd = now()->addDays(30);

            $org->update(['plan_id' => $plan->id]);

            $subscription = Subscription::firstOrCreate(
                ['organization_id' => $org->id],
                ['plan_id' => $plan->id, 'status' => 'active'],
            );

            $subscription->update([
                'plan_id' => $plan->id,
                'status' => 'active',
                'current_period_start' => $periodStart->toIso8601String(),
                'current_period_end' => $periodEnd->toIso8601String(),
            ]);

            SubscriptionInvoice::query()->create([
                'organization_id' => $org->id,
                'payment_intent_id' => $intent->id,
                'date' => $periodStart->toDateString(),
                'description' => 'Abonnement '.$plan->name.' — 30 jours',
                'amount' => $intent->amount,
                'currency' => $intent->currency,
                'status' => 'paid',
                'provider' => $provider,
                'provider_transaction_id' => $providerTransactionId,
            ]);

            return ['activated' => true, 'organization' => $org->fresh(['plan', 'subscription'])];
        });
    }

    /**
     * Downgrade orgs whose prepaid period has ended.
     */
    public function expireOverdue(): int
    {
        $count = 0;
        $now = now()->toIso8601String();

        Subscription::query()
            ->where('status', 'active')
            ->whereNotNull('current_period_end')
            ->where('current_period_end', '<', $now)
            ->where('plan_id', '!=', 'free')
            ->orderBy('id')
            ->chunkById(50, function ($subs) use (&$count) {
                foreach ($subs as $sub) {
                    DB::transaction(function () use ($sub, &$count) {
                        $locked = Subscription::query()->lockForUpdate()->find($sub->id);
                        if (! $locked || $locked->plan_id === 'free') {
                            return;
                        }
                        if ($locked->current_period_end && $locked->current_period_end >= now()->toIso8601String()) {
                            return;
                        }

                        $locked->update([
                            'plan_id' => 'free',
                            'status' => 'expired',
                        ]);

                        Organization::query()
                            ->where('id', $locked->organization_id)
                            ->update(['plan_id' => 'free']);

                        $count++;
                    });
                }
            });

        return $count;
    }
}
