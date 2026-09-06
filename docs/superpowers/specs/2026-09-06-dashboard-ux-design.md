# Dashboard UX InvoMind

Refonte du shell authentifié et de la home `/dashboard`. Identité visuelle conservée (IBM Plex, navy, ledger/brass). Objectif : orienter l’action sans inventer de métriques ni surcharger la navigation.

## Décisions figées

1. **Périmètre** : shell + home. Les listes Devis/Factures reçoivent les FilterChips parce que les filtres quittent la sidebar. Le reste des écrans suit plus tard.
2. **Voix** : vouvoiement professionnel. Faits produit uniquement. Pas de « en temps réel » sans realtime. Pas d’« objectif » sans objectif utilisateur.
3. **Une source de filtres** : le statut vit dans l’URL `?status=` et s’affiche sur la page (FilterChips). Devis et Factures sont des liens plats dans la sidebar.
4. **KPI = lien** : chaque carte de la home ouvre la liste ou le rapport qui l’explique.
5. **Un primaire par écran** : home = Nouvelle facture. Devis en secondaire. Dépense en lien texte.
6. **Contrats data** : inchangés. `pending` / « En attente » = `sent` + `partially_paid`. Overdue et CA restent `/reports/dashboard`. Filtre virtuel URL : `?status=awaiting`.
7. **Conversations** : sous-menu canaux conservé. Badges non-lus et prospects conservés.
8. **Chrome** : `PageHeader` avec `backHref` / `backLabel` sur new/[id]. `/billing` a un header. Pas de breadcrumbs complets, pas de barre haute desktop, pas de command palette.

## Home hybride

Ordre : Hero compact → bandeau « À traiter » (omis si tout est à 0) → 4 KPI liens → graphiques (si au moins une facture) → dernières factures.

- Eyebrow : `{mois année}` seulement.
- Taux d’encaissement (pas « Objectif ») : masqué si facturé et encaissé du mois sont à 0.
- À traiter : retard → `?status=overdue` ; attente → `?status=awaiting` ; prospects → `/clients?tab=prospects`.
- Empty : hero + bandeau éventuel + KPI + empty state. Pas de charts vides. Flag `SHOW_EMPTY_STATE` supprimé.
- Charts : plus de délai artificiel de 600 ms.

## Hors scope

Cartes mobiles sur les autres listes, onglets settings, layout conversations, home agent, command palette, PDF / avoirs / import Laravel, changement des formules financières.
