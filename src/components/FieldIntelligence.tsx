'use client';

/*
 * Backdrop for the AI & Data hero: smallholder plots seen from above, read by a scanning pass.
 * Each plot lights up in crop-health greens as the scan crosses it and then fades; now and then a
 * plot shows stress in amber, gets a finding, and sends a signal along a line to the assistant.
 * Illustrative only, not real satellite data. Drawn on a canvas at about 30 frames a second,
 * paused when off screen, and held still for people who prefer reduced motion.
 */
import { useEffect, useRef } from 'react';

type Plot = { pts: number[]; cx: number; cy: number; u: number; health: number; stress: boolean; lit: number };
type Signal = { p: Plot; t0: number; label: string; tw: number; free: boolean };

const ANGLE = -0.26; // how the land lies, in radians; the scan travels along it
const PASS = 9000; // ms for one scan pass
const FADE = 5600; // ms for a read plot to fade back
const SIGNAL = 3200; // ms a finding stays on screen
const FINDINGS = ['Brown spot risk', 'Low soil moisture', 'Ready in 3 weeks', 'Needs potash', 'Waterlogging risk', 'Pest pressure rising'];

const LEAF = [136, 187, 65];
const LIME = [221, 255, 128];
const FIELD = [3, 143, 47];
const AMBER = [242, 181, 68];

// seeded, so the land is the same on every visit
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

