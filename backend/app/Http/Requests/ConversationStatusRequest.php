<?php

namespace App\Http\Requests;

use App\Enums\StatutConversation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConversationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', Rule::enum(StatutConversation::class)],
        ];
    }
}
