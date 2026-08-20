import { isLaravelApiEnabled } from "@/lib/config";
import { LaravelApiError, laravelRequest } from "@/lib/laravel/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PortalStatusPayload = {
  payment_status?: string;
  outstanding_balance?: string | number;
  payments?: unknown[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isLaravelApiEnabled()) {
    return Response.json(
      { message: "Le statut de paiement n’est pas disponible en mode mock." },
      { status: 409 },
    );
  }

  try {
    const payload = await laravelRequest<PortalStatusPayload>(`/portal/${token}`);
    const payments = Array.isArray(payload.payments) ? payload.payments : [];

    return Response.json({
      payment_status: payload.payment_status ?? "unpaid",
      outstanding_balance: payload.outstanding_balance ?? "0.00",
      has_payments: payments.length > 0,
    });
  } catch (error) {
    if (error instanceof LaravelApiError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
