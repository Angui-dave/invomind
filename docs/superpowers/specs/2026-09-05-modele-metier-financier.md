# Modèle métier financier — contrat canonique

> Source de vérité runtime : **Laravel** (tables FR, JSON snake_case FR).  
> Le front expose des types camelCase EN via mappers / payloads.

## 1. Montants

Toujours nommer HT / TVA / TTC. Jamais un `amount` ambigu sur les dépenses.

| Domaine | Laravel | UI |
|---------|---------|-----|
| Document HT | `sous_total` | `subtotalHt` |
| Document TVA | `montant_tva` | `taxTotal` |
| Document TTC | `montant_total` | `total` |
| Dépense HT | `montant_ht` | `amountHt` |
| Dépense TVA | `montant_tva` | `taxAmount` |
| Dépense TTC | `montant_ttc` | `amountTtc` |
| Paiement | `montant` | `amount` (TTC encaissé) |

- `taxMode` documents = **exclusive** (HT + TVA).
- Arrondi calcul : `round2` (2 décimales). Affichage : `formatMoney` (0 décimale pour XOF/XAF).
- Saisie dépense UI : TTC → conversion inclusive → POST `montant_ht`.

## 2. CA et profit

| Métrique | Formule | Label UI |
|----------|--------|----------|
| `collectedTtc` | Σ paiements | CA encaissé |
| `billedHt` / `billedTtc` | Σ factures billables | CA facturé (HT/TTC) |
| `expensesHt` / `expensesTtc` | Σ dépenses `statut = validee` | Dépenses HT/TTC |
| `profitTtc` | `collectedTtc − expensesTtc` | Profit |

**Factures billables** (hors brouillon / annulée) :
`envoyee`, `partiellement_payee`, `payee`, `impayee`, `en_retard`.

- Top clients = CA **facturé TTC** + `client_id`.
- Série mensuelle / CA du mois = CA **encaissé**.
- TVA collectée = Σ `montant_tva` factures billables.
- TVA déductible = Σ `montant_tva` dépenses validées et déductibles.

## 3. Statuts facture

| API | UI |
|-----|-----|
| `brouillon` | `draft` |
| `envoyee` | `sent` |
| `impayee` | `unpaid` |
| `partiellement_payee` | `partially_paid` |
| `payee` | `paid` |
| `en_retard` | `overdue` |
| `annulee` | `cancelled` |

**Overdue unifié** : statut `en_retard` **ou** échéance dépassée sur un statut ouvert (`envoyee`, `partiellement_payee`, `impayee`).

**Trigger paiements** : si `montant_paye = 0` et échéance future → `envoyee`.

## 4. Client

| Laravel | UI | Notes |
|---------|-----|-------|
| `name_company` | `company` | Raison sociale (libellé principal) |
| — | `name` | Contact ; v1 peut = company |
| `delai_paiement_jours` | `paymentTermDays` | défaut 30 |
| `numero_fiscal` | `taxId` | optionnel |
| `categorie_client` | `categorieClient` | Kanban |

Nouvelle facture / devis hérite du délai client.

## 5. Paiements

Resource enrichie : `document_number`, `client_name`.  
Facture : `montant_paye` + `balance_due` exposés.

## 6. Hors scope

Avoirs Laravel, TVA inclusive, fusion Drizzle, conversion multi-devises.
