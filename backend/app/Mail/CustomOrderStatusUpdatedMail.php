<?php

namespace App\Mail;

use App\Models\CustomOrderRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomOrderStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public CustomOrderRequest $customOrderRequest) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Update on your Kinova Arts custom order');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.custom-order-status-updated');
    }
}
