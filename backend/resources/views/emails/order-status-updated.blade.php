@component('mail::message')
# Order status update

Hi {{ $order->shipping_name }},

Your order **{{ $order->order_number }}** is now **{{ ucfirst($order->status) }}**.

@if($order->courier || $order->tracking_number)
@if($order->courier) **Courier:** {{ $order->courier }}@endif
@if($order->tracking_number) **Tracking number:** {{ $order->tracking_number }}@endif
@endif

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/orders/'.$order->id])
View order
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
