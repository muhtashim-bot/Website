import type { ch } from './journey';
import type { MetricId } from './metrics';

export type ChannelKey = keyof typeof ch;

export type Status = 'LIVE' | 'PILOT' | 'IN DEVELOPMENT';
export type Item = { title: string; body: string; status?: Status; href?: string };
export type FAQ = { q: string; a: string };
export type Module = { title: string; body: string; href: string; linkLabel: string };
export type Block = { title: string; intro?: string; items: Item[]; layout?: 'grid' | 'list' | 'steps' };
/** A step of the scrolling phone walkthrough on solution pages. `screen` is a PhoneScreens key. */
export type WalkStep = { title: string; body: string; screen: string; callouts?: string[] };
export type Walkthrough = { title: string; steps: WalkStep[] };

export type Page = {
  slug: string;
  kind: 'service' | 'product' | 'audience';
  name: string;
  menuLabel: string;
  eyebrow?: string;
  title: string;
  intro: string;
  photo: string; // /public/photos/<photo>-1920.jpg
  channels: ChannelKey[]; // apps, places and partners that deliver this
  metrics?: MetricId[];
  walkthrough?: Walkthrough;
  blocks: Block[];
  module?: Module; // AI & Data cross-link module (AI brief, section 9)
  stores?: { android?: string; ios?: string };
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  faqs?: FAQ[];
  related?: string[];
  seo: { title: string; description: string };
};

export const HOTLINE = '08008500800';
export const HOTLINE_TEL = 'tel:+8808008500800';
export const EMAIL = 'hello@ifarmer.asia';

