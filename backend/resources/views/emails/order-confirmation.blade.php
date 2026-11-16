@component('mail::message')
# Order confirmed

Thank you for your order, {{ $order->shipping_name }}.

**Order number:** {{ $order->order_number }}

@component('mail::table')
| Item | Quantity | Price |
|:-----|---------:|------:|
@foreach($order->items as $item)
| {{ $item->name_snapshot }} | {{ $item->quantity }} | ${{ number_format($item->price_snapshot, 2) }} |
@endforeach
@endcomponent

**Total:** ${{ number_format($order->total, 2) }}

Thanks,<br>
{{ config('app.name') }}
@endcomponent
