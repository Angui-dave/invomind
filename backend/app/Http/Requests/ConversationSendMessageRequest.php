<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConversationSendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contenu' => ['nullable', 'string', 'max:8192'],
            'type_contenu' => ['nullable', 'in:texte,image,fichier,audio,video,modele'],
            'url_media' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
