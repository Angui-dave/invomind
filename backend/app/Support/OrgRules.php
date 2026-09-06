<?php

namespace App\Support;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class OrgRules
{
    public static function exists(string $table, string $column = 'id', ?int $orgId = null): Exists
    {
        $orgId ??= (int) request()->user()?->orga_id;

        return Rule::exists($table, $column)->where(
            fn ($query) => $query->where('orga_id', $orgId),
        );
    }
}
