@component('mail::message')
# New {{ ucfirst($type) }}

**From:** {{ $name }} ({{ $email }})
@if($orderNumber)
**Order number:** {{ $orderNumber }}
@endif

**Subject:** {{ $subjectLine }}

**Message:**
{{ $inquiryMessage }}

Reply to this email to respond directly to the sender.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
