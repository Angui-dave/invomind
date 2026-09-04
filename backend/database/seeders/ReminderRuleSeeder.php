<?php

namespace Database\Seeders;

use App\Models\ReminderRule;
use Illuminate\Database\Seeder;

class ReminderRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            [
                'orga_id' => null,
                'nom' => 'Rappel avant échéance',
                'decalage_jours' => -3,
                'canal' => 'email',
                'objet_message' => 'Votre facture {{numero_facture}} arrive bientôt à échéance',
                'template_message' => "Bonjour {{client_nom}}, votre facture {{numero_facture}} d'un montant de {{montant}} est à régler avant le {{date_echeance}}.",
                'actif' => true,
            ],
            [
                'orga_id' => null,
                'nom' => 'Première relance (retard)',
                'decalage_jours' => 6,
                'canal' => 'email',
                'objet_message' => 'Facture {{numero_facture}} en retard de paiement',
                'template_message' => 'Bonjour {{client_nom}}, votre facture {{numero_facture}} de {{montant}} est échue depuis 6 jours. Merci de régulariser rapidement.',
                'actif' => true,
            ],
            [
                'orga_id' => null,
                'nom' => 'Relance ferme',
                'decalage_jours' => 8,
                'canal' => 'sms',
                'objet_message' => null,
                'template_message' => 'Facture {{numero_facture}} impayée depuis 8 jours. Merci de contacter {{orga_nom}} rapidement pour régulariser.',
                'actif' => true,
            ],
        ];

        foreach ($rules as $rule) {
            ReminderRule::query()->updateOrCreate(
                [
                    'orga_id' => $rule['orga_id'],
                    'nom' => $rule['nom'],
                    'decalage_jours' => $rule['decalage_jours'],
                ],
                $rule,
            );
        }
    }
}
