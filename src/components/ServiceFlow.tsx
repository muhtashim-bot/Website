'use client';

/*
 * "Flow" version of the homepage opener: an isometric model of iFarmer's whole season. Eight
 * service stations sit on a loop of glass pipes around the farmer; value (seed, cash, produce)
 * flows through the pipes all the way round, and from every side into the hub, where a ring of
 * services revolves. Hover or tap a station for its name and what it does. Clicking one jumps to
 * that part of the story below.
 *
 * Everything is one SVG drawn from simple isometric shapes, animated with SMIL so the whole scene
 * can be paused at once: when it is off screen, and from the start for reduced motion.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { metrics } from '@/content/metrics';

/* ---------- isometric geometry ---------- */

const C = 0.8660254; // cos 30°
const r1 = (n: number) => Math.round(n * 10) / 10;
type P2 = [number, number];
/** plane (x, y) and height z to screen */
const iso = (x: number, y: number, z = 0): P2 => [r1((x - y) * C), r1((x + y) * 0.5 - z)];
const poly = (ps: [number, number, number][]) => ps.map(([x, y, z]) => iso(x, y, z).join(',')).join(' ');
/** draw plane shapes (rect, circle, path in plane x/y) lying flat at height z */
const flat = (z: number) => `matrix(${C} 0.5 ${-C} 0.5 0 ${r1(-z)})`;
/** draw on a front-left face (facing +y): u runs along +x, v up */
const faceL = ([X, Y]: P2) => `matrix(${C} 0.5 0 -1 ${X} ${Y})`;
/** draw on a front-right face (facing +x): u runs along -y (left to right on screen), v up */
const faceR = ([X, Y]: P2) => `matrix(${C} -0.5 0 -1 ${X} ${Y})`;

const D = 150; // half-size of the loop of stations
const H = 34; // half-size of a station platform
const PH = 10; // platform height
const ZP = 6; // pipe height
const HUB = 60; // hub radius
const VB = { x: -330, y: -218, w: 660, h: 412 };

type O = { x: number; y: number; z: number };
const at = (o: O, x: number, y: number, z: number) => iso(o.x + x, o.y + y, o.z + z);

/* ---------- primitives ---------- */

