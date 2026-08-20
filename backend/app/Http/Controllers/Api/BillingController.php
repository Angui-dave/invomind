<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\SubscriptionBillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(
        private SubscriptionBillingService $billing,
    ) {}

    public function changePlan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'string', 'in:free,pro,business'],
        ]);

        $plan = Plan::find($data['plan_id']);
        if (! $plan) {
            return response()->json(['message' => 'Plan inconnu.'], 422);
        }

        // Paid upgrades must go through CinetPay checkout — never self-serve mark as paid.
        if ((float) $plan->price > 0) {
            return response()->json([
                'message' => 'Les upgrades payants passent par CinetPay. Utilisez POST /billing/checkout.',
            ], 402);
        }

        $orgId = $this->orgId($request);
        $org = Organization::findOrFail($orgId);

        $org->update(['plan_id' => $plan->id]);

        $subscription = Subscription::firstOrCreate(
            ['organization_id' => $orgId],
            ['plan_id' => $plan->id, 'status' => 'active'],
        );

        $subscription->update([
            'plan_id' => $plan->id,
            'status' => 'active',
            'current_period_start' => now()->toIso8601String(),
            'current_period_end' => null,
        ]);

        return response()->json([
            'organization' => $org->fresh(['plan', 'subscription']),
            'message' => "Organisation passée au plan {$plan->id}",
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'string', 'in:pro,business'],
            'customer_phone' => ['nullable', 'string', 'max:32'],
            'method_hint' => ['sometimes', 'nullable', 'in:wave,orange_money,mtn,moov,card,transfer'],
        ]);

        $intent = $this->billing->createCheckout(
            $this->orgId($request),
            $data['plan_id'],
            [
                'customer_phone' => $data['customer_phone'] ?? null,
                'method_hint' => $data['method_hint'] ?? null,
            ],
        );

        return response()->json([
            'checkout_url' => $intent->checkout_url,
            'payment_intent' => $intent,
        ], 201);
    }

    public function cancel(Request $request): JsonResponse
    {
        $orgId = $this->orgId($request);
        $org = Organization::findOrFail($orgId);
        $free = Plan::find('free');

        if (! $free) {
            return response()->json(['message' => 'Plan free manquant.'], 500);
        }

        $org->update(['plan_id' => 'free']);

        Subscription::where('organization_id', $orgId)->update([
            'plan_id' => 'free',
            'status' => 'canceled',
            'current_period_end' => now()->toIso8601String(),
        ]);

        return response()->json([
            'organization' => $org->fresh(['plan', 'subscription']),
            'message' => 'Abonnement annulé — retour au plan Gratuit',
        ]);
    }
}
