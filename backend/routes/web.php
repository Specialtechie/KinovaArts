<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaystackWebhookController;

Route::post('/webhooks/paystack', [PaystackWebhookController::class, 'handle']);
