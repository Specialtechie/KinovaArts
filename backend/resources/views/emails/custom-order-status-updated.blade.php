@component('mail::message')
# Update on your custom order request

Hi {{ $customOrderRequest->name }},

@if($customOrderRequest->status === 'quoted')
We've reviewed your request and put together a quote:

**Piece price:** {{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->quoted_price, 2) }}

@if($customOrderRequest->delivery_fee > 0)
**Delivery fee:** {{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->delivery_fee, 2) }}
**Total:** {{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->totalQuoteAmount(), 2) }}
@else
The delivery fee will be calculated after you provide your delivery address and will be added to the remaining balance.
@endif

@if($customOrderRequest->requiresInstallment())
Pay a 70% deposit now ({{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->depositAmount(), 2) }}). The remaining balance is due before delivery.
@endif

Paystack will charge the NGN equivalent. The current estimate and final amount will be shown during checkout.

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/custom-orders/'.$customOrderRequest->id])
View quote & proceed to payment
@endcomponent
@elseif($customOrderRequest->status === 'declined')
Unfortunately we're not able to take this on right now. Feel free to reach out if you'd like to discuss alternatives.
@elseif($customOrderRequest->status === 'completed')
Your custom piece is complete and ready for final payment and delivery.

@if($customOrderRequest->completion_details)
**Completion update:** {{ $customOrderRequest->completion_details }}
@endif

@foreach($customOrderRequest->completion_images ?? [] as $image)
[View completion photo]({{ $image }})
@endforeach

@if($customOrderRequest->requiresInstallment() && ! $customOrderRequest->isBalancePaid())
The remaining balance, including any delivery fee, is **{{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->balanceAmount(), 2) }}** and is due before delivery.
@endif

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/custom-orders/'.$customOrderRequest->id])
View your request
@endcomponent
@else
Your request status has been updated to **{{ ucfirst($customOrderRequest->status) }}**.

@if($customOrderRequest->delivery_fee > 0)
The delivery fee of {{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->delivery_fee, 2) }} has been added to the remaining balance. The balance is now {{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->balanceAmount(), 2) }}.
@endif

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/custom-orders/'.$customOrderRequest->id])
View your request
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
