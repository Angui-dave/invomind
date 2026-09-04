<?php

namespace App\Jobs;

use App\Enums\StatutLivraisonMessage;
use App\Events\ConversationMiseAJour;
use App\Events\NouveauMessageConversation;
use App\Models\ContactInbox;
use App\Models\ConversationMessage;
use App\Services\Messagerie\CanalAdapterFactory;
use App\Services\Messagerie\Exceptions\CanalIndisponibleException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class SendConversationMessageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [5, 15, 60, 180];

    public function __construct(public int $messageId) {}

    public function handle(CanalAdapterFactory $factory): void
    {
        $message = ConversationMessage::withoutGlobalScopes()
            ->with(['conversation.inbox', 'conversation.contact'])
            ->find($this->messageId);

        if (! $message) {
            return;
        }

        if ($message->statut_livraison === StatutLivraisonMessage::Envoye
            || $message->statut_livraison === StatutLivraisonMessage::Livre
            || $message->statut_livraison === StatutLivraisonMessage::Lu) {
            return;
        }

        $inbox = $message->conversation?->inbox;
        if (! $inbox) {
            $this->markFailed($message, 'Boîte de réception introuvable.');

            return;
        }

        $canal = $inbox->canal?->value ?? 'whatsapp';
        $limit = (int) config("messagerie.rate_limits.{$canal}", 60);
        $key = "messagerie-send:{$inbox->id}";

        if (RateLimiter::tooManyAttempts($key, $limit)) {
            $this->release(RateLimiter::availableIn($key) ?: 10);

            return;
        }

        RateLimiter::hit($key, 60);

        $destinataire = ContactInbox::query()
            ->where('boite_reception_id', $inbox->id)
            ->where('contact_id', $message->conversation->contact_id)
            ->value('identifiant_externe');

        if (! $destinataire) {
            $this->markFailed($message, 'Identifiant externe du contact introuvable.');

            return;
        }

        try {
            $adapter = $factory->for($inbox);
            $result = $adapter->envoyerMessage($inbox, $message, $destinataire);
        } catch (CanalIndisponibleException $e) {
            $this->markFailed($message, $e->getMessage());

            return;
        } catch (\Throwable $e) {
            Log::warning('SendConversationMessageJob failed', ['error' => $e->getMessage()]);
            throw $e;
        }

        if (! $result->success) {
            if ($this->attempts() >= $this->tries) {
                $this->markFailed($message, $result->erreur ?? 'Échec d’envoi');

                return;
            }
            throw new \RuntimeException($result->erreur ?? 'Échec d’envoi');
        }

        $message->update([
            'statut_livraison' => StatutLivraisonMessage::Envoye,
            'id_externe' => $result->idExterne ?? $message->id_externe,
            'erreur' => null,
        ]);

        event(new NouveauMessageConversation($message->fresh()));
        if ($message->conversation) {
            event(new ConversationMiseAJour($message->conversation->fresh()));
        }
    }

    public function failed(?\Throwable $e): void
    {
        $message = ConversationMessage::withoutGlobalScopes()->find($this->messageId);
        if ($message) {
            $this->markFailed($message, $e?->getMessage() ?? 'Échec définitif d’envoi');
        }
    }

    private function markFailed(ConversationMessage $message, string $erreur): void
    {
        $message->update([
            'statut_livraison' => StatutLivraisonMessage::Echec,
            'erreur' => $erreur,
        ]);
        event(new NouveauMessageConversation($message->fresh()));
    }
}
