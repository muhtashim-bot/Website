/*
 * Parts for the flow version of the homepage opener: isometric drawing helpers, the eight service
 * stations (their models, positions on the village map, and what the phone shows for each), the
 * ring of services that turns around the farmer, and the farmer himself.
 */
import type { CSSProperties, ReactNode } from 'react';
import { metrics } from '@/content/metrics';

/* ---------- isometric geometry ---------- */

export const C = 0.8660254; // cos 30°
export const r1 = (n: number) => Math.round(n * 10) / 10;
export type P2 = [number, number];
/** plane (x, y) and height z to screen */
export const iso = (x: number, y: number, z = 0): P2 => [r1((x - y) * C), r1((x + y) * 0.5 - z)];
export const poly = (ps: [number, number, number][]) => ps.map(([x, y, z]) => iso(x, y, z).join(',')).join(' ');
/** draw plane shapes (rect, circle, path in plane x/y) lying flat at height z */
export const flat = (z: number) => `matrix(${C} 0.5 ${-C} 0.5 0 ${r1(-z)})`;
/** draw on a front-left face (facing +y): u runs along +x, v up */
export const faceL = ([X, Y]: P2) => `matrix(${C} 0.5 0 -1 ${X} ${Y})`;
/** draw on a front-right face (facing +x): u runs along -y (left to right on screen), v up */
export const faceR = ([X, Y]: P2) => `matrix(${C} -0.5 0 -1 ${X} ${Y})`;

export const H = 34; // half-size of a station platform
export const PH = 10; // platform height

export type O = { x: number; y: number; z: number };
export const at = (o: O, x: number, y: number, z: number) => iso(o.x + x, o.y + y, o.z + z);

/* ---------- primitives ---------- */

export function Box({ o, x, y, z, w, d, h, top, left, right }: { o: O; x: number; y: number; z: number; w: number; d: number; h: number; top: string; left: string; right: string }) {
  const X0 = o.x + x;
  const Y0 = o.y + y;
  const Z0 = o.z + z;
  const X1 = X0 + w;
  const Y1 = Y0 + d;
  const Z1 = Z0 + h;
  return (
    <g strokeLinejoin="round" strokeWidth="0.6">
      <polygon points={poly([[X1, Y0, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X1, Y0, Z1]])} fill={right} stroke={right} />
      <polygon points={poly([[X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1]])} fill={left} stroke={left} />
      <polygon points={poly([[X0, Y0, Z1], [X1, Y0, Z1], [X1, Y1, Z1], [X0, Y1, Z1]])} fill={top} stroke={top} />
    </g>
  );
}

export function Cyl({ o, x, y, z, r, h, top, side, rim }: { o: O; x: number; y: number; z: number; r: number; h: number; top: string; side: string; rim?: string }) {
  const [cx, yb] = at(o, x, y, z);
  const yt = r1(yb - h);
  const a = r1(r * 1.2247);
  const b = r1(r * 0.7071);
  return (
    <g>
      <path d={`M ${r1(cx - a)} ${yt} L ${r1(cx - a)} ${yb} A ${a} ${b} 0 0 0 ${r1(cx + a)} ${yb} L ${r1(cx + a)} ${yt} Z`} fill={side} />
      <ellipse cx={cx} cy={yt} rx={a} ry={b} fill={top} stroke={rim} strokeWidth={rim ? 0.8 : 0} />
    </g>
  );
}

/** A rounded slab, extruded by stacking its outline; sides shade from light (left) to dark (right). */
export function Slab({ o, x, y, z, w, d, h, rx, top, side, stroke, style }: { o: O; x: number; y: number; z: number; w: number; d: number; h: number; rx: number; top: string; side: string; stroke?: string; style?: CSSProperties }) {
  const n = Math.max(2, Math.ceil(h / 1.4));
  const rect = { x: r1(o.x + x), y: r1(o.y + y), width: w, height: d, rx };
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} {...rect} transform={flat(o.z + z + (h * i) / n)} fill={side} stroke={side} strokeWidth="0.9" />
      ))}
      <rect {...rect} transform={flat(o.z + z + h)} fill={top} stroke={stroke} strokeWidth={stroke ? 1 : 0} style={style} />
    </g>
  );
}

