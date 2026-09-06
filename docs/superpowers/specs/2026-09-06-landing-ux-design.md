# Landing UX InvoMind

Refonte en deux phases de la page marketing. Identité visuelle conservée (IBM Plex, ledger/brass). Objectif : convertir sans promesse invérifiable ni page-catalogue.

## Décisions figées

1. **Voix** : vouvoiement professionnel partout. Plus de tutoiement.
2. **Preuve** : uniquement des faits produit. Pas de « 10 000 PME », note Google, ni processeurs présentés comme clients.
3. **Quotas** : une source — `PRICING_PLANS` aligné sur `PlanSeeder` + `EntitlementService` (gratuit = 10 factures/mois, clients illimités). Hero, FAQ, CTA et tarifs lisent cette source via `lib/marketing/copy.ts`.
4. **CTA secondaire** : « Voir le portail client » → `#fonctionnalites`. Jamais « démo » sans démo.
5. **Parcours** : Hero → faits produit → opérateurs de paiement → 4 étapes → portail (différenciateur) → 3 piliers → retours types → tarifs → sécurité → FAQ → outils teaser → CTA.
6. **Outils** : 3 cartes vers les pages dédiées / l’inscription. Pas de calculateurs live sur la landing.
7. **CRM / inbox** : mention courte, pas un pilier égal aux encaissements.

## Décisions visuelles (talon de facture)

1. **Signature** : un seul geste mémorable — le talon perforé (`ledger-perf`). Hero = facture + talon de paiement. Bande de faits et CTA final en écho. Pas de perforation sur chaque carte.
2. **Tokens** : inchangés (`ledger` `#2563eb`, `brass` `#10b981`, `navy`, `paper`, `ink`, IBM Plex). Usage resserré : ledger = CTA / folio actif ; brass = argent reçu uniquement ; navy = bandes-talon.
3. **Interdits** : mesh hero, titre en dégradé, cartes glass flottantes, badge « Le plus choisi », « Objectif trésorerie », « en temps réel » sans realtime.
4. **Structure visuelle** : 4 étapes = lignes de registre (séquence réelle) ; opérateurs = estampilles ; eyebrow = marque folio mono, pas pastille.

## Hors scope

Pages légales nouvelles, vidéo démo, avis clients réels, refonte dashboard, changement des hex globaux.
