import { describe, expect, it } from "vitest";
import { conversationStampFr } from "@/lib/formatters";

describe("conversationStampFr", () => {
  const now = new Date("2026-09-05T15:00:00");

  it("shows time for messages from today", () => {
    const stamp = conversationStampFr("2026-09-05T09:30:00", now);
    expect(stamp).toMatch(/\d{2}:\d{2}/);
  });

  it("shows Hier for yesterday", () => {
    expect(conversationStampFr("2026-09-04T18:00:00", now)).toBe("Hier");
  });

  it("shows short date for older messages", () => {
    const stamp = conversationStampFr("2026-08-20T12:00:00", now);
    expect(stamp).not.toBe("Hier");
    expect(stamp).not.toMatch(/^\d{2}:\d{2}$/);
    expect(stamp.length).toBeGreaterThan(0);
  });
});
