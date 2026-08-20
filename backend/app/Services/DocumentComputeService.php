<?php

namespace App\Services;

class DocumentComputeService
{
    /**
     * Compute totals from an array of line items.
     *
     * @param  array<int, array<string, mixed>>  $lines  Each line: [quantity, unit_price, tax_rate, discount_percent?]
     * @return array{subtotal_ht: string, tax_total: string, total: string}
     */
    public function compute(array $lines, string $taxMode = 'exclusive'): array
    {
        $detailed = $this->computeDetailed($lines, $taxMode);

        return [
            'subtotal_ht' => $detailed['subtotal_ht'],
            'tax_total' => $detailed['tax_total'],
            'total' => $detailed['total'],
        ];
    }

    /**
     * Same rounding as compute(), plus per-line amounts and tax grouped by rate.
     *
     * @param  array<int, array<string, mixed>>  $lines
     * @return array{
     *     subtotal_ht: string,
     *     tax_total: string,
     *     total: string,
     *     lines: list<array<string, mixed>>,
     *     tax_by_rate: array<string, string>
     * }
     */
    public function computeDetailed(array $lines, string $taxMode = 'exclusive'): array
    {
        $subtotalHt = '0';
        $taxTotal = '0';
        $detailedLines = [];
        $taxByRate = [];

        foreach ($lines as $line) {
            $qty = (string) ($line['quantity'] ?? 1);
            $price = (string) ($line['unit_price'] ?? 0);
            $taxRate = (string) ($line['tax_rate'] ?? 0);
            $discount = (string) ($line['discount_percent'] ?? 0);

            $lineTotal = bcmul($qty, $price, 4);

            if (bccomp($discount, '0', 2) > 0) {
                $discountAmount = bcdiv(bcmul($lineTotal, $discount, 4), '100', 4);
                $lineTotal = bcsub($lineTotal, $discountAmount, 4);
            }

            if ($taxMode === 'inclusive') {
                $divisor = bcadd('100', $taxRate, 2);
                $ht = bcdiv(bcmul($lineTotal, '100', 4), $divisor, 2);
                $tax = bcsub($lineTotal, $ht, 2);
            } else {
                $ht = bcadd($lineTotal, '0', 2);
                $tax = bcdiv(bcmul($lineTotal, $taxRate, 4), '100', 2);
            }

            $subtotalHt = bcadd($subtotalHt, $ht, 2);
            $taxTotal = bcadd($taxTotal, $tax, 2);

            $rateKey = bcadd($taxRate, '0', 2);
            $taxByRate[$rateKey] = bcadd($taxByRate[$rateKey] ?? '0.00', $tax, 2);

            $detailedLines[] = [
                'description' => (string) ($line['description'] ?? ''),
                'quantity' => $qty,
                'unit_price' => $price,
                'tax_rate' => $rateKey,
                'discount_percent' => bccomp($discount, '0', 2) > 0 ? $discount : null,
                'ht' => $ht,
                'tax' => $tax,
                'ttc' => bcadd($ht, $tax, 2),
            ];
        }

        ksort($taxByRate, SORT_NUMERIC);

        return [
            'subtotal_ht' => $subtotalHt,
            'tax_total' => $taxTotal,
            'total' => bcadd($subtotalHt, $taxTotal, 2),
            'lines' => $detailedLines,
            'tax_by_rate' => $taxByRate,
        ];
    }
}
