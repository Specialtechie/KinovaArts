@component('mail::message')
# Delivery fee update

Hi {{ $order->shipping_name }},

@if($paid)
We received your delivery fee payment of **{{ $order->delivery_fee_currency }} {{ number_format($order->delivery_fee_amount, 2) }}** for order **{{ $order->order_number }}**. Thank you.
@elseif($order->delivery_fee_amount > 0)
A delivery fee of **{{ $order->delivery_fee_currency }} {{ number_format($order->delivery_fee_amount, 2) }}** has been added to order **{{ $order->order_number }}** based on your delivery address. It will be collected separately from your original order payment.

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/orders/'.$order->id])
View order and pay delivery fee
@endcomponent
@else
The delivery fee for order **{{ $order->order_number }}** has been removed.
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
