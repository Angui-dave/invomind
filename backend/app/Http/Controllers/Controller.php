<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function orgId(Request $request): string
    {
        return $request->attributes->get('organization_id');
    }
}
