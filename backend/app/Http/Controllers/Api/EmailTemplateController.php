<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Support\EmailTemplateCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            EmailTemplate::where('organization_id', $this->orgId($request))
                ->orderBy('event')
                ->get()
        );
    }

    public function update(Request $request, string $event): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string'],
            'body' => ['required', 'string'],
            'label' => ['sometimes', 'string'],
        ]);

        $resolved = EmailTemplateCatalog::eventFromKey($event);

        $template = EmailTemplate::where('organization_id', $this->orgId($request))
            ->where('event', $resolved)
            ->firstOrFail();

        $template->update([
            ...$data,
            'updated_at' => now(),
        ]);

        return response()->json($template);
    }
}