// ---------------------------------------------------------------- services
export const services: Page[] = [
  {
    slug: 'access-to-finance',
    kind: 'service',
    name: 'Access to Finance',
    menuLabel: 'Access to Finance',
    title: 'Finance that fits the farming season',
    intro:
      'Capital is the lifeblood of agriculture. iFarmer connects banks, NBFIs and retail funders with farmers, input retailers and suppliers, and bundles each loan with inputs, advice, insurance and a buyer for the harvest.',
    photo: 'center-farmers',
    channels: ['folon', 'sofol', 'iharvst', 'banks'],
    metrics: ['financeFacilitated', 'financedFarmers'],
    blocks: [
      {
        title: 'Our approach to finance',
        layout: 'grid',
        items: [
          { title: 'Collateral-free', body: 'Farmers and value-chain actors get funds without traditional collateral.' },
          { title: 'Repaid at harvest', body: 'Repayment is aligned with the crop cycle, including payment when the harvest is sold.' },
          { title: 'End-to-end digital', body: 'Demand, disbursement and repayment are all managed digitally.' },
          { title: 'A credit record that grows', body: 'Farmers, input retailers and suppliers build a credit profile they can use season after season.' },
          { title: 'Partner banks and NBFIs', body: 'We work with banks and NBFIs to reach more farmers, and give lenders a verified borrower pipeline.' },
        ],
      },
      {
        title: 'How a loan moves',
        layout: 'steps',
        items: [
          { title: 'Apply', body: 'On the Folon app, with a field facilitator on Sofol, or at an iFarmer Center.' },
          { title: 'Assess', body: 'Our credit-scoring models use alternative data to assess each applicant.' },
          { title: 'Approve', body: 'The partner lender’s credit team makes the decision.' },
          { title: 'Disburse', body: 'Funds reach the farmer as quickly as possible once approved.' },
        ],
      },
    ],
    module: {
      title: 'What goes into a farmer profile',
      body: 'KYC and identity from Sofol e-KYC, transactions and repayment history, information farmers share through Bangla Voice AI, farm boundaries and crops, satellite and weather signals, and field verification. Together they give a risk insight; the credit team or lending partner makes the decision.',
      href: '/ai-data-intelligence/#credit',
      linkLabel: 'See how our credit intelligence works',
    },
    cta: { label: 'Partner with us as a lender', href: '/for-partners/' },
    secondary: { label: 'Apply on Folon', href: '/product-folon/' },
    faqs: [
      {
        q: 'How can farmers get financial support from iFarmer?',
        a: 'Apply on the Folon app, through an iFarmer field facilitator, or at any of our 1,200+ iFarmer Centers. You can also call the free hotline 08008500800.',
      },
      {
        q: 'What is the repayment period?',
        a: 'Crop finance is repaid in line with the farming cycle, including at harvest. Input purchases on buy-now-pay-later are repaid in about 30 to 90 days, and machinery on EMI over 4 to 12 months.',
      },
    ],
    related: ['product-folon', 'product-iharvst', 'product-sofol'],
    seo: {
      title: 'Farmer Credit & Agri Finance in Bangladesh | iFarmer',
      description: 'Data-driven credit assessment helps farmers and agri-retailers access finance through iFarmer and partner banks and NBFIs.',
    },
  },
  {
    slug: 'agri-advisory',
    kind: 'service',
    name: 'Agri Advisory & Insurance',
    menuLabel: 'Agri Advisory & Insurance',
    title: 'Advice that knows the field, cover for the bad seasons',
    intro:
      'IoT sensors, remote sensing and machine learning help our agronomists guide crop farmers, fish farmers and dairy farmers. Insurance through our partners protects the crop, the herd and the family.',
    photo: 'advisory-field',
    channels: ['folonAI', 'folon', 'insurers', 'hotline'],
    metrics: ['riskCovered'],
    blocks: [
      {
        title: 'Core advisory services',
        layout: 'grid',
        items: [
          { title: 'Embedded farming advisory', body: 'Tailored, practical guidance delivered with every iFarmer service.' },
          { title: 'Weather, pest and disease alerts', body: 'Early warnings so farmers can act before damage spreads.' },
          { title: 'Crop-specific packages', body: 'Season-long recommendations for each crop.' },
          { title: 'Training', body: 'Programs that build farmers’ skills and knowledge.' },
          { title: 'Free advisory hotline', body: 'Call 08008500800, Saturday to Thursday, 10 AM to 6 PM.' },
        ],
      },
      {
        title: 'Advisory technology',
        layout: 'grid',
        items: [
          { title: 'Intelligent Soil Sensor', body: 'Real-time readings of soil fertility, pH and moisture, even in remote areas, combined with weather data.', status: 'LIVE' },
          { title: 'Fertilizer advice in under 10 minutes', body: 'Machine-learning models recommend nitrogen, phosphorus, potassium, sulphur and zinc doses from a soil test.', status: 'LIVE' },
          { title: 'Satellite monitoring', body: 'Facilitators map farm parcels by phone; vegetation indices (NDVI, MSAVI, NDRE, RECI) flag disease, water and nitrogen stress, and our call center and field staff confirm on the ground.', status: 'PILOT' },
          { title: 'Cowdy for dairy herds', body: 'A neck-strap monitor and solar Cow Router track health, activity and heat cycles, and send alerts for disease, heat and pregnancy.', status: 'PILOT' },
        ],
      },
      {
        title: 'Insurance through our partners',
        layout: 'grid',
        items: [
          { title: 'Farmer health insurance', body: 'Hospitalisation, doctor visits, death and permanent disability, with free medical consultations and a discount card.' },
          { title: 'Crop insurance', body: 'Weather-indexed cover against natural perils.' },
          { title: 'Cattle insurance', body: 'Cover for losses when cattle die from disease, accidents or poisoning.' },
          { title: 'Credit shield', body: 'Covers the loan if a farmer dies or becomes permanently disabled.' },
        ],
      },
    ],
    module: {
      title: 'Advice powered by experts and AI',
      body: 'Folon-AI answers farmers’ questions by text, voice or photo, satellite monitoring watches thousands of fields, and soil sensors guide fertilizer. Agronomists review all advice.',
      href: '/ai-data-intelligence/#folon-ai',
      linkLabel: 'Meet Folon-AI',
    },
    cta: { label: 'Call the advisory hotline', href: 'tel:+8808008500800' },
    secondary: { label: 'Get the Folon app', href: '/product-folon/' },
    faqs: [
      {
        q: 'What kind of advisory does iFarmer offer?',
        a: 'Crop, fisheries and livestock advice: tailored guidance, weather, pest and disease alerts, crop packages, training, soil testing with fertilizer recommendations, satellite crop monitoring and Cowdy herd monitoring.',
      },
      {
        q: 'Does iFarmer offer insurance services to farmers?',
        a: 'Yes. Through our partners we offer farmer health, crop, cattle and credit-shield insurance.',
      },
    ],
    related: ['product-folon', 'climate-smart-solution'],
    seo: {
      title: 'AI Agricultural Advisory, Soil & Satellite | iFarmer',
      description: 'Expert and AI-powered farming advice in Bangla with Folon-AI, soil sensors and satellite crop monitoring.',
    },
  },
  {
    slug: 'agri-input',
    kind: 'service',
    name: 'Agri Input & Machinery',
    menuLabel: 'Agri Input & Machinery',
    title: 'Quality inputs and machinery, close to every farm',
    intro:
      'iFarmer is building Bangladesh’s largest agri-input platform: quality seed, fertilizer, feed, crop protection and machinery for farmers and retailers, with training on how to use them well.',
    photo: 'krishop-retailer',
    channels: ['krishop', 'card', 'experience'],
    metrics: ['registeredRetailers', 'experienceCenters'],
    blocks: [
      {
        title: 'Ways to buy',
        layout: 'grid',
        items: [
          { title: 'KriShop app', body: 'Retailers order inputs on demand at competitive prices and run their shop from one app.', href: '/product-krishop/' },
          { title: 'Bundles and trusted brands', body: 'Inputs from reputable companies, machinery, and input bundles for each crop.' },
          { title: 'iFarmer private label', body: 'Our Rocky-55 maize seed has passed farmer trials. Vegetable seed, organic fertilizer, traps, cattle feed and more are on the way.' },
          { title: 'Agri-Machinery Experience Centers', body: 'Try machines from several brands, order on the spot, pay by EMI over 4 to 12 months, and get training and after-sales service.', href: '/experience-centers/' },
        ],
      },
      {
        title: 'Buy now, pay later for inputs',
        intro: 'Embedded input financing through the KriShop app or a sales agent.',
        layout: 'list',
        items: [
          { title: 'Instant credit decisions', body: 'Based on purchase history, digital KYC, field verification, community scoring and dealer references.' },
          { title: 'Repay in 30 to 90 days', body: 'By digital payment, agent collection or deduction from crop proceeds.' },
          { title: 'The Farmer Card', body: 'One identity for input finance, advisory, insurance, transaction records and discounts.' },
        ],
      },
    ],
    module: {
      title: 'The right input at the right time',
      body: 'Crop stage, the farmer’s profile and advisory data turn into relevant product recommendations at KriShop and retailers.',
      href: '/ai-data-intelligence/#folon-ai',
      linkLabel: 'See how recommendations work',
    },
    cta: { label: 'Become a KriShop partner', href: '/for-retailers/' },
    secondary: { label: 'Visit an Experience Center', href: '/experience-centers/' },
    faqs: [
      { q: 'Where can farmers buy quality agri-inputs?', a: 'From KriShop partner retailers and at iFarmer Centers across Bangladesh.' },
      { q: 'How can a retailer buy from iFarmer?', a: 'Through the KriShop app, by calling our team, or at an iFarmer Center. Orders are delivered to the shop.' },
      { q: 'How does iFarmer help with agri-machinery?', a: 'At our Agri-Machinery Experience Centers farmers can see and try machines from several brands, order on the spot, pay by EMI or credit over 4 to 12 months, and get training and after-sales service.' },
    ],
    related: ['product-krishop', 'experience-centers', 'ifarmer-center'],
    seo: {
      title: 'Agri Inputs, Seeds & Machinery in Bangladesh | iFarmer',
      description: 'Quality seed, fertilizer, crop protection and machinery for farmers and retailers through KriShop, iFarmer Centers and Experience Centers.',
    },
  },
  {
    slug: 'forward-market-linkage',
    kind: 'service',
    name: 'Market Linkage & Export',
    menuLabel: 'Forward Market Linkage & Export',
    title: 'From the field to buyers at home and abroad',
    intro:
      'Price swings and post-harvest losses cost farmers dearly. iFarmer runs an organised, tech-enabled supply chain that links farmers and traders with large buyers in Bangladesh and export markets.',
    photo: 'harvest-crates',
    channels: ['supplier', 'center', 'fresh'],
    metrics: ['produceSold', 'centers'],
    blocks: [
      {
        title: 'How the supply chain connects',
        layout: 'grid',
        items: [
          { title: 'Farmers', body: 'Sell through our trader network at iFarmer Centers, with better prices and access to finance, inputs and advice.' },
          { title: 'Small and medium traders', body: 'Sell efficiently with flexible financing and payment options.' },
          { title: 'Large B2B buyers', body: 'Buy in bulk from one source, with competitive prices and strict quality control.' },
        ],
      },
      {
        title: 'Storage and procurement hubs',
        layout: 'list',
        items: [
          { title: 'Collection centers and warehouses', body: 'Farmers can hold produce until prices improve; cold storage is planned.' },
          { title: 'Mini cold storage for vegetables', body: 'A planned collaboration with the USDA.', status: 'IN DEVELOPMENT' },
          { title: 'Warehouse-receipt finance', body: 'In discussion with financial institutions for loans against stored grain.', status: 'IN DEVELOPMENT' },
        ],
      },
      {
        title: 'iFarmer Fresh: Bangladeshi quality for global tables',
        intro: 'Our export brand serves the UAE, Saudi Arabia, Oman and Bahrain, starting with Chinigura rice. Mustard oil, turmeric, red chilli, puffed rice and chira are planned.',
        layout: 'grid',
        items: [
          { title: 'Export-grade quality', body: 'Committed to international quality and food-safety standards.' },
          { title: 'Year-round supply', body: 'Consistent volumes from our farmer network.' },
          { title: 'Dedicated trade support', body: 'One team from enquiry to delivery.' },
        ],
      },
    ],
    module: {
      title: 'Seeing the harvest before it happens',
      body: 'Voice AI conversations and field data show what farmers plan to sell, so buyers can plan procurement earlier.',
      href: '/ai-data-intelligence/#supply-chain',
      linkLabel: 'See our supply-chain intelligence',
    },
    cta: { label: 'Buy from iFarmer', href: '/for-buyers/' },
    secondary: { label: 'Supplier Connect', href: '/product-supplier-connect/' },
    related: ['product-supplier-connect', 'ifarmer-center'],
    seo: {
      title: 'Agri Market Linkage & Export from Bangladesh | iFarmer',
      description: 'An organised supply chain linking Bangladeshi farmers and traders with institutional and export buyers, including iFarmer Fresh.',
    },
  },
  {
    slug: 'climate-smart-solution',
    kind: 'service',
    name: 'Climate Smart Solutions',
    menuLabel: 'Climate Smart Solutions',
    title: 'Farming that saves water, soil and money',
    intro:
      'Our climate-smart programs help farmers adapt to changing weather, raise productivity sustainably and protect long-term food security.',
    photo: 'seed-farmer',
    channels: ['folon', 'center', 'hotline'],
    blocks: [
      {
        title: 'Programs in the field',
        layout: 'grid',
        items: [
          { title: 'Alternate Wetting and Drying', body: 'A perforated tube shows rice farmers when to irrigate: 1 to 5 fewer irrigations a season, about BDT 1,310 saved per bigha and about 223,000 litres of water saved per irrigation. 600+ farmers on 250 acres.' },
          { title: 'Vermicompost', body: 'Earthworm-made fertilizer that rebuilds soil: up to 30% less chemical fertilizer, 15–20% higher yields and 50–70% less methane.' },
          { title: 'Solar irrigation', body: 'Smart solar pumps replace diesel: about 20% lower operating costs and nearly 50% lower carbon emissions, with new business for young rural entrepreneurs.' },
          { title: 'Integrated Pest Management', body: 'Biocontrol, traps and ecological balance cut chemical pesticide use by 40–60% and help meet food-safety standards for high-value markets.' },
        ],
      },
    ],
    cta: { label: 'Partner on climate programs', href: '/for-partners/' },
    secondary: { label: 'Read our impact reports', href: '/reports/' },
    related: ['agri-advisory', 'impact'],
    seo: {
      title: 'Climate-Smart Agriculture in Bangladesh | iFarmer',
      description: 'AWD irrigation, vermicompost, solar irrigation and IPM programs that save water, cut costs and lower emissions for Bangladeshi farmers.',
    },
  },
];

