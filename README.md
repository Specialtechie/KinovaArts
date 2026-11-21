# Kinova Arts

This repository contains the two application directories:

- `backend/` - Laravel 12 API
- `frontend/` - Next.js storefront and admin UI

## Run locally

Prerequisites: PHP 8.2+ with PDO MySQL enabled, Composer, Node.js, npm, and a running MySQL server.

### Backend

For a fresh checkout, from the repository root:

```powershell
Set-Location backend
Copy-Item .env.example .env
composer install
php artisan key:generate
```

Create a MySQL database and a dedicated database user, then set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `backend/.env`. Do not use MySQL's root account for the application. Keep credentials in `.env`; do not commit them.

For an empty database, set `LOCAL_ADMIN_EMAIL` and `LOCAL_ADMIN_PASSWORD` in `backend/.env` if you want the local admin account, then run:

```powershell
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8001
```

The API health endpoint is `http://127.0.0.1:8001/api/health`. `migrate --seed` is for initializing a fresh local database; it is not the routine production deploy command. Existing SQLite records are not copied automatically when changing database connections.

To apply the category, collection, and product descriptions to a database, run from `backend/`:

```powershell
php artisan db:seed --class='Database\Seeders\CategoryDescriptionsSeeder'
php artisan db:seed --class='Database\Seeders\CollectionDescriptionsSeeder'
php artisan db:seed --class='Database\Seeders\ProductDescriptionsSeeder'
php artisan db:seed --class='Database\Seeders\PageContentSeeder'
```

The category and collection seeders create missing records with names derived from their slugs. For existing records, they preserve names and images; the collection seeder also sets `featured`. The product seeder creates missing products with generated unique SKUs, configured USD prices, active status, stock of one, and their matching category; it creates no image records. For products already present, it only fills a blank description and preserves their other fields.
The page content seeder creates the FAQ, returns, contact, about, privacy policy and terms pages, filling only missing or blank content so existing CMS edits are preserved.

Uploaded files are stored on Laravel's public disk. Email uses the log mailer locally by default. To send email through Resend, create an API key, verify your sending domain in Resend, then set these values in `backend/.env`:

```dotenv
MAIL_MAILER=resend
RESEND_KEY=re_your_api_key
MAIL_FROM_ADDRESS=orders@your-verified-domain.com
MAIL_FROM_NAME="Kinova Arts"
```

Use a sender address on a domain verified with Resend. Keep the API key private and out of source control. Custom-order budgets and quotes can use any currency returned by the exchange-rate service; Paystack payments are converted to and charged in NGN. Paystack checkout requires a valid test secret in `PAYSTACK_SECRET_KEY`.

Order status changes and order-conversation messages email the customer (or the admin inbox for customer messages). Customers and admins can exchange text and image updates from the order or custom-order detail page (up to three images, 1 MB each). Admin-set delivery fees for standard orders are collected separately through Paystack; custom-order delivery fees are added to the remaining balance after the shipping address is provided. Mark a custom order `Completed` when the piece is finished; this is before shipment or delivery and enables the final balance.

### Frontend

In another terminal, from the repository root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL=http://localhost:8001` in `frontend/.env.local` to connect to the local API.

## Deployment

Deploy `frontend/` as the Vercel project root and `backend/` to a Laravel-compatible host such as WhoGoHost. Configure production MySQL credentials, `APP_URL` (the public API origin), `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, `MAIL_MAILER=resend`, `RESEND_KEY`, `MAIL_FROM_ADDRESS` (on a verified Resend domain), mail, storage, and payment settings in the host's environment configuration. Run `php artisan storage:link` on the backend host so uploaded files are reachable at `/storage/...`. Run only pending migrations with `php artisan migrate --force`; never use `migrate:fresh`, `migrate:refresh`, or `db:wipe` on production data. Back up the database and uploaded files before deployments, and ensure the host preserves Laravel's `storage/app/public` uploads.

After deploying the seeders, run them from `backend/` on production:

```sh
php artisan db:seed --class='Database\Seeders\CategoryDescriptionsSeeder' --force
php artisan db:seed --class='Database\Seeders\CollectionDescriptionsSeeder' --force
php artisan db:seed --class='Database\Seeders\ProductDescriptionsSeeder' --force
php artisan db:seed --class='Database\Seeders\PageContentSeeder' --force
```

Automated tests intentionally use an isolated in-memory SQLite database; this does not change the application's MySQL runtime configuration.
