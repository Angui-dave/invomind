<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Ce compte a été désactivé.'], 403);
        }

        if (! $user->orga_id) {
            return response()->json(['message' => 'No organization context.'], 403);
        }

        $headerOrgId = $request->header('X-Organization-Id');

        if ($headerOrgId !== null && $headerOrgId !== '' && (string) $headerOrgId !== (string) $user->orga_id) {
            return response()->json(['message' => 'Not a member of this organization.'], 403);
        }

        $request->attributes->set('organization_id', $user->orga_id);
        $request->attributes->set('membership_role', $user->role?->value ?? $user->role);

        return $next($request);
    }
}
