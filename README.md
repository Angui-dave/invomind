# InvoMind

**InvoMind** est un SaaS B2B multi-tenant de facturation, devis, CRM et suivi des dépenses pour indépendants et PME.

Le front Next.js (BFF + Server Actions) parle à une **API Laravel** (Sanctum). La source de vérité métier est Laravel ; le mode mock en mémoire reste disponible pour démos locales sans backend.

## Fonctionnalités clés

- **Multi-tenant** : une seule URL SaaS ; le tenant est résolu via la session (cookie) et le header `X-Organization-Id` côté API.
- **Factures & devis** : création, statuts, taxes, PDF, envoi e-mail, relances.
- **Portail client** : liens token (`/f/[token]`) pour consulter et payer (CinetPay).
- **CRM & pipeline** : clients et prospection Kanban.
- **Dépenses & fournisseurs** : frais, catalogue, grand livre.
- **Messagerie omnicanal** : conversations + webhooks Meta / TikTok (Laravel).
- **Abonnements** : plans Free / Pro / Business (entitlements Laravel ; paiement prépayé 30 jours via **CinetPay**).
- **Import CSV** : clients, fournisseurs, catalogue, dépenses via l’API.
- **Agents (équipe)** : invitations et activation/désactivation des membres.
- **Rapports** : dashboard et overview agrégés côté Laravel.
- **Outils publics** : calculateur TVA, générateur QR facture.

## Stack technique

| Couche | Techno |
|--------|--------|
| Front | Next.js 16.3 (App Router, Server Actions), React 19, Tailwind v4, shadcn |
| API | Laravel 13 + Sanctum (`backend/`) |
| Auth | Cookies HttpOnly séparés : JWT session (`invomind_session`) + Bearer Sanctum (`invomind_access`) |
| Paiements | **CinetPay uniquement** (factures portail + abonnement SaaS) |
| Validation | Zod (front), Form Requests (Laravel) |

## Architecture

```text
invomind/
├── app/                 # Next.js routes (auth, dashboard, marketing, portal, BFF)
├── components/
├── lib/
│   ├── dal/             # Lectures (appelle Laravel si USE_LARAVEL_API)
│   ├── actions/         # Mutations Server Actions
│   ├── laravel/         # Client HTTP + mappers snake_case → camelCase
│   ├── auth/            # Cookie de session
│   └── mock/            # Fallback démo (si Laravel désactivé)
├── docs/                # Contrat API et notes backend
├── backend/             # API Laravel (source de vérité)
└── public/
```

Voir [docs/LARAVEL.md](docs/LARAVEL.md) pour le contrat API et la tenancy.

## Démarrage rapide (recommandé : Laravel)

### Prérequis

- Node.js 20+
- PHP 8.3+, Composer
- PostgreSQL (ou SQLite selon config Laravel)

### 1. Backend

```bash
cd backend
cp .env.example .env   # si besoin
composer install
php artisan key:generate
php artisan migrate
php artisan serve      # http://localhost:8000
```

Dans un second terminal (jobs PDF / mails / relances) :

```bash
cd backend
php artisan queue:work
php artisan schedule:work
```

### 2. Front

```bash
cp .env.example .env
npm install
npm run dev            # http://localhost:3000
```

Variables minimales dans `.env` :

```env
USE_LARAVEL_API=true
LARAVEL_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
SESSION_SECRET=dev-session-secret-change-in-production-32chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Mode mock (sans Laravel)

```env
USE_LARAVEL_API=false
NEXT_PUBLIC_USE_MOCK_DATA=true
```

Compte démo mock : `lea@atelier-diallo.sn` / `password123`.

## Scripts npm

- `npm run dev` / `build` / `start` / `lint` — Next.js
- Scripts `db:*` (Drizzle) — **legacy** (voir [drizzle/LEGACY.md](drizzle/LEGACY.md)), non requis en mode Laravel

## Variables d’environnement (front)

| Variable | Description |
|---|---|
| `USE_LARAVEL_API` | `true` = source de vérité Laravel (recommandé) |
| `LARAVEL_API_URL` | Base API, ex. `http://localhost:8000/api` |
| `LARAVEL_TIMEOUT_MS` | Timeout fetch vers Laravel |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` seulement si Laravel est désactivé |
| `SESSION_SECRET` | Signature du cookie JWT |
| `NEXT_PUBLIC_APP_URL` | URL publique du front |

Les secrets Meta / TikTok / CinetPay se configurent côté **Laravel** (`backend/.env`). Les webhooks inbound doivent pointer vers `https://api…/api/webhooks/{meta|tiktok|cinetpay}` (CinetPay direct Laravel ; Meta/TikTok peuvent passer par le proxy Next).

## Multi-tenancy

1. Login Laravel → token Sanctum dans `invomind_access` + JWT session (`userId`, `organizationId`, `role`) dans `invomind_session`.
2. Chaque appel API : `Authorization: Bearer …` + `X-Organization-Id: …`.
3. Middleware Laravel `ResolveTenant` vérifie le membership et scope les données.

## Intégrations

- **CinetPay** : checkout portail factures + checkout abonnement SaaS (prépayé 30 j) + webhook Laravel.
- **Meta / TikTok** : messages entrants → Laravel (`InboundConversationService`).
