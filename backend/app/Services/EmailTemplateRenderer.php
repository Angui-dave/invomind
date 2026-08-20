<?php

namespace App\Services;

use App\Models\Document;
use App\Support\Money;

class EmailTemplateRenderer
{
    /**
     * @param  array<string, string>  $variables
     */
    public function interpolate(string $template, array $variables): string
    {
        $replacements = [];
        foreach ($variables as $key => $value) {
            $replacements['{{'.$key.'}}'] = $value;
        }

        return strtr($template, $replacements);
    }

    /**
     * @return array<string, string>
     */
    public function variablesForDocument(Document $document): array
    {
        $snapshot = $document->snapshot_json ?? [];
        $client = $snapshot['client'] ?? [];
        $org = $snapshot['organization'] ?? [];
        $meta = $snapshot['document'] ?? [];
        $currency = $meta['currency'] ?? $document->currency;
        $total = (string) ($meta['total'] ?? $document->total);
        $token = $meta['portal_token'] ?? $document->portal_token;

        return [
            'client' => (string) ($client['name'] ?? $document->client_name),
            'numero' => (string) ($meta['number'] ?? $document->number),
            'montant' => Money::format($total, $currency),
            'lien_paiement' => rtrim((string) config('services.frontend.url'), '/').'/f/'.$token,
            'societe' => (string) ($org['name'] ?? ''),
        ];
    }
}
