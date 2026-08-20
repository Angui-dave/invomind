import { describe, expect, it } from "vitest";
import {
  mapClient,
  mapConversationSendStatus,
  mapDocument,
  mapInboundMessage,
  mapWebhookConfigResponse,
} from "@/lib/laravel/mappers";
import { unwrapList } from "@/lib/laravel/pagination";

describe("laravel mappers", () => {
  it("maps client snake_case", () => {
    const client = mapClient({
      id: "c1",
      name: "Aminata",
      company: "SARL",
      email: "a@test.com",
      postal_code: "10000",
      tax_id: "SN1",
      payment_term_days: 30,
      reminders_enabled: true,
      portal_token: "tok",
    });
    expect(client.postalCode).toBe("10000");
    expect(client.taxId).toBe("SN1");
    expect(client.paymentTermDays).toBe(30);
    expect(client.portalToken).toBe("tok");
  });

  it("maps document frozen and pdf flags", () => {
    const doc = mapDocument({
      id: "d1",
      kind: "invoice",
      number: "F-2026-001",
      client_id: "c1",
      client_name: "Aminata",
      status: "sent",
      currency: "XOF",
      tax_mode: "exclusive",
      issue_date: "2026-08-01",
      due_date: "2026-09-01",
      total: 118000,
      subtotal_ht: 100000,
      tax_total: 18000,
      online_payment_enabled: true,
      reminders_enabled: false,
      reminders: [],
      portal_token: "p",
      frozen: true,
      pdf_ready: true,
      lines: [],
    });
    expect(doc.frozen).toBe(true);
    expect(doc.pdfReady).toBe(true);
    expect(doc.subtotalHt).toBe(100000);
  });

  it("maps inbound messages for inbox polling", () => {
    const msg = mapInboundMessage({
      id: "m1",
      channel: "whatsapp",
      handle: "221770000000",
      contact_name: "Kofi",
      body: "Bonjour",
      sent_at: "2026-08-20T10:00:00+00:00",
      thread_ref: "t1",
    });
    expect(msg.contactName).toBe("Kofi");
    expect(msg.sentAt).toBe("2026-08-20T10:00:00+00:00");
    expect(msg.threadRef).toBe("t1");
  });

  it("maps webhook config and deliveries", () => {
    const mapped = mapWebhookConfigResponse({
      config: {
        url: "https://hooks.example.com/hook",
        enabled: true,
        has_secret: true,
        meta_verify_configured: true,
        meta_app_secret_configured: false,
        tiktok_secret_configured: true,
      },
      deliveries: [
        {
          id: "d1",
          conversation_id: "c1",
          channel: "whatsapp",
          status: "success",
          http_status: 200,
          attempted_at: "2026-08-20T10:00:00Z",
          duration_ms: 120,
        },
      ],
    });
    expect(mapped.config.hasSecret).toBe(true);
    expect(mapped.config.metaVerifyConfigured).toBe(true);
    expect(mapped.deliveries[0]?.conversationId).toBe("c1");
    expect(mapped.deliveries[0]?.durationMs).toBe(120);
  });

  it("normalizes conversation send status from Laravel shape", () => {
    expect(
      mapConversationSendStatus({
        message: { id: "1" },
        delivery: { status: "success" },
      }).status,
    ).toBe("success");
    expect(mapConversationSendStatus({ status: "skipped" }).status).toBe(
      "skipped",
    );
  });
});

describe("unwrapList", () => {
  it("accepts a bare array or a paginated envelope", () => {
    expect(unwrapList([{ id: "1" }])).toHaveLength(1);
    expect(unwrapList({ data: [{ id: "2" }], meta: { total: 1 } })).toEqual([
      { id: "2" },
    ]);
    expect(unwrapList(null)).toEqual([]);
  });
});
