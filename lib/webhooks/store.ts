/**
 * In-memory webhook store (mock mode) — scoped per tenant DB.
 */

import "server-only";
import { resolveTenantByExternalId } from "@/lib/mock/central";
import { tenantStoreById } from "@/lib/mock/store";
import type { ConversationChannel } from "@/lib/data/conversations";
import type {
  DeliveryAttempt,
  InboundMessage,
  MaskedWebhookConfig,
  WebhookConfig,
} from "@/lib/webhooks/types";

export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 4) return "••••";
  return `••••${secret.slice(-4)}`;
}

export async function getConfig(
  organizationId: string,
): Promise<WebhookConfig> {
  const { webhook } = tenantStoreById(organizationId);
  return { ...webhook };
}

export async function setConfig(
  organizationId: string,
  patch: Partial<WebhookConfig>,
): Promise<WebhookConfig> {
  const store = tenantStoreById(organizationId);
  const nextSecret =
    patch.secret !== undefined && patch.secret.length > 0
      ? patch.secret
      : store.webhook.secret;

  store.webhook = {
    url: patch.url !== undefined ? patch.url : store.webhook.url,
    secret: nextSecret,
    enabled:
      patch.enabled !== undefined ? patch.enabled : store.webhook.enabled,
  };
  if (store.webhook.url === "" && store.webhook.enabled) {
    store.webhook.enabled = false;
  }
  return { ...store.webhook };
}

export async function getMaskedConfig(
  organizationId: string,
): Promise<MaskedWebhookConfig> {
  const config = await getConfig(organizationId);
  return {
    url: config.url,
    secretMasked: maskSecret(config.secret),
    hasSecret: config.secret.length > 0,
    enabled: config.enabled,
    metaVerifyConfigured: Boolean(process.env.META_VERIFY_TOKEN),
    metaAppSecretConfigured: Boolean(process.env.META_APP_SECRET),
    tiktokSecretConfigured: Boolean(process.env.TIKTOK_CLIENT_SECRET),
  };
}

export async function appendInbound(
  organizationId: string,
  messages: InboundMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  const store = tenantStoreById(organizationId);
  for (const message of messages) {
    if (store.inbound.some((m) => m.id === message.id)) continue;
    store.inbound.unshift(message);
  }
  store.inbound = store.inbound.slice(0, 500);
}

export async function inboundSince(
  organizationId: string,
  iso?: string | null,
): Promise<InboundMessage[]> {
  const store = tenantStoreById(organizationId);
  if (!iso) return [...store.inbound];
  return store.inbound.filter((m) => m.sentAt > iso);
}

export async function logDelivery(
  organizationId: string,
  attempt: Omit<DeliveryAttempt, "id"> & { id?: string },
): Promise<DeliveryAttempt> {
  const store = tenantStoreById(organizationId);
  const row: DeliveryAttempt = {
    id: attempt.id ?? `dlv_${Math.random().toString(36).slice(2, 8)}`,
    conversationId: attempt.conversationId,
    channel: attempt.channel,
    status: attempt.status,
    httpStatus: attempt.httpStatus,
    error: attempt.error,
    attemptedAt: attempt.attemptedAt,
    durationMs: attempt.durationMs,
  };
  store.deliveries.unshift(row);
  store.deliveries = store.deliveries.slice(0, 50);
  return row;
}

export async function recentDeliveries(
  organizationId: string,
  limit = 20,
): Promise<DeliveryAttempt[]> {
  return tenantStoreById(organizationId).deliveries.slice(0, limit);
}

export async function resolveOrgByExternalId(
  _channel: ConversationChannel | ConversationChannel[],
  externalId: string,
): Promise<string | null> {
  return resolveTenantByExternalId(externalId);
}
