<?php

namespace App\Models;

use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    /** @use HasFactory<\Database\Factories\OrganizationFactory> */
    use HasFactory, HasPublicUuid, SoftDeletes;

    protected $table = 'organisations';

    protected $fillable = [
        'name_company',
        'full_name',
        'logo_url',
        'email',
        'phone',
        'adresse',
        'ville',
        'code_postal',
        'pays',
        'devise_defaut',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'orga_id');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'orga_id');
    }

    public function productServices(): HasMany
    {
        return $this->hasMany(ProductService::class, 'orga_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'orga_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'orga_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'orga_id');
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class, 'orga_id')->latestOfMany();
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'orga_id');
    }

    public function expenseCategories(): HasMany
    {
        return $this->hasMany(ExpenseCategory::class, 'orga_id');
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class, 'orga_id');
    }

    public function reminderRules(): HasMany
    {
        return $this->hasMany(ReminderRule::class, 'orga_id');
    }

    public function paymentIntegrations(): HasMany
    {
        return $this->hasMany(PaymentIntegration::class, 'orga_id');
    }
}
