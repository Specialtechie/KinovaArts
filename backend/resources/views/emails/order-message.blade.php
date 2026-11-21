@component('mail::message')
# New message about your order

Hi {{ $forAdmin ? 'Kinova Arts team' : ($orderMessage->order?->shipping_name ?? $orderMessage->customOrderRequest?->name) }},

There is a new message about your
@if($orderMessage->order)
order **{{ $orderMessage->order->order_number }}**.
@else
custom order request.
@endif

@if($orderMessage->sender)
**{{ $orderMessage->sender->is_admin ? 'Kinova Arts' : $orderMessage->sender->name }}:**
@endif

{{ $orderMessage->body }}

@foreach($orderMessage->images ?? [] as $image)
[View attached image]({{ $image }})
@endforeach

@php
    $frontendUrl = rtrim(config('services.frontend.url'), '/');
    $conversationUrl = $orderMessage->order
        ? $frontendUrl.($forAdmin ? '/admin/orders/' : '/account/orders/').$orderMessage->order->id
        : $frontendUrl.($forAdmin ? '/admin/custom-orders/' : '/account/custom-orders/').$orderMessage->custom_order_request_id;
@endphp
@component('mail::button', ['url' => $conversationUrl])
View conversation
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
