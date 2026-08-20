"use server";

import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { assertAllowedCheckoutUrl } from "@/lib/security/safe-redirect";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type ActionResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

const PortalCheckoutSchema = z.object({
  token: z.string().min(4),
  methodHint: z.enum(["wave", "orange_money", "mtn", "moov", "card"]),
  customerPhone: z.string().max(32).optional(),
});

export async function startPortalCheckout(
  input: z.infer<typeof PortalCheckoutSchema>,
): Promise<ActionResult> {
  const parsed = PortalCheckoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Paiement invalide" };

  const limited = consumeRateLimit(
    `portal-checkout:${parsed.data.token}`,
    10,
    60_000,
  );
  if (!limited.ok) {
    return {
      ok: false,
      error: `Trop de tentatives. Réessayez dans ${limited.retryAfterSec}s.`,
    };
  }

  if (!isLaravelApiEnabled()) {
    return {
      ok: false,
      error: "Le paiement en ligne n’est disponible qu’avec l’API Laravel.",
    };
  }

  try {
    const payload = await laravelRequest<{
      payment_intent?: { id?: string; checkout_url?: string | null };
    }>(`/portal/${parsed.data.token}/checkout`, {
      method: "POST",
      body: {
        method_hint: parsed.data.methodHint,
        customer_phone: parsed.data.customerPhone || undefined,
      },
    });
    const checkoutUrl = payload.payment_intent?.checkout_url;
    if (!checkoutUrl) {
      return { ok: false, error: "Lien de paiement indisponible." };
    }
    const safeUrl = assertAllowedCheckoutUrl(checkoutUrl);
    if (!safeUrl) {
      return {
        ok: false,
        error: "URL de paiement refusée (hôte non autorisé).",
      };
    }
    return { ok: true, checkoutUrl: safeUrl };
  } catch (error) {
    return {
      ok: false,
      error: actionErrorMessage(error, "Paiement impossible"),
    };
  }
}
