<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tenant scope that also includes global rows (orga_id IS NULL).
 * Used for seeded defaults: catégories de dépense, règles de relance.
 */
trait BelongsToOrganizationOrGlobal
{
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'orga_id');
    }

    protected static function bootBelongsToOrganizationOrGlobal(): void
    {
        static::addGlobalScope('organization_or_global', function (Builder $builder): void {
            $orgId = request()->attributes->get('organization_id');

            if ($orgId !== null && $orgId !== '') {
                $column = $builder->getModel()->getTable().'.orga_id';
                $builder->where(function (Builder $q) use ($column, $orgId): void {
                    $q->where($column, $orgId)->orWhereNull($column);
                });
            }
        });

        static::creating(function ($model) {
            if (! $model->orga_id && ($orgId = request()->attributes->get('organization_id'))) {
                $model->orga_id = $orgId;
            }
        });
    }
}
