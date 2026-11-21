<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExchangeRates;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class CurrencyRateController extends Controller
{
    public function show(ExchangeRates $exchangeRates): JsonResponse
    {
        try {
            return response()->json($exchangeRates->latest());
        } catch (RuntimeException $exception) {
            report($exception);

            return response()->json([
                'message' => 'Currency rates are temporarily unavailable.',
            ], 503);
        }
    }
}
