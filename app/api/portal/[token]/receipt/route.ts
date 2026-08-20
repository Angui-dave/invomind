import { isLaravelApiEnabled } from "@/lib/config";
import { LaravelApiError, laravelRequestBinary } from "@/lib/laravel/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isLaravelApiEnabled()) {
    return Response.json(
      { message: "Le reçu n’est pas disponible en mode mock." },
      { status: 409 },
    );
  }

  try {
    const { bytes, contentType, contentDisposition } =
      await laravelRequestBinary(`/portal/${token}/receipt.pdf`);

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
