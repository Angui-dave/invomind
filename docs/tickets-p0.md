# Backlog P0 — Cycle d’encaissement (ARCHIVÉ)

> **Statut : livré dans le code Laravel + front BFF (août 2026).**  
> Ce document décrit l’état *avant* P0. Ne pas s’en servir comme TODO actif.  
> Contrat API à jour : [LARAVEL.md](./LARAVEL.md).

Tous les tickets P0-01 … P0-10 sont **implémentés** :

| ID | Titre | État code |
|---|---|---|
| P0-01 | Numérotation / gel / snapshot | `DocumentNumberingService`, `DocumentLifecycleService`, `document_sequences` |
| P0-02 | Deliveries + relances | `outbound_deliveries`, `document_reminders.scheduled_for` |
| P0-03 | Payment intents PSP | table `payment_intents` |
| P0-04 | Queue / scheduler / mail | `queue:work`, schedule overdue + reminders |
| P0-05 | PDF DomPDF | `GenerateDocumentPdfJob`, Blade UEMOA |
| P0-06 | issue / send / pdf | endpoints + front |
| P0-07 | Overdue + relances | commandes artisan + jobs |
| P0-08 | CinetPay gateway | `CinetPayGateway`, `PSP_DRIVER=fake` |
| P0-09 | Portail réel | checkout + reçu, `POST /pay` → 410 |
| P0-10 | Reset password + invitations | pages Next + API |

## Hors P0 (toujours hors scope)

WhatsApp Cloud API native, OCR, stock, factures récurrentes, app Flutter, agents IA, export SYSCOHADA, auto-renouvellement CinetPay (hors checkout prépayé 30 j).

## Suivi post-P0 (alignement)

Voir l’audit d’alignement front↔back : multi-org auth, API Resources, templates mail complets, statuts devis, branding persisté, nettoyage Drizzle.
