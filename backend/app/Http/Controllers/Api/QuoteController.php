<?php

namespace App\Http\Controllers\Api;

use App\Enums\DevisStatut;
use App\Http\Controllers\Controller;
use App\Http\Requests\QuoteRequest;
use App\Http\Resources\QuoteResource;
use App\Models\Quote;
use App\Models\QuoteLine;
use App\Services\LineComputeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class QuoteController extends Controller
{
    /**
     * Org-wide listing for both admin and agent (no commercial/user_id filter).
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = Quote::query()->with('lines')->orderByDesc('created_at');

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        return $this->paginated($request, $query, QuoteResource::class);
    }

    public function show(int $id): QuoteResource
    {
        return new QuoteResource(Quote::query()->with('lines')->findOrFail($id));
    }

    public function store(QuoteRequest $request, LineComputeService $compute): JsonResponse
    {
        $quote = DB::transaction(function () use ($request, $compute) {
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

            $quote = Quote::create([
                'orga_id' => $orgaId,
                'user_id' => $request->user()->id,
                'client_id' => $data['client_id'],
                'numero' => $data['numero'] ?? $this->nextNumero($orgaId),
                'date_creation' => now(),
                'date_validite' => $data['date_validite'] ?? null,
                'statut' => DevisStatut::Brouillon,
                'devise' => $data['devise'] ?? 'XOF',
                'sous_total' => $totals['sous_total'],
                'remise_montant' => $data['remise_montant'] ?? 0,
                'montant_tva' => $totals['montant_tva'],
                'montant_total' => $totals['montant_total'],
                'note' => $data['note'] ?? null,
            ]);

            foreach ($computedLines as $line) {
                QuoteLine::create(['devis_id' => $quote->id, ...$line]);
            }

            return $quote->load('lines');
        });

        return (new QuoteResource($quote))->response()->setStatusCode(201);
    }

    public function update(QuoteRequest $request, int $id, LineComputeService $compute): QuoteResource
    {
        $quote = Quote::query()->findOrFail($id);

        if ($quote->statut !== DevisStatut::Brouillon) {
            abort(422, 'Seul un devis brouillon peut être modifié.');
        }

        $quote = DB::transaction(function () use ($request, $compute, $quote) {
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

            $quote->update([
                'client_id' => $data['client_id'],
                'numero' => $data['numero'] ?? $quote->numero,
                'date_validite' => $data['date_validite'] ?? $quote->date_validite,
                'devise' => $data['devise'] ?? $quote->devise,
                'remise_montant' => $data['remise_montant'] ?? 0,
                'sous_total' => $totals['sous_total'],
                'montant_tva' => $totals['montant_tva'],
                'montant_total' => $totals['montant_total'],
                'note' => $data['note'] ?? null,
            ]);

            $quote->lines()->delete();
            foreach ($computedLines as $line) {
                QuoteLine::create(['devis_id' => $quote->id, ...$line]);
            }

            return $quote->load('lines');
        });

        return new QuoteResource($quote);
    }

    public function updateStatus(Request $request, int $id): QuoteResource
    {
        $data = $request->validate([
            'statut' => ['required', 'string'],
        ]);

        $quote = Quote::query()->with('lines')->findOrFail($id);
        $quote->update(['statut' => $data['statut']]);

        return new QuoteResource($quote->fresh('lines'));
    }

    private function nextNumero(int|string $orgaId): string
    {
        $count = Quote::withoutGlobalScopes()->where('orga_id', $orgaId)->withTrashed()->count() + 1;

        return 'DEV-'.now()->format('Y').'-'.str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}
