<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Harmonise le recalcul statut facture après paiement :
 * montant_paye = 0 + échéance future → envoyee (plus de statut orphelin).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION recalculer_montant_paye_facture()
RETURNS TRIGGER AS $$
DECLARE
    v_facture_id BIGINT;
    v_total_paye NUMERIC(14,2);
    v_montant_total NUMERIC(14,2);
    v_date_echeance DATE;
    v_statut_actuel facture_statut;
BEGIN
    v_facture_id := COALESCE(NEW.facture_id, OLD.facture_id);

    SELECT COALESCE(SUM(montant), 0) INTO v_total_paye
    FROM paiements_facture WHERE facture_id = v_facture_id;

    SELECT montant_total, date_echeance, statut
    INTO v_montant_total, v_date_echeance, v_statut_actuel
    FROM factures WHERE id = v_facture_id;

    IF v_statut_actuel IN ('brouillon'::facture_statut, 'annulee'::facture_statut) THEN
        UPDATE factures
        SET montant_paye = v_total_paye
        WHERE id = v_facture_id;
        RETURN NULL;
    END IF;

    UPDATE factures
    SET montant_paye = v_total_paye,
        statut = CASE
            WHEN v_total_paye >= v_montant_total AND v_montant_total > 0 THEN 'payee'::facture_statut
            WHEN v_total_paye > 0 THEN 'partiellement_payee'::facture_statut
            WHEN v_date_echeance IS NOT NULL AND v_date_echeance < CURRENT_DATE THEN 'en_retard'::facture_statut
            ELSE 'envoyee'::facture_statut
        END
    WHERE id = v_facture_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
SQL);
    }

    public function down(): void
    {
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
    }
};
