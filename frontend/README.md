# Kinova Arts storefront (Next.js)

The customer-facing site **and the admin** (`/admin`), for **Vercel**. It talks to the Laravel API in `../backend`.

## 1. Run it locally

Prerequisite: the API is running locally on `http://localhost:8001`, or deployed.

```bash
npm install
cp .env.example .env.local      # Windows: Copy-Item .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

From the repository root, start the Laravel API in one terminal:

```powershell
Set-Location backend
php artisan serve --host=127.0.0.1 --port=8001
```

Start the storefront in another terminal from this directory:

```bash
npm run dev
```

The backend's `FRONTEND_URL` should be `http://localhost:3000`. Local setup details are in the repository [README](../README.md).

## 2. Check it works

1. Home page shows banners, collections, new arrivals
2. `/products`: search, category filter and sort work
3. A product page: gallery, add to bag, wishlist (asks you to sign in)
4. Sign up through the popup, refresh, and you should still be signed in
5. `/cart`: quantities, coupon, and the ₦ amount note
6. Checkout with the Paystack test card (`4084084084084081`, any future date, CVV `408`, PIN `0000`, OTP `123456`). You should land on `/checkout/success` and see "confirmed"
7. `/account/orders` shows the order; `/custom-order` submits a request

## 3. Deploy to Vercel

1. Import the repository in Vercel and set **Root Directory** to `frontend/`
2. Vercel → **Add New Project** → import the repo (framework is detected as Next.js)
3. Environment variable: `NEXT_PUBLIC_API_URL` = `https://<your-app>.laravel.cloud`
4. Deploy
5. In **Laravel Cloud** set `FRONTEND_URL` to your Vercel URL, e.g. `https://kinova-storefront.vercel.app`, then redeploy. Use commas for several origins: `https://kinovaarts.com,https://kinova-storefront.vercel.app`
6. Paystack dashboard: no callback change needed (the callback is sent with every payment). The webhook URL stays `https://<your-app>.laravel.cloud/webhooks/paystack`
7. When you add your own domain in Vercel, add it to `FRONTEND_URL` too

## How it fits together

| Piece | How |
|---|---|
| Catalog pages | Server-rendered, data cached for 60 s from the API |
| Sign-in | Popup posts to `/api/auth/*` (Next route handlers). The Laravel token is stored in an **httpOnly cookie**, never in browser JavaScript |
| Browser calls (wishlist, reviews, checkout) | Go through `/api/proxy/...`, which adds the token from the cookie |
| Cart | Lives in `localStorage` on the device. `/api/cart/quote` prices it, so prices can't be tampered with |
| Custom-order photos | Posted straight to the API (not via Vercel) to avoid Vercel's 4.5 MB request limit |
| Account pages | Server-rendered; signed-out visitors get the sign-in popup and are returned to the page they wanted |

## Things to know

- The cart is per device. Signing in on another device starts with an empty bag.
- Reviews appear only after you approve them in Admin → Reviews.
- A custom-order request made while signed in shows up in your account when its email matches your account email.
- Page content (FAQ, About...) is shown as plain text with line breaks, so HTML typed into the CMS is displayed literally, not executed.
- Email verification isn't part of sign-up yet.

## Admin

Sign in with your admin account; an **Admin** link appears in the header (or go to `/admin`). It covers the dashboard, products with photos,
categories, collections, orders, custom orders, coupons, banners, pages, reviews and the exchange rate.
Photos upload one at a time and big ones are shrunk in your browser first (Vercel rejects requests over about 4.5 MB).
Deleting a product archives it, so old orders keep their history.
