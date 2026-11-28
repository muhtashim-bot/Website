'use client';

/*
 * "Loop" version of the homepage opener: an isometric model of iFarmer's whole season, standing on
 * open, flat farmland. Eight service stations sit on a loop of glass pipes around the farmer; value
 * (seed, cash, produce) flows through the pipes all the way round, and from every side into the
 * hub, where a ring of services revolves. The whole place turns slowly through a full 360°. Hover or
 * tap a station for its name and what it does; clicking one jumps to that part of the story below.
 *
 * Built for smoothness: the land and the pipes are drawn once, flat, and turned and tilted into
 * isometric view by a CSS transform; each station and the hub is its own small layer that only
 * moves, and the value in the pipes is placed by the same single loop that turns the land.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
const VB = { x: -345, y: -244, w: 690, h: 440 }; // the scene, in screen units (origin = the hub, on the ground)

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

/* ---------- the land and the pipes: drawn once, flat, in plane units ---------- */

const G = 440; // radius of the drawn land
const PLAT = 42; // station platform radius
const f1 = (n: number) => Math.round(n * 10) / 10;
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// a patchwork of fields, some with crop rows
const PLOTS = (() => {
  const rand = rng(20261128);
  const cell = 88;
  const n = Math.ceil(G / cell) + 1;
  const pts: number[][][] = [];
  for (let i = -n; i <= n; i++) {
    pts[i + n] = [];
    for (let j = -n; j <= n; j++) pts[i + n][j + n] = [i * cell + (rand() - 0.5) * cell * 0.5, j * cell + (rand() - 0.5) * cell * 0.5];
  }
  const fills = ['#D5EBAE', '#C9E49C', '#DCEFBB', '#BFDD8E', '#D1E8A8', '#C4E096', '#F2E38E', '#E9E0C4', '#DCEFBB', '#CBE6A0'];
  const plots: { d: string; fill: string; rows: number }[] = [];
  for (let i = 0; i < 2 * n; i++) {
    for (let j = 0; j < 2 * n; j++) {
      const q = [pts[i][j], pts[i + 1][j], pts[i + 1][j + 1], pts[i][j + 1]];
      const cx = (q[0][0] + q[2][0]) / 2;
      const cy = (q[0][1] + q[2][1]) / 2;
      if (Math.hypot(cx, cy) > G - 30) continue;
      plots.push({ d: `M ${q.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L ')} Z`, fill: fills[Math.floor(rand() * fills.length)], rows: rand() < 0.55 ? Math.floor(rand() * 3) : -1 });
    }
  }
  return plots;
})();
const PONDS = [
  { cx: 92, cy: -92, rx: 17, ry: 11, a: 30 },
  { cx: -262, cy: 118, rx: 36, ry: 22, a: -20 },
  { cx: 246, cy: 250, rx: 40, ry: 24, a: 15 },
  { cx: -236, cy: -296, rx: 34, ry: 21, a: 50 },
];

