# InvoMind

SaaS multi-tenant de facturation (Next.js 16). Backend Laravel prévu ; **données mock en mémoire** pour le moment, avec **isolation réelle par organisation** (une « base » mock par client).

Chaque client partage la même URL (`NEXT_PUBLIC_APP_URL`). Le tenant est résolu depuis le cookie de session (`organizationId`), jamais depuis un sous-domaine.

## Prérequis

- Node.js 20+
- Aucune base de données requise en mode mock

## Démarrage rapide

```bash
cp .env.example .env
# NEXT_PUBLIC_USE_MOCK_DATA=true (défaut)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Comptes

| Accès | Identifiants | Données |
|-------|--------------|---------|
| Démo seed | `lea@atelier-diallo.sn` / `password123` | Atelier Diallo (catalogue, factures…) |
| Nouvelle org | `/register` | Store **vide** isolé + plan Gratuit |

## Multi-tenant (mock)

- **Central** : tenants, users, memberships, plans, subscriptions — `lib/mock/central.ts`
- **Par org** : clients, factures, branding, modules — `lib/mock/store.ts` (`tenantStore()`)
- **Personnalisation** : Paramètres → Apparence (couleurs, logo, police, modules)
- **Abonnements** : free / pro / business — quotas dans `lib/billing/entitlements.ts`

Voir [docs/LARAVEL.md](docs/LARAVEL.md) pour le mapping vers stancl/tenancy (DB par tenant + résolution par utilisateur).

## Stack actuelle

- Next.js 16 (App Router), React 19, Tailwind v4
- Auth mock (jose JWT + Server Actions)
- Zod pour la validation
