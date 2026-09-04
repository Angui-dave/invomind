# Messagerie omnicanale (InvoMind)

## Vue d’ensemble

Boîte de réception unifiée pour **WhatsApp Business**, **Messenger**, **Instagram Direct**, avec un adaptateur **TikTok** présent mais **désactivé** par défaut (`MESSAGERIE_TIKTOK_ENABLED=false`).

Architecture inspirée de Chatwoot (concepts, pas du code Rails) :

| Concept Chatwoot | Table InvoMind | Modèle |
|------------------|----------------|--------|
| Inbox | `boites_reception` | `Inbox` |
| Contact | `contacts_messagerie` | `MessagingContact` |
| ContactInbox | `contacts_boite_reception` | `ContactInbox` |
| Conversation | `conversations` | `Conversation` |
| Message | `conversation_messages` | `ConversationMessage` |
| Label | `etiquettes` | `Label` |
| Message template | `modeles_message` | `MessageTemplate` |

## Démarrage local

```bash
# Backend
cd backend
php artisan migrate
php artisan queue:work
php artisan reverb:start

# Front (.env)
USE_LARAVEL_API=true
LARAVEL_API_URL=http://localhost:8000/api
NEXT_PUBLIC_REVERB_APP_KEY=invomind-key
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

Créer une boîte en mode **fake** via Paramètres → Canaux & webhooks, puis poster un webhook de test :

```bash
curl -X POST http://localhost:8000/api/webhooks/meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": []
  }'
```

Pour le mode fake sans signature Meta, utilisez `FakeCanalAdapter` via une boîte `mode=fake` et un job manuel, ou configurez `APP_ENV=local` (la vérif de signature Meta accepte l’absence de secret en local).

### Simulation entrante (fake)

1. Créer une boîte WhatsApp en mode `fake` avec `identifiants.external_id = fake-inbox`.
2. Dispatcher un payload via tinker / job `ProcessInboundWebhookJob` n’est pas nécessaire si vous utilisez l’adaptateur fake ; le plus simple en local est d’appeler `InboundMessageService::ingerer()` avec un DTO, ou d’envoyer un message sortant depuis l’UI (fenêtre de réponse toujours ouverte en mode fake).

## API Laravel

### Authentifié (`auth:sanctum` + `tenant`)

| Méthode | Path | Rôle |
|---------|------|------|
| GET/POST/DELETE | `/inboxes` | **admin** |
| GET | `/inboxes/{id}/templates` | membre (modèles WhatsApp) |
| POST | `/inboxes/{id}/templates/sync` | **admin** (sync Meta) |
| GET | `/conversations` | membre |
| GET | `/conversations/{id}` | membre |
| GET/POST | `/conversations/{id}/messages` | membre (`type_contenu`: texte/image/audio/video/fichier/modele) |
| PUT | `/conversations/{id}/status` | membre (`ouverte` / `en_attente` / `resolue`) |
| PUT | `/conversations/{id}/assign` | membre |
| PUT | `/conversations/{id}/contact` | membre (`client_id` pour lier au CRM) |
| POST | `/conversations/{id}/read` | membre |
| POST/DELETE | `/conversations/{id}/labels/{labelId}` | membre |
| GET/POST/DELETE | `/labels` | membre |
| GET | `/conversations/unread-total` | membre |

### Public

| Méthode | Path |
|---------|------|
| GET/POST | `/webhooks/meta` |
| POST | `/webhooks/tiktok` |
| POST | `/broadcasting/auth` (Sanctum) |

## Credentials par plateforme

### Meta (WhatsApp / Messenger / Instagram) — requis pour la prod

1. Créer une **Meta App** (developers.facebook.com) de type Business.
2. Ajouter les produits :
   - **WhatsApp** → obtenir `phone_number_id`, `waba_id`, token permanent (System User).
   - **Messenger** → Page Facebook liée, `page_id`, Page Access Token.
   - **Instagram** → compte Instagram Professionnel lié à la Page, `ig_business_id`.
3. Configurer le webhook vers `https://VOTRE_API/api/webhooks/meta` :
   - Verify token = `META_VERIFY_TOKEN`
   - App secret = `META_APP_SECRET` (signature `X-Hub-Signature-256`)
4. Souscrire aux champs `messages` (WhatsApp) / `messages` (Page / Instagram).
5. Dans InvoMind (admin) : Paramètres → Canaux, créer une boîte en mode `sandbox` ou `production` et coller les IDs + `access_token`.

**Conformité WhatsApp** : fenêtre de réponse libre **24 h** après le dernier message entrant. Hors fenêtre, envoyez un *message template* approuvé (`type_contenu=modele`) — synchronisable via `POST /inboxes/{id}/templates/sync` (nécessite `waba_id` + `access_token`).

Souscrire aussi aux webhooks de **statuts** (`message_status` / `statuses`) pour mettre à jour `envoye` → `livre` → `lu`.

### TikTok — limitation documentée

La **TikTok Business Messaging API** (Open Beta) n’est **pas** symétrique à Meta :

- Réponse **uniquement** si l’utilisateur a écrit en premier.
- Fenêtre ~**48 h**, ~10 messages auto / fenêtre, quota journalier ~100–200 conversations.
- Disponibilité régionale restreinte / processus d’approbation développeur.
- **Pas d’initiation** de DM « cold ».

InvoMind expose l’adaptateur `TiktokAdapter` derrière le flag `MESSAGERIE_TIKTOK_ENABLED` (défaut `false`). L’UI marque TikTok comme « bientôt disponible ».

Pour activer plus tard :

1. Compte développeur TikTok for Business.
2. App approuvée pour Business Messaging.
3. `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` + `MESSAGERIE_TIKTOK_ENABLED=true`.
4. Webhook `POST /api/webhooks/tiktok`.

## Temps réel

- Backend : Laravel Reverb (`BROADCAST_CONNECTION=reverb`), events `NouveauMessageConversation` / `ConversationMiseAJour` sur `private-organisation.{orga_id}`.
- Front : `laravel-echo` + `pusher-js` via `lib/realtime/echo-client.ts`, auth BFF `POST /api/realtime/auth`.
- Fallback : poll 60 s si le socket est down ; en mode mock (sans Laravel), poll 10 s historique.

Processus à faire tourner en prod :

```bash
php artisan reverb:start
php artisan queue:work
```

## Sécurité

- Tokens canal stockés chiffrés (`encrypted:array` sur `boites_reception.identifiants`).
- Multi-tenant strict (`orga_id` + `BelongsToOrganization`).
- Webhooks Meta : HMAC obligatoire dès que `META_APP_SECRET` est défini.
- Idempotence : index unique partiel `(boite_reception_id, id_externe)`.
- Rate limit sortant par boîte (`config/messagerie.php`).
