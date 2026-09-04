<?php

namespace App\Http\Controllers\Api;

use App\Enums\AbonnementStatut;
use App\Enums\ModePaiement;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BillingController extends Controller
{
    public function changePlan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_code' => ['required', 'string', 'in:gratuit,pro,business'],
        ]);

        $plan = Plan::query()->where('code', $data['plan_code'])->first();
        if (! $plan) {
            return response()->json(['message' => 'Plan inconnu.'], 422);
        }

        if ((float) $plan->prix_mensuel > 0) {
            return response()->json([
                'message' => 'Les upgrades payants passent par CinetPay. Utilisez POST /billing/checkout.',
            ], 402);
        }

        $orgaId = $this->orgId($request);

        $subscription = Subscription::query()->firstOrCreate(
            ['orga_id' => $orgaId],
            [
                'plan_id' => $plan->id,
                'date_debut' => now()->toDateString(),
                'statut' => AbonnementStatut::EnCours,
                'renouvellement_auto' => true,
            ],
        );

        $subscription->update([
            'plan_id' => $plan->id,
            'statut' => AbonnementStatut::EnCours,
            'date_fin' => null,
        ]);

        return response()->json([
            'subscription' => $subscription->fresh('plan'),
            'message' => "Organisation passée au plan {$plan->code}",
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_code' => ['required', 'string', 'in:pro,business'],
        ]);

        $plan = Plan::query()->where('code', $data['plan_code'])->where('actif', true)->first();
        if (! $plan) {
            return response()->json([
                'message' => "Plan « {$data['plan_code']} » introuvable. Exécutez : php artisan db:seed --class=PlanSeeder",
            ], 422);
        }

        if (! $this->shouldSimulateCheckout()) {
            return response()->json([
                'message' => 'Checkout CinetPay SaaS à reconnecter (paiements_abonnement).',
                'plan' => $plan,
            ], 501);
        }

        $orgaId = $this->orgId($request);
        $reference = 'SIM-'.strtoupper(Str::random(12));

        [$subscription, $payment] = DB::transaction(function () use ($orgaId, $plan, $reference) {
            $subscription = Subscription::query()->firstOrCreate(
                ['orga_id' => $orgaId],
                [
                    'plan_id' => $plan->id,
                    'date_debut' => now()->toDateString(),
                    'statut' => AbonnementStatut::EnCours,
                    'renouvellement_auto' => true,
                ],
            );

            $subscription->update([
                'plan_id' => $plan->id,
                'date_debut' => now()->toDateString(),
                'date_fin' => now()->addDays(30)->toDateString(),
                'statut' => AbonnementStatut::EnCours,
                'renouvellement_auto' => true,
            ]);

            $payment = SubscriptionPayment::query()->create([
                'orga_id' => $orgaId,
                'abonnement_id' => $subscription->id,
                'montant' => $plan->prix_mensuel,
                'devise' => $plan->devise ?? 'XOF',
                'mode_paiement' => ModePaiement::OrangeMoney,
                'reference_payement' => $reference,
                'date_payement' => now(),
                'statut' => 'reussi',
            ]);

            return [$subscription->fresh('plan'), $payment];
        });

        return response()->json([
            'simulated' => true,
            'checkout_url' => null,
            'message' => "Paiement simulé — plan {$plan->nom} activé pour 30 jours.",
            'subscription' => $subscription,
            'payment' => [
                'id' => $payment->id,
                'reference' => $payment->reference_payement,
                'montant' => $payment->montant,
                'devise' => $payment->devise,
                'statut' => $payment->statut,
            ],
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $orgaId = $this->orgId($request);
        $gratuit = Plan::query()->where('code', 'gratuit')->first();
        if (! $gratuit) {
            return response()->json([
                'message' => 'Plan gratuit introuvable. Exécutez : php artisan db:seed --class=PlanSeeder',
            ], 422);
        }

        Subscription::query()->where('orga_id', $orgaId)->update([
            'plan_id' => $gratuit->id,
            'statut' => AbonnementStatut::Annule,
            'date_fin' => now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Abonnement annulé, retour au plan gratuit.',
        ]);
    }

    /**
     * Local / sandbox simulation until real CinetPay SaaS checkout is wired.
     */
    private function shouldSimulateCheckout(): bool
    {
        if (filter_var(config('services.cinetpay.simulate'), FILTER_VALIDATE_BOOLEAN)) {
            return true;
        }

        // No API credentials → simulate instead of 501 in local/dev.
        return empty(config('services.cinetpay.api_key'))
            && app()->environment(['local', 'testing']);
    }
}
