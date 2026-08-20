<?php

namespace App\Services;

use App\Models\EmailTemplate;
use App\Models\Organization;
use App\Support\EmailTemplateCatalog;

class DefaultEmailTemplateService
{
    public function seedFor(Organization $organization): void
    {
        foreach (EmailTemplateCatalog::defaults() as $template) {
            EmailTemplate::query()->firstOrCreate(
                [
                    'organization_id' => $organization->id,
                    'channel' => EmailTemplateCatalog::CHANNEL_EMAIL,
                    'event' => $template['event'],
                ],
                [
                    'label' => $template['label'],
                    'subject' => $template['subject'],
                    'body' => $template['body'],
                    'updated_at' => now(),
                ],
            );
        }
    }
}
