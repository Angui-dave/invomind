<?php

namespace App\Http\Requests;

use App\Enums\CanalMessagerie;
use App\Enums\ModeBoiteReception;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InboxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'canal' => ['required', Rule::enum(CanalMessagerie::class)],
            'nom' => ['required', 'string', 'max:255'],
            'mode' => ['nullable', Rule::enum(ModeBoiteReception::class)],
            'actif' => ['nullable', 'boolean'],
            'identifiants' => ['nullable', 'array'],
            'identifiants.access_token' => ['nullable', 'string'],
            'identifiants.phone_number_id' => ['nullable', 'string'],
            'identifiants.waba_id' => ['nullable', 'string'],
            'identifiants.page_id' => ['nullable', 'string'],
            'identifiants.ig_business_id' => ['nullable', 'string'],
            'identifiants.external_id' => ['nullable', 'string'],
        ];
    }
}
