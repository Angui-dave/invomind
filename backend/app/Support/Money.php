<?php

namespace App\Support;

final class Money
{
    /**
     * Format a NUMERIC(14,2) string without floats.
     */
    public static function format(string $amount, string $currency = 'XOF'): string
    {
        $negative = bccomp($amount, '0', 2) < 0;
        $abs = $negative ? bcmul($amount, '-1', 2) : $amount;
        $normalized = bcadd($abs, '0', 2);
        [$whole, $frac] = array_pad(explode('.', $normalized, 2), 2, '00');
        $grouped = preg_replace('/\B(?=(\d{3})+(?!\d))/', "\u{00A0}", $whole) ?? $whole;

        $body = in_array($currency, ['XOF', 'XAF'], true)
            ? $grouped
            : $grouped.','.$frac;

        return ($negative ? '-' : '').$body."\u{00A0}".$currency;
    }
}
