// Copy and statuses from "iFarmer – AI & Data Website Update Guide" (24 Nov 2026), sections 2–8.
// Golden rule: no metric, demo, screenshot or case study appears until it is approved.
import type { Status } from './offerings';

export const aiHero = {
  title: 'Building the intelligence layer for agriculture',
  body: 'iFarmer turns farmer conversations, farm data, satellite imagery and transaction history into better decisions on finance, farming advice, inputs and markets. Our AI works alongside our agronomists, credit teams and field staff, so every farmer gets help that fits their land, their crop and their situation.',
};

export const aiFlow = [
  { id: 'data', title: 'Data', body: 'Farmer profiles and KYC, voice conversations, transactions and repayment, farm polygons, soil sensors, satellite and weather.' },
  { id: 'intelligence', title: 'Intelligence', body: 'Credit-risk models, Bangla speech and language models, geospatial models, forecasting and recommendations.' },
  { id: 'engagement', title: 'Engagement', body: 'Bangla Voice AI, Folon-AI, the Folon and Sofol apps, field teams and retailers.' },
  { id: 'action', title: 'Action', body: 'Credit assessment, advisory, input recommendations, crop alerts and procurement planning.' },
  { id: 'impact', title: 'Impact', body: 'Farmers get finance, better advice, the right inputs and buyers. iFarmer cuts risk and cost.' },
];

export const aiFlowIntro =
  'Every service we offer creates data: a conversation, a loan, a soil test, a harvest. We connect that data, use it to understand each farmer and field, and put the insight back into the hands of farmers and the teams that serve them.';

export const voiceAI = {
  title: 'One conversation. Five ways to serve a farmer.',
  body: 'Many farmers find it easier to talk than to type. Our Bangla Voice AI speaks with farmers in their own language and is already part of our daily operations. A single conversation can build a farmer’s profile, add information to their credit assessment, answer a farming question, recommend the right inputs and learn what they plan to sell at harvest.',
  outcomes: [
    { id: 'profile', title: 'Farmer profile', body: 'Household, land, crops and contact details captured as structured data.' },
    { id: 'credit', title: 'Credit inputs', body: 'Information the farmer shares is added to KYC, transaction and repayment data. Voice AI collects information that supports our credit assessment; people make the credit decision.' },
    { id: 'advisory', title: 'Advisory', body: 'Bangla answers to farming questions, with handover to experts.' },
    { id: 'inputs', title: 'Input sales', body: 'Crop-stage needs become a product recommendation and an order follow-up.' },
    { id: 'procurement', title: 'Procurement', body: 'Crop, expected volume, quality, location and intent to sell.' },
  ],
};

export const folonAI = {
  title: 'Expert farming advice, any time, in Bangla.',
  body: 'Folon-AI is iFarmer’s AI-powered advisory assistant in the Folon app. Farmers can type, speak or send a photo. It answers questions about crops, pests, fertilizer and farm practices using iFarmer’s agricultural knowledge base, and hands complex cases to our agronomists.',
  modes: [
    { id: 'text', title: 'Text', body: 'Type a question in Bangla.' },
    { id: 'voice', title: 'Voice', body: 'Speak the question, for farmers who prefer not to type.' },
    { id: 'image', title: 'Photo', body: 'Send a photo of a crop, pest or disease.' },
  ],
  steps: [
    { title: 'Ask', body: 'The farmer asks in Bangla by text, voice or photo.' },
    { title: 'Understand', body: 'Folon-AI identifies the crop, the problem and the season.' },
    { title: 'Look it up', body: 'It searches iFarmer’s agronomist-reviewed knowledge base.' },
    { title: 'Answer', body: 'Clear, practical advice in Bangla.' },
    { title: 'Hand over', body: 'Complex cases go to an agronomist or the field team.' },
  ],
};

export const capabilities: { id: string; title: string; problem: string; status: Status }[] = [
  { id: 'voice-ai', title: 'Bangla Voice AI', problem: 'Reaching and understanding farmers at scale, in their own language.', status: 'LIVE' },
  { id: 'folon-ai', title: 'Folon-AI', problem: 'Fast, reliable farming advice at any time, by text, voice or photo.', status: 'LIVE' },
  { id: 'credit', title: 'Farmer & credit intelligence', problem: 'Assessing farmers who have little or no formal credit history.', status: 'LIVE' },
  { id: 'satellite', title: 'Satellite & geospatial', problem: 'Seeing crop health across thousands of fields without visiting each one.', status: 'PILOT' },
  { id: 'soil', title: 'Soil intelligence', problem: 'Fertilizer guesswork that wastes money and harms soil.', status: 'LIVE' },
  { id: 'livestock', title: 'Livestock (Cowdy)', problem: 'Missed heat cycles and late disease detection in dairy cattle.', status: 'PILOT' },
  { id: 'supply-chain', title: 'Supply-chain forecasting', problem: 'Buyers cannot see supply until harvest.', status: 'IN DEVELOPMENT' },
  { id: 'field-data', title: 'Field data (Sofol)', problem: 'Turning field visits into reliable digital records.', status: 'LIVE' },
];

export const profileInputs = [
  'KYC and identity (Sofol e-KYC)',
  'Transactions and repayment history',
  'Information farmers share through Voice AI',
  'Farm boundaries and crops',
  'Satellite and weather signals',
  'Field verification',
];

export const responsibleAI = {
  title: 'AI that supports people, not replaces them.',
  body: 'We collect farmer information with consent and use it only to provide our services. Credit decisions are made by people, with our models providing input. Agronomists review advisory content, and we monitor our models for accuracy and fairness across regions, crops and farmer groups.',
  pillars: [
    { title: 'Consent', body: 'Farmer information is collected with consent and used only to provide our services.' },
    { title: 'Human oversight', body: 'People make credit decisions; agronomists review advice.' },
    // Body left empty until the data team supplies the approved security summary.
    { title: 'Data security', body: '' },
    { title: 'Model monitoring', body: 'Accuracy and fairness are checked across regions, crops and farmer groups.' },
  ],
};

export const workWithUs = [
  { title: 'Lenders and agribusinesses', body: 'Reach farmers you could not assess before.', cta: 'Talk to our team', href: '/contact/?topic=partner' },
  { title: 'Researchers and tech partners', body: 'Solve real problems with real agricultural data.', cta: 'Email us', href: 'mailto:hello@ifarmer.asia?subject=Research%20partnership' },
  { title: 'Data scientists and engineers', body: 'Build AI that changes the lives of millions of farmers.', cta: 'See open roles', href: '/careers/' },
];
