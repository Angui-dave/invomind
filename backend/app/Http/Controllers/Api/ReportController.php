<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Expense;
use App\Models\Payment;
use App\Services\DocumentComputeService;
use App\Services\EntitlementService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private const BILLABLE = ['sent', 'partially_paid', 'paid', 'overdue'];

    public function dashboard(Request $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'reports');

        $orgId = $this->orgId($request);
        $monthStart = Carbon::now()->startOfMonth()->toDateString();

        $monthRevenue = Payment::where('organization_id', $orgId)
            ->whereRaw('paid_at >= ?', [$monthStart])
            ->sum('amount');

        $overdueCount = Document::where('organization_id', $orgId)
            ->where('kind', 'invoice')
            ->where('status', 'overdue')
            ->count();

        $pendingCount = Document::where('organization_id', $orgId)
            ->where('kind', 'invoice')
            ->whereIn('status', ['sent', 'partially_paid'])
            ->count();

        $revenueByMonth = Payment::where('organization_id', $orgId)
            ->selectRaw("substr(paid_at, 1, 7) as month, sum(amount) as total")
            ->groupByRaw("substr(paid_at, 1, 7)")
            ->orderBy('month')
            ->limit(12)
            ->get();

        $topClients = Payment::where('organization_id', $orgId)
            ->select('client_name', DB::raw('sum(amount) as total'))
            ->groupBy('client_name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'month_revenue' => $monthRevenue,
            'overdue_invoice_count' => $overdueCount,
            'pending_invoice_count' => $pendingCount,
            'revenue_by_month' => $revenueByMonth,
            'top_clients' => $topClients,
        ]);
    }

    public function overview(Request $request, EntitlementService $entitlements, DocumentComputeService $compute): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'reports');

        $orgId = $this->orgId($request);

        $totalRevenue = Payment::where('organization_id', $orgId)->sum('amount');
        $totalExpenses = Expense::where('organization_id', $orgId)->sum('amount');

        $invoicesByStatus = Document::where('organization_id', $orgId)
            ->where('kind', 'invoice')
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(total) as total'))
            ->groupBy('status')
            ->get();

        $expensesByCategory = Expense::where('organization_id', $orgId)
            ->join('expense_categories', 'expenses.category_id', '=', 'expense_categories.id')
            ->select('expense_categories.name as category', DB::raw('sum(expenses.amount) as total'))
            ->groupBy('expense_categories.name')
            ->get();

        $invoices = Document::query()
            ->where('organization_id', $orgId)
            ->where('kind', 'invoice')
            ->whereIn('status', self::BILLABLE)
            ->with('lines')
            ->get();

        $creditNotes = Document::query()
            ->where('organization_id', $orgId)
            ->where('kind', 'credit_note')
            ->whereIn('status', ['issued', 'applied'])
            ->with('lines')
            ->get();

        $billedHt = $invoices->sum(fn (Document $d) => (float) $d->subtotal_ht);
        $billedTtc = $invoices->sum(fn (Document $d) => (float) $d->total);
        $vatCollected = $invoices->sum(fn (Document $d) => (float) $d->tax_total)
            - $creditNotes->sum(fn (Document $d) => (float) $d->tax_total);

        $vatByRate = [];
        foreach ($invoices as $invoice) {
            $lines = $invoice->lines->map(fn ($line) => [
                'quantity' => $line->quantity,
                'unit_price' => $line->unit_price,
                'tax_rate' => $line->tax_rate,
                'discount_percent' => $line->discount_percent,
            ])->all();
            $detailed = $compute->computeDetailed($lines, $invoice->tax_mode ?? 'exclusive');
            foreach ($detailed['tax_by_rate'] as $rate => $amount) {
                $key = (string) $rate;
                $vatByRate[$key] = bcadd($vatByRate[$key] ?? '0.00', (string) $amount, 2);
            }
        }

        ksort($vatByRate, SORT_NUMERIC);
        $vatRows = [];
        foreach ($vatByRate as $rate => $amount) {
            $vatRows[] = [
                'rate' => (float) $rate,
                'amount' => (float) $amount,
            ];
        }

        $statusCount = fn (string $status): int => (int) ($invoicesByStatus->firstWhere('status', $status)?->count ?? 0);

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => bcsub((string) $totalRevenue, (string) $totalExpenses, 2),
            'invoices_by_status' => $invoicesByStatus,
            'expenses_by_category' => $expensesByCategory,
            'billed_ht' => round($billedHt, 2),
            'billed_ttc' => round($billedTtc, 2),
            'vat_collected' => round($vatCollected, 2),
            'vat_by_rate' => $vatRows,
            'paid_invoice_count' => $statusCount('paid'),
            'pending_invoice_count' => $statusCount('sent') + $statusCount('partially_paid'),
            'overdue_invoice_count' => $statusCount('overdue'),
        ]);
    }
}
