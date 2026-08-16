import type { ConversationChannel } from "@/lib/data/conversations";

export interface WebhookConfig {
  url: string;
  secret: string;
  enabled: boolean;
}

export type DeliveryStatus = "success" | "failed" | "skipped";

export interface DeliveryAttempt {
  id: string;
  conversationId: string;
  channel: ConversationChannel;
  status: DeliveryStatus;
  httpStatus?: number;
  error?: string;
  attemptedAt: string;
  durationMs: number;
}

export interface InboundMessage {
  id: string;
  channel: ConversationChannel;
  handle: string;
  contactName?: string;
  body: string;
  sentAt: string;
}

export interface MaskedWebhookConfig {
  url: string;
  secretMasked: string;
  hasSecret: boolean;
  enabled: boolean;
  metaVerifyConfigured: boolean;
  metaAppSecretConfigured: boolean;
}

export interface SendMessagePayload {
  conversationId: string;
  channel: ConversationChannel;
  to: string;
  body: string;
}
