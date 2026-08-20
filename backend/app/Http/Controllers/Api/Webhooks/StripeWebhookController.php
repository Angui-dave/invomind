<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');
        $stripeKey = config('services.stripe.secret');

        if (! $secret || ! $stripeKey) {
            return response()->json(['status' => 'ok', 'mode' => 'mock']);
        }

        $signature = $request->header('stripe-signature', '');
        $payload = $request->getContent();

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $signature, $secret);
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook signature verification failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        match ($event->type) {
            'customer.subscription.created',
            'customer.subscription.updated' => $this->handleSubscriptionUpdate($event->data->object),
            'customer.subscription.deleted' => $this->handleSubscriptionCanceled($event->data->object),
            'invoice.paid' => $this->handleInvoicePaid($event->data->object),
            default => null,
        };

        return response()->json(['status' => 'ok']);
    }

    private function handleSubscriptionUpdate(object $sub): void
    {
        $subscription = Subscription::where('stripe_subscription_id', $sub->id)->first();
        if (! $subscription) {
            return;
        }

        $subscription->update([
            'status' => $sub->status === 'active' ? 'active' : 'past_due',
            'current_period_start' => $sub->current_period_start
                ? date('c', $sub->current_period_start) : null,
            'current_period_end' => $sub->current_period_end
                ? date('c', $sub->current_period_end) : null,
        ]);
    }

    private function handleSubscriptionCanceled(object $sub): void
    {
        Subscription::where('stripe_subscription_id', $sub->id)
            ->update(['status' => 'canceled', 'plan_id' => 'free']);
    }

    private function handleInvoicePaid(object $invoice): void
    {
        $subscription = Subscription::where('stripe_customer_id', $invoice->customer)->first();
        if (! $subscription) {
            return;
        }

        SubscriptionInvoice::create([
            'organization_id' => $subscription->organization_id,
            'date' => date('Y-m-d', $invoice->created),
            'description' => $invoice->description ?? 'Subscription payment',
            'amount' => $invoice->amount_paid / 100,
            'currency' => strtoupper($invoice->currency),
            'status' => 'paid',
            'stripe_invoice_id' => $invoice->id,
        ]);
    }
}
