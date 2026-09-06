# Harmonisation des données InvoMind

> Source de vérité runtime : **Laravel**. Le BFF Next mappe FR → camelCase EN et **affiche** ; il ne recalcule pas les agrégats en mode API.

Complète [2026-09-05-modele-metier-financier.md](./2026-09-05-modele-metier-financier.md).

## Décisions figées

1. **Statut `impayee`** → UI `unpaid` (libellé « Impayée »). Plus de collapse vers `sent`.
2. **Overdue unifié** : `en_retard` **ou** échéance dépassée sur statut ouvert (`envoyee`, `partiellement_payee`, `impayee`).
3. **CA / profit** : identiques au contrat financier (encaissé = Σ paiements ; facturé = Σ BILLABLE ; profit = encaissé − dépenses `validee`).
4. **TVA ligne** : persistée (`facture_lignes.montant_tva`). `vat_collected` = header facture ; `vat_by_rate` = Σ lignes stockées. `remise_montant` reste un rabais TTC après TVA (documenté).
5. **Settings** : JSON `organisations.parametres` + colonnes client `relances_actives`. Plus de hardcodes 18 % / couleurs / locale en chemin Laravel.
6. **Avoirs / import / PDF** : hors implémentation. UI Laravel masque les avoirs ; import reste « bientôt » ; PDF portail reste 501.
7. **Pipeline** : entitlement `true` (Kanban = `categorie_client`). `estimatedValue` dérivé, hors factures `paid` / `cancelled` / `overdue`.
8. **Mock** : mêmes helpers `lib/domain/*`. `balanceDue` n’utilise jamais les fixtures seed hors mock.

## Machine à états facture

| Depuis | Vers autorisés (manuel) |
|--------|-------------------------|
| `brouillon` | `envoyee`, `annulee` |
| `envoyee` | `impayee`, `en_retard`, `annulee` |
| `impayee` | `envoyee`, `en_retard`, `annulee` |
| `partiellement_payee` | `en_retard`, `annulee` |
| `en_retard` | `impayee`, `annulee` |
| `payee` | — |
| `annulee` | — |

`payee` / `partiellement_payee` restent le domaine du **trigger paiements**. Interdit : `payee` sans paiement, retour `brouillon`.

## Machine à états devis

`brouillon` → `envoye` \| `refuse` ; `envoye` → `accepte` \| `refuse` \| `expire` ; `accepte` → `converti` (endpoint convert uniquement).

## Intégrité

- Tous les `exists:*` sont scopés `orga_id` du user.
- Paiement ≤ `balance_due` ; `devise` = devise facture.
- Conversion devis : `date_echeance` = aujourd’hui + `client.delai_paiement_jours` (défaut 30).
- Erreurs `/reports/*` : propagées au BFF (plus de zéros silencieux).

## Sync UI

- Dashboard KPIs + donut + série : `/reports/dashboard` uniquement.
- Listes factures / dépenses : mêmes formules que reports.
- `revalidatePath` layout après lecture conversation.
- `GET /conversations/messages-batch?ids=` pour supprimer le N+1.
