<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LabelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->attributes->get('organization_id');

        return [
            'nom' => [
                'required',
                'string',
                'max:100',
                Rule::unique('etiquettes', 'nom')->where(fn ($q) => $q->where('orga_id', $orgId)),
            ],
            'couleur' => ['nullable', 'string', 'max:32'],
        ];
    }
}
