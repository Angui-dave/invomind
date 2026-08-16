import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";

/**
 * Stripe webhook stub.
 * In mock mode (default), acknowledges without DB.
 * When Laravel owns billing, point Stripe to the Laravel endpoint instead.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  if (!stripe || !secret) {
    return NextResponse.json({
      received: true,
      mode: "mock",
      message: "Stripe non configuré — webhook ignoré",
    });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    // Persist via Laravel later; acknowledge for now
    console.info("[stripe webhook]", event.type);
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Invalid signature",
      },
      { status: 400 },
    );
  }
}
