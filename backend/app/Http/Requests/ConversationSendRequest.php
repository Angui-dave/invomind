<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConversationSendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'conversation_id' => ['required', 'uuid'],
            'channel' => ['required', 'in:whatsapp,messenger,instagram,tiktok'],
            'to' => ['required', 'string'],
            'body' => ['required', 'string'],
            'thread_ref' => ['nullable', 'string'],
        ];
    }
}
