# InvoMind 🚀

**InvoMind** est un SaaS B2B multi-tenant complet de facturation, gestion de devis, CRM, et suivi des dépenses, conçu pour les indépendants et les PME. 

Il inclut un portail client dédié, des intégrations de paiement (Stripe, Swiss QR Bill), et une architecture multi-tenant robuste basée sur PostgreSQL (Row-Level Security) avec Drizzle ORM.

## 🌟 Fonctionnalités Clés

- **Multi-tenant avec Isolation (RLS)** : Une seule base de données PostgreSQL, mais chaque organisation a ses données strictement isolées grâce au système de *Row-Level Security* natif de Postgres implémenté via Drizzle.
- **Factures & Devis** : Création, gestion de statuts, calcul de taxes (TVA, modes exclusif/inclusif), et suivi des paiements. Intégration de paiements en ligne et QR codes (Swiss QR / EMV).
- **Portail Client** : Liens sécurisés (avec token unique) permettant aux clients finaux de consulter et de payer leurs factures directement en ligne (`/f/[token]`).
- **CRM & Pipeline** : Annuaire de clients et suivi de prospection via un tableau visuel de type Kanban (Pipeline).
- **Dépenses & Fournisseurs** : Suivi des frais, gestion des fournisseurs et grand livre (*Ledger*).
- **Messagerie Omnicanal** : Centralisation des conversations clients (intégrations Webhooks Meta & TikTok prévues).
- **Abonnements & Billing** : Gestion des plans SaaS (Free, Pro) gérée via Stripe.
- **Tableau de Bord Analytique** : Graphiques de revenus, taux d'impayés, top clients (Recharts).

## 🛠️ Stack Technique

- **Framework** : [Next.js 16.3](https://nextjs.org/) (App Router, Server Actions)
- **UI / Styles** : [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) (Radix UI), [Lucide React](https://lucide.dev/)
- **Base de données** : [PostgreSQL](https://www.postgresql.org/) avec [Drizzle ORM](https://orm.drizzle.team/)
- **Validation** : [Zod](https://zod.dev/)
- **Authentification** : Custom (Session-based avec JWT signé via `jose` et hachage `bcryptjs`)
- **Paiements & Abonnements** : [Stripe](https://stripe.com/)
- **DevTools** : TypeScript, ESLint, Drizzle Studio, Docker (Postgres)

## 📁 Architecture du Projet

```text
invomind/
├── app/
│   ├── (auth)/             # Pages de connexion / inscription
│   ├── (dashboard)/        # Application principale (SaaS) : factures, CRM, rapports...
│   ├── (marketing)/        # Site vitrine (Landing page, calculateur TVA)
│   ├── (portal)/           # Portail client public (visualisation des factures)
│   └── api/                # Routes d'API externes (Webhooks Stripe, Meta, TikTok...)
├── components/
│   ├── ui/                 # Composants de base Shadcn UI
│   ├── auth/               # Formulaires d'authentification
│   ├── dashboard/          # Layouts et graphiques (Recharts)
│   ├── invoices/           # Formulaires de factures, badges, QR Code
│   ├── clients/            # Affichage CRM, Pipeline Board
│   └── portal/             # Composants du portail client sécurisé
├── lib/
│   ├── db/                 # Configuration Drizzle, Schémas (business & platform)
│   ├── dal/                # Data Access Layer (requêtes métier)
│   ├── data/               # Helpers d'accès aux données
│   ├── auth/               # Logique de session (JWT, cookies)
│   └── webhooks/           # Typages et validation de webhooks (Stripe, Meta)
├── scripts/                # Scripts utilitaires (Seed, Migrations)
└── docker/                 # Configuration Docker (Base de données locale)
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+
- [Docker](https://www.docker.com/) (pour exécuter la base de données PostgreSQL en local)

### Installation

1. **Cloner et installer les dépendances :**
   ```bash
   npm install
   ```

2. **Configuration de l'environnement :**
   Copiez le fichier d'exemple et remplissez les variables :
   ```bash
   cp .env.example .env
   ```
   > Assurez-vous de définir `SESSION_SECRET` et les variables `DATABASE_URL` (voir ci-dessous).

3. **Lancer la base de données :**
   Démarrez l'instance locale PostgreSQL via Docker Compose :
   ```bash
   npm run db:up
   ```

4. **Migrations et Seed :**
   Générez les schémas, appliquez les migrations et peuplez la base de données avec des données de test :
   ```bash
   npm run db:generate   # Génère les fichiers Drizzle
   npm run db:migrate    # Applique la structure
   npm run db:seed       # Peuple la DB avec le compte de test
   ```

5. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```
   Ouvrez [http://localhost:3000](http://localhost:3000).

### Données de Test (Seed)

Si vous avez exécuté `npm run db:seed`, un compte de démonstration sera créé :
- **Email** : `lea@atelier-diallo.sn`
- **Mot de passe** : `password123`

## 📦 Scripts Disponibles

- `npm run dev` : Lance l'application Next.js en mode développement.
- `npm run build` : Compile l'application pour la production.
- `npm run start` : Lance l'application compilée.
- `npm run lint` : Exécute ESLint pour vérifier le code.
- `npm run db:up` : Démarre le conteneur PostgreSQL via Docker.
- `npm run db:down` : Arrête le conteneur PostgreSQL.
- `npm run db:generate` : Génère les migrations Drizzle.
- `npm run db:migrate` : Exécute les migrations sur la DB.
- `npm run db:seed` : Injecte les fausses données de test.
- `npm run db:studio` : Ouvre Drizzle Studio (interface web pour gérer les données de la base).

## 🔒 Multi-tenancy et Sécurité

La sécurité des données est au cœur d'InvoMind :
1. **Sessions par organisation** : L'ID de l'organisation courante (`organizationId`) est stocké dans le JWT de session de l'utilisateur.
2. **Row-Level Security (RLS)** : Drizzle injecte un *Policy* (`tenantPolicy`) dans la quasi-totalité des tables métier (`clients`, `documents`, `expenses`, etc.). Cela signifie qu'au niveau même de Postgres, une requête ne peut accéder qu'aux lignes correspondant à l'`organizationId` de la transaction en cours.
3. **Portail Token Policy** : Les factures consultées sur le portail public utilisent une politique spécifique via `portalToken` qui restreint drastiquement l'accès en lecture seule aux seuls documents publics.

## 🤝 Intégrations

* **Stripe** : Gère la facturation de l'abonnement SaaS de l'organisation (Plans Free, Pro) et permet éventuellement aux clients de régler leurs factures en ligne.
* **Swiss QR / EMV** : Génération de QR Codes pour faciliter le paiement bancaire des factures émises.
* **Webhooks (Meta, TikTok)** : Architecture préparée (`app/api/webhooks/`) pour capturer et centraliser les messages entrants depuis les réseaux sociaux vers la boîte de réception InvoMind.
