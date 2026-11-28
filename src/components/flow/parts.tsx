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
    x: -235,
    y: -86,
    flow: 'in',
    token: '#F2C14E',
    explore: { label: "Explore Access to Finance", href: "/access-to-finance/" },
    steps: [
      { app: "Folon", screen: "folon-apply", text: "The farmer applies in a few taps, or with a field facilitator on Sofol." },
      { app: "iHarvst", screen: "iharvst-fund", text: "Funders and partner banks choose a farm to back." },
      { app: "Folon", screen: "folon-approved", text: "Approved and paid out, with no collateral." },
    ],
    tall: 58,
    draw: (o) => (
      <>
        <Box o={o} x={-26} y={-20} z={0} w={52} d={42} h={4} top="#F4F2EA" left="#E6E1D3" right="#CFC8B7" />
        <Box o={o} x={-21} y={-16} z={4} w={42} d={30} h={21} top="#FFFDF5" left="#F6F1E4" right="#E0D7C2" />
        <g transform={faceL(at(o, -21, 14, 4))}>
          <rect x="17" y="0" width="8" height="13" rx="1" fill={TEAL} />
          <rect x="3" y="7" width="6" height="8" rx="1" fill="#BFE7F2" />
          <rect x="33" y="7" width="6" height="8" rx="1" fill="#BFE7F2" />
        </g>
        {[-16, -6, 4, 14].map((x) => (
          <Cyl key={x} o={o} x={x} y={18} z={4} r={2.3} h={21} top="#FFFFFF" side="url(#fl-pole)" />
        ))}
        <Box o={o} x={-24} y={-19} z={25} w={48} d={40} h={4} top="#4FB25F" left="#2E9A3E" right="#1F7F31" />
        <polygon points={poly([[o.x, o.y - 19, o.z + 41], [o.x, o.y + 21, o.z + 41], [o.x + 24, o.y + 21, o.z + 29], [o.x + 24, o.y - 19, o.z + 29]])} fill="#1F7F31" />
        <polygon points={poly([[o.x - 24, o.y + 21, o.z + 29], [o.x + 24, o.y + 21, o.z + 29], [o.x, o.y + 21, o.z + 41]])} fill="#FFF8E8" stroke="#2E9A3E" strokeWidth="1" strokeLinejoin="round" />
        <g transform={`translate(${at(o, 0, 21, 33.5).join(' ')})`}>
          <circle r="4.6" fill="#F7D46A" stroke="#E2AE36" strokeWidth="1" />
          <text y="2.6" textAnchor="middle" fontSize="7" fontWeight="800" fill="#B07F12">৳</text>
        </g>
        <g transform={`translate(${at(o, 14, -8, 56).join(' ')})`}>
          <g>
            {bob(4, 3.2)}
            <ellipse rx="8.5" ry="9" fill="#F7D46A" stroke="#E2AE36" strokeWidth="1.3" />
            <text y="3.8" textAnchor="middle" fontSize="11" fontWeight="800" fill="#B07F12">৳</text>
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
    x: -109,
    y: -269,
    flow: 'in',
    token: '#88BB41',
    explore: { label: "Explore Agri Input & Machinery", href: "/agri-input/" },
    steps: [
      { app: "KriShop", screen: "krishop-order", text: "The village retailer orders seed, fertilizer and crop protection on demand." },
      { app: "KriShop", screen: "krishop-delivery", text: "Delivered to the registered shop, close to the farm." },
      { app: "Farmer Card", screen: "farmer-card", text: "The farmer buys now and pays in 30 to 90 days." },
      { app: "Machinery", screen: "machine-catalog", text: "Machines to finance, tried first at an Experience Center." },
    ],
    tall: 40,
    draw: (o) => (
      <>
        {/* the warehouse */}
        <Box o={o} x={-31} y={-25} z={0} w={33} d={35} h={20} top="#F1F4EE" left="#E4EAE0" right="#C8D2C2" />
        <polygon points={poly([[o.x + 2, o.y - 25, o.z + 20], [o.x + 2, o.y + 10, o.z + 20], [o.x + 2, o.y - 7.5, o.z + 31]])} fill="#DCE3D7" />
        <g transform={faceL(at(o, -31, 10, 0))}>
          <rect x="9" y="0" width="16" height="15" fill="#9AA79B" />
          {[2.5, 5, 7.5, 10, 12.5].map((v) => (
            <path key={v} d={`M 9 ${v} h 16`} stroke="#7F8C80" strokeWidth="0.8" />
          ))}
        </g>
        <polygon points={poly([[o.x - 32, o.y + 11, o.z + 20], [o.x + 3, o.y + 11, o.z + 20], [o.x + 3, o.y - 7.5, o.z + 31], [o.x - 32, o.y - 7.5, o.z + 31]])} fill="#6FA02C" />
        {[-28, -23, -18, -13, -8, -3, 2].map((x) => (
          <polyline key={x} points={poly([[o.x + x, o.y + 11, o.z + 20], [o.x + x, o.y - 7.5, o.z + 31]])} fill="none" stroke="#5E852B" strokeWidth="0.9" />
        ))}
        <Slab o={o} x={-10} y={13} z={0} w={8} d={9} h={9} rx={3} top="#F3E8CF" side="url(#fl-sack)" />
        {/* the village store (KriShop) */}
        <Box o={o} x={7} y={4} z={0} w={20} d={18} h={14} top="#FFF8E8" left="#FFF3DA" right="#E8DCC0" />
        <g transform={faceL(at(o, 7, 22, 0))}>
          <rect x="7" y="0" width="6" height="9" rx="0.8" fill={TEAL} />
          <rect x="1.5" y="4" width="4.5" height="5" rx="0.8" fill="#BFE7F2" />
          <rect x="14" y="4" width="4.5" height="5" rx="0.8" fill="#BFE7F2" />
          {[0, 1, 2, 3, 4].map((k) => (
            <rect key={k} x={k * 4} y="10.5" width="4" height="3.5" fill={k % 2 ? '#FFFFFF' : LIME} />
          ))}
        </g>
        <Box o={o} x={6} y={3} z={14} w={22} d={20} h={2.5} top="#4FB25F" left="#2E9A3E" right="#1F7F31" />
        <g transform={`translate(${at(o, 17, 13, 17).join(' ')})`}>
          <rect x="-9" y="-10" width="18" height="10" rx="3" fill="#FFFFFF" stroke="#D7E3D2" />
          <path d="M -3 -2.5 C -3 -7.5 1.5 -8.2 3.5 -8.2 C 3.5 -4 0.8 -2.5 -3 -2.5 Z" fill={GREEN} />
        </g>
      </>
    ),
  },
  {
    id: 'advice',
    label: 'Crop advice',
    via: 'Folon-AI',
    detail: 'Folon-AI answers in Bangla by text, voice or photo, and agronomists take the hard cases.',
    scene: 'grow',
    x: 71,
    y: -176,
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
    x: 245,
    y: -114,
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
    x: 260,
    y: 105,
    flow: 'out',
    token: '#E9792F',
    explore: { label: "Explore Market Linkage", href: "/forward-market-linkage/" },
    steps: [
      { app: "Supplier Connect", screen: "supplier-share", text: "Traders share what is ready to sell, with prices and dates." },
      { app: "Supplier Connect", screen: "supplier-orders", text: "Institutional and export buyers place orders with clear standards." },
      { app: "Supplier Connect", screen: "supplier-dispatch", text: "Quality checked at every hand-off, then dispatched." },
    ],
    tall: 32,
    draw: (o) => {
      const stall = (x: number, y: number, a: string, b: string, goods: string[]) => (
        <g>
          <Box o={o} x={x} y={y} z={0} w={16} d={11} h={7} top="#E2C08A" left="#D3AE73" right="#B89257" />
          {goods.map((c, k) => {
            const [cx, cy] = at(o, x + 3.5 + k * 4.5, y + 4 + (k % 2) * 3, 8.5);
            return <circle key={k} cx={cx} cy={cy} r="2.4" fill={c} stroke="#00000018" strokeWidth="0.5" />;
          })}
          <polyline points={poly([[o.x + x, o.y + y + 11, o.z + 7], [o.x + x, o.y + y + 11, o.z + 20]])} stroke="#8C6A45" strokeWidth="1.1" fill="none" />
          <polyline points={poly([[o.x + x + 16, o.y + y + 11, o.z + 7], [o.x + x + 16, o.y + y + 11, o.z + 20]])} stroke="#8C6A45" strokeWidth="1.1" fill="none" />
          {[0, 1, 2, 3].map((k) => (
            <polygon
              key={k}
              points={poly([[o.x + x - 1 + k * 4.5, o.y + y - 1, o.z + 24], [o.x + x + 3.5 + k * 4.5, o.y + y - 1, o.z + 24], [o.x + x + 3.5 + k * 4.5, o.y + y + 13, o.z + 20], [o.x + x - 1 + k * 4.5, o.y + y + 13, o.z + 20]])}
              fill={k % 2 ? b : a}
            />
          ))}
        </g>
      );
      return (
        <>
          {stall(-30, -22, '#F2A93B', '#FFF4DC', ['#E9792F', '#88BB41', '#E9792F'])}
          {stall(-8, -28, '#4FB25F', '#F3FBE6', ['#A3D45B', '#F2C14E', '#88BB41'])}
          {stall(6, -4, '#E85D4A', '#FFEFE8', ['#F2A93B', '#6FAE2E', '#E9792F'])}
          <Box o={o} x={-22} y={12} z={0} w={9} d={9} h={8} top="#C9E59E" left="#9FCB63" right="#86B24E" />
          <Box o={o} x={-22} y={12} z={8} w={9} d={9} h={7} top="#F7D46A" left="#EDC04D" right="#D3A538" />
          <Box o={o} x={-11} y={16} z={0} w={9} d={9} h={8} top="#F2B47A" left="#E39A5A" right="#C9803F" />
        </>
      );
    },
  },
  {
    id: 'center',
    label: 'iFarmer Center',
    via: `${metrics.centers.value} centers`,
    detail: 'One door in the village: farmers walk in to apply for a loan, buy inputs, get advice and sell their harvest.',
    scene: 'center',
    x: 52,
    y: 193,
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
    x: -143,
    y: 229,
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
    x: -169,
    y: 62,
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
 * A Bangladeshi farmer, standing at (0, 0): a gamchha tied round his head and another round his
 * neck, a fatua and a checked lungi folded to the knee. He waves with one hand and holds his phone
 * in the other. About 70 units tall.
 */
export function Farmer() {
  return (
    <g>
      <ellipse cx="0" cy="0.5" rx="13" ry="4" fill="rgba(2,43,54,0.22)" />
      {/* legs and bare feet */}
      <rect x="-5.4" y="-13" width="4" height="12" rx="2" fill={SKIN} />
      <rect x="1.4" y="-13" width="4" height="12" rx="2" fill={SKIN} />
      <ellipse cx="-4" cy="-0.9" rx="3.5" ry="1.6" fill={SKIN_DARK} />
      <ellipse cx="4" cy="-0.9" rx="3.5" ry="1.6" fill={SKIN_DARK} />
      {/* lungi */}
      <path d="M -9 -31 H 9 L 10 -12 Q 0 -10 -10 -12 Z" fill="#2C5D8A" />
      <g strokeWidth="0.9" stroke="#4A7FB0">
        {[-6, -1.5, 3, 7.5].map((x) => (
          <path key={x} d={`M ${x} -30 V -11.6`} />
        ))}
        {[-25, -19, -13.5].map((y) => (
          <path key={y} d={`M -9.2 ${y} H 9.2`} />
        ))}
      </g>
      <rect x="-9.6" y="-32.6" width="19.2" height="3" rx="1.5" fill="#244E75" />
      {/* fatua */}
      <path d="M -8 -50 Q 0 -47.5 8 -50 L 12.8 -46.5 L 13.4 -39 L 9.6 -38.4 L 9.8 -30.5 Q 0 -29 -9.8 -30.5 L -9.6 -38.4 L -13.4 -39 L -12.8 -46.5 Z" fill="#F3EEDD" stroke="#DED5BC" strokeWidth="0.7" />
      <path d="M 0 -48 V -36" stroke="#DED5BC" strokeWidth="0.7" />
      {/* gamchha round the neck */}
      <path d="M -7.2 -49.6 Q 0 -44.2 7.2 -49.6 L 8.6 -47.4 Q 0 -41.6 -8.6 -47.4 Z" fill="#D8493B" />
      <path d="M -4.5 -46.7 L -4 -44.6 M 0 -45.6 V -43.4 M 4.5 -46.7 L 4 -44.6" stroke="#FFFFFF" strokeWidth="0.6" />
      {/* waving arm */}
      <path d="M -12.4 -45 L -17 -50.5" stroke={SKIN} strokeWidth="4" strokeLinecap="round" />
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-12 -17 -50.5; 14 -17 -50.5; -12 -17 -50.5" dur="1.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
        <path d="M -17 -50.5 L -16 -59.5" stroke={SKIN} strokeWidth="4" strokeLinecap="round" />
        <circle cx="-15.8" cy="-61" r="2.7" fill={SKIN} />
      </g>
      {/* the other arm, with his phone */}
      <path d="M 12.4 -45 L 13.4 -37.6 L 7.6 -39.6" stroke={SKIN} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="3.3" y="-47" width="6.2" height="9.6" rx="1.3" fill="#0E1512" />
      <rect x="4.1" y="-46" width="4.6" height="7.2" rx="0.8" fill={LIME}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
      </rect>
      <circle cx="6.9" cy="-38.7" r="2.3" fill={SKIN} />
      {/* head, with a gamchha tied round it */}
      <rect x="-2.4" y="-53.5" width="4.8" height="4.5" fill={SKIN_DARK} />
      <circle cx="-8.5" cy="-59.6" r="1.7" fill={SKIN_DARK} />
      <circle cx="8.5" cy="-59.6" r="1.7" fill={SKIN_DARK} />
      <circle cx="0" cy="-60" r="8.6" fill={SKIN} />
      <path d="M -8.6 -61.5 Q -8.4 -69.8 0 -70 Q 8.4 -69.8 8.6 -61.5 Q 6 -65.6 0 -65.8 Q -6 -65.6 -8.6 -61.5 Z" fill={HAIR} />
      <path d="M -9 -64 Q 0 -68.2 9 -64 L 8.8 -61 Q 0 -65 -8.8 -61 Z" fill="#D8493B" />
      <path d="M -5 -65.6 L -5 -62.8 M 0 -66.6 V -63.8 M 5 -65.6 L 5 -62.8" stroke="#FFFFFF" strokeWidth="0.6" />
      <path d="M 8.6 -63 q 4 -1 5.6 2.4 q -3.2 -0.2 -5.2 0.6 z" fill="#C23D30" />
      <circle cx="-3" cy="-59.4" r="1" fill={HAIR} />
      <circle cx="3" cy="-59.4" r="1" fill={HAIR} />
      <path d="M -3.4 -55.6 Q 0 -57.3 3.4 -55.6 Q 0 -56.2 -3.4 -55.6 Z" fill={HAIR} stroke={HAIR} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M -2.1 -53.9 Q 0 -52.7 2.1 -53.9" stroke="#5A3523" strokeWidth="0.7" fill="none" strokeLinecap="round" />
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
