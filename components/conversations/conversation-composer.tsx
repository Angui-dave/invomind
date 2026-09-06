"use client";

import { useState } from "react";
import { Link2, Maximize2, Minimize2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BusinessDocument } from "@/lib/documents";
import { portalUrl } from "@/lib/data/clients";
import type { Conversation } from "@/lib/data/conversations";
import { latestOpenInvoiceToken } from "@/lib/data/derive";
import { cn } from "@/lib/utils";

export type SendPayload = {
  body: string;
  contentType?: "texte" | "image" | "fichier" | "audio" | "video" | "modele";
  mediaUrl?: string;
};

type ConversationComposerProps = {
  conversation: Conversation;
  invoices?: BusinessDocument[];
  onSend: (payload: SendPayload | string) => void | Promise<void>;
  composeExtra?: React.ReactNode;
};

function detectContentType(
  url: string,
): "image" | "audio" | "video" | "fichier" {
  const lower = url.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp)(\?|$)/.test(lower)) return "image";
  if (/\.(mp3|ogg|opus|wav|m4a)(\?|$)/.test(lower)) return "audio";
  if (/\.(mp4|webm|mov)(\?|$)/.test(lower)) return "video";
  return "fichier";
}

export function ConversationComposer({
  conversation,
  invoices = [],
  onSend,
  composeExtra,
}: ConversationComposerProps) {
  const [draft, setDraft] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleSend() {
    const body = draft.trim();
    const media = mediaUrl.trim();
    if (!body && !media) {
      toast.error("Le message ne peut pas être vide");
      return;
    }
    if (media) {
      void onSend({
        body: body || "[média]",
        contentType: detectContentType(media),
        mediaUrl: media,
      });
    } else {
      void onSend({ body, contentType: "texte" });
    }
    setDraft("");
    setMediaUrl("");
    setShowMediaInput(false);
  }

  function insertPaymentLink() {
    if (!conversation.clientId) {
      toast.error("Aucun client associé pour un lien de paiement");
      return;
    }
    const token = latestOpenInvoiceToken(conversation.clientId, invoices);
    if (!token) {
      toast.error("Aucune facture ouverte pour ce client");
      return;
    }
    const url = portalUrl(token);
    setDraft((prev) => (prev.trim() ? `${prev.trim()}\n${url}` : url));
    toast.success("Lien de paiement inséré");
  }

  return (
    <div className="shrink-0 border-t border-line bg-paper p-3 sm:p-4">
      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-ink">
            Répondre
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-ink/50 hover:text-ink"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Réduire la zone de saisie" : "Agrandir la zone de saisie"}
          >
            {expanded ? (
              <Minimize2 className="size-3.5" aria-hidden />
            ) : (
              <Maximize2 className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>

        {showMediaInput && (
          <div className="flex items-center gap-2 px-3 pt-2">
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="URL publique du média (https://…)"
              className="h-8"
            />
            {mediaUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setMediaUrl("")}
                aria-label="Retirer le média"
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            ) : null}
          </div>
        )}

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Maj+Entrée pour une nouvelle ligne."
          className={cn(
            "min-h-[72px] resize-none rounded-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent",
            expanded ? "max-h-56" : "max-h-32",
          )}
          rows={expanded ? 5 : 3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full bg-muted text-ink/70 hover:bg-muted/80 hover:text-ink"
                    onClick={insertPaymentLink}
                    disabled={!conversation.clientId}
                    aria-label="Insérer le lien de paiement"
                  />
                }
              >
                <Link2 className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent className="bg-ink text-paper border-ink">
                Insérer le lien de paiement
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "rounded-full bg-muted text-ink/70 hover:bg-muted/80 hover:text-ink",
                      showMediaInput && "bg-ledger/15 text-ledger",
                    )}
                    onClick={() => setShowMediaInput((v) => !v)}
                    aria-label="Joindre un média"
                  />
                }
              >
                <Paperclip className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent className="bg-ink text-paper border-ink">
                Média
              </TooltipContent>
            </Tooltip>

            {composeExtra}
          </div>

          <Button
            type="button"
            size="sm"
            className="rounded-lg bg-ledger px-3 text-paper hover:bg-ledger/90"
            onClick={handleSend}
          >
            Envoyer (Entrée)
          </Button>
        </div>
      </div>
    </div>
  );
}
