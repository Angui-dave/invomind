<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Document;
use App\Models\Payment;
use App\Services\DocumentPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function __construct(
        private DocumentPaymentService $payments,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|\Illuminate\Http\JsonResponse
    {
        $query = Payment::where('organization_id', $this->orgId($request))
            ->orderBy('created_at', 'desc');

        return $this->paginated($request, $query, PaymentResource::class);
    }

    public function store(PaymentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $orgId = $this->orgId($request);

        $doc = Document::where('organization_id', $orgId)->findOrFail($data['document_id']);
        $payment = $this->payments->recordManual($doc, $data);

        return (new PaymentResource($payment))
            ->response()
            ->setStatusCode(201);
    }
}
