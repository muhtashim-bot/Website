/*
 * The homepage story: every iFarmer service, the apps and places that deliver it,
 * and a cinematic of real field photos on the right.
 *
 * Each scene has one or more shots. A shot is a photo plus a camera move (from → to):
 *   s = scale (1 = photo fills the frame), x / y = pan in % of the frame.
 * `enter` is how the shot arrives: 'zoom' (push through from the last shot), 'slide' (wipes in
 * from the right), 'rise' (wipes up from below) or 'fade'.
 * Photos live in /public/photos as <name>-1920.jpg and <name>-1080.jpg.
 */

export type Channel = { name: string; kind: 'app' | 'place' | 'partner'; href: string };
export type Move = { s: number; x: number; y: number };
export type Shot = {
  photo: string;
  screen: string; // phone screen shown on the left (src/components/PhoneScreens.tsx)
  app: string; // app named above the phone
  does: string; // what happens in the app at this moment
  alt: string;
  caption: string;
  focus?: string; // CSS object-position
  from: Move;
  to: Move;
  enter: 'zoom' | 'slide' | 'rise' | 'fade';
};
export type Scene = {
  id: string;
  service: string; // name in the left-hand thread
  title: string;
  body: string;
  channels: Channel[];
  more?: { label: string; href: string };
  shots: Shot[];
};

export const ch = {
  folon: { name: 'Folon', kind: 'app', href: '/product-folon/' },
  folonAI: { name: 'Folon-AI', kind: 'app', href: '/ai-data-intelligence/#folon-ai' },
  sofol: { name: 'Sofol', kind: 'app', href: '/product-sofol/' },
  iharvst: { name: 'iHarvst', kind: 'app', href: '/product-iharvst/' },
  krishop: { name: 'KriShop', kind: 'app', href: '/product-krishop/' },
  supplier: { name: 'Supplier Connect', kind: 'app', href: '/product-supplier-connect/' },
  center: { name: 'iFarmer Center', kind: 'place', href: '/ifarmer-center/' },
  experience: { name: 'Experience Centers', kind: 'place', href: '/experience-centers/' },
  card: { name: 'Farmer Card', kind: 'partner', href: '/agri-input/' },
  banks: { name: 'Partner banks & NBFIs', kind: 'partner', href: '/access-to-finance/' },
  insurers: { name: 'Insurance partners', kind: 'partner', href: '/agri-advisory/' },
  fresh: { name: 'iFarmer Fresh', kind: 'partner', href: '/forward-market-linkage/' },
  hotline: { name: 'Hotline 08008500800', kind: 'partner', href: 'tel:+8808008500800' },
} satisfies Record<string, Channel>;

export const howItWorks = {
  title: 'How iFarmer works',
  body: 'One farmer, every service, and the apps that connect them. Scroll to follow a season, from the first loan to a paid harvest.',
};

export const intro = {
  title: 'Every harvest starts with a farmer.',
  body: 'We know every farmer we serve, so finance, advice, inputs and markets reach them faster and fit them better.',
};

