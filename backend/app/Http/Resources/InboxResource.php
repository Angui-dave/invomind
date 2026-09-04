<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Inbox */
class InboxResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $creds = $this->identifiants ?? [];

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'orga_id' => $this->orga_id,
            'canal' => $this->canal?->value ?? $this->canal,
            'nom' => $this->nom,
            'mode' => $this->mode?->value ?? $this->mode,
            'statut_connexion' => $this->statut_connexion?->value ?? $this->statut_connexion,
            'derniere_erreur' => $this->derniere_erreur,
            'actif' => $this->actif,
            'identifiants_masques' => [
                'phone_number_id' => $creds['phone_number_id'] ?? null,
                'waba_id' => $creds['waba_id'] ?? null,
                'page_id' => $creds['page_id'] ?? null,
                'ig_business_id' => $creds['ig_business_id'] ?? null,
                'external_id' => $creds['external_id'] ?? null,
                'has_access_token' => ! empty($creds['access_token']),
            ],
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
