<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Organization
 */
class OrganizationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'plan_id' => $this->plan_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'settings' => $this->whenLoaded('settings'),
            'branding' => $this->whenLoaded('branding'),
            'features' => $this->whenLoaded('features'),
            'plan' => $this->whenLoaded('plan'),
            'subscription' => $this->whenLoaded('subscription'),
            'subscription_invoices' => $this->whenLoaded('subscriptionInvoices'),
        ];
    }
}
