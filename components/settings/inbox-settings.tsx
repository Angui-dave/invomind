"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { LedgerCard } from "@/components/ledger-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createInbox,
  deleteInbox,
  testInboxConnection,
  updateInbox,
} from "@/lib/actions/inboxes";
import { CHANNEL_LABELS, type ConversationChannel } from "@/lib/data/conversations";

type InboxRow = {
  id: string;
  channel: ConversationChannel;
  name: string;
  mode: string;
  connectionStatus: string;
  active: boolean;
  maskedCredentials?: Record<string, unknown>;
};

type InboxMode = "fake" | "sandbox" | "production";

const emptyForm = {
  canal: "messenger" as ConversationChannel,
  nom: "",
  mode: "production" as InboxMode,
  externalId: "",
  accessToken: "",
  phoneNumberId: "",
  wabaId: "",
  pageId: "",
  igBusinessId: "",
};

export function InboxSettings() {
  const [inboxes, setInboxes] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const apiBase =
    process.env.NEXT_PUBLIC_LARAVEL_API_URL?.replace(/\/$/, "") ??
    "http://localhost:8000/api";
  const webhookCallbackUrl = `${apiBase}/webhooks/meta`;

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations/inboxes");
      if (!res.ok) {
        setInboxes([]);
        return;
      }
      const data = (await res.json()) as { data?: InboxRow[] } | InboxRow[];
      setInboxes(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      setInboxes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function setField<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(inbox: InboxRow) {
    const masked = inbox.maskedCredentials ?? {};
    setEditingId(inbox.id);
    setForm({
      canal: inbox.channel,
      nom: inbox.name,
      mode: (inbox.mode as InboxMode) || "production",
      externalId: String(masked.external_id ?? ""),
      accessToken: "",
      phoneNumberId: String(masked.phone_number_id ?? ""),
      wabaId: String(masked.waba_id ?? ""),
      pageId: String(masked.page_id ?? ""),
      igBusinessId: String(masked.ig_business_id ?? ""),
    });
  }

  function buildIdentifiants() {
    const identifiants: Record<string, string | undefined> = {};
    if (form.mode === "fake") {
      identifiants.external_id = form.externalId || "fake-inbox";
    }
    if (form.accessToken) identifiants.access_token = form.accessToken;
    if (form.canal === "whatsapp") {
      if (form.phoneNumberId) identifiants.phone_number_id = form.phoneNumberId;
      if (form.wabaId) identifiants.waba_id = form.wabaId;
    }
    if (form.canal === "messenger" || form.canal === "instagram") {
      if (form.pageId) identifiants.page_id = form.pageId;
    }
    if (form.canal === "instagram" && form.igBusinessId) {
      identifiants.ig_business_id = form.igBusinessId;
    }
    return identifiants;
  }

  function handleSubmit() {
    if (!form.nom.trim()) {
      toast.error("Nom requis");
      return;
    }
    if (
      form.mode !== "fake" &&
      (form.canal === "messenger" || form.canal === "instagram") &&
      !form.pageId.trim() &&
      !editingId
    ) {
      toast.error("Page ID requis pour Messenger / Instagram");
      return;
    }
    if (
      form.mode !== "fake" &&
      form.canal === "whatsapp" &&
      !form.phoneNumberId.trim() &&
      !editingId
    ) {
      toast.error("Phone number ID requis pour WhatsApp");
      return;
    }

    startTransition(async () => {
      const payload = {
        canal: form.canal,
        nom: form.nom.trim(),
        mode: form.mode,
        identifiants: buildIdentifiants(),
      };

      const result = editingId
        ? await updateInbox(editingId, payload)
        : await createInbox(payload);

      if (result.ok) {
        toast.success(editingId ? "Boîte mise à jour" : "Boîte connectée");
        resetForm();
        await reload();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleTest(id: string) {
    startTransition(async () => {
      const result = await testInboxConnection(id);
      if (result.ok) {
        toast.success(result.message ?? "Connexion OK — Page abonnée au webhook");
        await reload();
      } else {
        toast.error(result.error);
        await reload();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteInbox(id);
      if (result.ok) {
        toast.success("Boîte supprimée");
        if (editingId === id) resetForm();
        await reload();
      } else {
        toast.error(result.error);
      }
    });
  }

  const showWhatsAppFields = form.canal === "whatsapp";
  const showPageFields =
    form.canal === "messenger" || form.canal === "instagram";
  const showIgFields = form.canal === "instagram";
  const showFakeId = form.mode === "fake";

  return (
    <div className="space-y-6">
      <LedgerCard className="p-6">
        <h3 className="font-serif text-lg font-semibold text-ink">
          Webhook Meta (Messenger / WhatsApp / Instagram)
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          Dans Meta Developer → Messenger → Webhooks, utilisez ces valeurs. En
          local, exposez l’API avec{" "}
          <code className="rounded bg-muted px-1 text-xs">ngrok http 8000</code>{" "}
          et remplacez l’hôte ci-dessous.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <dt className="shrink-0 font-medium text-ink/70">Callback URL</dt>
            <dd className="break-all rounded-lg border border-line bg-muted/40 px-3 py-1.5 font-mono text-xs text-ink">
              {webhookCallbackUrl.replace(
                "http://localhost:8000",
                "https://<votre-sous-domaine>.ngrok-free.app",
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <dt className="shrink-0 font-medium text-ink/70">Verify Token</dt>
            <dd className="rounded-lg border border-line bg-muted/40 px-3 py-1.5 font-mono text-xs text-ink">
              valeur de <code>META_VERIFY_TOKEN</code> (backend .env)
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <dt className="shrink-0 font-medium text-ink/70">Champs</dt>
            <dd className="text-ink/70">
              <code className="text-xs">messages</code>,{" "}
              <code className="text-xs">messaging_postbacks</code>, optionnel{" "}
              <code className="text-xs">message_deliveries</code> /{" "}
              <code className="text-xs">message_reads</code>
            </dd>
          </div>
        </dl>
      </LedgerCard>

      <LedgerCard className="p-6">
        <h3 className="font-serif text-lg font-semibold text-ink">
          Boîtes de réception (canaux)
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          Connectez WhatsApp, Messenger ou Instagram. Mode « fake » pour tester
          sans credentials Meta. Après création en production, cliquez sur
          « Tester / Connecter » pour valider le token et abonner la Page.
        </p>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-ink/50">Chargement…</p>
          ) : inboxes.length === 0 ? (
            <p className="text-sm text-ink/50">Aucune boîte connectée.</p>
          ) : (
            <ul className="space-y-3">
              {inboxes.map((inbox) => (
                <li
                  key={inbox.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{inbox.name}</span>
                      <Badge variant="outline">
                        {CHANNEL_LABELS[inbox.channel] ?? inbox.channel}
                      </Badge>
                      <Badge variant="secondary">{inbox.mode}</Badge>
                    </div>
                    <p className="text-xs text-ink/50">
                      Statut : {inbox.connectionStatus}
                      {inbox.channel === "tiktok"
                        ? " — TikTok désactivé (bientôt disponible)"
                        : ""}
                      {inbox.maskedCredentials?.page_id
                        ? ` · Page ${String(inbox.maskedCredentials.page_id)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inbox.mode !== "fake" ? (
                      <Button
                        variant="default"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleTest(inbox.id)}
                      >
                        Tester / Connecter
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => startEdit(inbox)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleDelete(inbox.id)}
                    >
                      Déconnecter
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </LedgerCard>

      <LedgerCard className="p-6">
        <h3 className="font-serif text-lg font-semibold text-ink">
          {editingId ? "Modifier la boîte" : "Ajouter une boîte"}
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          Saisie manuelle des tokens / IDs. En édition, laissez le token vide
          pour conserver l’existant. OAuth Meta Embedded Signup prévu en V2.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select
              value={form.canal}
              onValueChange={(v) => setField("canal", v as ConversationChannel)}
              disabled={Boolean(editingId)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok" disabled>
                  TikTok (bientôt)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={form.mode}
              onValueChange={(v) => setField("mode", v as InboxMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fake">Fake (dev)</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Nom affiché</Label>
            <Input
              value={form.nom}
              onChange={(e) => setField("nom", e.target.value)}
              placeholder={
                form.canal === "messenger"
                  ? "Ex. Messenger boutique"
                  : "Ex. WhatsApp commercial"
              }
            />
          </div>

          {showFakeId ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>External ID (résolution webhook fake)</Label>
              <Input
                value={form.externalId}
                onChange={(e) => setField("externalId", e.target.value)}
                placeholder="fake-inbox"
              />
            </div>
          ) : null}

          {!showFakeId ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>
                Access token Meta
                {editingId ? " (laisser vide pour conserver)" : ""}
              </Label>
              <Input
                type="password"
                value={form.accessToken}
                onChange={(e) => setField("accessToken", e.target.value)}
                placeholder={
                  form.canal === "messenger"
                    ? "Page Access Token"
                    : "Token Meta"
                }
              />
            </div>
          ) : null}

          {showWhatsAppFields && !showFakeId ? (
            <>
              <div className="space-y-2">
                <Label>Phone number ID</Label>
                <Input
                  value={form.phoneNumberId}
                  onChange={(e) => setField("phoneNumberId", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>WABA ID</Label>
                <Input
                  value={form.wabaId}
                  onChange={(e) => setField("wabaId", e.target.value)}
                />
              </div>
            </>
          ) : null}

          {showPageFields && !showFakeId ? (
            <div className="space-y-2">
              <Label>Page ID (Facebook)</Label>
              <Input
                value={form.pageId}
                onChange={(e) => setField("pageId", e.target.value)}
                placeholder="ID numérique de la Page"
              />
            </div>
          ) : null}

          {showIgFields && !showFakeId ? (
            <div className="space-y-2">
              <Label>Instagram Business ID</Label>
              <Input
                value={form.igBusinessId}
                onChange={(e) => setField("igBusinessId", e.target.value)}
              />
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={pending} onClick={handleSubmit}>
            {editingId ? "Enregistrer" : "Créer la boîte"}
          </Button>
          {editingId ? (
            <Button variant="outline" disabled={pending} onClick={resetForm}>
              Annuler
            </Button>
          ) : null}
        </div>
      </LedgerCard>
    </div>
  );
}
