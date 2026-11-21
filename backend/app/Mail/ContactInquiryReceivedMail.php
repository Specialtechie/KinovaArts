<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactInquiryReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $type,
        public string $name,
        public string $email,
        public ?string $orderNumber,
        public string $subjectLine,
        public string $inquiryMessage,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: ucfirst($this->type).': '.$this->subjectLine,
            replyTo: [new Address($this->email, $this->name)],
        );
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.contact-inquiry-received');
    }
}
