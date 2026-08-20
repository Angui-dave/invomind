import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { LaravelApiError, laravelRequestBinary } from "@/lib/laravel/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isLaravelApiEnabled()) {
    return Response.json(
      { message: "Le PDF n’est pas disponible en mode mock." },
      { status: 409 },
    );
  }

  try {
    const session = await verifySession();
    const token = (await readSessionCookie())?.accessToken;
    const { bytes, contentType, contentDisposition } =
      await laravelRequestBinary(`/documents/${id}/pdf`, {
        token,
        organizationId: session.organizationId,
      });

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
    });
    if (contentDisposition) {
      headers.set("Content-Disposition", contentDisposition);
    }

    return new Response(bytes, { status: 200, headers });
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
