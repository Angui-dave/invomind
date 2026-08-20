import "server-only";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method?: ApiMethod;
  token?: string;
  organizationId?: string;
  body?: unknown;
  cache?: RequestCache;
};

function isPublicApiPath(path: string): boolean {
  return (
    path === "/auth/register" ||
    path === "/auth/login" ||
    path === "/auth/forgot-password" ||
    path === "/auth/reset-password" ||
    path === "/auth/invitations/accept" ||
    path === "/auth/email/resend" ||
    path.startsWith("/portal/") ||
    path.startsWith("/webhooks/")
  );
}

export class LaravelApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
  }
}

function apiBaseUrl(): string {
  const url = process.env.LARAVEL_API_URL;
  if (!url) {
    throw new Error(
      "LARAVEL_API_URL is not configured (set LARAVEL_API_URL in frontend .env)",
    );
  }
  return url.replace(/\/+$/, "");
}

export async function laravelRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${apiBaseUrl()}${normalizedPath}`;
  const headers = new Headers({ Accept: "application/json" });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options.organizationId) {
    headers.set("X-Organization-Id", options.organizationId);
  }

  if (
    (options.method === "POST" ||
      options.method === "PUT" ||
      options.method === "DELETE") &&
    !options.token &&
    !isPublicApiPath(normalizedPath)
  ) {
    throw new LaravelApiError(
      `API auth manquante pour ${options.method ?? "GET"} ${normalizedPath}`,
      401,
    );
  }

  const timeoutMs = Number(process.env.LARAVEL_TIMEOUT_MS ?? 10_000);
  const controller = new AbortController();
  const timer =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      cache: options.cache ?? "no-store",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (timer) clearTimeout(timer);
    if (error instanceof Error && error.name === "AbortError") {
      throw new LaravelApiError(
        `API timeout after ${timeoutMs}ms on ${normalizedPath}`,
        504,
      );
    }
    throw error;
  }
  if (timer) clearTimeout(timer);

  const raw = await response.text();
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  let payload: unknown = raw;
  if (response.status === 204 || response.status === 205 || raw === "") {
    payload = null;
  } else if (isJson) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const detail =
      typeof payload === "object" &&
      payload !== null &&
      "errors" in payload &&
      typeof payload.errors === "object"
        ? ` | ${JSON.stringify(payload.errors)}`
        : "";
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `API request failed (${response.status}) on ${normalizedPath}${detail}`;
    throw new LaravelApiError(
      `${message} [${options.method ?? "GET"} ${normalizedPath}]`,
      response.status,
      payload,
    );
  }

  return payload as T;
}

export async function laravelRequestBinary(
  path: string,
  options: RequestOptions = {},
): Promise<{
  bytes: ArrayBuffer;
  contentType: string;
  contentDisposition: string | null;
  status: number;
}> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${apiBaseUrl()}${normalizedPath}`;
  const headers = new Headers({ Accept: "application/pdf, application/json" });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options.organizationId) {
    headers.set("X-Organization-Id", options.organizationId);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `API request failed (${response.status}) on ${normalizedPath}`;
    throw new LaravelApiError(message, response.status, payload);
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "application/pdf",
    contentDisposition: response.headers.get("content-disposition"),
    status: response.status,
  };
}

