<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ExchangeRates
{
    private const FRESH_CACHE_KEY = 'exchange-rates.usd.fresh.v1';
    private const LAST_GOOD_CACHE_KEY = 'exchange-rates.usd.last-good.v1';

    public function latest(): array
    {
        $cached = Cache::get(self::FRESH_CACHE_KEY);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::timeout(10)->get('https://open.er-api.com/v6/latest/USD');
        } catch (ConnectionException $exception) {
            return $this->staleOrFail('Could not reach the exchange-rate provider.', $exception);
        }

        if (! $response->successful()) {
            return $this->staleOrFail('The exchange-rate provider returned an unsuccessful response.');
        }

        $payload = $response->json();
        if (
            ! is_array($payload)
            || ($payload['result'] ?? null) !== 'success'
            || ($payload['base_code'] ?? null) !== 'USD'
            || ! is_array($payload['rates'] ?? null)
            || ! isset($payload['rates']['NGN'])
            || ! is_numeric($payload['rates']['NGN'])
            || ! is_string($payload['time_last_update_utc'] ?? null)
        ) {
            return $this->staleOrFail('The exchange-rate provider returned invalid data.');
        }

        $rates = ['USD' => 1.0];
        foreach ($payload['rates'] as $currency => $rate) {
            if (preg_match('/^[A-Z]{3}$/', $currency) && is_numeric($rate) && (float) $rate > 0) {
                $rates[$currency] = (float) $rate;
            }
        }

        if (! isset($rates['NGN'])) {
            return $this->staleOrFail('The exchange-rate provider did not return an NGN rate.');
        }

        $data = [
            'base' => 'USD',
            'rates' => $rates,
            'updated_at' => $payload['time_last_update_utc'],
            'next_update_at' => is_string($payload['time_next_update_utc'] ?? null)
                ? $payload['time_next_update_utc']
                : null,
            'stale' => false,
        ];

        Cache::put(self::FRESH_CACHE_KEY, $data, now()->addDay());
        Cache::forever(self::LAST_GOOD_CACHE_KEY, $data);

        return $data;
    }

    public function usdToNgn(): float
    {
        try {
            return $this->rate('NGN');
        } catch (RuntimeException $exception) {
            report($exception);

            return (float) Setting::get('usd_to_ngn_rate', 1500);
        }
    }

    private function rate(string $currency): float
    {
        $rate = $this->latest()['rates'][$currency] ?? null;
        if (! is_numeric($rate) || (float) $rate <= 0) {
            throw new RuntimeException("No USD exchange rate is available for {$currency}.");
        }

        return (float) $rate;
    }

    private function staleOrFail(string $message, ?Throwable $previous = null): array
    {
        $stale = Cache::get(self::LAST_GOOD_CACHE_KEY);
        if (is_array($stale) && isset($stale['rates']['NGN'])) {
            $stale['stale'] = true;
            Cache::put(self::FRESH_CACHE_KEY, $stale, now()->addHour());
            report(new RuntimeException($message, 0, $previous));

            return $stale;
        }

        throw new RuntimeException($message, 0, $previous);
    }
}
