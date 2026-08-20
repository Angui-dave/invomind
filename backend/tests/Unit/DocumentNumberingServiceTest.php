<?php

namespace Tests\Unit;

use App\Services\DocumentNumberingService;
use InvalidArgumentException;
use RuntimeException;
use Tests\TestCase;

class DocumentNumberingServiceTest extends TestCase
{
    public function test_format_uses_annual_padded_sequence(): void
    {
        $service = new DocumentNumberingService;

        $this->assertSame('FAC-2026-00042', $service->format('invoice', 2026, 42));
        $this->assertSame('DEV-2026-00007', $service->format('quote', 2026, 7));
        $this->assertSame('AV-2026-00003', $service->format('credit_note', 2026, 3));
    }

    public function test_provisional_number_uses_kind_prefix(): void
    {
        $service = new DocumentNumberingService;

        $this->assertStringStartsWith('BROUILLON-FAC-', $service->provisional('invoice'));
        $this->assertStringStartsWith('BROUILLON-DEV-', $service->provisional('quote'));
        $this->assertStringStartsWith('BROUILLON-AV-', $service->provisional('credit_note'));
    }

    public function test_allocate_requires_an_open_transaction(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('must run inside a database transaction');

        (new DocumentNumberingService)->allocate(
            '00000000-0000-0000-0000-000000000000',
            'invoice',
            2026,
        );
    }

    public function test_unknown_kind_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new DocumentNumberingService)->format('delivery_note', 2026, 1);
    }
}
