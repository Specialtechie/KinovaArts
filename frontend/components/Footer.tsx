import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-line px-6 py-10 text-sm text-ink/70">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        <div>
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/kinova-primary-logo.png"
              alt="Kinova Arts"
              className="h-auto w-48 max-w-full object-contain object-left"
            />
          </Link>
          <p className="mt-2 max-w-xs">
            A curated gallery of hand-made African arts and crafts, sourced directly from artisans across the continent.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Shop</div>
          <ul className="space-y-1">
            <li><Link href="/products">All products</Link></li>
            <li><Link href="/collections/new-arrivals">New arrivals</Link></li>
            <li><Link href="/collections/best-sellers">Best sellers</Link></li>
            <li><Link href="/custom-order">Custom orders</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Support</div>
          <ul className="space-y-1">
            <li><Link href="/pages/faq">FAQ</Link></li>
            <li><Link href="/pages/returns">Returns</Link></li>
            <li><Link href="/pages/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Company</div>
          <ul className="space-y-1">
            <li><Link href="/pages/about">About</Link></li>
            <li><Link href="/pages/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/pages/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-line pt-6 text-xs">
        &copy; {new Date().getFullYear()} Specialtechie. All pieces made to order by credited artisans.
      </div>
    </footer>
  );
}
