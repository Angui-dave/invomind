"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHANNEL_LABELS, formatDateFr, formatTimeFr } from "@/lib/mock-data";
import type {
  DeliveryAttempt,
  MaskedWebhookConfig,
} from "@/lib/webhooks/types";
import { cn } from "@/lib/utils";

type WebhookResponse = {
  config: MaskedWebhookConfig;
  deliveries: DeliveryAttempt[];
};

const statusStyles: Record<DeliveryAttempt["status"], string> = {
  success: "border-brass/40 bg-brass/12 text-brass",
  failed: "border-brick/40 bg-brick/12 text-brick",
  skipped: "border-line bg-line/40 text-ink/60",
};

const statusLabels: Record<DeliveryAttempt["status"], string> = {
  success: "Succès",
  failed: "Échec",
  skipped: "Ignoré",
};

export function WebhookSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState<MaskedWebhookConfig | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryAttempt[]>([]);
  const [metaUrl, setMetaUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  const applyResponse = useCallback((data: WebhookResponse) => {
    setConfig(data.config);
    setUrl(data.config.url);
    setEnabled(data.config.enabled);
    setSecret("");
    setDeliveries(data.deliveries);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/webhook");
      if (!res.ok) throw new Error("Chargement impossible");
      const data = (await res.json()) as WebhookResponse;
      applyResponse(data);
    } catch {
      toast.error("Impossible de charger la configuration webhook");
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    void load();
    const laravelBase = (
      process.env.NEXT_PUBLIC_LARAVEL_API_URL || ""
    ).replace(/\/+$/, "");
    if (laravelBase) {
      setMetaUrl(`${laravelBase}/webhooks/meta`);
      setTiktokUrl(`${laravelBase}/webhooks/tiktok`);
    } else {
      // Next BFF proxies to Laravel when USE_LARAVEL_API / LARAVEL_API_URL is set.
      setMetaUrl(`${window.location.origin}/api/webhooks/meta`);
      setTiktokUrl(`${window.location.origin}/api/webhooks/tiktok`);
    }
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/conversations/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          enabled,
          ...(secret.trim() ? { secret: secret.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "Enregistrement impossible",
        );
        return;
      }
      applyResponse(data as WebhookResponse);
      toast.success("Webhook enregistré");
    } catch {
      toast.error("Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "conv_test",
          channel: "whatsapp",
          to: "+221770000000",
          body: "Message de test InvoMind",
        }),
      });
      const data = await res.json();
      await load();
      const status =
        typeof data.status === "string"
          ? data.status
          : typeof data?.delivery?.status === "string"
            ? data.delivery.status
            : null;
      if (status === "success" || status === "sent") {
        toast.success("Test envoyé avec succès");
      } else if (status === "skipped") {
        toast.message("Webhook désactivé — envoi ignoré");
      } else {
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "Échec du test d’envoi",
        );
      }
    } catch {
      toast.error("Échec du test d’envoi");
    } finally {
      setTesting(false);
    }
  }

  async function copyUrl(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink/55">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-line bg-muted/30 px-4 py-3 text-sm text-ink/70">
        En mode Laravel, la configuration webhook et le journal de livraisons
        sont persistés en base. En mode démo (mock), ils restent en mémoire
        serveur et sont remis à zéro au redémarrage.
      </div>

      <section className="space-y-4 rounded-sm border border-line bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-ink">
              Webhook sortant
            </h3>
            <p className="text-xs text-ink/55">
              Chaque message envoyé depuis Conversations est relayé en POST
              signé vers cette URL (n8n, Make, backend Meta…).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="webhook-enabled" className="text-xs text-ink/60">
              Actif
            </Label>
            <Switch
              id="webhook-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="webhook-url">URL du webhook</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://hooks.example.com/invomind"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="webhook-secret">Secret HMAC</Label>
            <Input
              id="webhook-secret"
              type="password"
              autoComplete="off"
              placeholder={
                config?.hasSecret
                  ? `Secret actuel : ${config.secretMasked}`
                  : "Optionnel — laissez vide pour ne pas changer"
              }
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <p className="text-[11px] text-ink/45">
              Signature envoyée dans{" "}
              <code className="num">X-Invomind-Signature</code> (
              <code className="num">sha256=…</code> sur{" "}
              <code className="num">timestamp.body</code>).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving && (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            )}
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testing}
            onClick={() => void handleTest()}
          >
            {testing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            Tester l’envoi
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-sm border border-line bg-paper p-4">
        <div>
          <h3 className="font-serif text-base font-semibold text-ink">
            Réception Meta
          </h3>
          <p className="text-xs text-ink/55">
            URL à déclarer dans votre App Meta (WhatsApp / Messenger /
            Instagram) pour recevoir les messages entrants. Traité par
            Laravel (proxy Next si URL locale).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <code className="num flex-1 truncate rounded-sm border border-line bg-muted/40 px-3 py-2 text-xs text-ink">
            {metaUrl || "/api/webhooks/meta"}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyUrl(metaUrl || "/api/webhooks/meta")}
          >
            <Copy className="size-3.5" aria-hidden />
            Copier
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-sm",
              config?.metaVerifyConfigured
                ? "border-brass/40 bg-brass/12 text-brass"
                : "border-line bg-line/40 text-ink/55",
            )}
          >
            META_VERIFY_TOKEN{" "}
            {config?.metaVerifyConfigured ? "configuré" : "manquant"}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "rounded-sm",
              config?.metaAppSecretConfigured
                ? "border-brass/40 bg-brass/12 text-brass"
                : "border-line bg-line/40 text-ink/55",
            )}
          >
            META_APP_SECRET{" "}
            {config?.metaAppSecretConfigured ? "configuré" : "manquant"}
          </Badge>
        </div>
      </section>

      <section className="space-y-4 rounded-sm border border-line bg-paper p-4">
        <div>
          <h3 className="font-serif text-base font-semibold text-ink">
            Réception TikTok
          </h3>
          <p className="text-xs text-ink/55">
            URL à déclarer dans TikTok Business Messaging (signature{" "}
            <code className="num">TikTok-Signature</code>). Accès API soumis à
            approbation TikTok.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <code className="num flex-1 truncate rounded-sm border border-line bg-muted/40 px-3 py-2 text-xs text-ink">
            {tiktokUrl || "/api/webhooks/tiktok"}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyUrl(tiktokUrl || "/api/webhooks/tiktok")}
          >
            <Copy className="size-3.5" aria-hidden />
            Copier
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-sm",
              config?.tiktokSecretConfigured
                ? "border-brass/40 bg-brass/12 text-brass"
                : "border-line bg-line/40 text-ink/55",
            )}
          >
            TIKTOK_CLIENT_SECRET{" "}
            {config?.tiktokSecretConfigured ? "configuré" : "manquant"}
          </Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-base font-semibold text-ink">
          Dernières livraisons
        </h3>
        <div className="rounded-sm border border-line bg-paper">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Canal</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">HTTP</TableHead>
                <TableHead className="text-right">Durée</TableHead>
                <TableHead>Horodatage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-ink/55"
                  >
                    Aucune livraison pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="text-sm">
                      {CHANNEL_LABELS[delivery.channel]}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-sm text-xs",
                          statusStyles[delivery.status],
                        )}
                      >
                        {statusLabels[delivery.status]}
                      </Badge>
                      {delivery.error && (
                        <p className="mt-1 max-w-[220px] truncate text-[11px] text-ink/45">
                          {delivery.error}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="num text-right text-sm text-ink/70">
                      {delivery.httpStatus ?? "—"}
                    </TableCell>
                    <TableCell className="num text-right text-sm text-ink/70">
                      {delivery.durationMs} ms
                    </TableCell>
                    <TableCell className="text-xs text-ink/60">
                      {formatDateFr(delivery.attemptedAt.slice(0, 10))}{" "}
                      <span className="num">
                        {formatTimeFr(delivery.attemptedAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
