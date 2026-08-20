<?php

namespace App\Services;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class EmvQrService
{
    /**
     * @param  array{merchantName: string, merchantCity: string, merchantPhone: string, amount: string, currency: string, reference: string, provider: string}  $input
     */
    public function payload(array $input): string
    {
        $merchantAccount = $this->tlv('00', $input['provider']).$this->tlv('01', $input['merchantPhone']);
        $amount = $this->amountString($input['amount'], $input['currency']);

        $payload = '';
        $payload .= $this->tlv('00', '01');
        $payload .= $this->tlv('01', '12');
        $payload .= $this->tlv('26', $merchantAccount);
        $payload .= $this->tlv('52', '0000');
        $payload .= $this->tlv('53', $this->currencyNumeric($input['currency']));
        $payload .= $this->tlv('54', $amount);
        $payload .= $this->tlv('58', $input['provider'] === 'twint' ? 'CH' : 'SN');
        $payload .= $this->tlv('59', mb_substr($input['merchantName'], 0, 25));
        $payload .= $this->tlv('60', mb_substr($input['merchantCity'] !== '' ? $input['merchantCity'] : 'Dakar', 0, 15));
        $payload .= $this->tlv('62', $this->tlv('05', mb_substr($input['reference'], 0, 25)));
        $payload .= '6304';

        return $payload.$this->crc16Ccitt($payload);
    }

    public function svg(string $payload, int $size = 180): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size, 0),
            new SvgImageBackEnd,
        );

        $svg = (new Writer($renderer))->writeString($payload);

        return preg_replace('/^<\?xml[^>]*>\s*/', '', $svg) ?? $svg;
    }

    public function providerLabel(string $provider): string
    {
        return match ($provider) {
            'orange_money' => 'Orange Money',
            'wave' => 'Wave',
            'mtn' => 'MTN MoMo',
            'moov' => 'Moov Money',
            'mpesa' => 'M-Pesa',
            'twint' => 'TWINT',
            default => $provider,
        };
    }

    private function tlv(string $id, string $value): string
    {
        return $id.str_pad((string) strlen($value), 2, '0', STR_PAD_LEFT).$value;
    }

    private function amountString(string $amount, string $currency): string
    {
        if (in_array($currency, ['XOF', 'XAF'], true)) {
            return (string) (int) bcadd($amount, '0', 0);
        }

        return bcadd($amount, '0', 2);
    }

    private function currencyNumeric(string $currency): string
    {
        return match ($currency) {
            'XOF' => '952',
            'XAF' => '950',
            'EUR' => '978',
            'USD' => '840',
            'CHF' => '756',
            'GBP' => '826',
            'MAD' => '504',
            'NGN' => '566',
            'GHS' => '936',
            'KES' => '404',
            'CAD' => '124',
            default => '952',
        };
    }

    private function crc16Ccitt(string $payload): string
    {
        $crc = 0xFFFF;
        $length = strlen($payload);

        for ($i = 0; $i < $length; $i++) {
            $crc ^= ord($payload[$i]) << 8;
            for ($j = 0; $j < 8; $j++) {
                $crc = ($crc & 0x8000)
                    ? (($crc << 1) ^ 0x1021) & 0xFFFF
                    : ($crc << 1) & 0xFFFF;
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }
}
