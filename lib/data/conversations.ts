import { CLIENTS, type Client } from "@/lib/data/clients";
import { PROSPECTS, type Prospect } from "@/lib/data/settings";

export type ConversationChannel = "whatsapp" | "messenger";

export type MessageDirection = "inbound" | "outbound";

export type MessageDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface ConversationMessage {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  sentAt: string;
  status?: MessageDeliveryStatus;
}

export interface Conversation {
  id: string;
  channel: ConversationChannel;
  contactName: string;
  contactHandle: string;
  avatarInitials?: string;
  clientId?: string;
  prospectId?: string;
  unreadCount: number;
  lastMessageAt: string;
  archived?: boolean;
}

export type ResolvedContact =
  | { kind: "client"; client: Client }
  | { kind: "prospect"; prospect: Prospect }
  | { kind: "unknown" };

export const CHANNEL_LABELS: Record<ConversationChannel, string> = {
  whatsapp: "WhatsApp",
  messenger: "Messenger",
};

export const CHANNEL_COLORS: Record<ConversationChannel, string> = {
  whatsapp: "#128c7e",
  messenger: "#0866ff",
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1",
    channel: "whatsapp",
    contactName: "Aminata Diallo",
    contactHandle: "+221 77 123 45 67",
    avatarInitials: "AD",
    clientId: "cli_1",
    unreadCount: 2,
    lastMessageAt: "2026-08-15T10:15:00",
  },
  {
    id: "conv_2",
    channel: "messenger",
    contactName: "Kofi Mensah",
    contactHandle: "@kofi.mensah",
    avatarInitials: "KM",
    clientId: "cli_2",
    unreadCount: 0,
    lastMessageAt: "2026-08-14T16:42:00",
  },
  {
    id: "conv_3",
    channel: "whatsapp",
    contactName: "Nicolas Petit",
    contactHandle: "+33 6 12 34 56 78",
    avatarInitials: "NP",
    prospectId: "prs_4",
    unreadCount: 1,
    lastMessageAt: "2026-08-15T09:30:00",
  },
  {
    id: "conv_4",
    channel: "messenger",
    contactName: "Élodie Martin",
    contactHandle: "@cabinet.martin",
    avatarInitials: "EM",
    prospectId: "prs_3",
    unreadCount: 0,
    lastMessageAt: "2026-08-13T11:05:00",
  },
  {
    id: "conv_5",
    channel: "whatsapp",
    contactName: "Fatou Ndiaye",
    contactHandle: "+221 76 987 65 43",
    avatarInitials: "FN",
    clientId: "cli_3",
    unreadCount: 0,
    lastMessageAt: "2026-08-15T08:22:00",
  },
  {
    id: "conv_6",
    channel: "messenger",
    contactName: "Claire Dupont",
    contactHandle: "@claire.dupont",
    avatarInitials: "CD",
    unreadCount: 3,
    lastMessageAt: "2026-08-15T11:48:00",
  },
  {
    id: "conv_7",
    channel: "whatsapp",
    contactName: "Ibrahim Traoré",
    contactHandle: "+226 70 11 22 33",
    avatarInitials: "IT",
    clientId: "cli_4",
    unreadCount: 0,
    lastMessageAt: "2026-08-12T14:10:00",
  },
  {
    id: "conv_8",
    channel: "whatsapp",
    contactName: "Marie Dupont",
    contactHandle: "+33 7 88 99 00 11",
    avatarInitials: "MD",
    prospectId: "prs_1",
    unreadCount: 0,
    lastMessageAt: "2026-08-14T09:15:00",
  },
  {
    id: "conv_9",
    channel: "messenger",
    contactName: "Aïcha Bamba",
    contactHandle: "@bamba.studio",
    avatarInitials: "AB",
    clientId: "cli_5",
    unreadCount: 1,
    lastMessageAt: "2026-08-15T07:55:00",
  },
];

