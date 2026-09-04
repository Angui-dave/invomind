<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nom' => 'Loyer', 'couleur' => '#16213E'],
            ['nom' => 'Salaires', 'couleur' => '#B23A48'],
            ['nom' => 'Fournitures de bureau', 'couleur' => '#C9CCC3'],
            ['nom' => 'Marketing & Publicité', 'couleur' => '#B08D57'],
            ['nom' => 'Transport & Logistique', 'couleur' => '#2F6E5B'],
            ['nom' => 'Abonnements logiciels', 'couleur' => '#2F6E5B'],
            ['nom' => 'Impôts & Taxes', 'couleur' => '#16213E'],
            ['nom' => 'Autres', 'couleur' => '#888888'],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::query()->updateOrCreate(
                ['orga_id' => null, 'nom' => $category['nom']],
                ['actif' => true, 'couleur' => $category['couleur']],
            );
        }
    }
}