// ---------------------------------------------------------------- products / solutions
export const products: Page[] = [
  {
    slug: 'product-folon',
    kind: 'product',
    name: 'Folon',
    menuLabel: 'Folon',
    eyebrow: 'Farmer app',
    title: 'Advice, finance and a community in the farmer’s pocket',
    intro: 'Folon is the farmer’s all-in-one digital partner: crop advice in text and audio, chat with agri experts, a farmer community, and simple loan applications.',
    photo: 'farmer-phone',
    channels: ['folon', 'folonAI'],
    walkthrough: {
      title: 'From a question in the field to a loan in hand',
      steps: [
        { title: 'Ask about your crop', body: 'Type, speak or send a photo in Bangla. Folon-AI answers from advice our agronomists have reviewed, and hands hard cases to a person.', screen: 'folonai-ask', callouts: ['Text, voice or photo', 'Agronomist follow-up'] },
        { title: 'Get this week’s advice', body: 'Weather alerts, fertilizer timing and pest watch for your crop, to read or listen to.', screen: 'folon-advice', callouts: ['Weather alerts', 'Listen in Bangla'] },
        { title: 'Apply for crop finance', body: 'Tell us your crop, your land and what you need. No collateral, and a facilitator can help you apply.', screen: 'folon-apply', callouts: ['No collateral', 'Repay at harvest'] },
        { title: 'Follow it to approval', body: 'See each step until the money reaches you, then buy your inputs at a KriShop partner shop.', screen: 'folon-approved', callouts: ['Funds sent to you'] },
      ],
    },
    blocks: [
      {
        title: 'What farmers can do in Folon',
        layout: 'grid',
        items: [
          { title: 'Smart advisory library', body: 'Advice for each crop, in audio or text, in the format the farmer prefers.' },
          { title: 'Folon-AI', body: 'Ask a farming question by typing, speaking or sending a photo, in Bangla. Complex cases go to our agronomists.', status: 'LIVE', href: '/ai-data-intelligence/#folon-ai' },
          { title: 'Chat with agri experts', body: 'Send a message, photo or voice note and get help from our experts.' },
          { title: 'Farmer Adda', body: 'A community where farmers share information, ask questions and help each other.' },
          { title: 'Easy loan application', body: 'Apply for agricultural finance in a few steps.' },
        ],
      },
    ],
    module: {
      title: 'When Folon-AI answers, and when a person does',
      body: 'Folon-AI answers from iFarmer’s agronomist-reviewed knowledge base. When a case is complex, it hands the farmer over to an agronomist or the field team.',
      href: '/ai-data-intelligence/#folon-ai',
      linkLabel: 'How Folon-AI answers',
    },
    stores: { android: 'https://play.google.com/store/apps/details?id=asia.ifarmer.farmers' },
    cta: { label: 'Get Folon on Google Play', href: 'https://play.google.com/store/apps/details?id=asia.ifarmer.farmers' },
    secondary: { label: 'Call 08008500800', href: 'tel:+8808008500800' },
    related: ['access-to-finance', 'agri-advisory', 'product-sofol'],
    seo: { title: 'Folon Farmer App: Advice, Loans & Community | iFarmer', description: 'Folon gives Bangladeshi farmers crop advice, Folon-AI, expert chat, a farmer community and easy loan applications.' },
  },
  {
    slug: 'product-sofol',
    kind: 'product',
    name: 'Sofol',
    menuLabel: 'Sofol',
    eyebrow: 'Field agent and retailer app',
    title: 'The field data behind every iFarmer service',
    intro: 'Field facilitators and partner retailers use Sofol to register farmers, complete e-KYC and keep farm records up to date. It is how iFarmer combines people, phones and remote sensing to serve smallholders at low cost.',
    photo: 'farmer-meeting',
    channels: ['sofol', 'center'],
    walkthrough: {
      title: 'How a facilitator brings a farmer in',
      steps: [
        { title: 'Register the farmer', body: 'Scan the national ID card. e-KYC checks it in real time.', screen: 'sofol-register', callouts: ['NID scan', 'e-KYC in real time'] },
        { title: 'Build the farmer profile', body: 'Household, land and crops go into one record, so every service fits the farmer.', screen: 'sofol-profile', callouts: ['One profile', 'Every service'] },
        { title: 'Keep the record current', body: 'Farm visits, photos and transactions keep the profile up to date for monitoring.', screen: 'sofol-visits', callouts: ['Farm visits', 'Crop stage'] },
      ],
    },
    blocks: [
      {
        title: 'What Sofol does',
        layout: 'steps',
        items: [
          { title: 'Register', body: 'A facilitator registers the farmer and their farm on Sofol.' },
          { title: 'Verify', body: 'e-KYC checks the farmer’s national ID in real time.' },
          { title: 'Profile', body: 'Farm and household details build a farmer profile for tailored services.' },
          { title: 'Track', body: 'Transactions and updates keep the record current for monitoring.' },
        ],
      },
    ],
    module: {
      title: 'Field data that powers our intelligence',
      body: 'Sofol registrations and e-KYC are a core input to our farmer and credit intelligence.',
      href: '/ai-data-intelligence/#credit',
      linkLabel: 'See what goes into a farmer profile',
    },
    cta: { label: 'Work with our field network', href: '/for-partners/' },
    related: ['product-folon', 'access-to-finance', 'ifarmer-center'],
    seo: { title: 'Sofol Field App: Farmer Registration & e-KYC | iFarmer', description: 'Sofol lets iFarmer field facilitators and partner retailers register farmers, complete e-KYC and keep farm records.' },
  },
  {
    slug: 'product-krishop',
    kind: 'product',
    name: 'KriShop',
    menuLabel: 'KriShop',
    eyebrow: 'Agri-input app for retailers',
    title: 'Bangladesh’s agri-input platform for retailers',
    intro: 'KriShop lets agri-input retailers buy quality products on demand at competitive prices, manage their shop, and serve farmers better.',
    photo: 'krishop-counter',
    channels: ['krishop', 'card'],
    metrics: ['registeredRetailers'],
    walkthrough: {
      title: 'How a village shop runs on KriShop',
      steps: [
        { title: 'Order inputs on demand', body: 'Quality seed, fertilizer and crop protection at competitive prices, ordered from the counter.', screen: 'krishop-order', callouts: ['Quality inputs', 'Pay with bKash'] },
        { title: 'Buy now, pay later', body: 'Input credit with an instant decision and 30 to 90 days to repay.', screen: 'krishop-credit', callouts: ['Instant decision', '30 to 90 days'] },
        { title: 'Delivered to your shop', body: 'We confirm the order and track it to your door.', screen: 'krishop-delivery', callouts: ['Tracked delivery'] },
        { title: 'Keep your books in Lenden', body: 'A digital ledger for daily sales that works offline and reminds customers about unpaid balances by SMS.', screen: 'krishop-ledger', callouts: ['Works offline', 'SMS reminders'] },
      ],
    },
    blocks: [
      {
        title: 'Built for the village shop',
        layout: 'grid',
        items: [
          { title: 'Easy ordering', body: 'Sign up with a phone OTP, upgrade with NID and trade licence, and pay with bKash. We confirm shop and address after each order.' },
          { title: 'Lenden bookkeeping', body: 'A digital ledger for daily transactions that works offline and sends SMS reminders to customers with unpaid balances.' },
          { title: 'Buy now, pay later', body: 'Input credit with instant decisions and 30 to 90 days to repay.', href: '/agri-input/' },
          { title: 'Retailer community', body: 'A forum to share insights and solve problems with other retailers.' },
        ],
      },
    ],
    module: {
      title: 'The right input at the right time',
      body: 'Crop stage, farmer profile and advisory data turn into relevant product recommendations for retailers and their farmers.',
      href: '/ai-data-intelligence/#folon-ai',
      linkLabel: 'How recommendations work',
    },
    cta: { label: 'Become a KriShop partner', href: '/for-retailers/' },
    secondary: { label: 'Call 08008500800', href: 'tel:+8808008500800' },
    related: ['agri-input', 'experience-centers'],
    seo: { title: 'KriShop: Agri-Input App for Retailers | iFarmer', description: 'KriShop helps Bangladeshi agri-input retailers order quality products, keep digital books and access input credit.' },
  },
  {
    slug: 'product-iharvst',
    kind: 'product',
    name: 'iHarvst',
    menuLabel: 'iHarvst',
    eyebrow: 'Funding app',
    title: 'Fund real farms and share in the harvest',
    intro: 'iHarvst connects funders with farming projects managed by farmers and supported by iFarmer, with insurance to reduce risk and full digital visibility.',
    photo: 'maize-harvest',
    channels: ['iharvst'],
    walkthrough: {
      title: 'Back a farm and follow it to harvest',
      steps: [
        { title: 'Choose a farm', body: 'Browse vetted, insured projects in All Farms, with Shariah-compliant options.', screen: 'iharvst-fund', callouts: ['Insured', 'Shariah option'] },
        { title: 'Follow the season', body: 'Updates and photos from the iFarmer team as the crop grows.', screen: 'iharvst-updates', callouts: ['Season updates'] },
        { title: 'Share the returns', body: 'After harvest and sale, the loan is repaid and returns are shared between you and the farmer.', screen: 'iharvst-returns', callouts: ['Returns shared'] },
      ],
    },
    blocks: [
      {
        title: 'How funding works',
        layout: 'steps',
        items: [
          { title: 'Create your account', body: 'Download the app and complete a quick, secure sign-up.' },
          { title: 'Choose a project', body: 'Browse vetted projects in All Farms.' },
          { title: 'Follow progress', body: 'Get updates from the iFarmer team through the season.' },
          { title: 'Share the returns', body: 'After harvest and sale, returns are shared between the funder and the farmer.' },
        ],
      },
      {
        title: 'Simple, smart and clear',
        layout: 'grid',
        items: [
          { title: 'Tech-enabled', body: 'Fund and track from your phone.' },
          { title: 'Data-driven', body: 'Our credit-scoring models assess each farmer’s financing needs.' },
          { title: 'Transparent', body: 'Funders and farmers see the information they need.' },
          { title: 'Shariah governance', body: 'Shariah-compliant options are overseen by our Shariah Board.', href: '/shariah-board/' },
        ],
      },
    ],
    cta: { label: 'Start funding on iHarvst', href: '/for-funders/' },
    secondary: { label: 'Meet the Shariah Board', href: '/shariah-board/' },
    related: ['access-to-finance', 'shariah-board'],
    seo: { title: 'iHarvst: Fund Farms in Bangladesh | iFarmer', description: 'iHarvst lets funders back vetted farming projects, follow progress and share returns after harvest.' },
  },
  {
    slug: 'product-supplier-connect',
    kind: 'product',
    name: 'Supplier Connect',
    menuLabel: 'Supplier Connect',
    eyebrow: 'Supplier app',
    title: 'One line between our suppliers and our buyers',
    intro: 'Supplier Connect links iFarmer directly with its network of suppliers, with clear buyer orders and rates, smooth communication and efficient fulfilment.',
    photo: 'collection-center',
    channels: ['supplier', 'center'],
    walkthrough: {
      title: 'From a supplier’s stock to a buyer’s order',
      steps: [
        { title: 'Share what is ready', body: 'Crop, quantity, grade, price and the date it is ready, in real time.', screen: 'supplier-share', callouts: ['Quantity and grade', 'Your price'] },
        { title: 'See buyer orders', body: 'Institutional buyers’ requirements, quality standards and payment schedules, in one place.', screen: 'supplier-orders', callouts: ['Quality standard', 'Payment schedule'] },
        { title: 'Deliver and get paid', body: 'Produce is collected, quality checked and dispatched, and payment follows the schedule.', screen: 'supplier-dispatch', callouts: ['Quality checked', 'Payment released'] },
      ],
    },
    blocks: [
      {
        title: 'What suppliers and iFarmer share',
        layout: 'grid',
        items: [
          { title: 'Suppliers share', body: 'Crop availability, offered prices and delivery schedules, in real time.' },
          { title: 'iFarmer shares', body: 'Institutional buyers’ requirements, quality standards and payment schedules.' },
          { title: 'Fewer middlemen', body: 'Direct communication saves time and strengthens supplier partnerships.' },
        ],
      },
    ],
    module: {
      title: 'Seeing the harvest before it happens',
      body: 'Supplier updates, Voice AI and field data show expected volumes, so buyers can plan procurement.',
      href: '/ai-data-intelligence/#supply-chain',
      linkLabel: 'Supply-chain intelligence',
    },
    cta: { label: 'Become a supplier', href: '/contact/?topic=supplier' },
    secondary: { label: 'Market Linkage & Export', href: '/forward-market-linkage/' },
    related: ['forward-market-linkage', 'ifarmer-center'],
    seo: { title: 'Supplier Connect: Agri Supply App | iFarmer', description: 'Supplier Connect links iFarmer’s suppliers with buyer orders, rates, quality standards and payment schedules.' },
  },
  {
    slug: 'ifarmer-center',
    kind: 'product',
    name: 'iFarmer Center',
    menuLabel: 'iFarmer Center',
    eyebrow: 'One-stop shop',
    title: 'A one-stop shop in the farmer’s own village',
    intro: 'A network of 1,200+ iFarmer Centers brings our services to the farmer’s doorstep. Walk in to apply for a loan, buy inputs, get advice, or sell the harvest.',
    photo: 'ifarmer-center-front',
    channels: ['center', 'sofol', 'krishop'],
    metrics: ['centers'],
    walkthrough: {
      title: 'One visit, every service',
      steps: [
        { title: 'Walk in and register', body: 'Our team registers you once with your national ID.', screen: 'sofol-register', callouts: ['Registered once'] },
        { title: 'Get finance and inputs', body: 'Apply for a loan and pick up quality inputs at the same counter.', screen: 'folon-apply', callouts: ['No collateral', 'Repay at harvest'] },
        { title: 'Sell your harvest', body: 'Bring your produce in. We check quality, connect you with buyers and settle your loan from the sale.', screen: 'folon-paid', callouts: ['Paid at harvest'] },
      ],
    },
    blocks: [
      {
        title: 'At any iFarmer Center',
        layout: 'grid',
        items: [
          { title: 'Apply for a loan', body: 'Get the finance you need for the season.', href: '/access-to-finance/' },
          { title: 'Buy inputs', body: 'Quality seed, fertilizer and crop protection.', href: '/agri-input/' },
          { title: 'One-to-one advice', body: 'Personal guidance from our team.', href: '/agri-advisory/' },
          { title: 'Sell your produce', body: 'Connect with markets and sell conveniently.', href: '/forward-market-linkage/' },
        ],
      },
    ],
    cta: { label: 'Find a center near you', href: '/contact/?topic=center' },
    secondary: { label: 'Call 08008500800', href: 'tel:+8808008500800' },
    faqs: [
      { q: 'What is an iFarmer Center?', a: 'A local one-stop shop where farmers can apply for loans, buy inputs, get one-to-one advice and sell their produce. Centers are run by traders in our network.' },
    ],
    related: ['experience-centers', 'forward-market-linkage'],
    seo: { title: 'iFarmer Centers: One-Stop Shops for Farmers | iFarmer', description: '1,200+ iFarmer Centers across Bangladesh where farmers apply for loans, buy inputs, get advice and sell produce.' },
  },
  {
    slug: 'experience-centers',
    kind: 'product',
    name: 'Experience Centers',
    menuLabel: 'Experience Centers',
    eyebrow: 'Agri-machinery',
    title: 'Try the machine before you buy it',
    intro: 'Our Agri-Machinery Experience Centers bring equipment from several brands under one roof, with sales, financing, training and after-sales service.',
    photo: 'experience-center',
    channels: ['experience', 'card'],
    metrics: ['experienceCenters'],
    walkthrough: {
      title: 'Try it, then pay over time',
      steps: [
        { title: 'Find the right machine', body: 'Power tillers, reapers and sprayers from several brands. Book a demo and try one at the center.', screen: 'machine-catalog', callouts: ['Several brands', 'Hands-on demo'] },
        { title: 'Pay in instalments', body: 'Spread the cost over 4 to 12 months, with training and after-sales service included.', screen: 'machine-emi', callouts: ['4 to 12 months', 'Training included'] },
      ],
    },
    blocks: [
      {
        title: 'What you will find',
        layout: 'grid',
        items: [
          { title: 'Learn and experience', body: 'Hands-on time with machines from small tools to high-value equipment.' },
          { title: 'Order on the spot', body: 'Found the right machine? Order it at the center.' },
          { title: 'Flexible financing', body: 'EMI or credit over 4 to 12 months.' },
          { title: 'Training', body: 'Learn to operate new machinery safely and well.' },
          { title: 'After-sales service', body: 'Ongoing support keeps equipment running.' },
        ],
      },
    ],
    cta: { label: 'Visit an Experience Center', href: '/contact/?topic=center' },
    related: ['agri-input', 'ifarmer-center'],
    seo: { title: 'Agri-Machinery Experience Centers | iFarmer', description: 'Try, buy and finance farm machinery from several brands, with training and after-sales service.' },
  },
];

