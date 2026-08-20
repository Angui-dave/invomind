<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Document
 */
class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'kind' => $this->kind,
            'number' => $this->number,
            'client_id' => $this->client_id,
            'client_name' => $this->client_name,
            'status' => $this->status,
            'currency' => $this->currency,
            'tax_mode' => $this->tax_mode,
            'issue_date' => $this->issue_date,
            'due_date' => $this->due_date,
            'total' => $this->total,
            'subtotal_ht' => $this->subtotal_ht,
            'tax_total' => $this->tax_total,
            'online_payment_enabled' => $this->online_payment_enabled,
            'paid_online_at' => $this->paid_online_at,
            'payment_method' => $this->payment_method,
            'reminders_enabled' => $this->reminders_enabled,
            'portal_token' => $this->portal_token,
            'portal_url' => rtrim((string) config('services.frontend.url'), '/').'/f/'.$this->portal_token,
            'source_document_id' => $this->source_document_id,
            'notes' => $this->notes,
            'issued_at' => $this->issued_at,
            'issued_by_user_id' => $this->issued_by_user_id,
            'frozen' => $this->frozen,
            'fiscal_year' => $this->fiscal_year,
            'pdf_ready' => $this->pdf_ready,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'lines' => $this->whenLoaded('lines'),
            'reminders' => $this->whenLoaded('reminders'),
            'payments' => $this->whenLoaded('payments'),
            'client' => $this->whenLoaded('client'),
        ];
    }
}
