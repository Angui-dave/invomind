<?php

namespace App\Services;

class DocumentComputeService
{
    /**
     * Compute totals from an array of line items.
     *
     * @param  array  $lines  Each line: [quantity, unit_price, tax_rate, discount_percent?]
     * @param  string $taxMode  'exclusive' or 'inclusive'
     * @return array{subtotal_ht: string, tax_total: string, total: string}
     */
    public function compute(array $lines, string $taxMode = 'exclusive'): array
    {
        $subtotalHt = '0';
        $taxTotal = '0';

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
                $subtotalHt = bcadd($subtotalHt, $ht, 2);
                $taxTotal = bcadd($taxTotal, $tax, 2);
            } else {
                $tax = bcdiv(bcmul($lineTotal, $taxRate, 4), '100', 2);
                $subtotalHt = bcadd($subtotalHt, $lineTotal, 2);
                $taxTotal = bcadd($taxTotal, $tax, 2);
            }
        }

        $total = bcadd($subtotalHt, $taxTotal, 2);

        return [
            'subtotal_ht' => $subtotalHt,
            'tax_total' => $taxTotal,
            'total' => $total,
        ];
    }
}
