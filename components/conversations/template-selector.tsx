"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listInboxTemplates,
  syncInboxTemplates,
  type MessageTemplateDto,
} from "@/lib/actions/inboxes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TemplateSelectorProps = {
  inboxId?: string;
  channel?: string;
  onSelect: (payload: {
    body: string;
    contentType: "modele";
    templatePayload: string;
  }) => void;
};

export function TemplateSelector({
  inboxId,
  channel,
  onSelect,
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplateDto[]>([]);

  const load = useCallback(async () => {
    if (!inboxId) return;
    setLoading(true);
    const result = await listInboxTemplates(inboxId);
    setLoading(false);
    if (result.ok) {
      setTemplates(result.templates);
    } else {
      toast.error(result.error);
    }
  }, [inboxId]);

  useEffect(() => {
    if (open && inboxId) {
      void load();
    }
  }, [open, inboxId, load]);

  if (channel !== "whatsapp" || !inboxId) {
    return null;
  }

  async function handleSync() {
    if (!inboxId) return;
    setSyncing(true);
    const result = await syncInboxTemplates(inboxId);
    setSyncing(false);
    if (result.ok) {
      toast.success("Modèles synchronisés depuis Meta");
      await load();
    } else {
      toast.error(result.error);
    }
  }

  function pick(t: MessageTemplateDto) {
    const payload = JSON.stringify({
      name: t.name,
      language: { code: t.language },
      components: [],
    });
    onSelect({
      body: t.preview ?? `Template: ${t.name}`,
      contentType: "modele",
      templatePayload: payload,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" />
        }
      >
        <FileText className="size-3.5" aria-hidden />
        Modèle WhatsApp
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modèles WhatsApp approuvés</DialogTitle>
        </DialogHeader>
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSync()}
            disabled={syncing}
          >
            <RefreshCw
              className={`size-3.5 ${syncing ? "animate-spin" : ""}`}
              aria-hidden
            />
            Sync Meta
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-ink/55">Chargement…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-ink/55">
            Aucun modèle approuvé. Synchronisez depuis Meta (nécessite waba_id +
            access_token sur la boîte).
          </p>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-line px-3 py-2 text-left hover:bg-muted/50"
                  onClick={() => pick(t)}
                >
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-ink/50">
                    {t.language} · {t.category}
                  </p>
                  {t.preview ? (
                    <p className="mt-1 line-clamp-2 text-xs text-ink/70">
                      {t.preview}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
