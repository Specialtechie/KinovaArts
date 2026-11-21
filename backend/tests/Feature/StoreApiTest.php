<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CustomOrderRequest;
use App\Models\Page;
use App\Mail\ContactInquiryReceivedMail;
use App\Mail\CustomOrderStatusUpdatedMail;
use App\Services\Paystack;
use App\Services\ExchangeRates;
use Database\Seeders\PageContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StoreApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_json(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson(['ok' => true]);
    }

    public function test_registration_returns_a_customer_token_and_not_admin_access(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Local Customer',
            'email' => 'customer@example.test',
            'password' => 'local-password-123',
            'password_confirmation' => 'local-password-123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'is_admin']])
            ->assertJsonPath('user.is_admin', false);

        $this->withToken($response->json('token'))
            ->getJson('/api/admin/dashboard')
            ->assertForbidden();
    }

    public function test_public_catalog_returns_a_paginated_product_list(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'per_page', 'total']);
    }

    public function test_custom_order_budget_currency_is_saved(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/custom-orders', [
            'name' => 'Customer Example',
            'email' => 'customer@example.test',
            'description' => 'A hand-carved table made to fit a small dining room.',
            'budget_range' => '500-750',
            'budget_currency' => 'GBP',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('custom_order_requests', [
            'id' => $response->json('id'),
            'budget_range' => '500-750',
            'budget_currency' => 'GBP',
        ]);
    }

    public function test_admin_quote_currency_is_saved_and_included_in_the_quote_email(): void
    {
        Mail::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $customOrder = CustomOrderRequest::create([
            'name' => 'Customer Example',
            'email' => 'customer@example.test',
            'description' => 'A custom hand-carved table for a dining room.',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/custom-orders/{$customOrder->id}", [
                'status' => 'quoted',
                'quoted_price' => 250,
                'quoted_currency' => 'GBP',
            ])
            ->assertOk()
            ->assertJsonPath('quoted_currency', 'GBP');

        $this->assertDatabaseHas('custom_order_requests', [
            'id' => $customOrder->id,
            'quoted_price' => 250,
            'quoted_currency' => 'GBP',
        ]);
        Mail::assertSent(CustomOrderStatusUpdatedMail::class);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/custom-orders/{$customOrder->id}", [
                'status' => 'quoted',
                'quoted_price' => 275,
                'quoted_currency' => 'EUR',
            ])
            ->assertOk()
            ->assertJsonPath('quoted_currency', 'EUR');

        $this->assertDatabaseHas('custom_order_requests', [
            'id' => $customOrder->id,
            'quoted_price' => 275,
            'quoted_currency' => 'EUR',
        ]);
        Mail::assertSentCount(2);
    }

    public function test_custom_order_quote_in_ngn_is_charged_as_ngn_by_paystack(): void
    {
        Cache::flush();
        config(['services.paystack.secret' => 'test-secret']);
        Http::fake([
            'https://open.er-api.com/v6/latest/USD' => Http::response([
                'result' => 'success',
                'base_code' => 'USD',
                'time_last_update_utc' => 'Thu, 20 Nov 2026 00:00:00 +0000',
                'rates' => ['USD' => 1, 'NGN' => 1350],
            ]),
            'https://api.paystack.co/transaction/initialize' => Http::response([
                'status' => true,
                'data' => ['authorization_url' => 'https://checkout.example.test/pay'],
            ]),
        ]);
        $user = User::factory()->create();
        $customOrder = CustomOrderRequest::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'description' => 'A custom hand-carved table for a dining room.',
            'status' => 'quoted',
            'quoted_price' => 1350,
            'quoted_currency' => 'NGN',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/account/custom-orders/{$customOrder->id}/pay/deposit", [
                'name' => $user->name,
                'line1' => '1 Example Street',
                'city' => 'Lagos',
                'country' => 'Nigeria',
                'postcode' => '100001',
            ])
            ->assertCreated()
            ->assertJsonPath('authorization_url', 'https://checkout.example.test/pay');

        $this->assertDatabaseHas('orders', [
            'custom_order_request_id' => $customOrder->id,
            'payment_type' => 'deposit',
            'total' => 0.70,
        ]);
        Http::assertSent(fn (HttpRequest $request) => (
            str_contains($request->url(), 'paystack.co/transaction/initialize')
            && $request['amount'] === 94500
            && $request['currency'] === 'NGN'
        ));
    }

    public function test_contact_inquiry_is_emailed_to_the_configured_support_inbox(): void
    {
        Mail::fake();
        config(['services.admin_notify_email' => 'support@example.test']);

        $this->postJson('/api/contact-inquiries', [
            'type' => 'complaint',
            'name' => 'Customer Example',
            'email' => 'customer@example.test',
            'order_number' => 'KA-TEST-100',
            'subject' => 'An item arrived damaged',
            'message' => 'The wall hanging arrived with visible damage.',
            'contact_reference' => '',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Your message has been sent.');

        Mail::assertSent(ContactInquiryReceivedMail::class, fn (ContactInquiryReceivedMail $mail) => (
            $mail->hasTo('support@example.test')
            && $mail->type === 'complaint'
            && $mail->email === 'customer@example.test'
            && $mail->orderNumber === 'KA-TEST-100'
        ));
    }

    public function test_contact_inquiry_requires_a_configured_inbox_and_valid_message(): void
    {
        Mail::fake();
        config(['services.admin_notify_email' => null]);

        $this->postJson('/api/contact-inquiries', [
            'type' => 'enquiry',
            'name' => 'Customer Example',
            'email' => 'customer@example.test',
            'subject' => 'A question',
            'message' => 'Short',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['message']);

        $this->postJson('/api/contact-inquiries', [
            'type' => 'enquiry',
            'name' => 'Customer Example',
            'email' => 'customer@example.test',
            'subject' => 'A question',
            'message' => 'I would like to know more about this item.',
            'contact_reference' => 'spam.example',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Your message has been sent.');

        $this->postJson('/api/contact-inquiries', [
            'type' => 'enquiry',
            'name' => 'Customer Example',
            'email' => 'customer@example.test',
            'subject' => 'A question',
            'message' => 'I would like to know more about this item.',
            'company_website' => 'spam.example',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Your message has been sent.');

        $this->postJson('/api/contact-inquiries', [
            'type' => 'enquiry',
            'name' => 'Customer Example',
            'email' => 'customer@example.test',
            'subject' => 'A question',
            'message' => 'I would like to know more about this item.',
        ])
            ->assertServiceUnavailable();

        Mail::assertNothingSent();
    }

    public function test_page_content_seeder_creates_public_pages_without_overwriting_existing_copy(): void
    {
        $seeder = new PageContentSeeder();
        $seeder->run();

        $this->assertDatabaseCount('pages', 6);
        $this->getJson('/api/pages/faq')
            ->assertOk()
            ->assertJsonPath('title', 'Frequently Asked Questions')
            ->assertJsonPath('slug', 'faq');

        Page::where('slug', 'faq')->update(['content' => 'Edited in the CMS']);
        $seeder->run();

        $this->assertDatabaseCount('pages', 6);
        $this->assertSame('Edited in the CMS', Page::where('slug', 'faq')->value('content'));
    }

    public function test_currency_rates_are_cached_and_include_supported_currency_codes(): void
    {
        Cache::flush();
        Http::fake([
            'https://open.er-api.com/v6/latest/USD' => Http::response([
                'result' => 'success',
                'base_code' => 'USD',
                'time_last_update_utc' => 'Thu, 20 Nov 2026 00:00:00 +0000',
                'time_next_update_utc' => 'Fri, 21 Nov 2026 00:00:00 +0000',
                'rates' => ['USD' => 1, 'NGN' => 1350, 'GHS' => 11.7, 'JPY' => 159],
            ]),
        ]);

        $this->getJson('/api/currency-rates')
            ->assertOk()
            ->assertJsonPath('base', 'USD')
            ->assertJsonPath('rates.NGN', 1350)
            ->assertJsonPath('rates.GHS', 11.7)
            ->assertJsonPath('rates.JPY', 159)
            ->assertJsonPath('stale', false);

        $this->getJson('/api/currency-rates')->assertOk();
        Http::assertSentCount(1);
        $this->assertSame(1350.0, Paystack::rate());
        $this->assertSame(1.0, app(ExchangeRates::class)->convert(1350, 'NGN', 'USD'));
    }

    public function test_admin_user_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'total_orders',
                'revenue',
                'pending_orders',
                'inventory_value',
                'reviews_pending',
                'custom_requests_pending',
                'low_stock',
                'recent_orders',
            ]);
    }

    public function test_custom_order_quotes_use_installments_at_any_positive_price(): void
    {
        $request = new CustomOrderRequest(['quoted_price' => 80]);

        $this->assertTrue($request->requiresInstallment());
        $this->assertSame(56.0, $request->depositAmount());
        $this->assertSame(24.0, $request->balanceAmount());
        $this->assertFalse((new CustomOrderRequest(['quoted_price' => 0]))->requiresInstallment());
    }
}
