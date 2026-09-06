# Déploiement InvoMind (GitHub Actions)

Pipeline actuelle : CI sur chaque PR / push, déploiement SSH vers **test** (`develop`) ou **production** (`main`). Les serveurs ne sont pas encore obligatoires : sans `SSH_HOST`, le job Deploy se termine en succès après un skip.

## Flux git

| Branche / action | Environnement GitHub | Effet |
|---|---|---|
| PR vers `develop` ou `main` | — | CI uniquement |
| Push sur `develop` | `test` | CI puis deploy test |
| Push sur `main` | `production` | CI puis deploy prod |
| Actions → Deploy → Run workflow | `test` ou `production` (choix) | CI puis deploy manuel |

Convention : PR vers `develop` pour valider en test, puis PR `develop` → `main` pour la prod.

## Workflows

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — lint Next, Vitest, `next build`, Composer, PHPUnit (PostgreSQL 16 en service ; les migrations utilisent `pgcrypto`).
- [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — relance la CI, puis rsync SSH + [`scripts/deploy-remote.sh`](../scripts/deploy-remote.sh).

Le front (racine **sans** `backend/`) va dans `DEPLOY_FRONT_PATH`. L’API (`backend/`) va dans `DEPLOY_BACK_PATH`. Les fichiers `.env` du serveur ne sont jamais écrasés (`rsync` les exclut, sans `--delete-excluded`).

## Secrets GitHub (par environment)

Créer les environments **Settings → Environments** : `test` et `production`. Sur `production`, activer *Required reviewers* si possible.

Secrets à ajouter **dans chaque environment** :

| Secret | Exemple | Obligatoire |
|---|---|---|
| `SSH_HOST` | `203.0.113.10` | oui pour déployer |
| `SSH_USER` | `deploy` | oui si `SSH_HOST` est posé |
| `SSH_PRIVATE_KEY` | clé privée OpenSSH complète | oui si `SSH_HOST` est posé |
| `SSH_PORT` | `22` | non (défaut `22`) |
| `DEPLOY_FRONT_PATH` | `/var/www/invomind-web` | oui si `SSH_HOST` est posé |
| `DEPLOY_BACK_PATH` | `/var/www/invomind-api` | oui si `SSH_HOST` est posé |

Variables d’environment optionnelles (Settings → Environments → Variables) :

| Variable | Exemple |
|---|---|
| `FRONT_RESTART_CMD` | `sudo systemctl restart invomind-web` |
| `BACK_RESTART_CMD` | `sudo systemctl reload php8.3-fpm && sudo systemctl restart invomind-queue` |

Si `SSH_HOST` est vide, le deploy affiche *Skipping deploy (server not configured yet)* et ne échoue pas.

## Clé SSH

Sur le poste local :

```bash
ssh-keygen -t ed25519 -C "github-actions-invomind" -f invomind-deploy -N ""
```

- Clé **publique** (`invomind-deploy.pub`) → `~/.ssh/authorized_keys` de l’utilisateur SSH sur le VPS test **et** le VPS prod (ou deux clés distinctes).
- Clé **privée** (`invomind-deploy`) → secret `SSH_PRIVATE_KEY` (tout le fichier, y compris les lignes `BEGIN` / `END`).

L’utilisateur SSH doit pouvoir écrire dans les deux dossiers de déploiement et exécuter Composer, PHP, Node, et les commandes de restart.

## Checklist serveur (plus tard)

À faire sur chaque VPS avant le premier deploy réel :

1. Nginx (ou équivalent) + TLS pour le front et l’API.
2. PHP 8.3, extensions Laravel, Composer, Node 20, `rsync`.
3. PostgreSQL 16 (même moteur que le job CI et `docker compose`).
4. Dossiers `DEPLOY_FRONT_PATH` et `DEPLOY_BACK_PATH` créés, appartenant à `SSH_USER`.
5. Fichiers `.env` **uniquement sur le serveur** :
   - front : voir [`.env.example`](../.env.example) — `SESSION_SECRET` ≥ 32 caractères, sans `dev-session-secret`, `USE_LARAVEL_API=true`.
   - API : voir [`backend/.env.example`](../backend/.env.example) — `APP_DEBUG=false`, `APP_ENV=production`, Postgres, CinetPay, Resend, Reverb.
6. Processus : `php artisan queue:work`, `php artisan schedule:work` (cron), `php artisan reverb:start` (Supervisor ou systemd).
7. `FRONT_RESTART_CMD` / `BACK_RESTART_CMD` renseignés une fois systemd / pm2 prêts.

Hors scope de cette pipeline : provisioner le VPS, le DNS, et Docker de l’app.

## Release distante

[`scripts/deploy-remote.sh`](../scripts/deploy-remote.sh) s’exécute **sur le VPS** après le rsync :

1. API : `composer install --no-dev`, `php artisan migrate --force`, caches config / routes / vues.
2. Front : `npm ci` puis `npm run build` (les `devDependencies` sont nécessaires pour compiler Next).
3. Restart optionnel si les variables sont définies.

Le script échoue si un `.env` serveur est absent.
