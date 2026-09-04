import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal/session";
import { readSessionCookie } from "@/lib/auth/session";
import { laravelRequest } from "@/lib/laravel/client";

/**
 * BFF proxy for Laravel broadcasting auth (private channels).
 */
export async function POST(request: Request) {
  try {
    const session = await verifySession();
    const token = (await readSessionCookie())?.accessToken;
    if (!token) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const body = (await request.json()) as {
      socket_id?: string;
      channel_name?: string;
    };

    const data = await laravelRequest<unknown>("/broadcasting/auth", {
      method: "POST",
      token,
      organizationId: session.organizationId,
      body: {
        socket_id: body.socket_id,
        channel_name: body.channel_name,
      },
    });

    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Auth failed";
    return NextResponse.json({ message }, { status: 403 });
  }
}
