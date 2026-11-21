<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageContentSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            'faq' => [
                'title' => 'Frequently Asked Questions',
                'content' => <<<'CONTENT'
ABOUT OUR PIECES

Where do your pieces come from?
Kinova Arts curates handmade African art, furniture and craft. We work with woodcarvers, dyers, weavers and sculptors, and share the maker, region, materials and tradition on product pages whenever that information is available.

Will my handmade piece look exactly like the photographs?
Handmade pieces can have small variations in colour, grain, texture, dimensions and finish. These details are part of the character of work made by hand. Check the product description and photographs, and contact us before ordering if you need more information about a particular piece.

How should I care for an item?
Care depends on the material and finish. Follow any instructions on the product page and contact us if you need care guidance before cleaning or treating a piece.

ORDERS AND DELIVERY

How do I place an order?
Add available items to your bag and follow the checkout steps. Review the price, delivery details and payment options shown at checkout before placing your order.

How much does delivery cost, and when will my order arrive?
Delivery options, costs and any available estimates are shown during checkout or in your order details. They can depend on the destination and the size or nature of the item.

Can I change or cancel an order?
Contact us as soon as possible using the details provided with your order. We will confirm what options are available; changes may not be possible once an order is being prepared or dispatched.

Can I request a custom piece?
Yes. Use the custom order page to tell us what you are looking for. We will review the request and confirm whether it can be made, along with any details and terms, before you decide to proceed.

How can I ask about an order?
Contact us using the details provided with your order and include your order number and the email address used at checkout.
CONTENT,
            ],
            'returns' => [
                'title' => 'Returns & Exchanges',
                'content' => <<<'CONTENT'
If there is a problem with your order or you would like to ask about a return or exchange, contact Kinova Arts promptly using the contact details provided with your order. Include your order number and a clear description of the issue; photographs can help us understand damage or a difference from the listing.

Please wait for instructions before sending an item back. We will confirm the available options, any applicable time limits and who is responsible for return delivery before you take action. Eligibility can depend on the item and the circumstances of the order. Custom or made-to-order pieces may have different terms, which should be confirmed before an order is placed.

This information does not limit any rights you have under applicable consumer-protection law.
CONTENT,
            ],
            'contact' => [
                'title' => 'Contact Kinova Arts',
                'content' => <<<'CONTENT'
We are here to help with questions about our pieces, an existing order or a custom request.

For an order enquiry, use the contact details in your order confirmation and include your order number and the email address used at checkout. For a product question, include the product name or link and tell us what you would like to know.

For a custom piece, you can also submit a request through the custom order page. Please do not send passwords or full payment-card details in a message.
CONTENT,
            ],
            'about' => [
                'title' => 'About Kinova Arts',
                'content' => <<<'CONTENT'
Kinova Arts is a curated destination for handmade African art, furniture and craft. We bring together distinctive pieces shaped by the skill, creativity and traditions of their makers.

We work with woodcarvers, dyers, weavers and sculptors. Each piece has a maker, a region and a reason it was made this way. Where available, product pages share the materials, place and tradition behind the work, so you can learn more about the piece you bring into your home.

Our collection connects African craftsmanship with contemporary living while celebrating the people and stories behind every piece.
CONTENT,
            ],
            'privacy-policy' => [
                'title' => 'Privacy Policy',
                'content' => <<<'CONTENT'
Kinova Arts uses personal information to operate this store and respond to the reason you provided it. This may include details you share when creating an account, placing an order or contacting us, such as your name, contact details, delivery information and order history.

We use this information to manage accounts and orders, arrange fulfilment, answer enquiries, protect the store and meet applicable legal or record-keeping obligations. Information needed to complete a transaction may be handled by service providers involved in payment, delivery or website operations, subject to their own terms and privacy practices.

The website may process technical information needed to operate and protect the service. Information is retained only as needed for these purposes and applicable obligations.

To ask about or request access to, correction of or deletion of your personal information, contact Kinova Arts using the contact details provided with your order. Some records may need to be retained where required by law or for legitimate order and business records.

Do not send passwords or full payment-card details when contacting us. This policy may be updated as our services or obligations change.
CONTENT,
            ],
            'terms' => [
                'title' => 'Terms of Service',
                'content' => <<<'CONTENT'
These terms apply when you use the Kinova Arts online store. By placing an order, you are responsible for providing accurate account, contact and delivery information and for reviewing the order details before submitting it.

Our products are handmade. Natural materials and hand-finishing can result in variations in colour, grain, texture, dimensions and appearance. Product descriptions and photographs are provided to help you understand each piece; contact us before ordering if you need clarification.

Prices, currency, delivery options, charges and payment methods applicable to your order are shown during checkout or in your order details. Review these details before completing payment. Availability and delivery information can vary by item and destination.

Custom or made-to-order work may have separate specifications, timing, pricing and other terms. Those details should be agreed before you proceed with a custom order.

Please contact Kinova Arts promptly if you have a question or concern about an order. Nothing in these terms excludes rights or protections that cannot be excluded under applicable law.
CONTENT,
            ],
        ];

        foreach ($pages as $slug => $data) {
            $page = Page::firstOrNew(['slug' => $slug]);

            if (filled($page->content)) {
                continue;
            }

            $page->fill($data)->save();
        }
    }
}
