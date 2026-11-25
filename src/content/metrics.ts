/**
 * ONE source of truth for every number on the site (AI brief, section 10).
 * Values below are exactly as published on ifarmer.asia when reviewed on 25 Nov 2026.
 * `approved: false` means the owner has not yet signed the figure off for the new site.
 * Conflicts found during the audit are recorded in `note` so the owner can resolve them.
 */
export type Metric = {
  id: string;
  value: string;
  label: string;
  kind: 'cumulative' | 'current' | 'study';
  owner: string;
  source: string;
  asOf: string;
  approved: boolean;
  note?: string;
};

export const METRICS_AS_OF = 'November 2026';

export const metrics = {
  financeFacilitated: {
    id: 'financeFacilitated', value: 'BDT 13.8B+', label: 'finance facilitated', kind: 'cumulative',
    owner: 'Finance', source: 'ifarmer.asia homepage', asOf: METRICS_AS_OF, approved: false,
  },
  registeredFarmers: {
    id: 'registeredFarmers', value: '320K+', label: 'registered farmers', kind: 'cumulative',
    owner: 'Operations / MIS', source: 'ifarmer.asia homepage', asOf: METRICS_AS_OF, approved: false,
    note: 'About page says 310,000+ farmers. Pick one.',
  },
  financedFarmers: {
    id: 'financedFarmers', value: '130K+', label: 'farmers financed', kind: 'cumulative',
    owner: 'Finance', source: 'ifarmer.asia homepage', asOf: METRICS_AS_OF, approved: false,
    note: 'Impact page says 86,231 farmers accessed financing through iFarmer Limited. Clarify the two definitions.',
  },
  registeredRetailers: {
    id: 'registeredRetailers', value: '60K+', label: 'registered retailers', kind: 'cumulative',
    owner: 'Agri-input', source: 'ifarmer.asia homepage', asOf: METRICS_AS_OF, approved: false,
  },
  produceSold: {
    id: 'produceSold', value: '280K+ t', label: 'farm produce sold', kind: 'cumulative',
    owner: 'Market linkage', source: 'ifarmer.asia homepage', asOf: METRICS_AS_OF, approved: false,
    note: 'Market Linkage page says 240,000+ tonnes worth US$130M. Pick one.',
  },
  centers: {
    id: 'centers', value: '1,200+', label: 'iFarmer Centers', kind: 'current',
    owner: 'Operations', source: 'ifarmer.asia/ifarmer-center', asOf: METRICS_AS_OF, approved: false,
  },
  experienceCenters: {
    id: 'experienceCenters', value: '6', label: 'Agri-Machinery Experience Centers', kind: 'current',
    owner: 'Agri-input', source: 'ifarmer.asia/experience-centers', asOf: METRICS_AS_OF, approved: false,
  },
  districts: {
    id: 'districts', value: '42', label: 'districts', kind: 'current',
    owner: 'Operations', source: 'ifarmer.asia/about', asOf: METRICS_AS_OF, approved: false,
  },
  riskCovered: {
    id: 'riskCovered', value: 'BDT 596M', label: 'risk covered for 14,000+ farmers through partners', kind: 'cumulative',
    owner: 'Advisory & insurance', source: 'ifarmer.asia/agri-advisory', asOf: METRICS_AS_OF, approved: false,
  },
  // Impact page figures (published separately, no reporting period given)
  impactFinanced: {
    id: 'impactFinanced', value: '86,231', label: 'smallholder farmers accessed affordable financing', kind: 'cumulative',
    owner: 'Impact', source: 'ifarmer.asia/impact', asOf: METRICS_AS_OF, approved: false,
  },
  impactSold: {
    id: 'impactSold', value: '49,719', label: 'smallholder farmers sold produce through iFarmer procurement centers', kind: 'cumulative',
    owner: 'Impact', source: 'ifarmer.asia/impact', asOf: METRICS_AS_OF, approved: false,
  },
  impactWomen: {
    id: 'impactWomen', value: '106,972', label: 'women farmers accessed finance, market access and other services', kind: 'cumulative',
    owner: 'Impact', source: 'ifarmer.asia/impact', asOf: METRICS_AS_OF, approved: false,
  },
  impactRetailers: {
    id: 'impactRetailers', value: '23,063', label: 'agri-input retailers received certified products and better income opportunities', kind: 'cumulative',
    owner: 'Impact', source: 'ifarmer.asia/impact', asOf: METRICS_AS_OF, approved: false,
  },
} satisfies Record<string, Metric>;

export type MetricId = keyof typeof metrics;

export const headlineMetrics: MetricId[] = [
  'registeredFarmers',
  'financeFacilitated',
  'financedFarmers',
  'registeredRetailers',
  'produceSold',
];
