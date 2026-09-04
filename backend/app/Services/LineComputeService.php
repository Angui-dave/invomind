<?php

namespace App\Services;

class LineComputeService
{
    /**
     * @param  array{quantite?: mixed, prix_unitaire?: mixed, taux_tva?: mixed, remise_pourcentage?: mixed}  $line
     * @return array{quantite: string, prix_unitaire: string, taux_tva: string, remise_pourcentage: string, montant_ht: string, montant_tva: string}
     */
    public function computeLine(array $line): array
    {
        $qty = (float) ($line['quantite'] ?? 1);
        $unit = (float) ($line['prix_unitaire'] ?? 0);
        $tva = (float) ($line['taux_tva'] ?? 0);
        $remise = (float) ($line['remise_pourcentage'] ?? 0);

        $brut = $qty * $unit;
        $ht = $brut * (1 - ($remise / 100));
        $montantTva = $ht * ($tva / 100);

        return [
            'quantite' => number_format($qty, 2, '.', ''),
            'prix_unitaire' => number_format($unit, 2, '.', ''),
            'taux_tva' => number_format($tva, 2, '.', ''),
            'remise_pourcentage' => number_format($remise, 2, '.', ''),
            'montant_ht' => number_format($ht, 2, '.', ''),
            'montant_tva' => number_format($montantTva, 2, '.', ''),
        ];
    }

    /**
     * @param  list<array{montant_ht: string, montant_tva: string}>  $lines
     * @return array{sous_total: string, montant_tva: string, montant_total: string}
     */
    public function computeTotals(array $lines, float $remiseMontant = 0): array
    {
        $sousTotal = 0.0;
        $montantTva = 0.0;

        foreach ($lines as $line) {
            $sousTotal += (float) $line['montant_ht'];
            $montantTva += (float) $line['montant_tva'];
        }

        $montantTotal = max(0, $sousTotal + $montantTva - $remiseMontant);

        return [
            'sous_total' => number_format($sousTotal, 2, '.', ''),
            'montant_tva' => number_format($montantTva, 2, '.', ''),
            'montant_total' => number_format($montantTotal, 2, '.', ''),
        ];
    }
}