/** a soft shadow on the ground under a plane footprint */
export const Shadow = ({ cx, cy, s }: { cx: number; cy: number; s: number }) => (
  <rect x={cx - s + 5} y={cy - s + 5} width={s * 2} height={s * 2} rx={s * 0.5} transform={flat(0)} fill="url(#fl-shadow)" />
);

export const spin = (dur: number, begin = 0) => <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />;
export const bob = (dy: number, dur: number, begin = 0) => (
  <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${-dy}; 0 0`} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
);

/* ---------- the stations ---------- */

export type Step = { app: string; screen: string; text: string };
export type Station = {
  id: string;
  label: string;
  via: string;
  detail: string;
  scene: string; // the part of the scroll story it belongs to
  x: number; // plane position
  y: number;
  lane: [number, number]; // where its lane meets the main road
  flow: 'in' | 'out'; // value travels to the farmer, or from the farmer
  token: string;
  tall: number; // height of its model, for placing the label
  steps: Step[];
  explore: { label: string; href: string };
  draw: (o: O) => ReactNode;
};

export const GREEN = '#038F2F';
export const LEAF = '#88BB41';
export const LIME = '#DDFF80';
export const TEAL = '#0B3B45';

export const stations: Station[] = [
  {
    id: 'finance',
    label: 'Crop finance',
    via: 'Folon, iHarvst',
    detail: 'Collateral-free loans, applied for on Folon and backed by funders on iHarvst and partner banks, repaid at harvest.',
    scene: 'finance',
    x: -300,
    y: -80,
    lane: [-300, 0],
    flow: 'in',
    token: '#F2C14E',
    explore: { label: "Explore Access to Finance", href: "/access-to-finance/" },
    steps: [
      { app: "Folon", screen: "folon-apply", text: "The farmer applies in a few taps, or with a field facilitator on Sofol." },
      { app: "iHarvst", screen: "iharvst-fund", text: "Funders and partner banks choose a farm to back." },
      { app: "Folon", screen: "folon-approved", text: "Approved and paid out, with no collateral." },
    ],
    tall: 50,
    draw: (o) => (
      <>
        <Box o={o} x={2} y={-20} z={0} w={22} d={13} h={2.5} top="#A9D86A" left="#7FB33F" right="#6A9A31" />
        <ellipse cx={at(o, 13, -13.5, 2.5)[0]} cy={at(o, 13, -13.5, 2.5)[1]} rx="4" ry="2.3" fill="#7FB33F" />
        {[0, 1, 2, 3].map((k) => (
          <Cyl key={k} o={o} x={-8} y={-2} z={k * 4} r={11} h={3.6} top="#F7D46A" side="url(#fl-coin)" rim="#E2AE36" />
        ))}
        {[0, 1].map((k) => (
          <Cyl key={k} o={o} x={12} y={10} z={k * 4} r={9} h={3.6} top="#F7D46A" side="url(#fl-coin)" rim="#E2AE36" />
        ))}
        <g transform={`translate(${at(o, -8, -2, 34).join(' ')})`}>
          <g>
            {bob(4, 3.2)}
            <ellipse rx="9.5" ry="10" fill="#F7D46A" stroke="#E2AE36" strokeWidth="1.4" />
            <text y="4.2" textAnchor="middle" fontSize="12" fontWeight="800" fill="#B07F12">৳</text>
          </g>
        </g>
      </>
    ),
  },
  {
    id: 'inputs',
    label: 'Inputs & machinery',
    via: 'KriShop, Farmer Card',
    detail: 'Village retailers order quality seed, fertilizer and crop protection on KriShop; farmers pay later with the Farmer Card.',
    scene: 'inputs',
    x: -70,
    y: -250,
    lane: [0, -250],
    flow: 'in',
    token: '#88BB41',
    explore: { label: "Explore Agri Input & Machinery", href: "/agri-input/" },
    steps: [
      { app: "KriShop", screen: "krishop-order", text: "The village retailer orders seed, fertilizer and crop protection on demand." },
      { app: "KriShop", screen: "krishop-delivery", text: "Delivered to the registered shop, close to the farm." },
      { app: "Farmer Card", screen: "farmer-card", text: "The farmer buys now and pays in 30 to 90 days." },
      { app: "Machinery", screen: "machine-catalog", text: "Machines to finance, tried first at an Experience Center." },
    ],
    tall: 42,
    draw: (o) => (
      <>
        <Slab o={o} x={-20} y={-14} z={0} w={17} d={24} h={22} rx={6} top="#F3E8CF" side="url(#fl-sack)" />
        <Slab o={o} x={1} y={-14} z={0} w={17} d={24} h={22} rx={6} top="#F3E8CF" side="url(#fl-sack)" />
        <Slab o={o} x={-10} y={-12} z={22} w={17} d={20} h={16} rx={6} top="#F3E8CF" side="url(#fl-sack)" />
        {[[-11.5, 10, 6], [9.5, 10, 6], [-1.5, 8, 25]].map(([x, y, z], k) => (
          <g key={k} transform={faceL(at(o, x, y, z))}>
            <rect x="-4.5" y="2" width="9" height="9" rx="2.5" fill={GREEN} />
            <path d="M -2 4.5 C -2 8.5 2 9 2.5 9.5 C 2.5 6 0.5 4 -2 4.5 Z" fill={LIME} />
          </g>
        ))}
        <Box o={o} x={20} y={8} z={0} w={10} d={10} h={9} top="#B8DB8A" left="#8FBF55" right="#77A644" />
      </>
    ),
  },
  {
    id: 'advice',
    label: 'Crop advice',
    via: 'Folon-AI',
    detail: 'Folon-AI answers in Bangla by text, voice or photo, and agronomists take the hard cases.',
    scene: 'grow',
    x: 90,
    y: -190,
    lane: [0, -190],
    flow: 'in',
    token: '#B8E655',
    explore: { label: "Explore Advisory & Insurance", href: "/agri-advisory/" },
    steps: [
      { app: "Folon-AI", screen: "folonai-ask", text: "Ask by text, voice or photo, in Bangla." },
      { app: "Bangla Voice AI", screen: "voice-advice", text: "The answer comes back in Bangla; agronomists take the hard cases." },
      { app: "Folon", screen: "folon-advice", text: "Advice for this crop, this week, with weather alerts." },
    ],
    tall: 66,
    draw: (o) => (
      <>
        <Box o={o} x={-2} y={-12} z={0} w={5} d={26} h={46} top="#1E5562" left="#14454F" right={TEAL} />
        <g transform={faceR(at(o, 3, 12, 3))}>
          <rect x="1.5" y="1" width="21" height="38" rx="2.5" fill="#EAF7DD" />
          <rect x="4" y="30" width="13" height="5" rx="2.5" fill={LEAF} />
          <rect x="7" y="22" width="13" height="5" rx="2.5" fill="#FFFFFF" />
          <rect x="4" y="14" width="10" height="5" rx="2.5" fill={LEAF} />
          <rect x="4" y="5" width="16" height="3" rx="1.5" fill="#C6DDB2" />
        </g>
        <g transform={`translate(${at(o, -12, -10, 56).join(' ')})`}>
          <g>
            {bob(3, 3.6, 0.6)}
            <path d="M -19 -11 h 38 a 6 6 0 0 1 6 6 v 9 a 6 6 0 0 1 -6 6 h -26 l -7 6 v -6 h -5 a 6 6 0 0 1 -6 -6 v -9 a 6 6 0 0 1 6 -6 z" fill="#FFFFFF" stroke="#D7E3D2" strokeWidth="1" />
            {[-8, 0, 8].map((dx, k) => (
              <circle key={k} cx={dx} cy="-0.5" r="2.4" fill={GREEN}>
                <animate attributeName="opacity" values="0.25;1;0.25" dur="1.2s" begin={`${k * 0.2}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        </g>
      </>
    ),
  },
  {
    id: 'insurance',
    label: 'Insurance & climate',
    via: 'Sensors, insurers',
    detail: 'Soil sensors and satellite monitoring protect the crop, and insurance covers crop, cattle and family.',
    scene: 'grow',
    x: 230,
    y: -70,
    lane: [230, 0],
    flow: 'in',
    token: '#7CC6E8',
    explore: { label: "Explore Advisory & Insurance", href: "/agri-advisory/" },
    steps: [
      { app: "Folon", screen: "folon-advice", text: "Weather alerts and field data warn the farmer early." },
      { app: "Sofol", screen: "sofol-visits", text: "Field staff visit and record how the crop is doing." },
      { app: "Sofol", screen: "sofol-profile", text: "Insurance for crop, cattle and family, arranged with partner insurers." },
    ],
    tall: 68,
    draw: (o) => (
      <>
        <Cyl o={o} x={6} y={-6} z={0} r={2.2} h={44} top="#E6EEE3" side="url(#fl-pole)" />
        <Box o={o} x={1} y={-11} z={44} w={10} d={10} h={7} top="#FFFFFF" left="#E9F0E6" right="#CFDBCB" />
        <circle cx={at(o, 11, -6, 48)[0] + 1} cy={at(o, 11, -6, 48)[1]} r="1.6" fill={LEAF}>
          <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <Box o={o} x={-12} y={2} z={0} w={8} d={8} h={5} top="#E6EEE3" left="#D6E1D2" right="#BFCDBB" />
        <Cyl o={o} x={-8} y={6} z={5} r={1.2} h={9} top="#9FB0A0" side="#9FB0A0" />
        <g transform={`translate(${at(o, -14, -14, 52).join(' ')})`}>
          <g>
            {bob(2.5, 4.2, 1)}
            <path d="M -16 4 a 7 7 0 0 1 2 -13.5 a 10 10 0 0 1 18.5 -3 a 8 8 0 0 1 11 9 a 6 6 0 0 1 -2 11.5 h -26 a 6 6 0 0 1 -3.5 -4 z" fill="#FFFFFF" stroke="#D7E3D2" strokeWidth="1" />
            {[-8, 0, 8].map((dx, k) => (
              <path key={k} d={`M ${dx} 11 l -1.6 4.5`} stroke="#6FB3D9" strokeWidth="2" strokeLinecap="round">
                <animateTransform attributeName="transform" type="translate" values="0 0; -2 10" dur="1.1s" begin={`${k * 0.35}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0" dur="1.1s" begin={`${k * 0.35}s`} repeatCount="indefinite" />
              </path>
            ))}
          </g>
        </g>
        <g transform={`translate(${at(o, 16, 18, 0).join(' ')})`}>
          <path d="M 0 -26 l 11 4 v 8 c 0 8 -5 12 -11 15 c -6 -3 -11 -7 -11 -15 v -8 z" fill={GREEN} />
          <path d="M -4.5 -12.5 l 3.2 3.2 l 6 -6.5" fill="none" stroke={LIME} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </>
    ),
  },
  {
    id: 'market',
    label: 'Market & export',
    via: 'Supplier Connect',
    detail: 'Traders share crop availability and prices on Supplier Connect; we match them with institutional and export buyers.',
    scene: 'market',
    x: 300,
    y: 100,
    lane: [300, 0],
    flow: 'out',
    token: '#E9792F',
    explore: { label: "Explore Market Linkage", href: "/forward-market-linkage/" },
    steps: [
      { app: "Supplier Connect", screen: "supplier-share", text: "Traders share what is ready to sell, with prices and dates." },
      { app: "Supplier Connect", screen: "supplier-orders", text: "Institutional and export buyers place orders with clear standards." },
      { app: "Supplier Connect", screen: "supplier-dispatch", text: "Quality checked at every hand-off, then dispatched." },
    ],
    tall: 36,
    draw: (o) => (
      <>
        <Box o={o} x={-24} y={-10} z={3} w={30} d={20} h={22} top="#FFFFFF" left="#EEF3EA" right="#D3DECF" />
        <g transform={faceL(at(o, -24, 10, 3))}>
          <rect x="3" y="9" width="24" height="5" rx="1.5" fill={LEAF} />
          <path d="M 4 17 h 22" stroke={GREEN} strokeWidth="1.2" />
        </g>
        <Box o={o} x={6} y={-9} z={3} w={14} d={18} h={16} top="#4FB25F" left="#2E9A3E" right="#1F7F31" />
        <g transform={faceR(at(o, 20, 9, 3))}>
          <rect x="3" y="7" width="12" height="7" rx="1.5" fill="#BFE7F2" opacity="0.9" />
        </g>
        {[-15, 12].map((x) => (
          <g key={x} transform={faceL(at(o, x, 10.5, 0))}>
            <circle cx="0" cy="4.5" r="4.6" fill="#22313A" />
            <circle cx="0" cy="4.5" r="1.8" fill="#9AA7AE" />
          </g>
        ))}
        <Box o={o} x={-30} y={14} z={0} w={9} d={9} h={8} top="#C9E59E" left="#9FCB63" right="#86B24E" />
        <Box o={o} x={-30} y={14} z={8} w={9} d={9} h={7} top="#F7D46A" left="#EDC04D" right="#D3A538" />
      </>
    ),
  },
  {
    id: 'center',
    label: 'iFarmer Center',
    via: `${metrics.centers.value} centers`,
    detail: 'One door in the village: farmers walk in to apply for a loan, buy inputs, get advice and sell their harvest.',
    scene: 'center',
    x: 70,
    y: 250,
    lane: [0, 250],
    flow: 'in',
    token: '#88BB41',
    explore: { label: "About iFarmer Centers", href: "/ifarmer-center/" },
    steps: [
      { app: "Sofol", screen: "sofol-register", text: "Field staff register farmers with e-KYC." },
      { app: "Sofol", screen: "sofol-profile", text: "One profile holds every service the farmer uses." },
      { app: "KriShop", screen: "krishop-credit", text: "Inputs on credit, right at the counter." },
    ],
    tall: 52,
    draw: (o) => (
      <>
        <Box o={o} x={-20} y={-16} z={0} w={34} d={30} h={24} top="#FFF8E8" left="#FFF3DA" right="#E8DCC0" />
        <Box o={o} x={-23} y={-19} z={24} w={40} d={36} h={4} top="#4FB25F" left="#2E9A3E" right="#1F7F31" />
        <g transform={faceL(at(o, -20, 14, 0))}>
          <rect x="13" y="0" width="9" height="14" rx="1" fill={TEAL} />
          <rect x="3" y="6" width="7" height="7" rx="1" fill="#BFE7F2" />
          <rect x="25" y="6" width="7" height="7" rx="1" fill="#BFE7F2" />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <rect key={k} x={k * 5} y="16" width="5" height="5" fill={k % 2 ? '#FFFFFF' : LEAF} />
          ))}
        </g>
        <g transform={`translate(${at(o, -3, -1, 30).join(' ')})`}>
          <rect x="-13" y="-15" width="26" height="15" rx="4" fill="#FFFFFF" stroke="#D7E3D2" />
          <path d="M -4 -4 C -4 -11 2 -12 5 -12 C 5 -6 1 -4 -4 -4 Z" fill={GREEN} />
          <path d="M -4 -4 l 4 -4" stroke={LIME} strokeWidth="1" />
        </g>
      </>
    ),
  },
  {
    id: 'paid',
    label: 'Paid at harvest',
    via: 'Loan settled',
    detail: 'Sale proceeds reach the farmer, the loan is settled from the harvest and funders are repaid.',
    scene: 'paid',
    x: -60,
    y: 210,
    lane: [0, 210],
    flow: 'in',
    token: '#F2C14E',
    explore: { label: "Explore iHarvst", href: "/product-iharvst/" },
    steps: [
      { app: "Folon", screen: "folon-paid", text: "The sale is paid and the loan is settled from the harvest." },
      { app: "iHarvst", screen: "iharvst-returns", text: "Funders receive their share." },
      { app: "iHarvst", screen: "iharvst-updates", text: "Funders follow the season from start to finish." },
    ],
    tall: 48,
    draw: (o) => (
      <>
        <Box o={o} x={-14} y={-12} z={0} w={26} d={22} h={13} top="#E7C892" left="#D9B77E" right="#BF9B62" />
        {[3.5, 8].map((v) => (
          <path key={v} d={`M 1 ${v} h 24`} transform={faceL(at(o, -14, 10, 0))} stroke="#B48D55" strokeWidth="0.9" />
        ))}
        {[
          [-8, -6, '#F2A93B'],
          [0, -8, '#88BB41'],
          [6, -2, '#F2A93B'],
          [-4, 2, '#A3D45B'],
          [4, 5, '#E9792F'],
          [-9, 4, '#88BB41'],
        ].map(([x, y, c], k) => {
          const [cx, cy] = at(o, x as number, y as number, 17);
          return <circle key={k} cx={cx} cy={cy} r="5" fill={c as string} stroke="#00000014" />;
        })}
        <g transform={`translate(${at(o, 0, 0, 26).join(' ')})`}>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 6; 0 -22" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.7;1" dur="2.6s" repeatCount="indefinite" />
            <ellipse rx="8.5" ry="9" fill="#F7D46A" stroke="#E2AE36" strokeWidth="1.3" />
            <text y="3.8" textAnchor="middle" fontSize="11" fontWeight="800" fill="#B07F12">৳</text>
          </g>
        </g>
      </>
    ),
  },
  {
    id: 'next',
    label: 'Next season',
    via: 'Stronger record',
    detail: 'Every repaid season strengthens the farmer’s record, and the next season begins.',
    scene: 'outro',
    x: -230,
    y: 60,
    lane: [-230, 0],
    flow: 'out',
    token: '#B8E655',
    explore: { label: "See our impact", href: "/impact/" },
    steps: [
      { app: "Sofol", screen: "sofol-profile", text: "Every repaid season strengthens the farmer's record." },
      { app: "Bangla Voice AI", screen: "voice-credit", text: "What the farmer shares adds to the next credit assessment; the credit team decides." },
      { app: "iFarmer apps", screen: "launcher", text: "One platform for the whole season. Then the next one begins." },
    ],
    tall: 26,
    draw: (o) => (
      <>
        <Slab o={o} x={-26} y={-26} z={0} w={52} d={52} h={6} rx={6} top="#9C7A55" side="url(#fl-soil)" />
        {[-14, 0, 14].map((x) =>
          [-14, 0, 14].map((y, j) => {
            const [sx, sy] = at(o, x, y, 6);
            return (
              <g key={`${x}${y}`} transform={`translate(${sx} ${sy})`}>
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="3.4s" begin={`${-((x + 14) / 14 + j) * 0.5}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
                  <path d="M 0 0 V -9" stroke="#4E8F2A" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M 0 -6 C -7 -6 -8 -12 -8 -13 C -3 -13 0 -10 0 -6 Z" fill="#88BB41" />
                  <path d="M 0 -8 C 6 -8 8 -14 8 -15 C 3 -15 0 -12 0 -8 Z" fill="#A9D86A" />
                </g>
              </g>
            );
          }),
        )}
      </>
    ),
  },
];

