<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactInquiryReceivedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class ContactInquiryController extends Controller
{
    public function store(Request $request)
    {
        if ($request->filled('contact_reference') || $request->filled('company_website')) {
            return response()->json(['message' => 'Your message has been sent.']);
        }

        $data = $request->validate([
            'type' => 'required|in:enquiry,complaint',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'order_number' => 'nullable|string|max:100',
            'subject' => 'required|string|max:160',
            'message' => 'required|string|min:20|max:5000',
        ]);

        $recipient = config('services.admin_notify_email');

        if (! $recipient) {
            return response()->json(['message' => 'Contact messages are temporarily unavailable. Please try again later.'], 503);
        }

        try {
            Mail::to($recipient)->send(new ContactInquiryReceivedMail(
                type: $data['type'],
                name: $data['name'],
                email: strtolower($data['email']),
                orderNumber: $data['order_number'] ?? null,
                subjectLine: $data['subject'],
                inquiryMessage: $data['message'],
            ));
        } catch (TransportExceptionInterface $exception) {
            report($exception);

            return response()->json(['message' => 'We could not send your message right now. Please try again later.'], 502);
        }

        return response()->json(['message' => 'Your message has been sent.']);
    }
}