export const scenes: Scene[] = [
  {
    id: 'intro',
    service: '',
    title: intro.title,
    body: intro.body,
    channels: [],
    shots: [
      {
        photo: 'farmer-meeting',
        screen: 'launcher',
        app: 'iFarmer apps',
        does: 'Every service in a few apps',
        alt: 'Farmers gather in an open field for a meeting with iFarmer field staff',
        caption: 'Farmers meet our field team',
        from: { s: 1.0, x: 0, y: 0 },
        to: { s: 1.16, x: -4, y: 2 },
        enter: 'fade',
      },
    ],
  },
  {
    id: 'finance',
    service: 'Access to Finance',
    title: 'A loan the farmer can actually get',
    body: 'Farmers apply on the Folon app or with a field facilitator on Sofol. Funders on iHarvst and our partner banks and NBFIs back each loan, collateral-free and repaid at harvest.',
    channels: [ch.folon, ch.sofol, ch.iharvst, ch.banks],
    more: { label: 'Explore Access to Finance', href: '/access-to-finance/' },
    shots: [
      {
        photo: 'farmer-phone',
        screen: 'folon-apply',
        app: 'Folon',
        does: 'Apply for crop finance in a few taps',
        alt: 'A farmer in a lungi talks on his phone beside young rice fields',
        caption: 'Applying from the field',
        focus: '50% 45%',
        from: { s: 1.32, x: -6, y: 4 },
        to: { s: 1.12, x: -2, y: 1 },
        enter: 'zoom',
      },
      {
        photo: 'farmer-card',
        screen: 'iharvst-fund',
        app: 'iHarvst',
        does: 'Funders choose a farm to back',
        alt: 'A group of farmers outside a village shop hold up their iFarmer Farmer Cards',
        caption: 'Farmers with their Farmer Cards',
        from: { s: 1.06, x: 0, y: 0 },
        to: { s: 1.2, x: 3, y: -2 },
        enter: 'slide',
      },
    ],
  },
  {
    id: 'inputs',
    service: 'Agri Input & Machinery',
    title: 'The right input, close to the farm',
    body: 'Village retailers order quality seed, fertilizer and crop protection on KriShop and get it delivered to the shop. Farmers pay later with the Farmer Card, and try machines at our Experience Centers.',
    channels: [ch.krishop, ch.card, ch.experience],
    more: { label: 'Explore Agri Input & Machinery', href: '/agri-input/' },
    shots: [
      {
        photo: 'krishop-counter',
        screen: 'krishop-order',
        app: 'KriShop',
        does: 'The retailer orders inputs on demand',
        alt: 'A KriShop partner retailer in a KriShop T-shirt holds up the KriShop app in his shop',
        caption: 'A KriShop partner shop',
        focus: '60% 40%',
        from: { s: 1.12, x: 4, y: 0 },
        to: { s: 1.3, x: -3, y: 2 },
        enter: 'zoom',
      },
      {
        photo: 'krishop-retailer',
        screen: 'krishop-delivery',
        app: 'KriShop',
        does: 'Delivered to the shop',
        alt: 'A retailer serves farmers at a counter lined with crop-protection products',
        caption: 'Inputs at the village counter',
        from: { s: 1.2, x: -3, y: 0 },
        to: { s: 1.06, x: 2, y: 0 },
        enter: 'slide',
      },
      {
        photo: 'experience-center',
        screen: 'farmer-card',
        app: 'Farmer Card',
        does: 'Buy now, pay in 30 to 90 days',
        alt: 'A reaper, a power tiller and other farm machines on display at an Agri-Machinery Experience Center',
        caption: 'At an Agri-Machinery Experience Center',
        from: { s: 1.04, x: 0, y: 0 },
        to: { s: 1.22, x: 4, y: 3 },
        enter: 'rise',
      },
    ],
  },
  {
    id: 'grow',
    service: 'Advisory, Insurance & Climate',
    title: 'Advice that knows the field',
    body: 'Folon-AI answers in Bangla by text, voice or photo, and agronomists take the hard cases. Soil sensors, satellite monitoring and climate-smart practices protect the crop, and insurance covers crop, cattle and family.',
    channels: [ch.folonAI, ch.folon, ch.insurers, ch.hotline],
    more: { label: 'Explore Advisory & Insurance', href: '/agri-advisory/' },
    shots: [
      {
        photo: 'advisory-field',
        screen: 'folonai-ask',
        app: 'Folon-AI',
        does: 'Ask by text, voice or photo, in Bangla',
        alt: 'An agronomist kneels with an older farmer to check young rice plants in a paddy field',
        caption: 'An agronomist in the paddy',
        focus: '45% 50%',
        from: { s: 1.02, x: 0, y: 0 },
        to: { s: 1.34, x: 2, y: 4 },
        enter: 'zoom',
      },
      {
        photo: 'seed-farmer',
        screen: 'folon-advice',
        app: 'Folon',
        does: 'Advice for this crop, this week',
        alt: 'A young farmer holds a packet of iFarmer Rocky-55 hybrid maize seed in his growing maize field',
        caption: 'Rocky-55 maize, our own seed',
        focus: '70% 40%',
        from: { s: 1.24, x: -4, y: -2 },
        to: { s: 1.08, x: 0, y: 0 },
        enter: 'slide',
      },
    ],
  },
  {
    id: 'market',
    service: 'Market Linkage & Export',
    title: 'Buyers see the harvest before it happens',
    body: 'On Supplier Connect, traders share crop availability, prices and delivery dates. We match them with institutional and export buyers, with quality checks at every hand-off and iFarmer Fresh for export.',
    channels: [ch.supplier, ch.center, ch.fresh],
    more: { label: 'Explore Market Linkage', href: '/forward-market-linkage/' },
    shots: [
      {
        photo: 'maize-harvest',
        screen: 'supplier-share',
        app: 'Supplier Connect',
        does: 'Traders share what is ready to sell',
        alt: 'Farmers harvest dry maize stalks in a field beside a river embankment',
        caption: 'Harvest time',
        from: { s: 1.0, x: 0, y: 0 },
        to: { s: 1.18, x: -4, y: 2 },
        enter: 'zoom',
      },
      {
        photo: 'collection-center',
        screen: 'supplier-orders',
        app: 'Supplier Connect',
        does: 'Buyer orders, standards and payment dates',
        alt: 'Farmers bring gourds and beans to an iFarmer collection center',
        caption: 'At an iFarmer collection center',
        from: { s: 1.16, x: 3, y: 0 },
        to: { s: 1.04, x: -2, y: 1 },
        enter: 'slide',
      },
      {
        photo: 'harvest-crates',
        screen: 'supplier-dispatch',
        app: 'Supplier Connect',
        does: 'Quality checked and dispatched',
        alt: 'Rows of blue crates filled with fresh vegetables ready for buyers',
        caption: 'Graded and ready for buyers',
        from: { s: 1.06, x: 0, y: 0 },
        to: { s: 1.26, x: 5, y: 4 },
        enter: 'rise',
      },
    ],
  },
  {
    id: 'center',
    service: 'iFarmer Center',
    title: 'Every service, one door in the village',
    body: 'At 1,200+ iFarmer Centers, farmers walk in to apply for a loan, buy inputs, get one-to-one advice and sell their harvest, with our team and apps working behind the counter.',
    channels: [ch.center, ch.sofol, ch.krishop],
    more: { label: 'About iFarmer Centers', href: '/ifarmer-center/' },
    shots: [
      {
        photo: 'ifarmer-center-front',
        screen: 'sofol-register',
        app: 'Sofol',
        does: 'Field staff register farmers with e-KYC',
        alt: 'The green storefront of an iFarmer Center with its Bangla signboard',
        caption: 'An iFarmer Center',
        focus: '50% 35%',
        from: { s: 1.34, x: 0, y: 6 },
        to: { s: 1.06, x: 0, y: 0 },
        enter: 'zoom',
      },
      {
        photo: 'center-farmers',
        screen: 'sofol-profile',
        app: 'Sofol',
        does: 'One profile for every service',
        alt: 'Inside an iFarmer Center, a staff member helps a row of farmers at the desk',
        caption: 'Inside the center',
        from: { s: 1.06, x: 0, y: 0 },
        to: { s: 1.22, x: -4, y: 2 },
        enter: 'slide',
      },
    ],
  },
  {
    id: 'paid',
    service: 'Paid at harvest',
    title: 'Farmer paid. Funders repaid.',
    body: 'Sale proceeds reach the farmer, the loan is settled from the harvest, and iHarvst funders receive their share. The farmer’s record grows stronger for next season.',
    channels: [ch.iharvst, ch.card, ch.folon],
    more: { label: 'Fund farms with iHarvst', href: '/product-iharvst/' },
    shots: [
      {
        photo: 'farmer-card-woman',
        screen: 'folon-paid',
        app: 'Folon',
        does: 'Sale paid, loan settled',
        alt: 'A woman farmer in a printed dress holds up her iFarmer Farmer Card beside an iFarmer banner',
        caption: 'Her Farmer Card, her record',
        focus: '60% 35%',
        from: { s: 1.18, x: 2, y: -2 },
        to: { s: 1.04, x: 0, y: 0 },
        enter: 'zoom',
      },
      {
        photo: 'harvest-market',
        screen: 'iharvst-returns',
        app: 'iHarvst',
        does: 'Funders receive their share',
        alt: 'A smiling farmer sits among a huge pile of freshly harvested bottle gourds',
        caption: 'A good season',
        from: { s: 1.3, x: 0, y: 3 },
        to: { s: 1.02, x: 0, y: 0 },
        enter: 'slide',
      },
    ],
  },
];

export const outro = {
  title: 'One platform for the whole season.',
  body: 'Finance, inputs, advice and markets, joined by data and delivered by people on the ground. Then the next season begins.',
};
