<?php

namespace App\Services\Messagerie;

use App\Enums\CategorieModeleMessage;
use App\Enums\StatutApprobationModele;
use App\Models\Inbox;
use App\Models\MessageTemplate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TemplateService
{
    /**
     * Sync WhatsApp message templates from Meta Graph API.
     *
     * @return list<MessageTemplate>
     */
    public function syncFromMeta(Inbox $inbox): array
    {
        $creds = $inbox->identifiants ?? [];
        $token = (string) ($creds['access_token'] ?? '');
        $wabaId = (string) ($creds['waba_id'] ?? '');

        if ($token === '' || $wabaId === '') {
            abort(422, 'Identifiants WhatsApp incomplets (access_token, waba_id) pour synchroniser les modèles.');
        }

        $url = $this->graphUrl("{$wabaId}/message_templates");
        $response = Http::withToken($token)->timeout(30)->get($url, [
            'limit' => 100,
            'fields' => 'id,name,language,status,category,components',
        ]);

        if (! $response->successful()) {
            $error = $response->json('error.message') ?? $response->body();
            Log::warning('Template sync failed', ['inbox_id' => $inbox->id, 'error' => $error]);
            abort(502, is_string($error) ? $error : 'Échec sync modèles Meta');
        }

        $synced = [];
        foreach ($response->json('data') ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }

            $name = (string) ($row['name'] ?? '');
            $language = (string) ($row['language'] ?? 'fr');
            if ($name === '') {
                continue;
            }

            $status = match (strtoupper((string) ($row['status'] ?? ''))) {
                'APPROVED' => StatutApprobationModele::Approuve,
                'PENDING', 'IN_APPEAL' => StatutApprobationModele::Soumis,
                'REJECTED', 'DISABLED' => StatutApprobationModele::Rejete,
                default => StatutApprobationModele::Brouillon,
            };

            $category = match (strtoupper((string) ($row['category'] ?? 'UTILITY'))) {
                'MARKETING' => CategorieModeleMessage::Marketing,
                'AUTHENTICATION' => CategorieModeleMessage::Authentication,
                default => CategorieModeleMessage::Utility,
            };

            $components = is_array($row['components'] ?? null) ? $row['components'] : [];
            $preview = $this->extractBodyPreview($components);

            $template = MessageTemplate::withoutGlobalScopes()->updateOrCreate(
                [
                    'boite_reception_id' => $inbox->id,
                    'nom' => $name,
                    'langue' => $language,
                ],
                [
                    'orga_id' => $inbox->orga_id,
                    'categorie' => $category,
                    'composants' => $components,
                    'statut_approbation' => $status,
                    'id_externe_meta' => isset($row['id']) ? (string) $row['id'] : null,
                    'corps_apercu' => $preview,
                ],
            );

            $synced[] = $template;
        }

        return $synced;
    }

    /**
     * @param  list<array<string, mixed>>  $components
     */
    private function extractBodyPreview(array $components): ?string
    {
        foreach ($components as $component) {
            if (($component['type'] ?? '') === 'BODY' && isset($component['text'])) {
                return (string) $component['text'];
            }
        }

        return null;
    }

    private function graphUrl(string $path): string
    {
        $base = rtrim((string) config('messagerie.meta.graph_base'), '/');
        $version = (string) config('messagerie.meta.graph_version');

        return "{$base}/{$version}/".ltrim($path, '/');
    }
}
