@component('mail::message')
# Order confirmed

Thank you for your order, {{ $order->shipping_name }}.

**Order number:** {{ $order->order_number }}

@if($order->custom_order_request_id && $order->customOrderRequest)
**Custom order payment:** {{ $order->customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($order->customOrderRequest->paymentAmount($order->payment_type ?: 'full'), 2) }}
@else
@component('mail::table')
| Item | Quantity | Price |
|:-----|---------:|------:|
@foreach($order->items as $item)
| {{ $item->name_snapshot }} | {{ $item->quantity }} | ${{ number_format($item->price_snapshot, 2) }} |
@endforeach
@endcomponent

**Total:** ${{ number_format($order->total, 2) }}
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
