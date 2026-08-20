<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationSettings extends Model
{
    protected $table = 'organization_settings';

    protected $primaryKey = 'organization_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'company_name', 'email', 'phone', 'address', 'city',
        'postal_code', 'country', 'tax_id', 'default_currency', 'default_tax_mode',
        'default_tax_rate', 'bank_name', 'iban', 'bic', 'qr_iban', 'twint_number',
        'mobile_money_provider', 'mobile_money_number', 'legal_mentions',
        'reminders_enabled', 'reminder_cadence', 'payment_connected',
        'accepted_payment_methods', 'psp_provider', 'psp_site_id',
        'psp_api_key', 'psp_environment',
    ];

    protected $hidden = [
        'psp_api_key',
    ];

    protected function casts(): array
    {
        return [
            'reminder_cadence' => 'array',
            'accepted_payment_methods' => 'array',
            'reminders_enabled' => 'boolean',
            'payment_connected' => 'boolean',
            'psp_api_key' => 'encrypted',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
