<?php

namespace App\Http\Requests;

use App\Support\OrgRules;
use Illuminate\Foundation\Http\FormRequest;

class ConversationAssignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'agent_id' => ['nullable', 'integer', OrgRules::exists('users')],
        ];
    }
}
