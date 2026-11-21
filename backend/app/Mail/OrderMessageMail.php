<?php

namespace App\Mail;

use App\Models\OrderMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public OrderMessage $orderMessage, public bool $forAdmin = false) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'New message about your Kinova Arts order');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.order-message');
    }
}
