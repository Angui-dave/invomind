<?php

namespace App\Mail;

use App\Models\Organization;
use App\Models\OrganizationInvitation;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public OrganizationInvitation $invitation,
        public string $plainToken,
        public Organization $organization,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitation à rejoindre '.$this->organization->name.' sur InvoMind',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.invitation',
            with: [
                'organizationName' => $this->organization->name,
                'acceptUrl' => $this->acceptUrl(),
            ],
        );
    }

    public function acceptUrl(): string
    {
        return rtrim((string) config('services.frontend.url'), '/').'/accept-invitation?token='.$this->plainToken;
    }
}
