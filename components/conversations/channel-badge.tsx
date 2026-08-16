"use client";

import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CHANNEL_LABELS,
  type ConversationChannel,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const channelStyles: Record<ConversationChannel, string> = {
  whatsapp: "bg-whatsapp/12 text-whatsapp border-whatsapp/35",
  messenger: "bg-messenger/12 text-messenger border-messenger/35",
};

const channelDotStyles: Record<ConversationChannel, string> = {
  whatsapp: "bg-whatsapp",
  messenger: "bg-messenger",
};

type ChannelBadgeProps = {
  channel: ConversationChannel;
  variant?: "pill" | "dot";
  className?: string;
};

export function ChannelBadge({
  channel,
  variant = "pill",
  className,
}: ChannelBadgeProps) {
  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-block size-2.5 shrink-0 rounded-full",
          channelDotStyles[channel],
          className,
        )}
        title={CHANNEL_LABELS[channel]}
        aria-label={CHANNEL_LABELS[channel]}
      />
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm font-sans text-xs font-medium",
        channelStyles[channel],
        className,
      )}
    >
      <MessageCircle className="size-3" aria-hidden />
      {CHANNEL_LABELS[channel]}
    </Badge>
  );
}
