<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProspectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['sometimes', 'string', 'max:255'],
            'estimated_value' => ['sometimes', 'numeric', 'min:0'],
            'stage' => ['sometimes', 'in:nouveau,qualifie,devis,negociation,gagne,perdu'],
        ];
    }
}
