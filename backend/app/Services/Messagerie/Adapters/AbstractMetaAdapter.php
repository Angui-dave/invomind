<?php

namespace App\Services\Messagerie\Adapters;

use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Contracts\CanalAdapterInterface;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use App\Services\Messagerie\Dto\NormalizedStatusUpdateDto;
use App\Services\Messagerie\Dto\ResultatEnvoiDto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class AbstractMetaAdapter implements CanalAdapterInterface
{
    public function verifierSignatureWebhook(Request $request): bool
    {
        $secret = (string) config('services.meta.app_secret', '');
        if ($secret === '') {
            // Allow local/fake without configured secret.
            return app()->environment('local', 'testing');
        }

        $signature = (string) $request->header('X-Hub-Signature-256', '');
        if ($signature === '' || ! str_starts_with($signature, 'sha256=')) {
            return false;
        }

        $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $signature);
    }

    /**
     * @return list<\App\Services\Messagerie\Dto\NormalizedInboundMessageDto>
     */
    abstract public function normaliserEvenement(Request $request): array;

    /**
     * @return list<\App\Services\Messagerie\Dto\NormalizedStatusUpdateDto>
     */
    public function normaliserStatuts(Request $request): array
    {
        return [];
    }

    abstract public function envoyerMessage(Inbox $boite, ConversationMessage $message, string $destinataireExterne): ResultatEnvoiDto;

    public function souscrirePageWebhook(Inbox $boite): ResultatEnvoiDto
    {
        return new ResultatEnvoiDto(true, null);
    }

    public function verifierIdentifiants(Inbox $boite): ResultatEnvoiDto
    {
        return new ResultatEnvoiDto(true, null);
    }

    public function resoudreNomContact(Inbox $boite, string $externalId): ?string
    {
        return null;
    }

    protected function graphUrl(string $path): string
    {
        $base = rtrim((string) config('messagerie.meta.graph_base'), '/');
        $version = (string) config('messagerie.meta.graph_version');

        return "{$base}/{$version}/".ltrim($path, '/');
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>|null
     */
    protected function getGraph(string $path, string $accessToken, array $query = []): ?array
    {
        try {
            $response = Http::withToken($accessToken)
                ->timeout(15)
                ->get($this->graphUrl($path), $query);

            if (! $response->successful()) {
                Log::warning('Meta Graph GET failed', [
                    'path' => $path,
                    'status' => $response->status(),
                    'body' => $response->json('error.message') ?? $response->body(),
                ]);

                return null;
            }

            $json = $response->json();

            return is_array($json) ? $json : null;
        } catch (\Throwable $e) {
            Log::warning('Meta Graph GET exception', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function postGraph(string $path, string $accessToken, array $payload): ResultatEnvoiDto
    {
        try {
            $response = Http::withToken($accessToken)
                ->timeout(15)
                ->post($this->graphUrl($path), $payload);

            if (! $response->successful()) {
                $error = $response->json('error.message') ?? $response->body();

                return new ResultatEnvoiDto(false, null, is_string($error) ? $error : 'Erreur Graph API');
            }

            $id = $response->json('messages.0.id')
                ?? $response->json('message_id')
                ?? $response->json('id');

            return new ResultatEnvoiDto(true, $id ? (string) $id : null);
        } catch (\Throwable $e) {
            Log::warning('Meta Graph send failed', ['error' => $e->getMessage()]);

            return new ResultatEnvoiDto(false, null, $e->getMessage());
        }
    }

    /**
     * Shared Page webhook subscription for Messenger / Instagram (via Page).
     *
     * @param  list<string>  $fields
     */
    protected function subscribePageFields(Inbox $boite, array $fields): ResultatEnvoiDto
    {
        $creds = $boite->identifiants ?? [];
        $token = (string) ($creds['access_token'] ?? '');
        $pageId = (string) ($creds['page_id'] ?? '');

        if ($token === '' || $pageId === '') {
            return new ResultatEnvoiDto(false, null, 'Identifiants incomplets (access_token, page_id).');
        }

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->post($this->graphUrl("{$pageId}/subscribed_apps"), [
                    'subscribed_fields' => implode(',', $fields),
                ]);

            if (! $response->successful()) {
                $error = $response->json('error.message') ?? $response->body();

                return new ResultatEnvoiDto(false, null, is_string($error) ? $error : 'Échec abonnement webhook');
            }

            $success = (bool) ($response->json('success') ?? true);

            return $success
                ? new ResultatEnvoiDto(true, $pageId)
                : new ResultatEnvoiDto(false, null, 'Abonnement webhook refusé par Meta.');
        } catch (\Throwable $e) {
            Log::warning('Meta subscribed_apps failed', ['error' => $e->getMessage()]);

            return new ResultatEnvoiDto(false, null, $e->getMessage());
        }
    }

    protected function verifyPageCredentials(Inbox $boite): ResultatEnvoiDto
    {
        $creds = $boite->identifiants ?? [];
        $token = (string) ($creds['access_token'] ?? '');
        $pageId = (string) ($creds['page_id'] ?? '');

        if ($token === '' || $pageId === '') {
            return new ResultatEnvoiDto(false, null, 'Identifiants incomplets (access_token, page_id).');
        }

        $data = $this->getGraph($pageId, $token, ['fields' => 'id,name']);
        if ($data === null || ! isset($data['id'])) {
            return new ResultatEnvoiDto(false, null, 'Impossible de vérifier la Page (token ou page_id invalide).');
        }

        return new ResultatEnvoiDto(true, (string) $data['id']);
    }

    protected function resolvePageUserName(Inbox $boite, string $psid): ?string
    {
        $creds = $boite->identifiants ?? [];
        $token = (string) ($creds['access_token'] ?? '');
        if ($token === '' || $psid === '') {
            return null;
        }

        $data = $this->getGraph($psid, $token, ['fields' => 'first_name,last_name,name']);
        if ($data === null) {
            return null;
        }

        if (isset($data['name']) && is_string($data['name']) && $data['name'] !== '') {
            return $data['name'];
        }

        $first = isset($data['first_name']) && is_string($data['first_name']) ? $data['first_name'] : '';
        $last = isset($data['last_name']) && is_string($data['last_name']) ? $data['last_name'] : '';
        $full = trim("{$first} {$last}");

        return $full !== '' ? $full : null;
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return list<NormalizedInboundMessageDto>
     */
    protected function parseWhatsAppEntry(array $entry): array
    {
        $out = [];
        foreach ($entry['changes'] ?? [] as $change) {
            $value = $change['value'] ?? [];
            $phoneNumberId = (string) ($value['metadata']['phone_number_id'] ?? '');
            $contacts = $value['contacts'] ?? [];
            $contactName = $contacts[0]['profile']['name'] ?? null;

            foreach ($value['messages'] ?? [] as $msg) {
                $type = (string) ($msg['type'] ?? 'text');
                $contenu = match ($type) {
                    'text' => (string) ($msg['text']['body'] ?? ''),
                    'image' => (string) ($msg['image']['caption'] ?? '[image]'),
                    'audio' => '[audio]',
                    'video' => (string) ($msg['video']['caption'] ?? '[video]'),
                    'document' => (string) ($msg['document']['filename'] ?? '[fichier]'),
                    default => '['.$type.']',
                };
                $typeContenu = match ($type) {
                    'text' => 'texte',
                    'image' => 'image',
                    'audio' => 'audio',
                    'video' => 'video',
                    'document' => 'fichier',
                    default => 'texte',
                };

                $out[] = new NormalizedInboundMessageDto(
                    canal: 'whatsapp',
                    inboxExternalId: $phoneNumberId,
                    contactExternalId: (string) ($msg['from'] ?? ''),
                    messageExternalId: (string) ($msg['id'] ?? ''),
                    contenu: $contenu,
                    typeContenu: $typeContenu,
                    urlMedia: $msg['image']['id'] ?? $msg['document']['id'] ?? $msg['audio']['id'] ?? $msg['video']['id'] ?? null,
                    contactName: is_string($contactName) ? $contactName : null,
                    envoyeAt: isset($msg['timestamp']) ? new \DateTimeImmutable('@'.(int) $msg['timestamp']) : null,
                    raw: $msg,
                );
            }
        }

        return $out;
    }

    /**
     * Parse WhatsApp delivery/read status webhooks.
     *
     * @param  array<string, mixed>  $entry
     * @return list<NormalizedStatusUpdateDto>
     */
    protected function parseWhatsAppStatuses(array $entry): array
    {
        $out = [];
        foreach ($entry['changes'] ?? [] as $change) {
            $value = $change['value'] ?? [];
            $phoneNumberId = (string) ($value['metadata']['phone_number_id'] ?? '');

            foreach ($value['statuses'] ?? [] as $status) {
                $raw = (string) ($status['status'] ?? '');
                $mapped = match ($raw) {
                    'sent' => 'sent',
                    'delivered' => 'delivered',
                    'read' => 'read',
                    'failed' => 'failed',
                    default => null,
                };
                if (! $mapped) {
                    continue;
                }

                $erreur = null;
                if ($mapped === 'failed') {
                    $erreur = $status['errors'][0]['title']
                        ?? $status['errors'][0]['message']
                        ?? 'Échec livraison WhatsApp';
                    $erreur = is_string($erreur) ? $erreur : 'Échec livraison WhatsApp';
                }

                $out[] = new NormalizedStatusUpdateDto(
                    canal: 'whatsapp',
                    inboxExternalId: $phoneNumberId,
                    messageExternalId: (string) ($status['id'] ?? ''),
                    statut: $mapped,
                    timestamp: isset($status['timestamp'])
                        ? new \DateTimeImmutable('@'.(int) $status['timestamp'])
                        : null,
                    erreur: $erreur,
                );
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return list<NormalizedStatusUpdateDto>
     */
    protected function parseMessengerDelivery(array $entry, string $canal = 'messenger'): array
    {
        $out = [];
        $pageId = (string) ($entry['id'] ?? '');

        foreach ($entry['messaging'] ?? [] as $event) {
            if (isset($event['delivery']['mids']) && is_array($event['delivery']['mids'])) {
                foreach ($event['delivery']['mids'] as $mid) {
                    $out[] = new NormalizedStatusUpdateDto(
                        canal: $canal,
                        inboxExternalId: $pageId,
                        messageExternalId: (string) $mid,
                        statut: 'delivered',
                        timestamp: isset($event['timestamp'])
                            ? new \DateTimeImmutable('@'.(int) floor(((int) $event['timestamp']) / 1000))
                            : null,
                    );
                }
            }
            if (isset($event['read'])) {
                // Messenger read receipts don't include mids — skip granular update
                continue;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return list<NormalizedInboundMessageDto>
     */
    protected function parseMessengerOrInstagramEntry(array $entry, string $canal): array
    {
        $out = [];
        $pageId = (string) ($entry['id'] ?? '');

        foreach ($entry['messaging'] ?? [] as $event) {
            if (! isset($event['message']) || isset($event['message']['is_echo'])) {
                continue;
            }

            $message = $event['message'];
            $attachments = $message['attachments'] ?? [];
            $typeContenu = 'texte';
            $urlMedia = null;
            $contenu = (string) ($message['text'] ?? '');

            if ($attachments !== [] && is_array($attachments[0])) {
                $attType = (string) ($attachments[0]['type'] ?? 'file');
                $urlMedia = $attachments[0]['payload']['url'] ?? null;
                $typeContenu = match ($attType) {
                    'image' => 'image',
                    'audio' => 'audio',
                    'video' => 'video',
                    default => 'fichier',
                };
                if ($contenu === '') {
                    $contenu = '['.$typeContenu.']';
                }
            }

            $out[] = new NormalizedInboundMessageDto(
                canal: $canal,
                inboxExternalId: $pageId,
                contactExternalId: (string) ($event['sender']['id'] ?? ''),
                messageExternalId: (string) ($message['mid'] ?? ''),
                contenu: $contenu,
                typeContenu: $typeContenu,
                urlMedia: is_string($urlMedia) ? $urlMedia : null,
                contactName: null,
                envoyeAt: isset($event['timestamp'])
                    ? new \DateTimeImmutable('@'.(int) floor(((int) $event['timestamp']) / 1000))
                    : null,
                raw: $event,
            );
        }

        return $out;
    }
}
