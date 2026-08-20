<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_branding', function (Blueprint $table) {
            $table->text('font_family')->default('Inter')->after('accent_color');
            $table->text('document_template')->default('classic')->after('font_family');
            $table->text('locale')->default('fr-SN')->after('document_template');
            $table->string('currency', 3)->default('XOF')->after('locale');
        });
    }

    public function down(): void
    {
        Schema::table('organization_branding', function (Blueprint $table) {
            $table->dropColumn(['font_family', 'document_template', 'locale', 'currency']);
        });
    }
};
