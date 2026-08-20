# Legacy — Drizzle / Postgres Next

> **Ne plus utiliser.** La source de vérité schéma + API est Laravel (`backend/database/migrations`).

Ce dossier et les fichiers associés sont conservés uniquement pour historique :

| Chemin | Statut |
|--------|--------|
| `drizzle/` | Migrations Drizzle obsolètes |
| `drizzle.config.ts` | Config Drizzle kit — non requise |
| `lib/db/` | Schéma Drizzle TypeScript — non branché si `USE_LARAVEL_API=true` |
| `scripts/migrate.ts`, `scripts/seed.ts` | Scripts npm `db:*` — legacy |

Pour une base neuve :

```bash
cd backend
php artisan migrate
php artisan db:seed
```

Le front parle à Laravel via `LARAVEL_API_URL` ; ne pas reconnecter Drizzle.
