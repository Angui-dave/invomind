import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal/session";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { laravelRequest, LaravelApiError } from "@/lib/laravel/client";
import { mapInbox } from "@/lib/laravel/mappers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    await verifySession();
    if (!isLaravelApiEnabled()) {
      return NextResponse.json(
        { ok: false, message: "API Laravel requise" },
        { status: 503 },
      );
    }

    const { id } = await context.params;
    const token = (await readSessionCookie())?.accessToken;
    const session = await verifySession();

    const result = await laravelRequest<{
      ok?: boolean;
      message?: string;
      data?: unknown;
    }>(`/inboxes/${id}/test`, {
      method: "POST",
      token,
      organizationId: session.organizationId,
      body: {},
    });

    return NextResponse.json({
      ok: result.ok !== false,
      message: result.message ?? "Boîte connectée",
      data: result.data ? mapInbox(result.data) : undefined,
    });
  } catch (e) {
    if (e instanceof LaravelApiError) {
      const payload = e.payload as { message?: string; data?: unknown } | null;
      return NextResponse.json(
        {
          ok: false,
          message: payload?.message ?? e.message,
          data: payload?.data ? mapInbox(payload.data) : undefined,
        },
        { status: e.status || 422 },
      );
    }
    const message = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
