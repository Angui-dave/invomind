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
import { createInbox, deleteInbox } from "@/lib/actions/inboxes";
import { CHANNEL_LABELS, type ConversationChannel } from "@/lib/data/conversations";

type InboxRow = {
  id: string;
  channel: ConversationChannel;
  name: string;
  mode: string;
  connectionStatus: string;
  active: boolean;
};

export function InboxSettings() {
  const [inboxes, setInboxes] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [canal, setCanal] = useState<ConversationChannel>("whatsapp");
  const [nom, setNom] = useState("");
  const [mode, setMode] = useState<"fake" | "sandbox" | "production">("fake");
  const [externalId, setExternalId] = useState("fake-inbox");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [pageId, setPageId] = useState("");

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

  function handleCreate() {
    if (!nom.trim()) {
      toast.error("Nom requis");
      return;
    }
    startTransition(async () => {
      const result = await createInbox({
        canal,
        nom: nom.trim(),
        mode,
        identifiants: {
          external_id: externalId || undefined,
          access_token: accessToken || undefined,
          phone_number_id: phoneNumberId || undefined,
          page_id: pageId || undefined,
        },
      });
      if (result.ok) {
        toast.success("Boîte connectée");
        setNom("");
        await reload();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteInbox(id);
      if (result.ok) {
        toast.success("Boîte supprimée");
        await reload();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <LedgerCard className="p-6">
        <h3 className="font-serif text-lg font-semibold text-ink">
          Boîtes de réception (canaux)
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          Connectez WhatsApp, Messenger ou Instagram. Mode « fake » pour tester
          sans credentials Meta. Voir docs/MESSAGERIE.md.
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
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleDelete(inbox.id)}
                  >
                    Déconnecter
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </LedgerCard>

      <LedgerCard className="p-6">
        <h3 className="font-serif text-lg font-semibold text-ink">
          Ajouter une boîte
        </h3>
        <p className="mt-1 text-sm text-ink/60">
          En V1, saisie manuelle des tokens / IDs. OAuth Meta Embedded Signup
          prévu en V2.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select
              value={canal}
              onValueChange={(v) => setCanal(v as ConversationChannel)}
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
              value={mode}
              onValueChange={(v) =>
                setMode(v as "fake" | "sandbox" | "production")
              }
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
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. WhatsApp commercial"
            />
          </div>
          <div className="space-y-2">
            <Label>External ID (fake / résolution webhook)</Label>
            <Input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="fake-inbox"
            />
          </div>
          <div className="space-y-2">
            <Label>Access token Meta</Label>
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Optionnel en mode fake"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone number ID (WhatsApp)</Label>
            <Input
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Page ID (Messenger / IG)</Label>
            <Input
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button disabled={pending} onClick={handleCreate}>
            Connecter
          </Button>
        </div>
      </LedgerCard>
    </div>
  );
}
