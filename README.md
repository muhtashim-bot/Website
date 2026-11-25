# iFarmer website: revamp prototype

A full rebuild of ifarmer.asia. The homepage is a realistic 3D fly-through of a Bangladeshi delta that follows one farming season: a farmer applies for finance, funders back the loan, inputs arrive, the crop grows and ripens, the harvest is sold, and everyone is paid. The app journey (every service, the apps that deliver it, and a phone whose screen changes) sits on the left. 35 pages on shared templates. It keeps the current brand (leaf green `#88BB41`, deep green `#038F2F`, lime `#DDFF80`, cream `#FFF5D9`, Quicksand) and folds in the AI & Data Website Update Guide (Nov 2026).

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

- `/` homepage with the 3D story
- `/?low` the lighter 3D version phones get (no reflections or post-processing)
- `/?static` the story as a still, readable sequence (also what visitors with reduced motion or no WebGL 2 get)
- `/ai-data-intelligence/` the new AI & Data page from the brief

## How it is built

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), TypeScript, `output: 'export'` |
| Styling | Tailwind CSS 3 with iFarmer tokens in `tailwind.config.ts` |
| 3D | Three.js with a physical sky, reflective river and wind-animated crops (`src/three/delta.ts`); post-processing with ambient occlusion, depth of field and bloom (`postprocessing`, `n8ao`) |
| Film | `scripts/render_film.py` (Pillow + ffmpeg) renders the hero loop and the services film from the photos |
| Fonts | Quicksand, self-hosted through `@fontsource/quicksand` |

```
src/
  app/                    one folder per page; [slug] renders every service, solution and audience page
  components/             Header, Footer, Story3D (homepage 3D story), PhoneScreens, Journey (static fallback + app chips), OfferingPage, ui.tsx
  three/delta.ts          the 3D delta: terrain, river, sky, fields, villages, people, vehicles, camera keys
  content/                ALL copy and numbers live here
    metrics.ts            single source of truth for every number (AI brief, section 10)
    journey.ts            the 9 chapters of the homepage story
    offerings.ts          5 services, 7 solutions, 5 audience pages
    company.ts            awards, stories, leadership, Shariah Board, jobs, news, reports, backers, offices
    ai.ts                 AI & Data page copy and statuses (from the brief)
    nav.ts                menu structure
public/photos/            real field photos (1920px and 1080px)
public/scenes/            still shown while the 3D loads
scripts/render_film.py    renders the hero loop and the services film
```

### The homepage story

`src/components/Story3D.tsx` pins a full-screen 3D world (`src/three/delta.ts`) while the visitor scrolls through 15 beats (`src/content/story3d.ts`). The camera flies from place to place along a spline, and the sun moves from dawn to golden hour.

| Beat | Where | What moves | Phone shows |
| --- | --- | --- | --- |
| intro | Aerial over the delta at dawn | Boats, birds, smoke from the homestead | The iFarmer apps |
| apply | The farmer's homestead | Phone glows, data rings rise | Folon: apply for crop finance |
| fund | Market town and partner bank | A light trail from the iHarvst billboard to the bank | iHarvst: fund a farm |
| receive | Over the village | The money trail lands at the farmer | Folon: approved |
| buy / card | Village bazaar, KriShop shop | The KriShop van arrives, the shop restocks | KriShop order, Farmer Card |
| grow / grow2 | Paddy fields | Rice grows in the wind, a soil sensor pulses, a drone and a satellite pass | Folon-AI, Folon advice |
| harvest / collect / dispatch | Fields, collection point, highway | Crop turns gold, workers harvest, sacks fill the shed, trucks leave | Supplier Connect |
| center | iFarmer Center at the river ghat | Farmers at the veranda | Sofol: register a farmer |
| paid / returns / outro | Homestead, town, aerial at sunset | Trails return to the farmer and the funders | Folon paid, iHarvst returns |

- Words for each service: `src/content/journey.ts`. Words for each beat (phone screen, app line, pinned label): `src/content/story3d.ts`.
- Camera framing, sun angle and depth of field per beat: `KEYS` near the top of `src/three/delta.ts`.
- Phones and slower computers get the light version automatically; `/?low` forces it.

### Photos and films

- Photos in `public/photos/` are iFarmer's own field photography, taken from the current ifarmer.asia pages, in 1920px and 1080px versions. To swap one, replace both files with the same name. Use only photos you hold rights and consent for.
- `scripts/render_film.py services out.mp4` renders the 1080p services film with titles from these photos (`pip install pillow numpy`, needs ffmpeg). The site itself does not use the video.
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

### Performance notes (3D story)

- No post-processing: the renderer uses MSAA and ACES tone mapping; the vignette is a CSS overlay.
- The river is a reflective material, not a mirror (a mirror re-renders the scene every frame).
- The sky environment map is rendered once at load; re-rendering it while scrolling caused hitches.
- Rice, distant trees and small objects in wide shots cast no shadows; people are merged into a few meshes each; sacks are instanced.
- Resolution drops a step automatically if frames run slower than about 48 fps (see `adapt()` in `src/three/delta.ts`).
- Avoid `backdrop-filter` on anything over the canvas: it makes the browser re-read the WebGL canvas every frame.
- `?debug` exposes the world as `window.__world` (draw calls: `__world.renderer.info.render`).
