import { services, products, audiences } from './offerings';

export type NavLink = { label: string; href: string; note?: string };
export type NavGroup = { label: string; href?: string; links?: NavLink[] };

export const nav: NavGroup[] = [
  {
    label: 'Services',
    links: services.map((s) => ({ label: s.menuLabel, href: `/${s.slug}/`, note: s.title })),
  },
  {
    label: 'Solutions',
    links: products.map((p) => ({ label: p.menuLabel, href: `/${p.slug}/`, note: p.eyebrow })),
  },
  { label: 'AI & Data', href: '/ai-data-intelligence/' },
  {
    label: 'For you',
    links: audiences.map((a) => ({ label: a.menuLabel, href: `/${a.slug}/`, note: a.title })),
  },
  {
    label: 'Impact',
    links: [
      { label: 'Our impact', href: '/impact/' },
      { label: 'Reports', href: '/reports/' },
      { label: 'News & media', href: '/news/' },
      { label: 'Insights', href: '/blogs/' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About us', href: '/about/' },
      { label: 'Our values', href: '/our-values/' },
      { label: 'Leadership', href: '/leadership/' },
      { label: 'Shariah Board', href: '/shariah-board/' },
      { label: 'Investors', href: '/investors/' },
      { label: 'Careers', href: '/careers/' },
    ],
  },
];
