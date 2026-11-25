import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ifarmer.asia'),
  title: {
    default: 'iFarmer | Finance, Advice, Inputs & Markets for Farmers',
    template: '%s',
  },
  description:
    'iFarmer helps Bangladeshi farmers access finance, expert advice, quality inputs and buyers, powered by data and AI.',
  icons: { icon: '/favicon.svg' },
  openGraph: { siteName: 'iFarmer', type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#FFFDF5',
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'iFarmer',
  url: 'https://www.ifarmer.asia',
  email: 'hello@ifarmer.asia',
  telephone: '+8808008500800',
  foundingDate: '2018',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'House NE (B) 3B, Road 74, Gulshan-2',
    addressLocality: 'Dhaka',
    postalCode: '1212',
    addressCountry: 'BD',
  },
  sameAs: [
    'https://www.facebook.com/ifarmerasia',
    'https://www.linkedin.com/company/ifarmerasia',
    'https://www.instagram.com/ifarmerasia',
    'https://x.com/iFarmer_Asia',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-field focus:px-5 focus:py-3 focus:text-white">
          Skip to content
        </a>
        {process.env.NEXT_PUBLIC_REVIEW === '1' && (
          <p className="bg-teal px-4 py-1.5 text-center text-[0.8rem] font-semibold text-white/85">Website prototype for internal review. Not the live iFarmer site.</p>
        )}
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </body>
    </html>
  );
}
