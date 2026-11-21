<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderMessageMail;
use App\Models\CustomOrderRequest;
use App\Models\Order;
use App\Models\OrderMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class OrderMessageController extends Controller
{
    public function customerOrder(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        return $this->store($request, $order, null);
    }

    public function customerCustomOrder(Request $request, CustomOrderRequest $customOrder)
    {
        $this->authorizeCustomOrder($request, $customOrder);

        return $this->store($request, null, $customOrder);
    }

    public function adminOrder(Request $request, Order $order)
    {
        return $this->store($request, $order, null);
    }

    public function adminCustomOrder(Request $request, CustomOrderRequest $customOrder)
    {
        return $this->store($request, null, $customOrder);
    }

    private function store(Request $request, ?Order $order, ?CustomOrderRequest $customOrder)
    {
        $data = $request->validate([
            'body' => 'nullable|string|max:5000',
            'images' => 'nullable|array|max:3',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:1024',
        ]);
        $files = $request->file('images', []);

        if (blank($data['body'] ?? null) && count($files) === 0) {
            return response()->json(['message' => 'Add a message or attach at least one image.'], 422);
        }

        $imageUrls = [];
        foreach ($files as $file) {
            $path = $file->store('order-messages', 'public');
            $imageUrls[] = Storage::disk('public')->url($path);
        }

        $message = OrderMessage::create([
            'order_id' => $order?->id,
            'custom_order_request_id' => $customOrder?->id,
            'sender_id' => $request->user()->id,
            'body' => trim($data['body'] ?? ''),
            'images' => $imageUrls,
        ])->load('sender:id,name,is_admin');

        $recipient = $request->user()->is_admin
            ? ($order?->recipientEmail() ?? $customOrder?->email)
            : (config('services.admin_notify_email') ?: config('mail.from.address'));

        if ($recipient) {
            try {
                Mail::to($recipient)->send(new OrderMessageMail(
                    $message->load(['order', 'customOrderRequest']),
                    ! $request->user()->is_admin,
                ));
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return response()->json($message, 201);
    }

    private function authorizeCustomOrder(Request $request, CustomOrderRequest $customOrder): void
    {
        $user = $request->user();
        abort_unless($customOrder->user_id === $user->id || $customOrder->email === $user->email, 404);
    }
}
