<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Expense;
use App\Models\Payment;
use App\Services\EntitlementService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
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
            ->whereIn('status', ['draft', 'sent'])
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

    public function overview(Request $request, EntitlementService $entitlements): JsonResponse
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

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => bcsub((string) $totalRevenue, (string) $totalExpenses, 2),
            'invoices_by_status' => $invoicesByStatus,
            'expenses_by_category' => $expensesByCategory,
        ]);
    }
}