const CORNERS: [number, number][] = [
  [-D, -D],
  [D, -D],
  [D, D],
  [-D, D],
];
const LOOP_P = `M ${CORNERS.map((p) => p.join(' ')).join(' L ')} Z`;
const SPOKE_ENDS: [number, number][] = [
  [0, -D],
  [D, 0],
  [0, D],
  [-D, 0],
];
const SPOKES_P = SPOKE_ENDS.map(([x, y]) => `M ${x} ${y} L 0 0`);
// collars where the glass is joined: halfway between stations, and partway along each spoke
const COLLARS_P = [
  ...stationsAround().map(([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, b[0] - a[0], b[1] - a[1]]),
  ...SPOKE_ENDS.map(([x, y]) => [x * 0.6, y * 0.6, -x, -y]),
].map(([x, y, dx, dy]) => {
  const l = Math.hypot(dx, dy);
  const ux = (dx / l) * 4.5;
  const uy = (dy / l) * 4.5;
  return `M ${f1(x - ux)} ${f1(y - uy)} L ${f1(x + ux)} ${f1(y + uy)}`;
});
function stationsAround(): [[number, number], [number, number]][] {
  const ring: [number, number][] = [
    [-D, -D],
    [0, -D],
    [D, -D],
    [D, 0],
    [D, D],
    [0, D],
    [-D, D],
    [-D, 0],
  ];
  return ring.map((p, i) => [p, ring[(i + 1) % ring.length]]);
}

function Ground({ dark }: { dark: boolean }) {
  const pipe = (stroke: string, width: number, extra?: object) => (
    <>
      <path d={LOOP_P} stroke={stroke} strokeWidth={width} {...extra} />
      {SPOKES_P.map((d, i) => (
        <path key={i} d={d} stroke={stroke} strokeWidth={width} {...extra} />
      ))}
    </>
  );
  return (
    <svg viewBox={`${-G} ${-G} ${G * 2} ${G * 2}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <circle r={G} fill={dark ? '#D9EBC2' : '#E3F0CF'} />
      <g stroke="#EEF5E2" strokeWidth="3" strokeLinejoin="round">
        {PLOTS.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </g>
      <g opacity="0.32">{PLOTS.map((p, i) => (p.rows >= 0 ? <path key={i} d={p.d} fill={`url(#fl-rows-${p.rows})`} /> : null))}</g>
      {PONDS.map((p, i) => (
        <g key={i} transform={`translate(${p.cx} ${p.cy}) rotate(${p.a})`}>
          <ellipse rx={p.rx + 5} ry={p.ry + 5} fill="#D9E9C8" />
          <ellipse rx={p.rx} ry={p.ry} fill="#A9D8E6" />
          <ellipse rx={p.rx * 0.55} ry={p.ry * 0.35} cx={-p.rx * 0.2} cy={-p.ry * 0.25} fill="#C8E9F2" />
        </g>
      ))}
      {/* the glass pipes */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {pipe('rgba(2,43,54,0.1)', 27)}
        {pipe('#A9BEA3', 18)}
        {pipe('#F1F6EE', 14.5)}
        {pipe('#FFFFFF', 2.4, { opacity: 0.9 })}
        {COLLARS_P.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#A9BEA3" strokeWidth="21.5" strokeLinecap="butt" />
            <path d={d} stroke="#F7FAF5" strokeWidth="18.5" strokeLinecap="butt" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ---------- shared gradients, mounted once outside any hidden copy of the scene ---------- */

let defsOwner = false;
function FlowDefs() {
  const [own, setOwn] = useState(false);
  useEffect(() => {
    if (defsOwner) return;
    defsOwner = true;
    setOwn(true);
    return () => {
      defsOwner = false;
    };
  }, []);
  if (!own) return null;
  return createPortal(
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="fl-plat" x1="0" x2="1">
          <stop offset="0" stopColor="#F4F8F1" />
          <stop offset="1" stopColor="#CFDBCB" />
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
        <radialGradient id="fl-shade">
          <stop offset="0.35" stopColor="rgba(2,43,54,0.2)" />
          <stop offset="1" stopColor="rgba(2,43,54,0)" />
        </radialGradient>
        <radialGradient id="fl-glow">
          <stop offset="0" stopColor="rgba(221,255,128,0.9)" />
          <stop offset="1" stopColor="rgba(221,255,128,0)" />
        </radialGradient>
        {[0, 60, 120].map((a, k) => (
          <pattern key={k} id={`fl-rows-${k}`} width="11" height="11" patternUnits="userSpaceOnUse" patternTransform={`rotate(${a})`}>
            <rect width="11" height="5" fill="#7FAF45" />
          </pattern>
        ))}
      </defs>
    </svg>,
    document.body,
  );
}

/* ---------- placing things as the land turns ---------- */

type Box = { w: number; top: number; h: number };
const SP: Box = { w: 176, top: 116, h: 168 }; // a station's layer, around its ground point
const HP: Box = { w: 190, top: 116, h: 176 }; // the hub's layer
const TURN = (2 * Math.PI) / 110; // radians per second: one full turn in a little under two minutes
const START = -0.3; // the turn the scene opens at

/** screen position of a plane point after the land has turned by a */
function project(x: number, y: number, a: number) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const xr = x * ca - y * sa;
  const yr = x * sa + y * ca;
  return { sx: (xr - yr) * C, sy: (xr + yr) * 0.5, depth: xr + yr };
}
/** the transform that puts a layer's ground point at screen position (sx, sy), in % of its own size */
const seat = (sx: number, sy: number, b: Box) => `translate3d(${(((sx - VB.x - b.w / 2) / b.w) * 100).toFixed(3)}%, ${(((sy - VB.y - b.top) / b.h) * 100).toFixed(3)}%, 0)`;
const size = (b: Box) => ({ width: `${(b.w / VB.w) * 100}%`, height: `${(b.h / VB.h) * 100}%` });
const groundTurn = (a: number) => `scale(${(Math.SQRT2 * C).toFixed(5)}, ${Math.SQRT1_2.toFixed(5)}) rotate(${(45 + (a * 180) / Math.PI).toFixed(3)}deg)`;
const z = (depth: number) => 1000 + Math.round(depth / 4);

/* the value in the pipes: where each piece is at time t (seconds) */
const BALLS = ['#B8E655', '#6FAE2E', '#F2C14E', '#B8E655', '#6FAE2E', '#B8E655', '#F2C14E', '#6FAE2E', '#B8E655', '#6FAE2E', '#F2C14E', '#B8E655', '#6FAE2E', '#F2C14E'];
const LOOP_DUR = 18;
const SPOKE_DUR = 3.2;
const SPOKE_BALLS = SPOKE_ENDS.flatMap((_, j) => [0, 1].map((k) => ({ j, k })));
function onLoop(u: number): [number, number] {
  const s = (((u % 1) + 1) % 1) * 4;
  const k = Math.floor(s);
  const f = s - k;
  const a = CORNERS[k];
  const b = CORNERS[(k + 1) % 4];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
function onSpoke(j: number, u: number): [number, number] {
  const f = ((u % 1) + 1) % 1;
  const [x, y] = SPOKE_ENDS[j];
  return [x * (1 - f), y * (1 - f)];
}

const hubInfo = { id: 'hub', label: 'The farmer', via: 'At the centre', detail: 'Every service, from financing to payout, flows to and from the farmer.', scene: '', x: 0, y: 0, tall: 64 };

export function ServiceFlow({ onPick, dark = false, compact = false }: { onPick?: (scene: string) => void; dark?: boolean; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const balls = useRef<(SVGCircleElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const svgs = useRef<Set<SVGSVGElement>>(new Set());
  const angle = useRef(START);
  const clock = useRef(0); // seconds of flow, paused with the scene
  const [hover, setHover] = useState<string | null>(null);
  const [tour, setTour] = useState(0);
  const [seen, setSeen] = useState(true);
  const still = useRef(false);
  const pointer = useRef('mouse'); // what the last press came from, so touch can tap once to read

  const keep = useCallback((el: SVGSVGElement | null) => {
    if (el) svgs.current.add(el);
  }, []);

  const shown = hover === 'hub' ? hubInfo : stations.find((s) => s.id === (hover ?? stations[tour].id))!;
  const shownRef = useRef(shown);
  shownRef.current = shown;

  // where the card sits for the station it describes, at turn a
  const cardSpot = (a: number) => {
    const s = shownRef.current;
    const p = project(s.x, s.y, a);
    const topY = p.sy - PH - s.tall;
    const left = ((p.sx - VB.x) / VB.w) * 100;
    const flip = (topY - VB.y) / VB.h < 0.22; // near the top edge, show the card under the station
    const top = (((flip ? p.sy + PLAT * 0.75 : topY) - VB.y) / VB.h) * 100;
    return { left, top, flip };
  };

  const place = useCallback((a: number, t: number) => {
    if (ground.current) ground.current.style.transform = groundTurn(a % (2 * Math.PI));
    stations.forEach((s, i) => {
      const el = layers.current[i];
      if (!el) return;
      const p = project(s.x, s.y, a);
      el.style.transform = seat(p.sx, p.sy, SP);
      el.style.zIndex = String(z(p.depth));
    });
    BALLS.forEach((_, i) => {
      const el = balls.current[i];
      if (!el) return;
      const [x, y] = onLoop(t / LOOP_DUR + i / BALLS.length);
      const p = project(x, y, a);
      el.setAttribute('transform', `translate(${p.sx.toFixed(1)} ${p.sy.toFixed(1)})`);
    });
    SPOKE_BALLS.forEach(({ j, k }, i) => {
      const el = balls.current[BALLS.length + i];
      if (!el) return;
      const [x, y] = onSpoke(j, t / SPOKE_DUR + j * 0.25 + k * 0.5);
      const p = project(x, y, a);
      el.setAttribute('transform', `translate(${p.sx.toFixed(1)} ${p.sy.toFixed(1)})`);
    });
    const c = cardRef.current;
    if (c) {
      const spot = cardSpot(a);
      c.style.left = `${spot.left}%`;
      c.style.top = `${spot.top}%`;
      c.style.transform = `translate(${-spot.left}%, ${spot.flip ? '10px' : 'calc(-100% - 10px)'})`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio > 0.1), { threshold: [0, 0.1, 0.3] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the little animations inside the stations and hub pause with the scene
  useEffect(() => {
    const run = seen && !still.current;
    svgs.current.forEach((s) => (run ? s.unpauseAnimations() : s.pauseAnimations()));
  }, [seen]);

  // one loop turns the land and moves the value through the pipes; the turn eases to a stop while
  // someone points at a station, and everything stops when the scene is out of sight
  const held = hover !== null;
  useEffect(() => {
    if (!seen || still.current) {
      place(angle.current, clock.current);
      return;
    }
    const target = held ? 0 : TURN;
    let speed = held ? 0 : TURN * 0.6;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      speed += (target - speed) * Math.min(1, dt * 2.5);
      angle.current += speed * dt;
      clock.current += dt;
      place(angle.current, clock.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [seen, held, place]);

  // when nobody is pointing, the highlight travels round the loop
  useEffect(() => {
    if (hover || !seen || still.current) return;
    const id = window.setInterval(() => setTour((t) => (t + 1) % stations.length), 3200);
    return () => window.clearInterval(id);
  }, [hover, seen]);

  const activeId = hover ?? stations[tour].id;
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

  // before the first frame, so the server-drawn page already looks right
  const initialLayer = (x: number, y: number) => {
    const p = project(x, y, START);
    return { transform: seat(p.sx, p.sy, SP), zIndex: z(p.depth) };
  };
  const initialBall = (i: number) => {
    const [x, y] = i < BALLS.length ? onLoop(i / BALLS.length) : onSpoke(SPOKE_BALLS[i - BALLS.length].j, SPOKE_BALLS[i - BALLS.length].j * 0.25 + SPOKE_BALLS[i - BALLS.length].k * 0.5);
    const p = project(x, y, START);
    return `translate(${p.sx.toFixed(1)} ${p.sy.toFixed(1)})`;
  };
  const spot0 = cardSpot(angle.current);
  const full = !!hover;

  return (
    <div
      ref={root}
      className="relative w-full select-none"
      style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
      onPointerDown={(e) => {
        pointer.current = e.pointerType;
        if (!(e.target as Element).closest('.flow-station')) setHover(null);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHover(null);
      }}
    >
      <FlowDefs />
      {/* the land, flat, fading out on every side; the pipes are part of it and turn with it */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_50%_47%_at_50%_54%,#000_55%,transparent_100%)]">
        <div
          ref={ground}
          className="absolute will-change-transform"
          style={{
            left: `${((-G - VB.x) / VB.w) * 100}%`,
            top: `${((-G - VB.y) / VB.h) * 100}%`,
            width: `${((G * 2) / VB.w) * 100}%`,
            height: `${((G * 2) / VB.h) * 100}%`,
            transform: groundTurn(START),
          }}
        >
          <Ground dark={dark} />
        </div>
      </div>

      {/* the value flowing through the pipes */}
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 100 }} aria-hidden>
        {[...BALLS, ...SPOKE_BALLS.map(({ k }) => (k ? '#F2C14E' : '#B8E655'))].map((c, i) => (
          <circle
            key={i}
            ref={(el) => {
              balls.current[i] = el;
            }}
            r={i < BALLS.length ? 5.4 : 4.8}
            fill={c}
            stroke="rgba(2,43,54,0.28)"
            strokeWidth="0.9"
            transform={initialBall(i)}
          />
        ))}
      </svg>

      {/* the farmer's hub, at the centre */}
      <div className="absolute left-0 top-0" style={{ ...size(HP), transform: seat(0, 0, HP), zIndex: 1000 }}>
        <svg ref={keep} viewBox={`${-HP.w / 2} ${-HP.top} ${HP.w} ${HP.h}`} className="absolute inset-0 h-full w-full overflow-visible">
          <g
            className="flow-station cursor-default outline-none"
            tabIndex={0}
            role="button"
            aria-label="The farmer: every service, from financing to payout, flows to and from the farmer"
            onPointerEnter={enter('hub')}
            onFocus={() => setHover('hub')}
            onBlur={() => setHover(null)}
            onClick={tap('hub')}
          >
            <ellipse cx="5" cy="7" rx={HUB * 1.5} ry={HUB * 0.9} fill="url(#fl-shade)" />
            <ellipse cx="0" cy={-6} rx={HUB * 1.6} ry={HUB * 0.95} fill="url(#fl-glow)" style={{ opacity: hover === 'hub' ? 0.9 : 0, transition: 'opacity .4s' }} />
            <Hub />
          </g>
        </svg>
      </div>

      {/* the stations, each its own layer */}
      {stations.map((st, i) => {
        const o: O = { x: 0, y: 0, z: PH };
        const on = activeId === st.id;
        return (
          <div
            key={st.id}
            ref={(el) => {
              layers.current[i] = el;
            }}
            className="pointer-events-none absolute left-0 top-0 will-change-transform"
            style={{ ...size(SP), ...initialLayer(st.x, st.y) }}
          >
            <svg ref={keep} viewBox={`${-SP.w / 2} ${-SP.top} ${SP.w} ${SP.h}`} className="absolute inset-0 h-full w-full overflow-visible">
              <g
                className="flow-station pointer-events-auto cursor-pointer outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${st.label}: ${st.detail}`}
                onPointerEnter={enter(st.id)}
                onFocus={() => setHover(st.id)}
                onBlur={() => setHover(null)}
                onClick={tap(st.id, st.scene)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPick?.(st.scene);
                  }
                }}
              >
                <ellipse cx="4" cy="6" rx={PLAT * 1.55} ry={PLAT * 0.95} fill="url(#fl-shade)" />
                <ellipse cx="0" cy={-PH / 2} rx={PLAT * 2} ry={PLAT * 1.2} fill="url(#fl-glow)" style={{ opacity: on ? 0.85 : 0, transition: 'opacity .45s' }} />
                <Cyl o={{ x: 0, y: 0, z: 0 }} x={0} y={0} z={0} r={PLAT} h={PH} top={on ? '#F6FFE3' : '#FFFFFF'} side="url(#fl-plat)" rim={on ? LEAF : '#E3EADF'} />
                <g className="flow-obj" style={{ transform: on ? 'translateY(-5px)' : 'none' }}>
                  {st.draw(o)}
                </g>
                {/* a generous, invisible target for the pointer */}
                <rect x={-PLAT * 1.35} y={-PH - st.tall - 12} width={PLAT * 2.7} height={st.tall + PH + PLAT * 0.85 + 12} fill="transparent" />
              </g>
            </svg>
          </div>
        );
      })}

      {/* the card for the station in focus; it rides along as the land turns */}
      <div
        ref={cardRef}
        className="pointer-events-none absolute"
        style={{ left: `${spot0.left}%`, top: `${spot0.top}%`, transform: `translate(${-spot0.left}%, ${spot0.flip ? '10px' : 'calc(-100% - 10px)'})`, zIndex: 5000 }}
      >
        <div key={`${shown.id}-${full}`} className="flow-card">
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
      </div>
    </div>
  );
}
