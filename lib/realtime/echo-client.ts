"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import type { ChannelAuthorizationCallback } from "pusher-js";

type ChannelAuthorizationData = NonNullable<
  Parameters<ChannelAuthorizationCallback>[1]
>;

type EchoInstance = Echo<"reverb">;

let echoSingleton: EchoInstance | null = null;

/**
 * Browser-only Laravel Echo client pointed at Reverb.
 * Returns null when realtime env is not configured or when run on the server.
 */
export function getEcho(): EchoInstance | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";

  if (!key) return null;

  if (echoSingleton) return echoSingleton;

  (window as unknown as { Pusher: unknown }).Pusher = Pusher;

  const apiBase =
    process.env.NEXT_PUBLIC_LARAVEL_API_URL ??
    process.env.LARAVEL_API_URL ??
    "http://localhost:8000/api";

  echoSingleton = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiBase.replace(/\/$/, "")}/broadcasting/auth`,
    auth: {
      headers: {
        // Cookie-based Sanctum SPA auth may not apply; Bearer is set by a
        // short-lived cookie reader in the BFF if needed. For local Reverb,
        // channel auth uses Sanctum token from Authorization when available.
        Accept: "application/json",
        "X-Organization-Id":
          document.cookie
            .split("; ")
            .find((c) => c.startsWith("invomind_org="))
            ?.split("=")[1] ?? "",
      },
    },
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (
          error: Error | null,
          data: ChannelAuthorizationData | null,
        ) => void,
      ) => {
        void fetch("/api/realtime/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(async (res) => {
            const data = (await res.json()) as ChannelAuthorizationData;
            callback(res.ok ? null : new Error("Broadcasting auth failed"), data);
          })
          .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
      },
    }),
  }) as EchoInstance;

  return echoSingleton;
}
