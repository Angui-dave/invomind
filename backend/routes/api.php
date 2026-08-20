<?php

use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\ProspectController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\WebhookConfigController;
use App\Http\Controllers\Api\Webhooks\MetaWebhookController;
use App\Http\Controllers\Api\Webhooks\StripeWebhookController;
use App\Http\Controllers\Api\Webhooks\TiktokWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth (public)
|--------------------------------------------------------------------------
*/
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Portal (public, token-based)
|--------------------------------------------------------------------------
*/
Route::get('/portal/{token}', [PortalController::class, 'show']);
Route::post('/portal/{token}/pay', [PortalController::class, 'pay']);

/*
|--------------------------------------------------------------------------
| Webhooks (public, signature-verified)
|--------------------------------------------------------------------------
*/
Route::get('/webhooks/meta', [MetaWebhookController::class, 'verify']);
Route::post('/webhooks/meta', [MetaWebhookController::class, 'handle']);
Route::post('/webhooks/tiktok', [TiktokWebhookController::class, 'handle']);
Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle']);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | Tenant-scoped routes
    |----------------------------------------------------------------------
    */
    Route::middleware(['tenant'])->group(function () {

        // Organization
        Route::get('/organization', [OrganizationController::class, 'show']);
        Route::get('/organization/entitlements', [OrganizationController::class, 'entitlements']);

        // Organization settings (admin only)
        Route::middleware(['admin'])->group(function () {
            Route::put('/organization/settings', [OrganizationController::class, 'updateCompanySettings']);
            Route::put('/organization/tax', [OrganizationController::class, 'updateTaxSettings']);
            Route::put('/organization/banking', [OrganizationController::class, 'updateBankingSettings']);
            Route::put('/organization/reminders', [OrganizationController::class, 'updateReminders']);
            Route::put('/organization/payments', [OrganizationController::class, 'updatePaymentSettings']);
            Route::put('/organization/branding', [OrganizationController::class, 'updateBranding']);
            Route::put('/organization/modules', [OrganizationController::class, 'updateModules']);

            // Webhook config
            Route::get('/conversations/webhook', [WebhookConfigController::class, 'show']);
            Route::put('/conversations/webhook', [WebhookConfigController::class, 'update']);
        });

        // Clients
        Route::get('/clients', [ClientController::class, 'index']);
        Route::post('/clients', [ClientController::class, 'store']);
        Route::put('/clients/{id}', [ClientController::class, 'update']);
        Route::delete('/clients/{id}', [ClientController::class, 'destroy']);

        // Documents (quotes, invoices, credit notes)
        Route::get('/documents', [DocumentController::class, 'index']);
        Route::get('/documents/{id}', [DocumentController::class, 'show']);
        Route::post('/documents', [DocumentController::class, 'store']);
        Route::put('/documents/{id}', [DocumentController::class, 'update']);

        // Prospects
        Route::get('/prospects', [ProspectController::class, 'index']);
        Route::post('/prospects', [ProspectController::class, 'store']);
        Route::put('/prospects/{id}/stage', [ProspectController::class, 'updateStage']);

        // Expenses
        Route::get('/expenses', [ExpenseController::class, 'index']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
        Route::get('/expense-categories', [ExpenseController::class, 'categories']);

        // Payments
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::post('/payments', [PaymentController::class, 'store']);

        // Suppliers
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::put('/suppliers/{id}', [SupplierController::class, 'update']);

        // Catalog
        Route::get('/catalog', [CatalogController::class, 'index']);
        Route::post('/catalog', [CatalogController::class, 'store']);
        Route::put('/catalog/{id}', [CatalogController::class, 'update']);

        // Conversations
        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::get('/conversations/messages', [ConversationController::class, 'messages']);
        Route::post('/conversations/send', [ConversationController::class, 'send']);
        Route::get('/conversations/inbox', [ConversationController::class, 'inbox']);

        // Reports
        Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
        Route::get('/reports/overview', [ReportController::class, 'overview']);

        // Import
        Route::post('/import/{entity}', [ImportController::class, 'import']);

        // Agents
        Route::get('/agents', [AgentController::class, 'index']);
        Route::post('/agents', [AgentController::class, 'store']);
        Route::put('/agents/{id}/enable', [AgentController::class, 'enable']);
        Route::put('/agents/{id}/disable', [AgentController::class, 'disable']);

        // Email templates
        Route::get('/email-templates', [EmailTemplateController::class, 'index']);
        Route::put('/email-templates/{milestone}', [EmailTemplateController::class, 'update']);
    });
});
