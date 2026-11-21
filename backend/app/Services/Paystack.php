<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class Paystack
{
    public static function frontendUrl(): string
    {
        return rtrim(config('services.frontend.url', 'http://localhost:3000'), '/');
    }

    public static function rate(): float
    {
        return app(ExchangeRates::class)->usdToNgn();
    }

    /** Starts a transaction and returns the hosted payment page URL. Prices are USD; Paystack charges NGN. */
    public function initialize(string $email, float $usdAmount, string $reference, array $metadata = []): string
    {
        $amountInSubunit = (int) round($usdAmount * self::rate() * 100);

        try {
            $response = Http::withToken(config('services.paystack.secret'))
                ->timeout(15)
                ->post('https://api.paystack.co/transaction/initialize', [
                    'email' => $email,
                    'amount' => $amountInSubunit,
                    'currency' => config('services.paystack.currency', 'NGN'),
                    'reference' => $reference,
                    'callback_url' => self::frontendUrl().'/checkout/success',
                    'metadata' => $metadata,
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Could not reach the payment provider. Please try again.');
        }

        if (! $response->successful() || ! $response->json('status')) {
            throw new RuntimeException('Could not start payment. Please try again.');
        }

        return $response->json('data.authorization_url');
    }

    /** true = paid, false = not paid, null = provider unreachable. */
    public function isPaid(string $reference): ?bool
    {
        try {
            $response = Http::withToken(config('services.paystack.secret'))
                ->timeout(15)
                ->get('https://api.paystack.co/transaction/verify/'.urlencode($reference));
        } catch (ConnectionException $e) {
            return null;
        }

        return $response->successful() && $response->json('data.status') === 'success';
    }
}
