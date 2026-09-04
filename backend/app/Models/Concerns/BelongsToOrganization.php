<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToOrganization
{
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'orga_id');
    }

    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder): void {
            $orgId = request()->attributes->get('organization_id');

            if ($orgId !== null && $orgId !== '') {
                $builder->where(
                    $builder->getModel()->getTable().'.orga_id',
                    $orgId,
                );
            }
        });

        static::creating(function ($model) {
            if (! $model->orga_id && ($orgId = request()->attributes->get('organization_id'))) {
                $model->orga_id = $orgId;
            }
        });
    }
}