function Box({ o, x, y, z, w, d, h, top, left, right }: { o: O; x: number; y: number; z: number; w: number; d: number; h: number; top: string; left: string; right: string }) {
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

function Cyl({ o, x, y, z, r, h, top, side, rim }: { o: O; x: number; y: number; z: number; r: number; h: number; top: string; side: string; rim?: string }) {
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
function Slab({ o, x, y, z, w, d, h, rx, top, side, stroke, style }: { o: O; x: number; y: number; z: number; w: number; d: number; h: number; rx: number; top: string; side: string; stroke?: string; style?: React.CSSProperties }) {
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
const Shadow = ({ cx, cy, s }: { cx: number; cy: number; s: number }) => (
  <rect x={cx - s + 5} y={cy - s + 5} width={s * 2} height={s * 2} rx={s * 0.5} transform={flat(0)} fill="url(#fl-shadow)" />
);

const spin = (dur: number, begin = 0) => <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />;
const bob = (dy: number, dur: number, begin = 0) => (
  <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${-dy}; 0 0`} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
);

/* ---------- the stations ---------- */

type Station = { id: string; label: string; via: string; detail: string; scene: string; x: number; y: number; tall: number; draw: (o: O) => ReactNode };

const GREEN = '#038F2F';
const LEAF = '#88BB41';
const LIME = '#DDFF80';
const TEAL = '#0B3B45';

const stations: Station[] = [
  {
    id: 'finance',
    label: 'Crop finance',
    via: 'Folon, iHarvst',
    detail: 'Collateral-free loans, applied for on Folon and backed by funders on iHarvst and partner banks, repaid at harvest.',
    scene: 'finance',
    x: -D,
    y: -D,
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
    x: 0,
    y: -D,
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
    x: D,
    y: -D,
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
    x: D,
    y: 0,
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
    x: D,
    y: D,
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
    x: 0,
    y: D,
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
    x: -D,
    y: D,
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
    x: -D,
    y: 0,
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

const RING = [
  { c: GREEN, s: '#02701F', h: 4 },
  { c: LEAF, s: '#6A9A31', h: 6 },
  { c: GREEN, s: '#02701F', h: 3 },
  { c: LIME, s: '#B7DB5C', h: 5 },
  { c: GREEN, s: '#02701F', h: 6 },
  { c: LEAF, s: '#6A9A31', h: 3 },
  { c: GREEN, s: '#02701F', h: 5 },
  { c: LIME, s: '#B7DB5C', h: 4 },
];
const sector = (i: number, r0: number, rA: number) => {
  const g = 0.09;
  const a0 = (i / RING.length) * Math.PI * 2 + g;
  const a1 = ((i + 1) / RING.length) * Math.PI * 2 - g;
  const p = (r: number, a: number) => `${r1(r * Math.cos(a))} ${r1(r * Math.sin(a))}`;
  return `M ${p(rA, a0)} A ${rA} ${rA} 0 0 1 ${p(rA, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
};

function Hub() {
  const top = 12;
  const o: O = { x: 0, y: 0, z: 0 };
  const layers = Math.max(...RING.map((s) => s.h));
  return (
    <g>
      <Cyl o={o} x={0} y={0} z={0} r={HUB} h={top} top="#FFFFFF" side="url(#fl-plat)" rim="#E3EADF" />
      <circle r={HUB - 9} transform={flat(top)} fill="#F2F7EE" />
      {/* the revolving ring of services: every layer turns together */}
      {Array.from({ length: layers + 1 }, (_, k) => (
        <g key={k} transform={flat(top + k * 1.6)}>
          <g>
            {spin(30)}
            {RING.map((s, i) => (k <= s.h ? <path key={i} d={sector(i, 31, 47)} fill={k === s.h ? s.c : s.s} stroke={k === s.h ? 'none' : s.s} strokeWidth="1" /> : null))}
          </g>
        </g>
      ))}
      {/* the farmer's glass, value rising through it */}
      <Cyl o={o} x={0} y={0} z={top} r={17} h={46} top="rgba(255,255,255,0.55)" side="url(#fl-glass)" rim="rgba(160,185,160,0.7)" />
      {[0, 1, 2].map((k) => (
        <circle key={k} cx="0" cy={-top - 4} r="3.6" fill={k === 1 ? '#F7D46A' : LIME} stroke="#88BB4155">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -36" dur="2.4s" begin={`${-k * 0.8}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.75;1" dur="2.4s" begin={`${-k * 0.8}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <path d={`M ${r1(-17 * 1.2247 + 4)} ${-top - 40} V ${-top - 6}`} stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

/* ---------- pipes ---------- */

const loopPts: P2[] = [iso(-D, -D, ZP), iso(D, -D, ZP), iso(D, D, ZP), iso(-D, D, ZP)];
const LOOP = `M ${loopPts.map((p) => p.join(' ')).join(' L ')} Z`;
const LOOP_GROUND = `M ${[iso(-D, -D), iso(D, -D), iso(D, D), iso(-D, D)].map((p) => p.join(' ')).join(' L ')} Z`;
const spokes = [
  [0, -D],
  [D, 0],
  [0, D],
  [-D, 0],
].map(([x, y]) => ({ d: `M ${iso(x, y, ZP).join(' ')} L ${iso(0, 0, ZP).join(' ')}`, g: `M ${iso(x, y).join(' ')} L ${iso(0, 0).join(' ')}` }));
// collars along the pipes, where the glass is joined
const collars: string[] = [];
{
  const corners: [number, number][] = [
    [-D, -D],
    [0, -D],
    [D, -D],
    [D, 0],
    [D, D],
    [0, D],
    [-D, D],
    [-D, 0],
  ];
  const seg = (a: [number, number], b: [number, number], t: number) => {
    const l = 4 / D;
    const p = (s: number) => iso(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, ZP).join(' ');
    collars.push(`M ${p(t - l)} L ${p(t + l)}`);
  };
  corners.forEach((c, i) => {
    const n = corners[(i + 1) % corners.length];
    seg(c, n, 0.5);
  });
  [
    [0, -D],
    [D, 0],
    [0, D],
    [-D, 0],
  ].forEach(([x, y]) => seg([x, y], [0, 0], 0.4));
}

const BALLS = ['#B8E655', '#6FAE2E', '#F2C14E', '#B8E655', '#6FAE2E', '#B8E655', '#F2C14E', '#6FAE2E', '#B8E655', '#6FAE2E', '#F2C14E', '#B8E655', '#6FAE2E', '#F2C14E'];
const LOOP_DUR = 18;

/* ---------- component ---------- */

export function ServiceFlow({ onPick, dark = false, compact = false }: { onPick?: (scene: string) => void; dark?: boolean; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tour, setTour] = useState(0);
  const [seen, setSeen] = useState(true);
  const still = useRef(false);
  const pointer = useRef('mouse'); // what the last press came from, so touch can tap once to read

  // pause the whole scene off screen and for reduced motion
  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio > 0.15), { threshold: [0, 0.15, 0.4] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    if (seen && !still.current) s.unpauseAnimations();
    else s.pauseAnimations();
  }, [seen]);

  // when nobody is pointing, the highlight travels round the loop
  useEffect(() => {
    if (hover || !seen || still.current) return;
    const id = window.setInterval(() => setTour((t) => (t + 1) % stations.length), 3200);
    return () => window.clearInterval(id);
  }, [hover, seen]);

  const activeId = hover ?? stations[tour].id;
  const hubInfo = { id: 'hub', label: 'The farmer', via: 'At the centre', detail: 'Every service, from financing to payout, flows to and from the farmer.', x: 0, y: 0, tall: 64 };
  const shown = hover === 'hub' ? hubInfo : stations.find((s) => s.id === activeId);

  const enter = (id: string) => (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setHover(id);
  };
  const tap = (id: string, scene?: string) => () => {
    // touch: first tap shows the card, second tap goes to the story
    if (pointer.current !== 'mouse' && hover !== id) {
      setHover(id);
      return;
    }
    if (scene) onPick?.(scene);
  };

  const card = (() => {
    if (!shown) return null;
    const top = iso(shown.x, shown.y, PH + shown.tall);
    const below = iso(shown.x + H, shown.y + H, 0);
    const pct = (p: P2) => ({ left: ((p[0] - VB.x) / VB.w) * 100, top: ((p[1] - VB.y) / VB.h) * 100 });
    const flip = pct(top).top < 26; // near the top edge, show the card under the station instead
    const a = flip ? pct([top[0], below[1]]) : pct(top);
    const full = !!hover;
    return (
      <div
        key={`${shown.id}-${full}`}
        className="flow-card pointer-events-none absolute z-30"
        style={{ left: `${a.left}%`, top: `${a.top}%`, transform: `translate(${-a.left}%, ${flip ? '10px' : 'calc(-100% - 10px)'})` }}
      >
        {full ? (
          <div className={`rounded-2xl bg-white p-3.5 text-left shadow-[0_18px_40px_-16px_rgba(2,43,54,0.45)] ring-1 ring-ink/[0.06] ${compact ? 'w-[min(230px,64vw)]' : 'w-[240px]'}`}>
            <p className="text-[0.95rem] font-bold leading-tight text-field">{shown.label}</p>
            <p className="mt-0.5 text-[0.72rem] font-semibold text-ink-mute">{shown.via}</p>
            <p className="mt-2 text-[0.8rem] leading-snug text-ink-soft">{shown.detail}</p>
            {shown.id !== 'hub' && onPick && <p className="mt-2 text-[0.72rem] font-bold text-field">{compact ? 'Tap again' : 'Click'} to see it in the season</p>}
          </div>
        ) : (
          <div className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[0.78rem] font-bold text-field shadow-[0_10px_24px_-12px_rgba(2,43,54,0.5)] ring-1 ring-leaf/40">{shown.label}</div>
        )}
      </div>
    );
  })();

  const order = ['finance', 'inputs', 'next', 'advice', 'paid', 'hub', 'insurance', 'center', 'market'];

  return (
    <div
      ref={root}
      className="relative w-full"
      style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
      onPointerDown={(e) => {
        pointer.current = e.pointerType;
        if (!(e.target as Element).closest('.flow-station')) setHover(null);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHover(null);
      }}
    >
      <svg ref={svg} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full overflow-visible" role="group" aria-label="iFarmer's services, connected around the farmer">
        <defs>
          <linearGradient id="fl-plat" x1="0" x2="1">
            <stop offset="0" stopColor="#F4F8F1" />
            <stop offset="1" stopColor="#CFDBCB" />
          </linearGradient>
          <linearGradient id="fl-side" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#F1F5EE" />
            <stop offset="1" stopColor="#CCD8C8" />
          </linearGradient>
          <linearGradient id="fl-sack" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#EADBB9" />
            <stop offset="1" stopColor="#C8B48A" />
          </linearGradient>
          <linearGradient id="fl-soil" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#8E6B47" />
            <stop offset="1" stopColor="#6A4F34" />
          </linearGradient>
          <linearGradient id="fl-coin" x1="0" x2="1">
            <stop offset="0" stopColor="#F3C94F" />
            <stop offset="1" stopColor="#C99428" />
          </linearGradient>
          <linearGradient id="fl-pole" x1="0" x2="1">
            <stop offset="0" stopColor="#F1F5EE" />
            <stop offset="1" stopColor="#B9C6B6" />
          </linearGradient>
          <linearGradient id="fl-glass" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="0.5" stopColor="rgba(235,245,230,0.35)" />
            <stop offset="1" stopColor="rgba(200,220,195,0.5)" />
          </linearGradient>
          <radialGradient id="fl-shadow">
            <stop offset="0.3" stopColor="rgba(2,43,54,0.16)" />
            <stop offset="1" stopColor="rgba(2,43,54,0)" />
          </radialGradient>
          <radialGradient id="fl-glow">
            <stop offset="0" stopColor="rgba(221,255,128,0.9)" />
            <stop offset="1" stopColor="rgba(221,255,128,0)" />
          </radialGradient>
          <radialGradient id="fl-ground">
            <stop offset="0" stopColor={dark ? 'rgba(221,255,128,0.12)' : 'rgba(221,255,128,0.4)'} />
            <stop offset="1" stopColor="rgba(221,255,128,0)" />
          </radialGradient>
          <path id="fl-loop" d={LOOP} />
          {spokes.map((s, i) => (
            <path key={i} id={`fl-spoke-${i}`} d={s.d} />
          ))}
        </defs>

        <ellipse cx="0" cy="0" rx="320" ry="190" fill="url(#fl-ground)" />

        {/* shadows on the ground */}
        <g fill="none" stroke={dark ? 'rgba(0,0,0,0.25)' : 'rgba(2,43,54,0.07)'} strokeWidth="13" strokeLinejoin="round">
          <path d={LOOP_GROUND} transform="translate(3 3)" />
          {spokes.map((s, i) => (
            <path key={i} d={s.g} transform="translate(3 3)" />
          ))}
        </g>
        {stations.map((s) => (
          <Shadow key={s.id} cx={s.x} cy={s.y} s={H + 8} />
        ))}
        <circle r={HUB + 14} transform={`${flat(0)} translate(5 5)`} fill="url(#fl-shadow)" />

        {/* the glass pipes, with value flowing through them */}
        <g fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d={LOOP} stroke="#C9D7C4" strokeWidth="15" />
          {spokes.map((s, i) => (
            <path key={i} d={s.d} stroke="#C9D7C4" strokeWidth="15" />
          ))}
          <path d={LOOP} stroke="#EEF4EA" strokeWidth="12.5" />
          {spokes.map((s, i) => (
            <path key={i} d={s.d} stroke="#EEF4EA" strokeWidth="12.5" />
          ))}
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={LOOP} stroke="rgba(255,255,255,0.18)" strokeWidth="12.5" />
          {spokes.map((s, i) => (
            <path key={i} d={s.d} stroke="rgba(255,255,255,0.18)" strokeWidth="12.5" />
          ))}
        </g>
        <g>
          {BALLS.map((c, i) => (
            <circle key={i} r="5.4" fill={c} stroke="rgba(2,43,54,0.28)" strokeWidth="0.9">
              <animateMotion dur={`${LOOP_DUR}s`} begin={`${-(i * LOOP_DUR) / BALLS.length}s`} repeatCount="indefinite">
                <mpath href="#fl-loop" />
              </animateMotion>
            </circle>
          ))}
          {spokes.map((_, i) =>
            [0, 1].map((k) => (
              <circle key={`${i}-${k}`} r="4.8" fill={k ? '#F2C14E' : '#B8E655'} stroke="rgba(2,43,54,0.28)" strokeWidth="0.9">
                <animateMotion dur="3.2s" begin={`${-(i * 0.8 + k * 1.6)}s`} repeatCount="indefinite">
                  <mpath href={`#fl-spoke-${i}`} />
                </animateMotion>
              </circle>
            )),
          )}
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={LOOP} stroke="#FFFFFF" strokeWidth="1.8" transform="translate(0 -4.4)" opacity="0.9" />
          {spokes.map((s, i) => (
            <path key={i} d={s.d} stroke="#FFFFFF" strokeWidth="1.8" transform="translate(0 -4.4)" opacity="0.9" />
          ))}
          {collars.map((d, i) => (
            <g key={i}>
              <path d={d} stroke="#C9D7C4" strokeWidth="18" strokeLinecap="butt" />
              <path d={d} stroke="#F7FAF5" strokeWidth="15.5" strokeLinecap="butt" />
            </g>
          ))}
        </g>

        {/* stations and hub, back to front */}
        {order.map((id) => {
          if (id === 'hub') {
            const on = hover === 'hub';
            return (
              <g
                key="hub"
                className="flow-station cursor-default outline-none"
                tabIndex={0}
                role="button"
                aria-label="The farmer: every service, from financing to payout, flows to and from the farmer"
                onPointerEnter={enter('hub')}
                onFocus={() => setHover('hub')}
                onBlur={() => setHover(null)}
                onClick={tap('hub')}
              >
                <ellipse cx="0" cy={-6} rx={HUB * 1.6} ry={HUB * 0.95} fill="url(#fl-glow)" style={{ opacity: on ? 0.9 : 0, transition: 'opacity .4s' }} />
                <Hub />
              </g>
            );
          }
          const s = stations.find((t) => t.id === id)!;
          const o: O = { x: s.x, y: s.y, z: PH };
          const on = activeId === s.id;
          const [gx, gy] = iso(s.x, s.y, PH);
          return (
            <g
              key={s.id}
              className="flow-station cursor-pointer outline-none"
              tabIndex={0}
              role="button"
              aria-label={`${s.label}: ${s.detail}`}
              onPointerEnter={enter(s.id)}
              onFocus={() => setHover(s.id)}
              onBlur={() => setHover(null)}
              onClick={tap(s.id, s.scene)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPick?.(s.scene);
                }
              }}
            >
              <ellipse cx={gx} cy={gy} rx={H * 2.3} ry={H * 1.35} fill="url(#fl-glow)" style={{ opacity: on ? 0.85 : 0, transition: 'opacity .45s' }} />
              <Slab
                o={{ x: s.x, y: s.y, z: 0 }}
                x={-H}
                y={-H}
                z={0}
                w={H * 2}
                d={H * 2}
                h={PH}
                rx={9}
                top={on ? '#F6FFE3' : '#FFFFFF'}
                side="url(#fl-side)"
                stroke={on ? LEAF : '#E3EADF'}
                style={{ transition: 'fill .4s, stroke .4s' }}
              />
              <g className="flow-obj" style={{ transform: on ? 'translateY(-5px)' : 'none' }}>
                {s.draw(o)}
              </g>
              {/* a generous, invisible target for the pointer */}
              <rect x={gx - H * 1.75} y={gy - s.tall - 12} width={H * 3.5} height={s.tall + H + 22} fill="transparent" />
            </g>
          );
        })}
      </svg>
      {card}
    </div>
  );
}