/* ---------- the hub ---------- */

export const RING = [
  { c: GREEN, s: '#02701F', h: 4 },
  { c: LEAF, s: '#6A9A31', h: 6 },
  { c: GREEN, s: '#02701F', h: 3 },
  { c: LIME, s: '#B7DB5C', h: 5 },
  { c: GREEN, s: '#02701F', h: 6 },
  { c: LEAF, s: '#6A9A31', h: 3 },
  { c: GREEN, s: '#02701F', h: 5 },
  { c: LIME, s: '#B7DB5C', h: 4 },
];
export const sector = (i: number, r0: number, rA: number) => {
  const g = 0.09;
  const a0 = (i / RING.length) * Math.PI * 2 + g;
  const a1 = ((i + 1) / RING.length) * Math.PI * 2 - g;
  const p = (r: number, a: number) => `${r1(r * Math.cos(a))} ${r1(r * Math.sin(a))}`;
  return `M ${p(rA, a0)} A ${rA} ${rA} 0 0 1 ${p(rA, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
};


/* ---------- the farmer ---------- */

const SKIN = '#8B5A3C';
const SKIN_DARK = '#6F452C';
const HAIR = '#1B1410';

/**
 * A Bangladeshi farmer, standing at (0, 0) with his feet there: mathal (palm-leaf hat), gamchha
 * over the shoulder, fatua and a checked lungi; a sheaf of paddy in one hand and his phone in the
 * other.
 */
export function Farmer() {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="17" ry="5" fill="rgba(2,43,54,0.2)" />
      <defs>
        <clipPath id="fl-lungi">
          <path d="M -12 -38 H 12 L 13.5 -8 Q 0 -6 -13.5 -8 Z" />
        </clipPath>
      </defs>
      {/* legs and bare feet */}
      <path d="M -5.5 -10 L -6.2 -2 M 5 -10 L 5.6 -2" stroke={SKIN} strokeWidth="4.4" strokeLinecap="round" />
      <ellipse cx="-7.4" cy="-0.9" rx="4.2" ry="1.9" fill={SKIN_DARK} />
      <ellipse cx="6.9" cy="-0.9" rx="4.2" ry="1.9" fill={SKIN_DARK} />
      {/* paddy sheaf, held low in his right hand */}
      <g stroke="#C9952E" strokeWidth="1.1" strokeLinecap="round">
        {[-31, -28, -25, -22, -19.5].map((tx, k) => (
          <path key={k} d={`M -17 -27 Q ${tx + 3} -48 ${tx} ${-66 + (k % 2) * 4}`} fill="none" />
        ))}
      </g>
      {[-31, -28, -25, -22, -19.5].map((tx, k) => (
        <g key={k} fill="#E3B54A">
          <ellipse cx={tx} cy={-66 + (k % 2) * 4} rx="1.5" ry="3.4" transform={`rotate(-18 ${tx} ${-66 + (k % 2) * 4})`} />
          <ellipse cx={tx + 0.8} cy={-60 + (k % 2) * 4} rx="1.3" ry="2.6" transform={`rotate(-14 ${tx + 0.8} ${-60 + (k % 2) * 4})`} />
        </g>
      ))}
      <path d="M -21 -36 L -16 -35" stroke="#8C6A2A" strokeWidth="2.4" strokeLinecap="round" />
      {/* lungi, checked */}
      <path d="M -12 -38 H 12 L 13.5 -8 Q 0 -6 -13.5 -8 Z" fill="#1F6B4A" />
      <g clipPath="url(#fl-lungi)" strokeWidth="1">
        {[-9, -4, 1, 6, 11].map((x) => (
          <path key={x} d={`M ${x} -40 V -4`} stroke="#3E8F69" />
        ))}
        {[-31, -24, -17, -10].map((y) => (
          <path key={y} d={`M -15 ${y} H 15`} stroke="#3E8F69" />
        ))}
        {[-6.5, 3.5].map((x) => (
          <path key={x} d={`M ${x} -40 V -4`} stroke="#E8F0E6" strokeWidth="0.5" />
        ))}
      </g>
      <rect x="-12.5" y="-40" width="25" height="3.2" rx="1.4" fill="#17573B" />
      {/* fatua */}
      <path d="M -9 -64 Q 0 -61 9 -64 L 16 -60 L 17.5 -50 L 12.8 -48.6 L 13 -37 Q 0 -35 -13 -37 L -12.8 -48.6 L -17.5 -50 L -16 -60 Z" fill="#F3EEDD" stroke="#DED5BC" strokeWidth="0.8" />
      <path d="M 0 -61 V -42" stroke="#DED5BC" strokeWidth="0.8" />
      {/* right arm, down, holding the sheaf */}
      <path d="M -15.2 -49.5 Q -17.6 -41 -17 -33" stroke={SKIN} strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="-17" cy="-31.5" r="3" fill={SKIN} />
      {/* gamchha over the shoulder */}
      <path d="M -8.5 -63.5 Q 0 -57 8.5 -63.5 L 10.5 -61 Q 0 -53.5 -10.5 -61 Z" fill="#D8493B" />
      <path d="M 6.5 -61.5 L 11.5 -61 L 10.6 -44.5 L 5.6 -45.5 Z" fill="#D8493B" />
      <path d="M 6.2 -57 L 11.2 -56.6 M 6 -52 L 11 -51.6 M 5.8 -48 L 10.8 -47.6" stroke="#FFFFFF" strokeWidth="0.7" />
      <path d="M -6 -60 Q 0 -57 6 -60" stroke="#FFFFFF" strokeWidth="0.6" fill="none" />
      {/* left arm, bent, with his phone */}
      <path d="M 15.4 -49.5 L 16.6 -42 L 9 -44.6" stroke={SKIN} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="3.6" y="-54" width="7.4" height="11.4" rx="1.6" fill="#0E1512" />
      <rect x="4.6" y="-52.8" width="5.4" height="8.4" rx="0.9" fill={LIME}>
        <animate attributeName="opacity" values="0.75;1;0.75" dur="2.4s" repeatCount="indefinite" />
      </rect>
      <circle cx="8.2" cy="-44.2" r="2.7" fill={SKIN} />
      {/* head */}
      <rect x="-3" y="-67.5" width="6" height="5.5" fill={SKIN_DARK} />
      <ellipse cx="-8" cy="-73.5" rx="1.7" ry="2.5" fill={SKIN_DARK} />
      <ellipse cx="8" cy="-73.5" rx="1.7" ry="2.5" fill={SKIN_DARK} />
      <ellipse cx="0" cy="-74" rx="8" ry="9.6" fill={SKIN} />
      <path d="M -8 -75 Q -8.4 -84 0 -84.2 Q 8.4 -84 8 -75 Q 6 -79.2 0 -79.6 Q -6 -79.2 -8 -75 Z" fill={HAIR} />
      <circle cx="-3" cy="-74.6" r="0.95" fill={HAIR} />
      <circle cx="3" cy="-74.6" r="0.95" fill={HAIR} />
      <path d="M -3.8 -70 Q 0 -72 3.8 -70 Q 0 -70.6 -3.8 -70 Z" fill={HAIR} stroke={HAIR} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M -2.2 -67.9 Q 0 -66.6 2.2 -67.9" stroke="#5A3523" strokeWidth="0.75" fill="none" strokeLinecap="round" />
      {/* mathal */}
      <ellipse cx="0" cy="-81.5" rx="24.5" ry="7.2" fill="#DDBB7A" stroke="#B8914F" strokeWidth="0.8" />
      <ellipse cx="0" cy="-81.8" rx="17" ry="4.8" fill="none" stroke="#C9A262" strokeWidth="0.6" />
      <path d="M -11.5 -82.5 Q 0 -95 11.5 -82.5 Q 0 -79.5 -11.5 -82.5 Z" fill="#E7C98C" stroke="#B8914F" strokeWidth="0.8" />
      <path d="M -6 -84.5 Q 0 -91 6 -84.5" fill="none" stroke="#C9A262" strokeWidth="0.6" />
    </g>
  );
}

/* ---------- the village around them ---------- */

/** a simple round tree */
export function Tree({ x, y, s = 1, tint = '#7DB443' }: { x: number; y: number; s?: number; tint?: string }) {
  const [sx, sy] = iso(x, y, 0);
  return (
    <g transform={`translate(${sx} ${sy}) scale(${s})`}>
      <ellipse cx="2" cy="1" rx="11" ry="4.5" fill="rgba(2,43,54,0.14)" />
      <path d="M 0 0 V -14" stroke="#7A5A3A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="-22" r="11" fill={tint} />
      <circle cx="-4" cy="-26" r="6" fill="#FFFFFF" opacity="0.18" />
    </g>
  );
}

/** a coconut palm */
export function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const [sx, sy] = iso(x, y, 0);
  return (
    <g transform={`translate(${sx} ${sy}) scale(${s})`}>
      <ellipse cx="3" cy="1" rx="12" ry="4.5" fill="rgba(2,43,54,0.14)" />
      <path d="M 0 0 Q 2 -16 5 -34" stroke="#8C6A45" strokeWidth="3" fill="none" strokeLinecap="round" />
      {[-150, -110, -70, -30, 10].map((a, k) => (
        <path key={k} d="M 0 0 q 9 -6 17 1 q -8 -2 -17 -1 z" fill={k % 2 ? '#5E9F2A' : '#6FB03A'} transform={`translate(5 -34) rotate(${a})`} />
      ))}
    </g>
  );
}

/** a field on the plane, with crop rows */
export function Field({ x, y, w, d, fill, row }: { x: number; y: number; w: number; d: number; fill: string; row: string }) {
  return (
    <g transform={flat(0.5)}>
      <rect x={x} y={y} width={w} height={d} rx="6" fill={fill} />
      {Array.from({ length: Math.floor(d / 9) }, (_, k) => (
        <path key={k} d={`M ${x + 5} ${y + 6 + k * 9} H ${x + w - 5}`} stroke={row} strokeWidth="2.2" strokeLinecap="round" />
      ))}
    </g>
  );
}
