<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class DocumentNumberingService
{
    public const PREFIXES = [
        'quote' => 'DEV',
        'invoice' => 'FAC',
        'credit_note' => 'AV',
    ];

    /**
     * Allocate the next definitive number for a kind/year.
     * Must run inside a transaction so SELECT … FOR UPDATE is held until commit.
     */
    public function allocate(string $organizationId, string $kind, int $year): string
    {
        if (DB::transactionLevel() === 0) {
            throw new RuntimeException(
                'DocumentNumberingService::allocate() must run inside a database transaction.',
            );
        }

        $this->assertKind($kind);

        DB::table('document_sequences')->insertOrIgnore([
            'organization_id' => $organizationId,
            'kind' => $kind,
            'year' => $year,
            'last_number' => 0,
        ]);

        $row = DB::table('document_sequences')
            ->where('organization_id', $organizationId)
            ->where('kind', $kind)
            ->where('year', $year)
            ->lockForUpdate()
            ->first();

        if ($row === null) {
            throw new RuntimeException('Failed to lock document sequence.');
        }

        $next = (int) $row->last_number + 1;

        DB::table('document_sequences')
            ->where('organization_id', $organizationId)
            ->where('kind', $kind)
            ->where('year', $year)
            ->update(['last_number' => $next]);

        return $this->format($kind, $year, $next);
    }

    public function provisional(string $kind): string
    {
        $this->assertKind($kind);

        return sprintf(
            'BROUILLON-%s-%s',
            self::PREFIXES[$kind],
            Str::upper(Str::ulid()),
        );
    }

    public function format(string $kind, int $year, int $sequence): string
    {
        $this->assertKind($kind);

        return sprintf('%s-%d-%05d', self::PREFIXES[$kind], $year, $sequence);
    }

    public function prefix(string $kind): string
    {
        $this->assertKind($kind);

        return self::PREFIXES[$kind];
    }

    private function assertKind(string $kind): void
    {
        if (! isset(self::PREFIXES[$kind])) {
            throw new InvalidArgumentException("Unknown document kind [{$kind}].");
        }
    }
}
