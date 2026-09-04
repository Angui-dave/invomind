"use client";

import { AlertCircle, Check, CheckCheck, FileIcon, Loader2 } from "lucide-react";
import {
  formatTimeFr,
  type ConversationMessage,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: ConversationMessage;
  contactName: string;
};

export function MessageBubble({ message, contactName }: MessageBubbleProps) {
  const outbound = message.direction === "outbound";
  const mediaUrl = message.mediaUrl;
  const contentType = message.contentType ?? "texte";

  return (
    <div
      className={cn(
        "flex w-full",
        outbound ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          outbound
            ? "bg-ledger text-paper"
            : "border border-line bg-muted/60 text-ink",
        )}
      >
        <p
          className={cn(
            "mb-1 text-[10px] font-medium uppercase tracking-wide",
            outbound ? "text-paper/70" : "text-ink/45",
          )}
        >
          {outbound ? "Vous" : contactName}
        </p>
        {mediaUrl && contentType === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt={message.body || "Image"}
            className="mb-2 max-h-64 max-w-full rounded-lg object-contain"
          />
        ) : null}
        {mediaUrl && contentType === "audio" ? (
          <audio controls className="mb-2 max-w-full" src={mediaUrl}>
            <track kind="captions" />
          </audio>
        ) : null}
        {mediaUrl && contentType === "video" ? (
          <video
            controls
            className="mb-2 max-h-64 max-w-full rounded-lg"
            src={mediaUrl}
          >
            <track kind="captions" />
          </video>
        ) : null}
        {mediaUrl && contentType === "fichier" ? (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "mb-2 flex items-center gap-2 underline",
              outbound ? "text-paper" : "text-ledger",
            )}
          >
            <FileIcon className="size-4 shrink-0" aria-hidden />
            Télécharger le fichier
          </a>
        ) : null}
        {message.body && message.body !== "[média]" ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.body}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            outbound ? "text-paper/65" : "text-ink/40",
          )}
        >
          <span className="num">{formatTimeFr(message.sentAt)}</span>
          {outbound && message.status && (
            <span aria-label={message.status}>
              {message.status === "pending" ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : message.status === "failed" ? (
                <AlertCircle className="size-3 text-brick" aria-hidden />
              ) : message.status === "read" ? (
                <CheckCheck className="size-3 text-brass" aria-hidden />
              ) : message.status === "delivered" ? (
                <CheckCheck className="size-3" aria-hidden />
              ) : (
                <Check className="size-3" aria-hidden />
              )}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
