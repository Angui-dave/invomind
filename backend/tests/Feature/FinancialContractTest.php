<?php

namespace Tests\Feature;

use App\Enums\DepenseStatut;
use App\Enums\FactureStatut;
use App\Enums\ModePaiement;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\InvoicePayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class FinancialContractTest extends TestCase
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

    public function test_client_exposes_payment_terms_and_tax_id(): void
    {
        $this->seedTenant('pro');

        $created = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/clients', [
                'name_company' => 'Diallo SA',
                'email' => 'contact@diallo.test',
                'delai_paiement_jours' => 45,
                'numero_fiscal' => 'SN123',
            ])
            ->assertCreated()
            ->json();

        $this->assertSame(45, $created['delai_paiement_jours']);
        $this->assertSame('SN123', $created['numero_fiscal']);
    }

    public function test_payment_updates_invoice_paid_amount_and_status(): void
    {
        $this->seedTenant('pro');

        $invoice = Invoice::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'numero' => 'FAC-2026-100',
            'date_creation' => now(),
            'date_echeance' => now()->addDays(30)->toDateString(),
            'statut' => FactureStatut::Envoyee,
            'devise' => 'XOF',
            'sous_total' => 100000,
            'remise_montant' => 0,
            'montant_tva' => 18000,
            'montant_total' => 118000,
            'montant_paye' => 0,
        ]);

        $payment = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/payments', [
                'facture_id' => $invoice->id,
                'montant' => 50000,
                'mode_paiement' => ModePaiement::Wave->value,
                'date_paiement' => now()->toDateString(),
            ])
            ->assertCreated()
            ->json();

        $this->assertSame('FAC-2026-100', $payment['document_number']);
        $this->assertSame('Ndiaye SARL', $payment['client_name']);

        $invoice->refresh();
        $this->assertEquals(50000, (float) $invoice->montant_paye);
        $this->assertSame(FactureStatut::PartiellementPayee, $invoice->statut);

        $resource = $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/invoices/'.$invoice->id)
            ->assertOk()
            ->json();

        $this->assertEquals(50000, (float) $resource['montant_paye']);
        $this->assertEquals(68000, (float) $resource['balance_due']);
    }

    public function test_overview_profit_uses_collected_ttc_minus_validated_expenses_ttc(): void
    {
        $this->seedTenant('pro');

        $invoice = Invoice::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'numero' => 'FAC-2026-101',
            'date_creation' => now(),
            'date_echeance' => now()->addDays(15)->toDateString(),
            'statut' => FactureStatut::Envoyee,
            'devise' => 'XOF',
            'sous_total' => 100000,
            'remise_montant' => 0,
            'montant_tva' => 18000,
            'montant_total' => 118000,
            'montant_paye' => 0,
        ]);

        InvoiceLine::create([
            'facture_id' => $invoice->id,
            'designation' => 'Presta',
            'quantite' => 1,
            'prix_unitaire' => 100000,
            'taux_tva' => 18,
            'remise_pourcentage' => 0,
            'montant_ht' => 100000,
            'ordre' => 0,
        ]);

        InvoicePayment::create([
            'orga_id' => $this->organization->id,
            'facture_id' => $invoice->id,
            'client_id' => $this->client->id,
            'montant' => 118000,
            'devise' => 'XOF',
            'date_paiement' => now(),
            'mode_paiement' => ModePaiement::Virement,
        ]);

        $category = ExpenseCategory::create([
            'orga_id' => $this->organization->id,
            'nom' => 'Loyer',
            'couleur' => '#16213E',
        ]);

        Expense::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'categorie_id' => $category->id,
            'libelle' => 'Loyer validé',
            'montant_ht' => 100000,
            'taux_tva' => 18,
            'montant_tva' => 18000,
            'devise' => 'XOF',
            'date_depense' => now()->toDateString(),
            'statut' => DepenseStatut::Validee,
        ]);

        Expense::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'categorie_id' => $category->id,
            'libelle' => 'Loyer rejeté',
            'montant_ht' => 50000,
            'taux_tva' => 0,
            'montant_tva' => 0,
            'devise' => 'XOF',
            'date_depense' => now()->toDateString(),
            'statut' => DepenseStatut::Rejetee,
        ]);

        $overview = $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/reports/overview')
            ->assertOk()
            ->json();

        $this->assertEquals(118000, (float) $overview['total_revenue']);
        $this->assertEquals(118000, (float) $overview['total_expenses']);
        $this->assertEquals(100000, (float) $overview['total_expenses_ht']);
        $this->assertEquals(0, (float) $overview['net_profit']);
        $this->assertEquals(100000, (float) $overview['billed_ht']);
        $this->assertEquals(118000, (float) $overview['billed_ttc']);
        $this->assertNotEmpty($overview['vat_by_rate']);

        $dashboard = $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/reports/dashboard')
            ->assertOk()
            ->json();

        $this->assertSame((string) $this->client->id, (string) $dashboard['top_clients'][0]['client_id']);
        $this->assertSame('Ndiaye SARL', $dashboard['top_clients'][0]['client_name']);
    }
}
