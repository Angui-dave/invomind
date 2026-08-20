<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToOrganization
{
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder): void {
            $orgId = request()->attributes->get('organization_id');

            if (is_string($orgId) && $orgId !== '') {
                $builder->where(
                    $builder->getModel()->getTable().'.organization_id',
                    $orgId,
                );
            }
        });

        static::creating(function ($model) {
            if (! $model->organization_id && $orgId = request()->attributes->get('organization_id')) {
                $model->organization_id = $orgId;
            }
        });
    }
}
