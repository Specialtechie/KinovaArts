@component('mail::message')
# Update on your custom order request

Hi {{ $customOrderRequest->name }},

@if($customOrderRequest->status === 'quoted')
We've reviewed your request and put together a quote:

**Total price:** {{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->quoted_price, 2) }}

@if($customOrderRequest->requiresInstallment())
This can be paid as a 70% deposit now ({{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->depositAmount(), 2) }}), with the remaining 30% ({{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->balanceAmount(), 2) }}) due before delivery.
@endif

Paystack will charge the NGN equivalent. The current estimate and final amount will be shown during checkout.

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/custom-orders/'.$customOrderRequest->id])
View quote & proceed to payment
@endcomponent
@elseif($customOrderRequest->status === 'declined')
Unfortunately we're not able to take this on right now. Feel free to reach out if you'd like to discuss alternatives.
@elseif($customOrderRequest->status === 'completed')
Your custom piece is ready! @if($customOrderRequest->requiresInstallment() && ! $customOrderRequest->isBalancePaid()) The remaining balance of {{ $customOrderRequest->quoted_currency ?: 'USD' }} {{ number_format($customOrderRequest->balanceAmount(), 2) }} is now due before delivery. @endif

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/custom-orders/'.$customOrderRequest->id])
View your request
@endcomponent
@else
Your request status has been updated to **{{ ucfirst($customOrderRequest->status) }}**.

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/account/custom-orders/'.$customOrderRequest->id])
View your request
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
