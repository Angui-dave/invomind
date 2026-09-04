<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Organization
 */
class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'uuid' => $this->uuid,
            'name_company' => $this->name_company,
            'full_name' => $this->full_name,
            'logo_url' => $this->logo_url,
            'email' => $this->email,
            'phone' => $this->phone,
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'code_postal' => $this->code_postal,
            'pays' => $this->pays,
            'devise_defaut' => $this->devise_defaut,
            'subscription' => $this->whenLoaded('subscription', function () {
                return [
                    'id' => $this->subscription->id,
                    'plan_id' => $this->subscription->plan_id,
                    'plan_code' => $this->subscription->plan?->code,
                    'statut' => $this->subscription->statut?->value ?? $this->subscription->statut,
                    'date_debut' => $this->subscription->date_debut,
                    'date_fin' => $this->subscription->date_fin,
                ];
            }),
            'subscription_invoices' => $this->when(
                $this->relationLoaded('subscription') && $this->subscription?->relationLoaded('payments'),
                function () {
                    return $this->subscription->payments
                        ->sortByDesc('date_payement')
                        ->values()
                        ->map(function ($payment) {
                            $planName = $this->subscription->plan?->nom ?? 'Abonnement';

                            return [
                                'id' => (string) $payment->id,
                                'date' => optional($payment->date_payement)->toDateString()
                                    ?? optional($payment->created_at)->toDateString(),
                                'description' => "Abonnement {$planName}"
                                    .($payment->reference_payement ? " ({$payment->reference_payement})" : ''),
                                'amount' => (float) $payment->montant,
                                'currency' => $payment->devise ?? 'XOF',
                                'status' => $payment->statut === 'reussi' ? 'paid' : 'open',
                            ];
                        })
                        ->all();
                },
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
