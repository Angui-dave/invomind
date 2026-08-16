/**
 * In-memory webhook store.
 * Configuration and delivery logs reset on server restart and do not
 * survive multi-instance deployments. Swap this module for a database later.
 */

import type {
  DeliveryAttempt,
  InboundMessage,
  MaskedWebhookConfig,
  WebhookConfig,
} from "@/lib/webhooks/types";

const INBOUND_CAP = 500;
const DELIVERIES_CAP = 50;

let config: WebhookConfig = {
  url: process.env.CONVERSATIONS_WEBHOOK_URL ?? "",
  secret: process.env.CONVERSATIONS_WEBHOOK_SECRET ?? "",
  enabled: Boolean(process.env.CONVERSATIONS_WEBHOOK_URL),
};

const inbound: InboundMessage[] = [];
const deliveries: DeliveryAttempt[] = [];

export function getConfig(): WebhookConfig {
  return { ...config };
}

export function setConfig(patch: Partial<WebhookConfig>): WebhookConfig {
  config = {
    ...config,
    ...patch,
    // Keep existing secret when patch.secret is empty / undefined
    secret:
      patch.secret !== undefined && patch.secret.length > 0
        ? patch.secret
        : config.secret,
  };
  return getConfig();
}

export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 4) return "••••";
  return `••••${secret.slice(-4)}`;
}

export function getMaskedConfig(): MaskedWebhookConfig {
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

export function appendInbound(messages: InboundMessage[]): void {
  for (const message of messages) {
    if (inbound.some((m) => m.id === message.id)) continue;
    inbound.push(message);
  }
  if (inbound.length > INBOUND_CAP) {
    inbound.splice(0, inbound.length - INBOUND_CAP);
  }
}

export function inboundSince(iso?: string | null): InboundMessage[] {
  if (!iso) return [...inbound];
  return inbound.filter((m) => m.sentAt > iso);
}

export function logDelivery(attempt: DeliveryAttempt): void {
  deliveries.unshift(attempt);
  if (deliveries.length > DELIVERIES_CAP) {
    deliveries.length = DELIVERIES_CAP;
  }
}

export function recentDeliveries(limit = 20): DeliveryAttempt[] {
  return deliveries.slice(0, limit);
}
