<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            EmailTemplate::where('organization_id', $this->orgId($request))->get()
        );
    }

    public function update(Request $request, string $milestone): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string'],
            'body' => ['required', 'string'],
        ]);

        $template = EmailTemplate::where('organization_id', $this->orgId($request))
            ->where('milestone', $milestone)
            ->firstOrFail();

        $template->update($data);

        return response()->json($template);
    }
}
