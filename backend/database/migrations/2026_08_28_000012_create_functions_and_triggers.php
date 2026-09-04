<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
SQL);

        foreach ([
            'organisations' => 'trg_organisations_updated_at',
            'users' => 'trg_users_updated_at',
            'clients' => 'trg_clients_updated_at',
            'produits_services' => 'trg_produits_updated_at',
            'devis' => 'trg_devis_updated_at',
            'factures' => 'trg_factures_updated_at',
            'abonnements' => 'trg_abonnements_updated_at',
            'regles_relance' => 'trg_regles_relance_updated_at',
            'depenses' => 'trg_depenses_updated_at',
            'integrations_paiement' => 'trg_integrations_updated_at',
            'paiements_cinetpay' => 'trg_paiements_cinetpay_updated_at',
        ] as $table => $trigger) {
            DB::unprepared("
                CREATE TRIGGER {$trigger}
                BEFORE UPDATE ON {$table}
                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            ");
        }

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION recalculer_montant_paye_facture()
RETURNS TRIGGER AS $$
DECLARE
    v_facture_id BIGINT;
    v_total_paye NUMERIC(14,2);
    v_montant_total NUMERIC(14,2);
BEGIN
    v_facture_id := COALESCE(NEW.facture_id, OLD.facture_id);

    SELECT COALESCE(SUM(montant), 0) INTO v_total_paye
    FROM paiements_facture WHERE facture_id = v_facture_id;

    SELECT montant_total INTO v_montant_total
    FROM factures WHERE id = v_facture_id;

    UPDATE factures
    SET montant_paye = v_total_paye,
        statut = CASE
            WHEN v_total_paye >= v_montant_total AND v_montant_total > 0 THEN 'payee'::facture_statut
            WHEN v_total_paye > 0 THEN 'partiellement_payee'::facture_statut
            WHEN date_echeance IS NOT NULL AND date_echeance < CURRENT_DATE THEN 'en_retard'::facture_statut
            ELSE statut
        END
    WHERE id = v_facture_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
SQL);

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_paiement_facture_recalcul
AFTER INSERT OR UPDATE OR DELETE ON paiements_facture
FOR EACH ROW EXECUTE FUNCTION recalculer_montant_paye_facture();
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION annuler_relances_si_soldee()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut IN ('payee', 'annulee') AND OLD.statut IS DISTINCT FROM NEW.statut THEN
        UPDATE relances_facture
        SET statut = 'annulee'
        WHERE facture_id = NEW.id AND statut = 'planifiee';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
SQL);

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_factures_annuler_relances
AFTER UPDATE ON factures
FOR EACH ROW EXECUTE FUNCTION annuler_relances_si_soldee();
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION generer_relances_du_jour()
RETURNS void AS $$
BEGIN
    INSERT INTO relances_facture (orga_id, facture_id, regle_id, date_prevue, statut, canal, destinataire)
    SELECT f.orga_id, f.id, r.id, f.date_echeance + r.decalage_jours, 'planifiee', r.canal, cl.email
    FROM factures f
    JOIN clients cl ON cl.id = f.client_id
    JOIN regles_relance r ON (r.orga_id = f.orga_id OR r.orga_id IS NULL) AND r.actif = true
    WHERE f.statut IN ('envoyee', 'impayee', 'en_retard', 'partiellement_payee')
      AND f.date_echeance IS NOT NULL
      AND f.date_echeance + r.decalage_jours = CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1 FROM relances_facture rf
          WHERE rf.facture_id = f.id AND rf.regle_id = r.id
      )
    ON CONFLICT (facture_id, regle_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION reconcilier_paiement_cinetpay()
RETURNS TRIGGER AS $$
DECLARE
    v_paiement_id BIGINT;
    v_client_id BIGINT;
BEGIN
    IF NEW.statut = 'succes' AND OLD.statut IS DISTINCT FROM NEW.statut AND NEW.paiement_facture_id IS NULL THEN
        SELECT client_id INTO v_client_id FROM factures WHERE id = NEW.facture_id;

        INSERT INTO paiements_facture (orga_id, facture_id, client_id, montant, devise, mode_paiement, reference, date_paiement)
        VALUES (NEW.orga_id, NEW.facture_id, v_client_id, NEW.montant, NEW.devise,
                COALESCE(NEW.operateur, 'autre'), NEW.transaction_id, now())
        RETURNING id INTO v_paiement_id;

        UPDATE paiements_cinetpay SET paiement_facture_id = v_paiement_id WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
SQL);

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_cinetpay_reconciliation
AFTER UPDATE ON paiements_cinetpay
FOR EACH ROW EXECUTE FUNCTION reconcilier_paiement_cinetpay();
SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_cinetpay_reconciliation ON paiements_cinetpay');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_factures_annuler_relances ON factures');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_paiement_facture_recalcul ON paiements_facture');

        foreach ([
            'organisations' => 'trg_organisations_updated_at',
            'users' => 'trg_users_updated_at',
            'clients' => 'trg_clients_updated_at',
            'produits_services' => 'trg_produits_updated_at',
            'devis' => 'trg_devis_updated_at',
            'factures' => 'trg_factures_updated_at',
            'abonnements' => 'trg_abonnements_updated_at',
            'regles_relance' => 'trg_regles_relance_updated_at',
            'depenses' => 'trg_depenses_updated_at',
            'integrations_paiement' => 'trg_integrations_updated_at',
            'paiements_cinetpay' => 'trg_paiements_cinetpay_updated_at',
        ] as $table => $trigger) {
            DB::unprepared("DROP TRIGGER IF EXISTS {$trigger} ON {$table}");
        }

        DB::unprepared('DROP FUNCTION IF EXISTS reconcilier_paiement_cinetpay()');
        DB::unprepared('DROP FUNCTION IF EXISTS generer_relances_du_jour()');
        DB::unprepared('DROP FUNCTION IF EXISTS annuler_relances_si_soldee()');
        DB::unprepared('DROP FUNCTION IF EXISTS recalculer_montant_paye_facture()');
        DB::unprepared('DROP FUNCTION IF EXISTS set_updated_at()');
    }
};
