<?php

use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\InboxController;
use App\Http\Controllers\Api\LabelController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\Webhooks\CinetPayWebhookController;
use App\Http\Controllers\Api\Webhooks\MetaWebhookController;
use App\Http\Controllers\Api\Webhooks\TiktokWebhookController;
use Illuminate\Broadcasting\BroadcastController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth (public)
|--------------------------------------------------------------------------
*/
Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware('throttle:register');
Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:forgot-password');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])
    ->middleware('throttle:reset-password');
Route::get('/auth/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');
Route::post('/auth/email/resend', [AuthController::class, 'resendVerification'])
    ->middleware('throttle:forgot-password');

/*
|--------------------------------------------------------------------------
| Portal (public, uuid-based)
|--------------------------------------------------------------------------
*/
Route::get('/portal/{token}', [PortalController::class, 'show']);
Route::get('/portal/{token}/pdf', [PortalController::class, 'pdf'])
    ->middleware('throttle:portal-pdf');
Route::get('/portal/{token}/receipt.pdf', [PortalController::class, 'receipt'])
    ->middleware('throttle:portal-pdf');
Route::post('/portal/{token}/pay', [PortalController::class, 'pay']);
Route::post('/portal/{token}/checkout', [PortalController::class, 'checkout'])
    ->middleware('throttle:portal-checkout');

/*
|--------------------------------------------------------------------------
| Webhooks
|--------------------------------------------------------------------------
*/
Route::post('/webhooks/cinetpay', [CinetPayWebhookController::class, 'handle']);
Route::get('/webhooks/cinetpay', [CinetPayWebhookController::class, 'handle'])
    ->middleware('throttle:60,1');

Route::get('/webhooks/meta', [MetaWebhookController::class, 'verify'])
    ->middleware('throttle:60,1');
Route::post('/webhooks/meta', [MetaWebhookController::class, 'handle'])
    ->middleware('throttle:120,1');
Route::post('/webhooks/tiktok', [TiktokWebhookController::class, 'handle'])
    ->middleware('throttle:120,1');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate']);

    Route::middleware(['tenant'])->group(function () {
        Route::get('/organization', [OrganizationController::class, 'show']);
        Route::get('/organization/entitlements', [OrganizationController::class, 'entitlements']);

        Route::middleware(['admin'])->group(function () {
            Route::put('/organization', [OrganizationController::class, 'update']);

            Route::post('/billing/change-plan', [BillingController::class, 'changePlan']);
            Route::post('/billing/checkout', [BillingController::class, 'checkout'])
                ->middleware('throttle:portal-checkout');
            Route::post('/billing/cancel', [BillingController::class, 'cancel']);

            Route::get('/agents', [AgentController::class, 'index']);
            Route::post('/agents', [AgentController::class, 'store']);
            Route::put('/agents/{id}/enable', [AgentController::class, 'enable']);
            Route::put('/agents/{id}/disable', [AgentController::class, 'disable']);

            Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
            Route::get('/reports/overview', [ReportController::class, 'overview']);

            Route::get('/inboxes', [InboxController::class, 'index']);
            Route::post('/inboxes', [InboxController::class, 'store']);
            Route::put('/inboxes/{id}', [InboxController::class, 'update']);
            Route::post('/inboxes/{id}/test', [InboxController::class, 'testConnection']);
            Route::delete('/inboxes/{id}', [InboxController::class, 'destroy']);
            Route::post('/inboxes/{id}/templates/sync', [TemplateController::class, 'sync']);
        });

        Route::get('/inboxes/{id}/templates', [TemplateController::class, 'index']);

        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::get('/conversations/unread-total', [ConversationController::class, 'unreadTotal']);
        Route::get('/conversations/messages-batch', [ConversationController::class, 'messagesBatch']);
        Route::get('/conversations/{id}', [ConversationController::class, 'show']);
        Route::get('/conversations/{id}/messages', [ConversationController::class, 'messages']);
        Route::post('/conversations/{id}/messages', [ConversationController::class, 'sendMessage']);
        Route::put('/conversations/{id}/status', [ConversationController::class, 'updateStatus']);
        Route::put('/conversations/{id}/assign', [ConversationController::class, 'assign']);
        Route::post('/conversations/{id}/read', [ConversationController::class, 'markRead']);
        Route::put('/conversations/{id}/contact', [ConversationController::class, 'linkClient']);
        Route::post('/conversations/{id}/labels/{labelId}', [ConversationController::class, 'attachLabel']);
        Route::delete('/conversations/{id}/labels/{labelId}', [ConversationController::class, 'detachLabel']);

        Route::get('/labels', [LabelController::class, 'index']);
        Route::post('/labels', [LabelController::class, 'store']);
        Route::delete('/labels/{id}', [LabelController::class, 'destroy']);

        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);
        Route::post('/clients', [ClientController::class, 'store']);
        Route::put('/clients/{id}', [ClientController::class, 'update']);
        Route::delete('/clients/{id}', [ClientController::class, 'destroy']);

        Route::get('/quotes', [QuoteController::class, 'index']);
        Route::get('/quotes/{id}', [QuoteController::class, 'show']);
        Route::post('/quotes', [QuoteController::class, 'store']);
        Route::put('/quotes/{id}', [QuoteController::class, 'update']);
        Route::put('/quotes/{id}/status', [QuoteController::class, 'updateStatus']);
        Route::post('/quotes/{id}/convert', [InvoiceController::class, 'convertFromQuote']);

        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
        Route::put('/invoices/{id}/status', [InvoiceController::class, 'updateStatus']);

        Route::get('/expenses', [ExpenseController::class, 'index']);
        Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
        Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

        Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
        Route::post('/expense-categories', [ExpenseCategoryController::class, 'store']);
        Route::put('/expense-categories/{id}', [ExpenseCategoryController::class, 'update']);
        Route::delete('/expense-categories/{id}', [ExpenseCategoryController::class, 'destroy']);

        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

        Route::get('/payments', [PaymentController::class, 'index']);
        Route::post('/payments', [PaymentController::class, 'store']);

        Route::get('/catalog', [CatalogController::class, 'index']);
        Route::post('/catalog', [CatalogController::class, 'store']);
        Route::put('/catalog/{id}', [CatalogController::class, 'update']);
    });
});
