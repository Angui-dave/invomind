<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use App\Models\Organization;
use App\Models\ReminderRule;

class OrganizationBootstrapService
{
    /**
     * Copy global default expense categories onto the organization (optional overrides later).
     * Global rows (orga_id NULL) remain visible via BelongsToOrganizationOrGlobal.
     */
    public function seedExpenseCategories(Organization $organization): void
    {
        if (ExpenseCategory::withoutGlobalScopes()->where('orga_id', $organization->id)->exists()) {
            return;
        }

        // Globals already seeded; no per-org copy required for MVP.
    }

    public function seedReminderRules(Organization $organization): void
    {
        if (ReminderRule::withoutGlobalScopes()->where('orga_id', $organization->id)->exists()) {
            return;
        }

        // Globals already seeded; no per-org copy required for MVP.
    }
}
