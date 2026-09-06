<?php

namespace Tests\Feature;

use App\Enums\FactureStatut;
use App\Enums\ModePaiement;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\Quote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class DataIntegrityTest extends TestCase
{
    use CreatesTenant;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL required.');
        }
    }

    public function test_cannot_attach_foreign_tenant_client_to_invoice(): void
    {
        $this->seedTenant('pro');

        $otherOrg = Organization::create([
            'name_company' => 'Autre Org',
            'email' => 'other-'.uniqid().'@test.invomind',
            'devise_defaut' => 'XOF',
        ]);
        $foreignClient = Client::create([
            'orga_id' => $otherOrg->id,
            'user_id' => $this->user->id,
            'name_company' => 'Client étranger',
            'email' => 'foreign@test.invomind',
            'devise' => 'XOF',
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/invoices', [
                'client_id' => $foreignClient->id,
                'devise' => 'XOF',
                'lines' => [[
                    'designation' => 'Presta',
                    'quantite' => 1,
                    'prix_unitaire' => 1000,
                    'taux_tva' => 0,
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['client_id']);
    }

    public function test_cannot_mark_invoice_paid_without_payment(): void
    {
        $this->seedTenant('pro');

        $invoice = Invoice::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'numero' => 'FAC-2026-200',
            'date_creation' => now(),
            'date_echeance' => now()->addDays(10)->toDateString(),
            'statut' => FactureStatut::Envoyee,
            'devise' => 'XOF',
            'sous_total' => 1000,
            'remise_montant' => 0,
            'montant_tva' => 0,
            'montant_total' => 1000,
            'montant_paye' => 0,
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/invoices/'.$invoice->id.'/status', [
                'statut' => FactureStatut::Payee->value,
            ])
            ->assertStatus(422);
    }

    public function test_cannot_overpay_invoice(): void
    {
        $this->seedTenant('pro');

        $invoice = Invoice::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'numero' => 'FAC-2026-201',
            'date_creation' => now(),
            'date_echeance' => now()->addDays(10)->toDateString(),
            'statut' => FactureStatut::Envoyee,
            'devise' => 'XOF',
            'sous_total' => 1000,
            'remise_montant' => 0,
            'montant_tva' => 0,
            'montant_total' => 1000,
            'montant_paye' => 0,
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/payments', [
                'facture_id' => $invoice->id,
                'montant' => 1500,
                'mode_paiement' => ModePaiement::Cash->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['montant']);
    }

    public function test_cannot_pay_with_mismatched_currency(): void
    {
        $this->seedTenant('pro');

        $invoice = Invoice::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'numero' => 'FAC-2026-202',
            'date_creation' => now(),
            'date_echeance' => now()->addDays(10)->toDateString(),
            'statut' => FactureStatut::Envoyee,
            'devise' => 'XOF',
            'sous_total' => 1000,
            'remise_montant' => 0,
            'montant_tva' => 0,
            'montant_total' => 1000,
            'montant_paye' => 0,
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/payments', [
                'facture_id' => $invoice->id,
                'montant' => 500,
                'devise' => 'EUR',
                'mode_paiement' => ModePaiement::Cash->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['devise']);
    }

    public function test_quote_convert_inherits_client_payment_terms(): void
    {
        $this->seedTenant('pro');
        $this->client->update(['delai_paiement_jours' => 45]);

        $quote = Quote::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'numero' => 'DEV-2026-001',
            'date_creation' => now(),
            'statut' => 'accepte',
            'devise' => 'XOF',
            'sous_total' => 1000,
            'remise_montant' => 0,
            'montant_tva' => 0,
            'montant_total' => 1000,
        ]);

        $created = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/quotes/'.$quote->id.'/convert')
            ->assertCreated()
            ->json();

        $this->assertSame(
            now()->addDays(45)->toDateString(),
            substr((string) $created['date_echeance'], 0, 10),
        );
    }
}
