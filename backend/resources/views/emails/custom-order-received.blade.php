@component('mail::message')
# New custom order request

**From:** {{ $customOrderRequest->name }} ({{ $customOrderRequest->email }})
@if($customOrderRequest->phone)
**Phone:** {{ $customOrderRequest->phone }}
@endif

@if($customOrderRequest->product)
**Inspired by:** {{ $customOrderRequest->product->name }}
@endif

**Description:**
{{ $customOrderRequest->description }}

@if($customOrderRequest->material_preference)
**Material preference:** {{ $customOrderRequest->material_preference }}
@endif
@if($customOrderRequest->color_preference)
**Color preference:** {{ $customOrderRequest->color_preference }}
@endif
@if($customOrderRequest->dimensions)
**Dimensions:** {{ $customOrderRequest->dimensions }}
@endif
@if($customOrderRequest->budget_range)
**Budget range:** {{ $customOrderRequest->budget_range }} {{ $customOrderRequest->budget_currency ?: 'USD' }}
@endif
@if($customOrderRequest->desired_timeline)
**Desired timeline:** {{ $customOrderRequest->desired_timeline }}
@endif

@component('mail::button', ['url' => rtrim(config('services.frontend.url'), '/').'/admin/custom-orders/'.$customOrderRequest->id])
View request in admin
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
