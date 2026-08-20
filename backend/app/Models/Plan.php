<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'name', 'price', 'price_label', 'description', 'features',
        'limit_label', 'highlighted', 'max_invoices_per_month', 'max_clients',
        'max_agents', 'auto_reminders', 'online_payments', 'pipeline', 'conversations',
        'reports', 'expenses', 'catalog', 'import_tool',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'highlighted' => 'boolean',
            'auto_reminders' => 'boolean',
            'online_payments' => 'boolean',
            'pipeline' => 'boolean',
            'conversations' => 'boolean',
            'reports' => 'boolean',
            'expenses' => 'boolean',
            'catalog' => 'boolean',
            'import_tool' => 'boolean',
        ];
    }
}
