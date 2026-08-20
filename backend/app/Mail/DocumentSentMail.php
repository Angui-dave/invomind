<?php

namespace App\Mail;

use App\Models\Document;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentSentMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public Document $document,
        public string $subjectLine,
        public string $bodyText,
        public string $pdfAbsolutePath,
        public string $pdfFilename,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: nl2br(e($this->bodyText), false),
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if (! is_file($this->pdfAbsolutePath)) {
            return [];
        }

        return [
            Attachment::fromPath($this->pdfAbsolutePath)
                ->as($this->pdfFilename)
                ->withMime('application/pdf'),
        ];
    }
}
