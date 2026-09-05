<?php

namespace App\Http\Controllers\Api;

use App\Enums\DepenseStatut;
use App\Enums\FactureStatut;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\InvoicePayment;
use App\Models\Quote;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /** Statuts facture hors brouillon / annulée (CA facturé). */
    private const BILLABLE = [
        FactureStatut::Envoyee->value,
        FactureStatut::PartiellementPayee->value,
        FactureStatut::Payee->value,
        FactureStatut::Impayee->value,
        FactureStatut::EnRetard->value,
    ];

    /** Statuts ouverts (en attente d'encaissement). */
    private const PENDING = [
        FactureStatut::Envoyee->value,
        FactureStatut::PartiellementPayee->value,
        FactureStatut::Impayee->value,
    ];

    public function dashboard(Request $request): JsonResponse
    {
        $orgaId = $this->orgId($request);
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth()->toDateString();
        $monthEnd = $now->copy()->endOfMonth()->toDateString();

        $monthRevenue = (float) InvoicePayment::query()
            ->whereDate('date_paiement', '>=', $monthStart)
            ->whereDate('date_paiement', '<=', $monthEnd)
            ->sum('montant');

        $pendingInvoiceCount = Invoice::query()
            ->whereIn('statut', self::PENDING)
            ->count();

        $overdueInvoiceCount = $this->overdueQuery()->count();

        $revenueByMonth = [];
        for ($i = 11; $i >= 0; $i--) {
            $cursor = $now->copy()->startOfMonth()->subMonths($i);
            $start = $cursor->toDateString();
            $end = $cursor->copy()->endOfMonth()->toDateString();
            $key = $cursor->format('Y-m');
            $total = (float) InvoicePayment::query()
                ->whereDate('date_paiement', '>=', $start)
                ->whereDate('date_paiement', '<=', $end)
                ->sum('montant');
            $revenueByMonth[] = [
                'month' => $key,
                'total' => $total,
            ];
        }

        $topClients = Invoice::query()
            ->select([
                'clients.id as client_id',
                'clients.name_company as client_name',
                DB::raw('COALESCE(SUM(factures.montant_total), 0) as total'),
            ])
            ->join('clients', 'clients.id', '=', 'factures.client_id')
            ->whereIn('factures.statut', self::BILLABLE)
            ->groupBy('clients.id', 'clients.name_company')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'client_id' => (string) $row->client_id,
                'client_name' => (string) $row->client_name,
                'total' => (float) $row->total,
            ])
            ->values()
            ->all();

        $expensesTtc = (float) Expense::query()
            ->where('statut', DepenseStatut::Validee->value)
            ->sum('montant_ttc');

        return response()->json([
            'organization_id' => $orgaId,
            'month_revenue' => $monthRevenue,
            'pending_invoice_count' => $pendingInvoiceCount,
            'overdue_invoice_count' => $overdueInvoiceCount,
            'revenue_by_month' => $revenueByMonth,
            'top_clients' => $topClients,
            'clients' => Client::query()->count(),
            'quotes' => Quote::query()->count(),
            'invoices' => Invoice::query()->count(),
            'invoices_total' => (float) Invoice::query()
                ->whereIn('statut', self::BILLABLE)
                ->sum('montant_total'),
            'invoices_paid' => (float) Invoice::query()->sum('montant_paye'),
            'payments_count' => InvoicePayment::query()->count(),
            'expenses_total' => $expensesTtc,
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        $totalRevenue = (float) InvoicePayment::query()->sum('montant');
        $totalExpensesHt = (float) Expense::query()
            ->where('statut', DepenseStatut::Validee->value)
            ->sum('montant_ht');
        $totalExpensesTtc = (float) Expense::query()
            ->where('statut', DepenseStatut::Validee->value)
            ->sum('montant_ttc');
        $billedHt = (float) Invoice::query()
            ->whereIn('statut', self::BILLABLE)
            ->sum('sous_total');
        $billedTtc = (float) Invoice::query()
            ->whereIn('statut', self::BILLABLE)
            ->sum('montant_total');
        $vatCollected = (float) Invoice::query()
            ->whereIn('statut', self::BILLABLE)
            ->sum('montant_tva');

        $invoicesByStatus = Invoice::query()
            ->select(['statut', DB::raw('COUNT(*) as count'), DB::raw('COALESCE(SUM(montant_total), 0) as total')])
            ->groupBy('statut')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->statut instanceof FactureStatut
                    ? $row->statut->value
                    : (string) $row->statut,
                'count' => (int) $row->count,
                'total' => (float) $row->total,
            ])
            ->values()
            ->all();

        $expensesByCategory = Expense::query()
            ->select([
                DB::raw("COALESCE(categories_depense.nom, 'Autres') as category"),
                DB::raw('COALESCE(SUM(depenses.montant_ttc), 0) as total'),
            ])
            ->leftJoin('categories_depense', 'categories_depense.id', '=', 'depenses.categorie_id')
            ->where('depenses.statut', DepenseStatut::Validee->value)
            ->groupBy('categories_depense.nom')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'category' => (string) $row->category,
                'total' => (float) $row->total,
            ])
            ->values()
            ->all();

        $vatByRate = InvoiceLine::query()
            ->select([
                'facture_lignes.taux_tva as rate',
                DB::raw('COALESCE(SUM(facture_lignes.montant_ht * facture_lignes.taux_tva / 100), 0) as amount'),
            ])
            ->join('factures', 'factures.id', '=', 'facture_lignes.facture_id')
            ->whereIn('factures.statut', self::BILLABLE)
            ->whereNull('factures.deleted_at')
            ->groupBy('facture_lignes.taux_tva')
            ->orderBy('facture_lignes.taux_tva')
            ->get()
            ->map(fn ($row) => [
                'rate' => (float) $row->rate,
                'amount' => round((float) $row->amount, 2),
            ])
            ->values()
            ->all();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpensesTtc,
            'total_expenses_ht' => $totalExpensesHt,
            'net_profit' => $totalRevenue - $totalExpensesTtc,
            'billed_ht' => $billedHt,
            'billed_ttc' => $billedTtc,
            'vat_collected' => $vatCollected,
            'vat_by_rate' => $vatByRate,
            'invoices_by_status' => $invoicesByStatus,
            'expenses_by_category' => $expensesByCategory,
            'paid_invoice_count' => Invoice::query()->where('statut', FactureStatut::Payee->value)->count(),
            'pending_invoice_count' => Invoice::query()->whereIn('statut', self::PENDING)->count(),
            'overdue_invoice_count' => $this->overdueQuery()->count(),
        ]);
    }

    /**
     * Overdue unifié : statut en_retard OU échéance dépassée sur statut ouvert.
     */
    private function overdueQuery()
    {
        return Invoice::query()
            ->where(function ($q) {
                $q->where('statut', FactureStatut::EnRetard->value)
                    ->orWhere(function ($q2) {
                        $q2->whereIn('statut', self::PENDING)
                            ->whereDate('date_echeance', '<', now()->toDateString());
                    });
            });
    }
}
