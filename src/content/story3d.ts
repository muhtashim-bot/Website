/*
 * The homepage 3D story: one beat per scroll step. Each beat belongs to a service (a scene in
 * journey.ts, which holds the service titles, copy and apps), shows one phone screen on the left,
 * and pins one label in the 3D world. Camera moves and world events for each beat live in
 * src/three/delta.ts under the same ids.
 */
export type Beat = {
  id: string;
  scene: string; // id of a scene in journey.ts
  screen: string; // PhoneScreens key
  app: string;
  does: string;
  label?: string; // pinned in the 3D world
};

export const beats: Beat[] = [
  { id: 'intro', scene: 'intro', screen: 'launcher', app: 'iFarmer apps', does: 'Every service in a few apps' },
  { id: 'apply', scene: 'finance', screen: 'folon-apply', app: 'Folon', does: 'Apply for crop finance in a few taps', label: 'A farmer applies on Folon' },
  { id: 'fund', scene: 'finance', screen: 'iharvst-fund', app: 'iHarvst', does: 'Funders choose a farm to back', label: 'iHarvst funders and partner banks' },
  { id: 'receive', scene: 'finance', screen: 'folon-approved', app: 'Folon', does: 'Approved and paid out, no collateral', label: 'The loan reaches the farmer' },
  { id: 'buy', scene: 'inputs', screen: 'krishop-order', app: 'KriShop', does: 'The retailer orders inputs on demand', label: 'A KriShop partner shop' },
  { id: 'card', scene: 'inputs', screen: 'farmer-card', app: 'Farmer Card', does: 'Buy now, pay in 30 to 90 days', label: 'Inputs delivered to the village' },
  { id: 'grow', scene: 'grow', screen: 'folonai-ask', app: 'Folon-AI', does: 'Ask by text, voice or photo, in Bangla', label: 'Agronomist and Folon-AI in the field' },
  { id: 'grow2', scene: 'grow', screen: 'folon-advice', app: 'Folon', does: 'Advice for this crop, this week', label: 'Sensors and satellites watch the crop' },
  { id: 'harvest', scene: 'market', screen: 'supplier-share', app: 'Supplier Connect', does: 'Traders share what is ready to sell', label: 'Harvest time' },
  { id: 'collect', scene: 'market', screen: 'supplier-orders', app: 'Supplier Connect', does: 'Buyer orders, standards and payment dates', label: 'iFarmer collection point' },
  { id: 'dispatch', scene: 'market', screen: 'supplier-dispatch', app: 'Supplier Connect', does: 'Quality checked and dispatched', label: 'On the way to buyers' },
  { id: 'center', scene: 'center', screen: 'sofol-register', app: 'Sofol', does: 'Field staff register farmers with e-KYC', label: 'iFarmer Center' },
  { id: 'paid', scene: 'paid', screen: 'folon-paid', app: 'Folon', does: 'Sale paid, loan settled', label: 'The farmer is paid' },
  { id: 'returns', scene: 'paid', screen: 'iharvst-returns', app: 'iHarvst', does: 'Funders receive their share', label: 'Funders repaid' },
  { id: 'outro', scene: 'outro', screen: 'launcher', app: 'iFarmer apps', does: 'One platform for the whole season' },
];
