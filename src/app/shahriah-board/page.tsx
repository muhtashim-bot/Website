import type { Metadata } from 'next';

// The old, misspelt URL. On a real host, replace this page with a 301 redirect to /shariah-board/.
export const metadata: Metadata = {
  title: 'Shariah Board | iFarmer',
  robots: { index: false },
  alternates: { canonical: '/shariah-board/' },
};

export default function OldShariahUrl() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/shariah-board/" />
      <div className="container py-24">
        <p>
          This page has moved to <a className="link" href="/shariah-board/">Shariah Board</a>.
        </p>
      </div>
    </>
  );
}
