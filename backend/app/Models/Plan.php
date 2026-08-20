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
        'auto_reminders', 'online_payments', 'pipeline', 'conversations',
        'reports', 'stripe_price_id',
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
        ];
    }
}
