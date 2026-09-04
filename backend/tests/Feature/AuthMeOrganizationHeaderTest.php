<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class AuthMeOrganizationHeaderTest extends TestCase
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

    public function test_me_returns_organization_context(): void
    {
        $this->seedTenant('pro');

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('organization_id', $this->organization->id)
            ->assertJsonPath('role', 'admin')
            ->assertJsonPath('user.full_name', 'Lea Diallo');
    }

    public function test_wrong_organization_header_is_rejected(): void
    {
        $this->seedTenant('pro');

        $this->withHeaders([
            'Accept' => 'application/json',
            'X-Organization-Id' => '999999',
        ])
            ->getJson('/api/organization')
            ->assertForbidden();
    }

    public function test_change_plan_to_gratuit(): void
    {
        $this->seedTenant('pro');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/billing/change-plan', ['plan_code' => 'gratuit'])
            ->assertOk()
            ->assertJsonPath('subscription.plan.code', 'gratuit');
    }

    public function test_client_crud_smoke(): void
    {
        $this->seedTenant('pro');

        $created = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/clients', [
                'name_company' => 'Acme CI',
                'email' => 'acme@test.ci',
            ])
            ->assertCreated()
            ->json();

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/clients/'.$created['id'])
            ->assertOk()
            ->assertJsonPath('name_company', 'Acme CI');
    }

    public function test_supplier_category_expense_smoke(): void
    {
        $this->seedTenant('pro');

        $supplier = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/suppliers', [
                'name_company' => 'Orange Business',
                'contact' => 'Support',
                'email' => 'entreprises@orange.test',
                'ville' => 'Dakar',
            ])
            ->assertCreated()
            ->json();

        $this->assertSame('Orange Business', $supplier['name_company']);

        $category = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/expense-categories', [
                'nom' => 'Assurances',
                'couleur' => '#2F6E5B',
            ])
            ->assertCreated()
            ->json();

        $this->assertSame('Assurances', $category['nom']);
        $this->assertFalse($category['is_global']);

        $expense = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/expenses', [
                'libelle' => 'Fibre optique',
                'montant_ht' => 90000,
                'taux_tva' => 18,
                'categorie_id' => $category['id'],
                'fournisseur_id' => $supplier['id'],
                'date_depense' => '2026-08-01',
            ])
            ->assertCreated()
            ->json();

        $this->assertSame('Fibre optique', $expense['libelle']);
        $this->assertSame($supplier['id'], $expense['fournisseur_id']);
        $this->assertSame('Orange Business', $expense['fournisseur']);
        $this->assertSame('16200.00', (string) $expense['montant_tva']);

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/expenses/'.$expense['id'])
            ->assertOk()
            ->assertJsonPath('libelle', 'Fibre optique');

        $this->withHeaders($this->tenantHeaders())
            ->deleteJson('/api/expense-categories/'.$category['id'])
            ->assertNoContent();

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/expense-categories/'.$category['id'], [
                'nom' => 'Assurances (modifié)',
            ])
            ->assertOk()
            ->assertJsonPath('actif', false);
    }
}
