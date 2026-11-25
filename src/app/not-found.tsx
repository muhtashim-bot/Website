import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="bg-mint">
      <div className="container py-28">
        <p className="kicker">Page not found</p>
        <h1 className="mt-2 text-h1">This field is still fallow.</h1>
        <p className="mt-4 max-w-xl text-lead text-ink-soft">The page you were looking for has moved or doesn’t exist. Try the homepage, or call our free hotline 08008500800.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="btn-primary">Go to the homepage</Link>
          <Link href="/contact/" className="btn-ghost">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
