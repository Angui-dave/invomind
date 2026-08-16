import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./platform";
import { clients, prospects } from "./business";
import { tenantPolicy } from "./helpers";

export const conversationChannelEnum = pgEnum("conversation_channel", [
  "whatsapp",
  "messenger",
  "instagram",
  "tiktok",
]);

export const messageDirectionEnum = pgEnum("message_direction", [
  "inbound",
  "outbound",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "success",
  "failed",
  "skipped",
  "pending",
  "sent",
  "delivered",
  "read",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channel: conversationChannelEnum("channel").notNull(),
    contactName: text("contact_name").notNull(),
    contactHandle: text("contact_handle").notNull(),
    threadRef: text("thread_ref"),
    avatarInitials: text("avatar_initials"),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    prospectId: uuid("prospect_id").references(() => prospects.id, {
      onDelete: "set null",
    }),
    unreadCount: integer("unread_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: messageDirectionEnum("direction").notNull(),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    status: deliveryStatusEnum("status"),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const channelConnections = pgTable(
  "channel_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channel: conversationChannelEnum("channel").notNull(),
    externalId: text("external_id").notNull(),
    displayName: text("display_name"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    tenantPolicy(t.organizationId),
    uniqueIndex("channel_connections_channel_external_idx").on(
      t.channel,
      t.externalId,
    ),
  ],
).enableRLS();

export const webhookConfigs = pgTable(
  "webhook_configs",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    url: text("url").notNull().default(""),
    secret: text("secret").notNull().default(""),
    enabled: boolean("enabled").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const inboundMessages = pgTable(
  "inbound_messages",
  {
    id: text("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channel: conversationChannelEnum("channel").notNull(),
    handle: text("handle").notNull(),
    body: text("body").notNull(),
    sentAt: text("sent_at").notNull(),
    contactName: text("contact_name"),
    threadRef: text("thread_ref"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const deliveryAttempts = pgTable(
  "delivery_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").notNull(),
    channel: conversationChannelEnum("channel").notNull(),
    status: deliveryStatusEnum("status").notNull(),
    httpStatus: integer("http_status"),
    error: text("error"),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    durationMs: integer("duration_ms"),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();
