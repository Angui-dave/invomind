<?php

use Database\Seeders\PlanSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        (new PlanSeeder)->run();
    }

    public function down(): void
    {
        // Catalog rows stay: organizations.plan_id references plans.id.
    }
};
