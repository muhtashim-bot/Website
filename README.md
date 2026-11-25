# iFarmer website: revamp prototype

A full rebuild of ifarmer.asia: a homepage that opens on a looping film of real field photography, then tells the season service by service. The app journey (every service, the apps that deliver it, and a phone whose screen changes) sits on the left; a scroll-driven cinematic of real Bangladeshi farm photos zooms and slides on the right. 35 pages on shared templates. It keeps the current brand (leaf green `#88BB41`, deep green `#038F2F`, lime `#DDFF80`, cream `#FFF5D9`, Quicksand) and folds in the AI & Data Website Update Guide (Nov 2026).

## Run it locally

You need **Node.js 18.18 or newer** (20 LTS recommended).

```bash
npm install
npm run dev          # development server with hot reload → http://localhost:3000
```

To run the production build exactly as it would be deployed:

```bash
npm run build        # static export into ./out
npm start            # serves ./out on http://localhost:3000
```

`./out` is plain HTML, CSS and JS, so any static host or CDN can serve it (Nginx, S3 + CloudFront, Netlify, Vercel, Cloudflare Pages).

Useful URLs:

- `/` homepage: hero film, then the app journey and cinematic
- `/?static` the journey as a still, readable sequence (also what visitors with reduced motion get)
- `/ai-data-intelligence/` the new AI & Data page from the brief

## How it is built

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), TypeScript, `output: 'export'` |
| Styling | Tailwind CSS 3 with iFarmer tokens in `tailwind.config.ts` |
| Motion | Scroll-driven photo cinematic in `src/components/Journey.tsx` (CSS transforms, no libraries) |
| Film | `scripts/render_film.py` (Pillow + ffmpeg) renders the hero loop and the services film from the photos |
| Fonts | Quicksand, self-hosted through `@fontsource/quicksand` |

```
src/
  app/                    one folder per page; [slug] renders every service, solution and audience page
  components/             Header, Footer, HeroFilm, Journey (app journey + cinematic), PhoneScreens, OfferingPage template, ui.tsx
  content/                ALL copy and numbers live here
    metrics.ts            single source of truth for every number (AI brief, section 10)
    journey.ts            the 9 chapters of the homepage story
    offerings.ts          5 services, 7 solutions, 5 audience pages
    company.ts            awards, stories, leadership, Shariah Board, jobs, news, reports, backers, offices
    ai.ts                 AI & Data page copy and statuses (from the brief)
    nav.ts                menu structure
public/photos/            real field photos (1920px and 1080px)
public/video/             hero film and poster
scripts/render_film.py    renders the hero loop and the services film
```

### The homepage story

1. **Hero film** (`src/components/HeroFilm.tsx`): `public/video/hero-1280.mp4`, a 22-second seamless loop of seven real photos with zoom, pan, slide and push-through transitions. Muted, with a pause button; a poster frame shows for reduced motion.
2. **The app journey** (`src/components/Journey.tsx`, content in `src/content/journey.ts`):
   - **Left:** every service on one thread, each with the apps, places and partners that deliver it (Folon, Folon-AI, Sofol, KriShop, iHarvst, Supplier Connect, iFarmer Center, Experience Centers, Farmer Card, partner banks and NBFIs). A phone beside it changes screen with every shot (`src/components/PhoneScreens.tsx`).
   - **Right:** a cinematic of 15 real photos. Each shot has its own camera move (`from` → `to`: scale and pan) and arrives by zoom, slide or rise, all driven by scroll. The service title and story sit over the film like a lower third.
   - On phones the film fills the screen, the story sits at the bottom and the phone floats top right.
3. **Statement band** with a slowly drifting photo, then the rest of the homepage.

To change a scene, edit `src/content/journey.ts`: its words, its apps (`channels`), and for each shot the photo, camera move, transition, phone `screen` and the line under the phone (`app`, `does`).

### Photos and films

- Photos in `public/photos/` are iFarmer's own field photography, taken from the current ifarmer.asia pages, in 1920px and 1080px versions. To swap one, replace both files with the same name. Use only photos you hold rights and consent for.
- Re-render the films after changing photos: `pip install pillow numpy && python3 scripts/render_film.py hero` (homepage loop) and `python3 scripts/render_film.py services out.mp4` (1080p services film with titles). Needs ffmpeg.
- **Phone screens are illustrative layouts**, not product screenshots. To use real screenshots, save them as `public/apps/<screen>.png` (for example `folon-apply.png`) and list them in `realShots` at the top of `src/components/PhoneScreens.tsx`.

## Before launch

Nothing on the site is invented, but several items are carried over as published or need sign-off. Search the code for the notes mentioned.

**Approvals and content to supply**

- [ ] **Metrics**: every number in `src/content/metrics.ts` is marked `approved: false`. Three conflict with other pages on the live site (farmers 320K+ vs 310,000+, financed farmers 130K+ vs 86,231, produce 280K+ t vs 240,000 t). Pick one each, add owner and as-of date.
- [ ] **Logo**: `src/components/Logo.tsx` is a recreation. Replace with the official SVG.
- [ ] **Farmer stories**: `stories` in `company.ts` are short summaries of the testimonials on the live site. Paste the farmers' own quotes and add consented photos.
- [ ] **Photos**: confirm consent for the field photos taken from the current site, and add leadership and careers photos.
- [ ] **App screenshots**: replace the illustrative phone screens with real screenshots (see Photos and films).
- [ ] **Leadership**: names and titles only; add photos and two-line bios.
- [ ] **Store links**: only Folon (Android) is known. Add Folon iOS, KriShop, iHarvst, Sofol and Supplier Connect links in `offerings.ts` (`stores`).
- [ ] **FAQ answers**: the live site lists many questions with no answers in its page source. Only questions with answers taken from the site's own copy are included. Still to answer: Folon (pricing, advisory package, multiple crops), KriShop (17 questions on ordering, delivery, credit, areas, brands), iHarvst (payments, receipts, certificates, insurance, Shariah farms, refunds, withdrawals), Access to Finance (processing time, non-farming landowners), Market Linkage (selling, collection, pricing, export, farmer selection), Climate Smart (3), Sofol (3).
- [ ] **iHarvst**: the old homepage called it a credit-scoring platform; this build uses the product page's description (funding app). Confirm.
- [ ] **Backers**: `backers` lists only investors named in press. Confirm the list and logo permissions; add partner and funder logos with names.
- [ ] **Singapore address**: the live site joins two addresses (Duo Tower and Centennial Tower). Confirm which is correct.
- [ ] **UCB**: a farmer story names UCB as the lender. Confirm it can be shown.
- [ ] **SDG mapping** on `/impact/` is a proposal; confirm with the impact team.
- [ ] **Responsible AI**: the "Data security" pillar has no body until the data team supplies one.
- [ ] **AI metrics, Voice AI demo, Folon-AI sample chats, case studies**: left out on purpose until approved (AI brief golden rule).

**Engineering**

- [ ] Contact form opens the visitor's email app (works with no backend). Connect it to your CRM or a form endpoint.
- [ ] On the real host, add 301 redirects: `/shahriah-board` → `/shariah-board/`, and keep or redirect the old `/blog-details-N` and `/careers/...` URLs (they are linked to the live site for now).
- [ ] Privacy and Terms link to the live site's pages; migrate them.
- [ ] Add analytics (journey chapter reach, app-store clicks, enquiries, hotline taps, report downloads).
- [ ] Bangla version: copy is centralised in `src/content`, so a `bn` copy of those files plus a locale switch is the main work.
- [ ] Move `src/content` into a headless CMS (Sanity, Payload or Strapi) when the content team is ready.