// ---------------------------------------------------------------- audiences
export const audiences: Page[] = [
  {
    slug: 'for-farmers',
    kind: 'audience',
    name: 'Farmers',
    menuLabel: 'Farmers',
    title: 'Everything for the season, in one place',
    intro: 'Finance without collateral, quality inputs, advice in Bangla, insurance, and a buyer for your harvest. Start on your phone, at an iFarmer Center, or with a call.',
    photo: 'farmer-card-woman',
    channels: ['folon', 'center', 'card', 'hotline'],
    blocks: [
      {
        title: 'What you get',
        layout: 'grid',
        items: [
          { title: 'Finance', body: 'Collateral-free, repaid at harvest.', href: '/access-to-finance/' },
          { title: 'Inputs', body: 'Quality seed, fertilizer and machinery nearby.', href: '/agri-input/' },
          { title: 'Advice', body: 'Folon-AI, experts and the free hotline.', href: '/agri-advisory/' },
          { title: 'Insurance', body: 'Health, crop, cattle and credit-shield cover.', href: '/agri-advisory/' },
          { title: 'A buyer', body: 'Sell your harvest at an iFarmer Center.', href: '/forward-market-linkage/' },
        ],
      },
      {
        title: 'Three ways to start',
        layout: 'steps',
        items: [
          { title: 'Download Folon', body: 'Advice, expert chat and loan applications on your phone.', href: '/product-folon/' },
          { title: 'Visit an iFarmer Center', body: 'Walk in to any of 1,200+ centers.', href: '/ifarmer-center/' },
          { title: 'Call 08008500800', body: 'Free, Saturday to Thursday, 10 AM to 6 PM.', href: 'tel:+8808008500800' },
        ],
      },
    ],
    cta: { label: 'Get Folon on Google Play', href: 'https://play.google.com/store/apps/details?id=asia.ifarmer.farmers' },
    secondary: { label: 'Call 08008500800', href: 'tel:+8808008500800' },
    seo: { title: 'For Farmers: Finance, Inputs, Advice & Markets | iFarmer', description: 'Collateral-free finance, quality inputs, advice in Bangla, insurance and a buyer for your harvest.' },
  },
  {
    slug: 'for-retailers',
    kind: 'audience',
    name: 'Retailers',
    menuLabel: 'Retailers',
    title: 'Grow your agri-input shop with KriShop',
    intro: 'Order quality products on demand, keep your books on your phone, get input credit, and learn from other retailers.',
    photo: 'krishop-shop',
    channels: ['krishop', 'card'],
    metrics: ['registeredRetailers'],
    blocks: [
      {
        title: 'Why retailers join',
        layout: 'grid',
        items: [
          { title: 'Products from trusted brands', body: 'Order on demand at competitive prices, delivered to your shop.', href: '/product-krishop/' },
          { title: 'Input credit', body: 'Buy now, pay later in 30 to 90 days.', href: '/agri-input/' },
          { title: 'Lenden digital ledger', body: 'Record sales and dues, even offline.' },
          { title: 'Serve farmers better', body: 'Farmers in our network come to you for inputs and advice.' },
        ],
      },
    ],
    cta: { label: 'Become a KriShop partner', href: '/contact/?topic=retailer' },
    secondary: { label: 'About KriShop', href: '/product-krishop/' },
    seo: { title: 'For Agri-Input Retailers: Join KriShop | iFarmer', description: 'Order quality agri-inputs, keep digital books and get input credit with KriShop.' },
  },
  {
    slug: 'for-funders',
    kind: 'audience',
    name: 'Funders',
    menuLabel: 'Funders',
    title: 'Put your money to work on real farms',
    intro: 'Back vetted farming projects on iHarvst, follow them through the season, and share in the returns after harvest.',
    photo: 'farmer-card',
    channels: ['iharvst'],
    blocks: [
      {
        title: 'Why fund through iHarvst',
        layout: 'grid',
        items: [
          { title: 'Vetted projects', body: 'Farmers are assessed with our credit-scoring models and field verification.' },
          { title: 'Insurance-backed', body: 'Insurance helps reduce the risk to funders.' },
          { title: 'Season-long visibility', body: 'Progress updates from the iFarmer team.' },
          { title: 'Shariah governance', body: 'Shariah-compliant options overseen by our Shariah Board.', href: '/shariah-board/' },
        ],
      },
    ],
    cta: { label: 'Explore iHarvst', href: '/product-iharvst/' },
    secondary: { label: 'Meet the Shariah Board', href: '/shariah-board/' },
    seo: { title: 'For Funders: Back Farms with iHarvst | iFarmer', description: 'Fund vetted farming projects in Bangladesh, follow progress and share returns after harvest.' },
  },
  {
    slug: 'for-buyers',
    kind: 'audience',
    name: 'Buyers & Export',
    menuLabel: 'Buyers & Export',
    title: 'Reliable supply from Bangladesh’s farms',
    intro: 'Buy in bulk from one source, with competitive prices, strict quality control and year-round supply, for the Bangladeshi market or for export through iFarmer Fresh.',
    photo: 'harvest-market',
    channels: ['supplier', 'fresh'],
    metrics: ['produceSold'],
    blocks: [
      {
        title: 'What we offer buyers',
        layout: 'grid',
        items: [
          { title: 'One source, bulk volumes', body: 'Aggregated, quality-assured supply from our farmer and trader network.' },
          { title: 'Quality control', body: 'Checks across the supply chain and commitment to food-safety standards.' },
          { title: 'iFarmer Fresh export', body: 'Serving the UAE, Saudi Arabia, Oman and Bahrain, starting with Chinigura rice.', href: '/forward-market-linkage/' },
          { title: 'Trade support', body: 'A dedicated team from enquiry to delivery.' },
        ],
      },
    ],
    cta: { label: 'Send a buying enquiry', href: '/contact/?topic=buyer' },
    secondary: { label: 'Market Linkage & Export', href: '/forward-market-linkage/' },
    seo: { title: 'For Buyers: Agri Commodities & Export | iFarmer', description: 'Bulk, quality-assured agri commodities from Bangladesh for domestic and export buyers, including iFarmer Fresh.' },
  },
  {
    slug: 'for-partners',
    kind: 'audience',
    name: 'Partners',
    menuLabel: 'Partners',
    title: 'Reach farmers you could not reach before',
    intro: 'Banks, input companies, development organisations and research teams work with iFarmer to serve smallholders at scale.',
    photo: 'farmer-meeting',
    channels: ['center', 'sofol', 'krishop', 'supplier'],
    blocks: [
      {
        title: 'Ways to partner',
        layout: 'grid',
        items: [
          { title: 'Banks and NBFIs', body: 'A verified borrower pipeline with performance data and risk insights.', href: '/access-to-finance/' },
          { title: 'Input and machinery companies', body: 'Reach our retailer network, iFarmer Centers and Experience Centers.', href: '/agri-input/' },
          { title: 'Development organisations', body: 'Reach remote farmers, build capacity and resilience, and promote sustainable farming.', href: '/impact/' },
          { title: 'Researchers and tech partners', body: 'Solve real problems with real agricultural data.', href: '/ai-data-intelligence/' },
        ],
      },
    ],
    cta: { label: 'Start a partnership', href: '/contact/?topic=partner' },
    secondary: { label: 'Read our impact reports', href: '/reports/' },
    seo: { title: 'Partner with iFarmer: Lenders, Agribusiness, Development | iFarmer', description: 'Work with iFarmer to reach smallholder farmers in Bangladesh with finance, inputs, advice and market access.' },
  },
];

export const allPages = [...services, ...products, ...audiences];
export const pageBySlug = (slug: string) => allPages.find((p) => p.slug === slug);
