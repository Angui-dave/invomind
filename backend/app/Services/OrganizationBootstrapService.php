<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use App\Models\Organization;

class OrganizationBootstrapService
{
    /**
     * @return list<array{name: string, color: string}>
     */
    public static function defaultExpenseCategories(): array
    {
        return [
            ['name' => 'Fournitures', 'color' => '#3B82F6'],
            ['name' => 'Loyer & locaux', 'color' => '#8B5CF6'],
            ['name' => 'Transport', 'color' => '#F59E0B'],
            ['name' => 'Marketing', 'color' => '#10B981'],
            ['name' => 'Salaires & honoraires', 'color' => '#EF4444'],
            ['name' => 'Logiciels & abonnements', 'color' => '#06B6D4'],
            ['name' => 'Divers', 'color' => '#C9CCC3'],
        ];
    }

    public function seedExpenseCategories(Organization $organization): void
    {
        if (ExpenseCategory::where('organization_id', $organization->id)->exists()) {
            return;
        }

        foreach (self::defaultExpenseCategories() as $category) {
            ExpenseCategory::create([
                'organization_id' => $organization->id,
                'name' => $category['name'],
                'color' => $category['color'],
            ]);
        }
    }
}
