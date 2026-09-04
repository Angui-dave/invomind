<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->attributes->get('membership_role');

        if ($role !== UserRole::Admin->value && $role !== UserRole::Admin) {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        return $next($request);
    }
}
