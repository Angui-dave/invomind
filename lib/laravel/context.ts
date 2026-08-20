import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";

export async function getApiContext() {
  const session = await verifySession();
  const payload = await readSessionCookie();
  const token = payload?.accessToken;
  const organizationId = session.organizationId;

  if (isLaravelApiEnabled() && !token) {
    throw new Error("Session API invalide: token d'accès manquant");
  }
  if (isLaravelApiEnabled() && !organizationId) {
    throw new Error("Session API invalide: organisation manquante");
  }

  return {
    session,
    organizationId,
    token,
  };
}

