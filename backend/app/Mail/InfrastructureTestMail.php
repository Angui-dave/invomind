<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InfrastructureTestMail extends Mailable
{
    use SerializesModels;

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'InvoMind — e-mail de test infrastructure',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.infrastructure-test',
        );
    }
}
