<?php

namespace App\Http\Controllers\Api;

use App\Enums\DevisStatut;
use App\Enums\FactureStatut;
use App\Http\Controllers\Controller;
use App\Http\Requests\InvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Quote;
use App\Services\DocumentStatusService;
use App\Services\EntitlementService;
use App\Services\LineComputeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    /**
     * Org-wide listing for both admin and agent (no commercial/user_id filter).
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = Invoice::query()->with(['lines', 'client'])->orderByDesc('created_at');

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        return $this->paginated($request, $query, InvoiceResource::class);
    }

    public function show(int $id): InvoiceResource
    {
        return new InvoiceResource(Invoice::query()->with(['lines', 'client'])->findOrFail($id));
    }

    public function store(InvoiceRequest $request, EntitlementService $entitlements, LineComputeService $compute): JsonResponse
    {
        $entitlements->assertCanCreateInvoice($this->orgId($request));

        $invoice = DB::transaction(function () use ($request, $compute) {
            $data = $request->validated();
            $computedLines = [];
            foreach (array_values($data['lines']) as $i => $line) {
                $c = $compute->computeLine($line);
                $computedLines[] = [
                    ...$c,
                    'produit_id' => $line['produit_id'] ?? null,
                    'designation' => $line['designation'],
                    'ordre' => $i,
                ];
            }

            $totals = $compute->computeTotals($computedLines, (float) ($data['remise_montant'] ?? 0));
            $orgaId = $this->orgId($request);

            $invoice = Invoice::create([
                'orga_id' => $orgaId,
                'user_id' => $request->user()->id,
                'client_id' => $data['client_id'],
                'devis_id' => $data['devis_id'] ?? null,
                'numero' => $data['numero'] ?? $this->nextNumero($orgaId),
                'date_creation' => now(),
                'date_echeance' => $data['date_echeance'] ?? null,
                'statut' => FactureStatut::Brouillon,
                'devise' => $data['devise'] ?? 'XOF',
                'sous_total' => $totals['sous_total'],
                'remise_montant' => $data['remise_montant'] ?? 0,
                'montant_tva' => $totals['montant_tva'],
                'montant_total' => $totals['montant_total'],
                'montant_paye' => 0,
                'note' => $data['note'] ?? null,
            ]);

            foreach ($computedLines as $line) {
                InvoiceLine::create(['facture_id' => $invoice->id, ...$line]);
            }

            if (! empty($data['devis_id'])) {
                Quote::query()->whereKey($data['devis_id'])->update(['statut' => DevisStatut::Converti]);
            }

            return $invoice->load('lines');
        });

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    public function update(InvoiceRequest $request, int $id, LineComputeService $compute): InvoiceResource
    {
        $invoice = Invoice::query()->findOrFail($id);

        if ($invoice->statut !== FactureStatut::Brouillon) {
            abort(422, 'Seule une facture brouillon peut être modifiée.');
        }

        $invoice = DB::transaction(function () use ($request, $compute, $invoice) {
            $data = $request->validated();
            $computedLines = [];
            foreach (array_values($data['lines']) as $i => $line) {
                $c = $compute->computeLine($line);
                $computedLines[] = [
                    ...$c,
                    'produit_id' => $line['produit_id'] ?? null,
                    'designation' => $line['designation'],
                    'ordre' => $i,
                ];
            }
            $totals = $compute->computeTotals($computedLines, (float) ($data['remise_montant'] ?? 0));

            $invoice->update([
                'client_id' => $data['client_id'],
                'devis_id' => $data['devis_id'] ?? $invoice->devis_id,
                'numero' => $data['numero'] ?? $invoice->numero,
                'date_echeance' => $data['date_echeance'] ?? $invoice->date_echeance,
                'devise' => $data['devise'] ?? $invoice->devise,
                'remise_montant' => $data['remise_montant'] ?? 0,
                'sous_total' => $totals['sous_total'],
                'montant_tva' => $totals['montant_tva'],
                'montant_total' => $totals['montant_total'],
                'note' => $data['note'] ?? null,
            ]);

            $invoice->lines()->delete();
            foreach ($computedLines as $line) {
                InvoiceLine::create(['facture_id' => $invoice->id, ...$line]);
            }

            return $invoice->load('lines');
        });

        return new InvoiceResource($invoice);
    }

    public function updateStatus(Request $request, int $id, DocumentStatusService $statuses): InvoiceResource
    {
        $data = $request->validate([
            'statut' => ['required', Rule::enum(FactureStatut::class)],
        ]);

        $invoice = Invoice::query()->with('lines')->findOrFail($id);
        $next = FactureStatut::from($data['statut']);
        $statuses->assertInvoiceTransition($invoice->statut, $next);
        $invoice->update(['statut' => $next]);

        return new InvoiceResource($invoice->fresh('lines'));
    }

    public function convertFromQuote(Request $request, int $quoteId, EntitlementService $entitlements, LineComputeService $compute): JsonResponse
    {
        $entitlements->assertCanCreateInvoice($this->orgId($request));
        $quote = Quote::query()->with(['lines', 'client'])->findOrFail($quoteId);
        $quoteStatus = $quote->statut instanceof DevisStatut
            ? $quote->statut
            : DevisStatut::tryFrom((string) $quote->statut);
        if (! in_array($quoteStatus, [DevisStatut::Accepte, DevisStatut::Envoye], true)) {
            abort(422, 'Seul un devis envoyé ou accepté peut être converti.');
        }

        $invoice = DB::transaction(function () use ($request, $compute, $quote) {
            $computedLines = [];
            foreach ($quote->lines->values() as $i => $line) {
                $c = $compute->computeLine([
                    'quantite' => $line->quantite,
                    'prix_unitaire' => $line->prix_unitaire,
                    'taux_tva' => $line->taux_tva,
                    'remise_pourcentage' => $line->remise_pourcentage,
                ]);
                $computedLines[] = [
                    ...$c,
                    'produit_id' => $line->produit_id,
                    'designation' => $line->designation,
                    'ordre' => $i,
                ];
            }

            $totals = $compute->computeTotals($computedLines, (float) $quote->remise_montant);
            $orgaId = $this->orgId($request);
            $quote->loadMissing('client');
            $termDays = (int) ($quote->client?->delai_paiement_jours ?? 30);

            $invoice = Invoice::create([
                'orga_id' => $orgaId,
                'user_id' => $request->user()->id,
                'client_id' => $quote->client_id,
                'devis_id' => $quote->id,
                'numero' => $this->nextNumero($orgaId),
                'date_creation' => now(),
                'date_echeance' => now()->addDays($termDays)->toDateString(),
                'statut' => FactureStatut::Brouillon,
                'devise' => $quote->devise,
                'sous_total' => $totals['sous_total'],
                'remise_montant' => $quote->remise_montant,
                'montant_tva' => $totals['montant_tva'],
                'montant_total' => $totals['montant_total'],
                'montant_paye' => 0,
                'note' => $quote->note,
            ]);

            foreach ($computedLines as $line) {
                InvoiceLine::create(['facture_id' => $invoice->id, ...$line]);
            }

            $quote->update(['statut' => DevisStatut::Converti]);

            return $invoice->load('lines');
        });

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    private function nextNumero(int|string $orgaId): string
    {
        $count = Invoice::withoutGlobalScopes()->where('orga_id', $orgaId)->withTrashed()->count() + 1;

        return 'FAC-'.now()->format('Y').'-'.str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}
