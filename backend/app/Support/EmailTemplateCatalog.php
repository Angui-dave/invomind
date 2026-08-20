<?php

namespace App\Support;

final class EmailTemplateCatalog
{
    public const CHANNEL_EMAIL = 'email';

    public const EVENTS = [
        'document_sent',
        'quote_sent',
        'reminder_J-3',
        'reminder_J+3',
        'reminder_J+7',
        'reminder_J+14',
        'payment_receipt',
    ];

    /**
     * @return array<int, array{event: string, label: string, subject: string, body: string}>
     */
    public static function defaults(): array
    {
        return [
            [
                'event' => 'document_sent',
                'label' => 'Envoi de facture',
                'subject' => 'Votre facture {{numero}} — {{montant}}',
                'body' => "Bonjour {{client}},\n\nVeuillez trouver votre facture {{numero}} d’un montant de {{montant}}.\nVous pouvez la consulter et la régler ici : {{lien_paiement}}\n\nCordialement,\n{{societe}}",
            ],
            [
                'event' => 'quote_sent',
                'label' => 'Envoi de devis',
                'subject' => 'Votre devis {{numero}} — {{montant}}',
                'body' => "Bonjour {{client}},\n\nVoici notre devis {{numero}} d’un montant de {{montant}}.\nConsultez-le ici : {{lien_paiement}}\n\nCordialement,\n{{societe}}",
            ],
            [
                'event' => 'reminder_J-3',
                'label' => 'Rappel avant échéance',
                'subject' => 'Rappel : facture {{montant}} due bientôt',
                'body' => "Bonjour {{client}},\n\nVotre facture de {{montant}} arrive à échéance dans trois jours.\nVous pouvez la consulter et la régler ici : {{lien_paiement}}\n\nCordialement",
            ],
            [
                'event' => 'reminder_J+3',
                'label' => 'Première relance',
                'subject' => 'Relance : facture {{montant}}',
                'body' => "Bonjour {{client}},\n\nNous n’avons pas encore reçu le paiement de {{montant}}.\nRéglez en ligne via {{lien_paiement}}.\n\nCordialement",
            ],
            [
                'event' => 'reminder_J+7',
                'label' => 'Deuxième relance',
                'subject' => 'Deuxième relance — {{montant}}',
                'body' => "Bonjour {{client}},\n\nLa facture de {{montant}} reste en attente. Lien de paiement : {{lien_paiement}}\n\nCordialement",
            ],
            [
                'event' => 'reminder_J+14',
                'label' => 'Dernière relance',
                'subject' => 'Dernière relance — {{montant}}',
                'body' => "Bonjour {{client}},\n\nDernier rappel concernant {{montant}}. Paiement : {{lien_paiement}}\n\nCordialement",
            ],
            [
                'event' => 'payment_receipt',
                'label' => 'Reçu de paiement',
                'subject' => 'Reçu — facture {{numero}} {{montant}}',
                'body' => "Bonjour {{client}},\n\nNous confirmons la réception de {{montant}} pour la facture {{numero}}.\n\nCordialement,\n{{societe}}",
            ],
        ];
    }

    public static function eventFromKey(string $key): string
    {
        return match ($key) {
            'J-3' => 'reminder_J-3',
            'J+3' => 'reminder_J+3',
            'J+7' => 'reminder_J+7',
            'J+14' => 'reminder_J+14',
            default => $key,
        };
    }

    public static function milestoneFromEvent(string $event): ?string
    {
        return match ($event) {
            'reminder_J-3' => 'J-3',
            'reminder_J+3' => 'J+3',
            'reminder_J+7' => 'J+7',
            'reminder_J+14' => 'J+14',
            default => null,
        };
    }
}