export function FieldIntelligence() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const host = cv?.parentElement;
    const ctx = cv?.getContext('2d');
    if (!cv || !host || !ctx) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cos = Math.cos(ANGLE);
    const sin = Math.sin(ANGLE);
    const font = getComputedStyle(cv).fontFamily;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let plots: Plot[] = [];
    let uMin = 0;
    let uMax = 0;
    let vMin = 0;
    let vMax = 0;
    let node = { x: 0, y: 0 };
    let avoid: DOMRect[] = [];
    let land: HTMLCanvasElement | null = null;
    let signals: Signal[] = [];
    let lastScan = -1;
    let nodeHit = -1e9;
    let finding = 0;

    const toXY = (u: number, v: number) => [u * cos - v * sin, u * sin + v * cos];

    const build = () => {
      const r = host.getBoundingClientRect();
      W = Math.round(r.width);
      H = Math.round(r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);

      // where the words and the assistant sit, so findings are only labelled in open ground
      avoid = [...host.querySelectorAll<HTMLElement>('[data-ai-avoid]')].map((el) => {
        const b = el.getBoundingClientRect();
        return new DOMRect(b.left - r.left - 18, b.top - r.top - 18, b.width + 36, b.height + 36);
      });
      const target = host.querySelector<HTMLElement>('[data-ai-node]')?.getBoundingClientRect();
      node = target
        ? W >= 1024
          ? { x: target.left - r.left + 2, y: target.top - r.top + target.height * 0.34 }
          : { x: target.left - r.left + target.width / 2, y: target.top - r.top + 2 }
        : { x: W * 0.62, y: H * 0.4 };

      // the canvas corners in the land's own axes
      const corners = [
        [0, 0],
        [W, 0],
        [0, H],
        [W, H],
      ].map(([x, y]) => [x * cos + y * sin, -x * sin + y * cos]);
      uMin = Math.min(...corners.map((c) => c[0]));
      uMax = Math.max(...corners.map((c) => c[0]));
      vMin = Math.min(...corners.map((c) => c[1]));
      vMax = Math.max(...corners.map((c) => c[1]));

      const rand = rng(20261126);
      const cw = W < 700 ? 74 : 104;
      const ch = W < 700 ? 58 : 76;
      const cols = Math.ceil((uMax - uMin) / cw) + 3;
      const rows = Math.ceil((vMax - vMin) / ch) + 3;
      const lattice: number[][][] = [];
      for (let i = 0; i < cols; i++) {
        lattice[i] = [];
        for (let j = 0; j < rows; j++) {
          const u = uMin - cw + i * cw + (rand() - 0.5) * cw * 0.42;
          const v = vMin - ch + j * ch + (rand() - 0.5) * ch * 0.42;
          lattice[i][j] = toXY(u, v);
        }
      }
      const lerp = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      plots = [];
      for (let i = 0; i < cols - 1; i++) {
        for (let j = 0; j < rows - 1; j++) {
          const p00 = lattice[i][j];
          const p10 = lattice[i + 1][j];
          const p11 = lattice[i + 1][j + 1];
          const p01 = lattice[i][j + 1];
          // paddy is farmed in strips: split many plots into two or three
          const k = rand() < 0.45 ? 1 : rand() < 0.6 ? 2 : 3;
          const alongU = rand() < 0.5;
          for (let s = 0; s < k; s++) {
            const t0 = s / k;
            const t1 = (s + 1) / k;
            const q = alongU
              ? [lerp(p00, p10, t0), lerp(p00, p10, t1), lerp(p01, p11, t1), lerp(p01, p11, t0)]
              : [lerp(p00, p01, t0), lerp(p10, p11, t0), lerp(p10, p11, t1), lerp(p00, p01, t1)];
            const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
            const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
            if (cx < -cw || cx > W + cw || cy < -ch || cy > H + ch) continue;
            plots.push({ pts: q.flat(), cx, cy, u: cx * cos + cy * sin, health: 0.3 + rand() * 0.7, stress: rand() < 0.07, lit: -1e9 });
          }
        }
      }

      // the land itself never changes, so it is drawn once
      land = document.createElement('canvas');
      land.width = cv.width;
      land.height = cv.height;
      const g = land.getContext('2d')!;
      g.scale(dpr, dpr);
      for (const p of plots) {
        g.beginPath();
        g.moveTo(p.pts[0], p.pts[1]);
        for (let n = 2; n < 8; n += 2) g.lineTo(p.pts[n], p.pts[n + 1]);
        g.closePath();
        g.fillStyle = rgba(LEAF, 0.015 + p.health * 0.035);
        g.fill();
        g.strokeStyle = rgba(LIME, 0.11);
        g.lineWidth = 1;
        g.stroke();
      }
      g.fillStyle = rgba(LIME, 0.22);
      for (const col of lattice) for (const [x, y] of col) if (x > -4 && x < W + 4 && y > -4 && y < H + 4) g.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
    };

    const isFree = (x: number, y: number) => x > 12 && x < W - 12 && y > 12 && y < H - 30 && !avoid.some((a) => x > a.left && x < a.right && y > a.top && y < a.bottom);

    const scanAt = (t: number) => uMin - 160 + ((t % PASS) / PASS) * (uMax - uMin + 320);
    // light the plots the scan has already crossed, each as faded as its time since
    const preroll = (t: number) => {
      const s = scanAt(t);
      const speed = (uMax - uMin + 320) / PASS;
      for (const p of plots) p.lit = p.u <= s ? t - (s - p.u) / speed : -1e9;
      lastScan = s;
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (land) ctx.drawImage(land, 0, 0, W, H);

      // read the plots the scan has just crossed
      const s = scanAt(t);
      const prev = lastScan;
      lastScan = s;
      for (const p of plots) {
        const crossed = prev <= s ? p.u > prev && p.u <= s : p.u <= s; // a new pass starts at the far edge
        if (!crossed) continue;
        p.lit = t;
        if (p.stress && signals.length < 2 && !still) {
          // label it only if the whole label lands in open ground
          const label = FINDINGS[finding++ % FINDINGS.length];
          ctx.font = `700 12px ${font}`;
          const tw = ctx.measureText(label).width;
          const [bx, by] = [p.cx + 14, p.cy - 30];
          const free = [p.cx, bx, bx + tw + 20].every((x) => [p.cy, by, by + 24].every((y) => isFree(x, y)));
          signals.push({ p, t0: t, label, tw, free });
        }
      }

      // lit plots, fading in crop-health colour behind the scan
      for (const p of plots) {
        const age = t - p.lit;
        const signalled = signals.some((g) => g.p === p);
        if (age > FADE && !signalled) continue;
        const k = signalled ? 1 : Math.pow(1 - age / FADE, 1.6);
        const c = p.stress ? AMBER : p.health > 0.78 ? LIME : p.health > 0.5 ? LEAF : FIELD;
        ctx.beginPath();
        ctx.moveTo(p.pts[0], p.pts[1]);
        for (let n = 2; n < 8; n += 2) ctx.lineTo(p.pts[n], p.pts[n + 1]);
        ctx.closePath();
        ctx.fillStyle = rgba(c, (p.stress ? 0.55 : c === LIME ? 0.3 : 0.42) * k);
        ctx.fill();
        if (p.stress && k > 0.2) {
          ctx.strokeStyle = rgba(AMBER, 0.8 * k);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // the scan: a soft wash behind a bright leading edge
      ctx.save();
      ctx.rotate(ANGLE);
      const wash = ctx.createLinearGradient(s - 300, 0, s, 0);
      wash.addColorStop(0, rgba(LIME, 0));
      wash.addColorStop(1, rgba(LIME, 0.14));
      ctx.fillStyle = wash;
      ctx.fillRect(s - 300, vMin - 40, 300, vMax - vMin + 80);
      for (const [w, a] of [
        [10, 0.06],
        [4, 0.16],
        [1.4, 0.75],
      ]) {
        ctx.fillStyle = rgba(LIME, a);
        ctx.fillRect(s - w / 2, vMin - 40, w, vMax - vMin + 80);
      }
      ctx.restore();

      // findings: a ring on the plot, a signal along the line to the assistant, a short label
      signals = signals.filter((g) => t - g.t0 < SIGNAL);
      for (const g of signals) {
        const age = t - g.t0;
        const life = Math.min(1, age / 250) * Math.min(1, (SIGNAL - age) / 500);
        const { cx, cy } = g.p;
        const mx = (cx + node.x) / 2;
        const my = Math.min(cy, node.y) - 60;
        ctx.strokeStyle = rgba(LIME, 0.28 * life);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(mx, my, node.x, node.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const ring = (age % 1400) / 1400;
        ctx.strokeStyle = rgba(AMBER, (1 - ring) * 0.9 * life);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 5 + ring * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = rgba(AMBER, life);
        ctx.beginPath();
        ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
        ctx.fill();

        const k = Math.min(1, age / 1300);
        if (k < 1) {
          const e = 1 - Math.pow(1 - k, 3);
          const x = (1 - e) * (1 - e) * cx + 2 * (1 - e) * e * mx + e * e * node.x;
          const y = (1 - e) * (1 - e) * cy + 2 * (1 - e) * e * my + e * e * node.y;
          ctx.fillStyle = rgba(LIME, 0.25);
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = rgba(LIME, 1);
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (age - 1300 < 40) nodeHit = t;

        if (g.free) {
          ctx.font = `700 12px ${font}`;
          const tw = g.tw;
          const bx = cx + 14;
          const by = cy - 30;
          ctx.fillStyle = `rgba(2,30,38,${(0.88 * life).toFixed(3)})`;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, by, tw + 20, 24, 12);
          else ctx.rect(bx, by, tw + 20, 24);
          ctx.fill();
          ctx.strokeStyle = rgba(AMBER, 0.6 * life);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = rgba([255, 255, 255], 0.92 * life);
          ctx.fillText(g.label, bx + 10, by + 16);
        }
      }

      // the assistant's end of the line: it glows when a signal lands
      const hit = Math.max(0, 1 - (t - nodeHit) / 900);
      const breathe = 0.5 + 0.5 * Math.sin(t / 700);
      ctx.fillStyle = rgba(LIME, 0.1 + 0.08 * breathe + 0.3 * hit);
      ctx.beginPath();
      ctx.arc(node.x, node.y, 14 + 10 * hit, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(LIME, 0.95);
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    build();

    if (still) {
      // a single, calm frame: the scan part-way across with the plots behind it lit
      const t = PASS * 0.62;
      preroll(t);
      draw(t);
      const ro = new ResizeObserver(() => {
        build();
        preroll(t);
        draw(t);
      });
      ro.observe(host);
      return () => ro.disconnect();
    }

    let raf = 0;
    let visible = true;
    let lastFrame = 0;
    const t0 = performance.now() - PASS * 0.45; // open with the scan already under way
    preroll(PASS * 0.45);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastFrame < 31) return; // about 30 frames a second is plenty for this
      lastFrame = now;
      draw(now - t0);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(cv);
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    let resizeT = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(() => {
        build();
        signals = [];
        preroll(performance.now() - t0);
      }, 120);
    });
    ro.observe(host);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.clearTimeout(resizeT);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />;
}
