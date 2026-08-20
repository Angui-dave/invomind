<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->attributes->get('membership_role');

        if (! in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        return $next($request);
    }
}