export const CONVERSATION_MESSAGES: ConversationMessage[] = [
  // conv_1 — Aminata Diallo (WhatsApp / client)
  {
    id: "msg_1a",
    conversationId: "conv_1",
    direction: "inbound",
    body: "Bonjour ! Avez-vous pu valider le devis ?",
    sentAt: "2026-08-15T10:14:00",
  },
  {
    id: "msg_1b",
    conversationId: "conv_1",
    direction: "inbound",
    body: "On aimerait démarrer la semaine prochaine.",
    sentAt: "2026-08-15T10:15:00",
  },
  {
    id: "msg_1c",
    conversationId: "conv_1",
    direction: "outbound",
    body: "Oui, tout est prêt. Je vous mets le lien de paiement ci-dessous.",
    sentAt: "2026-08-14T18:20:00",
    status: "read",
  },
  {
    id: "msg_1d",
    conversationId: "conv_1",
    direction: "outbound",
    body: "Bonjour Aminata, le devis a bien été envoyé hier.",
    sentAt: "2026-08-14T17:05:00",
    status: "read",
  },

  // conv_2 — Kofi Mensah (Messenger / client)
  {
    id: "msg_2a",
    conversationId: "conv_2",
    direction: "inbound",
    body: "Merci pour le document, c’est clair.",
    sentAt: "2026-08-14T16:42:00",
  },
  {
    id: "msg_2b",
    conversationId: "conv_2",
    direction: "outbound",
    body: "Parfait. N’hésitez pas si vous avez des questions sur la facture.",
    sentAt: "2026-08-14T16:50:00",
    status: "delivered",
  },
  {
    id: "msg_2c",
    conversationId: "conv_2",
    direction: "outbound",
    body: "Bonjour Kofi, voici le récapitulatif demandé.",
    sentAt: "2026-08-14T15:30:00",
    status: "read",
  },

  // conv_3 — Nicolas Petit (WhatsApp / prospect négociation)
  {
    id: "msg_3a",
    conversationId: "conv_3",
    direction: "inbound",
    body: "On peut discuter du prix un peu ?",
    sentAt: "2026-08-15T09:30:00",
  },
  {
    id: "msg_3b",
    conversationId: "conv_3",
    direction: "outbound",
    body: "Bien sûr. Je peux vous proposer un acompte de 30 %.",
    sentAt: "2026-08-14T19:00:00",
    status: "read",
  },
  {
    id: "msg_3c",
    conversationId: "conv_3",
    direction: "inbound",
    body: "Le devis pour Petit Immobilier nous intéresse.",
    sentAt: "2026-08-13T10:00:00",
  },

  // conv_4 — Élodie Martin (Messenger / prospect devis)
  {
    id: "msg_4a",
    conversationId: "conv_4",
    direction: "outbound",
    body: "Bonjour Élodie, le devis est prêt. Souhaitez-vous un appel ?",
    sentAt: "2026-08-13T11:05:00",
    status: "read",
  },
  {
    id: "msg_4b",
    conversationId: "conv_4",
    direction: "inbound",
    body: "Oui, jeudi à 14 h me convient.",
    sentAt: "2026-08-12T16:20:00",
  },

  // conv_5 — Fatou Ndiaye (WhatsApp / client)
  {
    id: "msg_5a",
    conversationId: "conv_5",
    direction: "inbound",
    body: "Parfait, paiement effectué ce matin.",
    sentAt: "2026-08-15T08:22:00",
  },
  {
    id: "msg_5b",
    conversationId: "conv_5",
    direction: "outbound",
    body: "Merci Fatou, je confirme la réception sous peu.",
    sentAt: "2026-08-15T08:30:00",
    status: "delivered",
  },

  // conv_6 — Claire Dupont (Messenger / unknown)
  {
    id: "msg_6a",
    conversationId: "conv_6",
    direction: "inbound",
    body: "Bonjour, je cherche un devis pour une identité visuelle.",
    sentAt: "2026-08-15T11:48:00",
  },
  {
    id: "msg_6b",
    conversationId: "conv_6",
    direction: "inbound",
    body: "Vous travaillez aussi pour des startups ?",
    sentAt: "2026-08-15T11:49:00",
  },
  {
    id: "msg_6c",
    conversationId: "conv_6",
    direction: "inbound",
    body: "Pouvez-vous m’envoyer un catalogue ?",
    sentAt: "2026-08-15T11:50:00",
  },

  // conv_7 — Ibrahim Traoré (WhatsApp / client)
  {
    id: "msg_7a",
    conversationId: "conv_7",
    direction: "outbound",
    body: "Bonjour Ibrahim, la facture FAC-2026-004 est disponible.",
    sentAt: "2026-08-12T14:10:00",
    status: "read",
  },
  {
    id: "msg_7b",
    conversationId: "conv_7",
    direction: "inbound",
    body: "Reçu, merci.",
    sentAt: "2026-08-12T15:00:00",
  },

  // conv_8 — Marie Dupont (WhatsApp / prospect nouveau)
  {
    id: "msg_8a",
    conversationId: "conv_8",
    direction: "inbound",
    body: "Bonjour, on m’a recommandé Atelier Diallo.",
    sentAt: "2026-08-14T09:15:00",
  },
  {
    id: "msg_8b",
    conversationId: "conv_8",
    direction: "outbound",
    body: "Bienvenue Marie ! Dites-moi en quoi je peux vous aider.",
    sentAt: "2026-08-14T09:40:00",
    status: "read",
  },

  // conv_9 — Aïcha Bamba (Messenger / client)
  {
    id: "msg_9a",
    conversationId: "conv_9",
    direction: "inbound",
    body: "Le rendu final est superbe, merci !",
    sentAt: "2026-08-15T07:55:00",
  },
  {
    id: "msg_9b",
    conversationId: "conv_9",
    direction: "outbound",
    body: "Ravi que ça vous plaise. Je vous envoie la facture.",
    sentAt: "2026-08-14T20:10:00",
    status: "read",
  },
];

export function getMessages(conversationId: string): ConversationMessage[] {
  return CONVERSATION_MESSAGES.filter((m) => m.conversationId === conversationId).sort(
    (a, b) => a.sentAt.localeCompare(b.sentAt),
  );
}

export function lastMessage(
  conversationId: string,
): ConversationMessage | undefined {
  const messages = getMessages(conversationId);
  return messages[messages.length - 1];
}

export function unreadTotal(conversations: Conversation[] = CONVERSATIONS): number {
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

export function resolveContact(conversation: Conversation): ResolvedContact {
  if (conversation.clientId) {
    const client = CLIENTS.find((c) => c.id === conversation.clientId);
    if (client) return { kind: "client", client };
  }
  if (conversation.prospectId) {
    const prospect = PROSPECTS.find((p) => p.id === conversation.prospectId);
    if (prospect) return { kind: "prospect", prospect };
  }
  return { kind: "unknown" };
}

export function getConversationById(id: string): Conversation | undefined {
  return CONVERSATIONS.find((c) => c.id === id);
}
