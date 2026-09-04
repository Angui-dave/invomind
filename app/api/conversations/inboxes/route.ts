import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal/session";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { laravelRequest } from "@/lib/laravel/client";
import { unwrapList } from "@/lib/laravel/pagination";
import { mapInbox } from "@/lib/laravel/mappers";

export async function GET() {
  try {
    await verifySession();
    if (!isLaravelApiEnabled()) {
      return NextResponse.json([]);
    }
    const token = (await readSessionCookie())?.accessToken;
    const session = await verifySession();
    const rows = unwrapList(
      await laravelRequest<unknown>("/inboxes", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return NextResponse.json(rows.map(mapInbox));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ message }, { status: 403 });
  }
}
