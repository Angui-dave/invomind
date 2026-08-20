<?php

namespace Tests\Unit;

use App\Services\DocumentComputeService;
use App\Services\EmvQrService;
use Tests\TestCase;

class EmvQrServiceTest extends TestCase
{
    public function test_payload_matches_the_typescript_builder(): void
    {
        $payload = (new EmvQrService)->payload([
            'merchantName' => 'Atelier Diallo',
            'merchantCity' => 'Dakar',
            'merchantPhone' => '+221771234567',
            'amount' => '118000.00',
            'currency' => 'XOF',
            'reference' => 'FAC-2026-00001',
            'provider' => 'wave',
        ]);

        $this->assertSame(
            '00020101021226250004wave0113+22177123456752040000530395254061180005802SN5914Atelier Diallo6005Dakar62180514FAC-2026-000016304ACF1',
            $payload,
        );
    }

    public function test_svg_is_inline_markup(): void
    {
        $svg = (new EmvQrService)->svg('000201', 80);

        $this->assertStringContainsString('<svg', $svg);
        $this->assertStringNotContainsString('<?xml', $svg);
    }
}

class DocumentComputeDetailedTest extends TestCase
{
    public function test_mixed_rates_match_compute_and_group_vat(): void
    {
        $lines = [
            ['description' => 'Couture', 'quantity' => 1, 'unit_price' => 100000, 'tax_rate' => 18],
            ['description' => 'Livraison exonérée', 'quantity' => 1, 'unit_price' => 50000, 'tax_rate' => 0],
        ];

        $service = new DocumentComputeService;
        $summary = $service->compute($lines, 'exclusive');
        $detailed = $service->computeDetailed($lines, 'exclusive');

        $this->assertSame($summary['subtotal_ht'], $detailed['subtotal_ht']);
        $this->assertSame($summary['tax_total'], $detailed['tax_total']);
        $this->assertSame($summary['total'], $detailed['total']);
        $this->assertSame('150000.00', $detailed['subtotal_ht']);
        $this->assertSame('18000.00', $detailed['tax_total']);
        $this->assertSame('168000.00', $detailed['total']);
        $this->assertSame('18000.00', $detailed['tax_by_rate']['18.00']);
        $this->assertSame('0.00', $detailed['tax_by_rate']['0.00']);
    }
}
