/*
 * iFarmer delta: a realistic, procedural Bangladeshi landscape for the homepage story.
 * River, flooded paddy, tree-ringed homesteads, a market town and a riverside iFarmer Center,
 * under a physical sky whose sun moves from dawn to golden hour as the season unfolds.
 *
 * Scroll progress p (0..1) runs through the beats in src/content/story3d.ts. Each beat has a
 * camera key below; the camera flies between them along a smooth spline.
 */
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  BloomEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

export type Quality = 'high' | 'low';

/* ------------------------------------------------------------------ helpers */
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x: number, y: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct = 4) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ world layout (metres) */
const RIVER = new THREE.CatmullRomCurve3([
  V(-700, 0, 40), V(-420, 0, 70), V(-220, 0, 150), V(-40, 0, 175), V(110, 0, 130), V(230, 0, 150), V(380, 0, 90), V(700, 0, 120),
]);
const RIVER_W = 46;
const HOME = V(0, 0, 0);
const TOWN = V(-120, 0, -70);
const BAZAAR = V(95, 0, -48);
const CENTER = V(120, 0, 96);
const FIELD = { x0: 18, x1: 200, z0: 18, z1: 82 };

const riverPts = RIVER.getSpacedPoints(400);
function riverDist(x: number, z: number) {
  let best = 1e9;
  for (let i = 0; i < riverPts.length; i++) {
    const dx = riverPts[i].x - x;
    const dz = riverPts[i].z - z;
    const d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/* ------------------------------------------------------------------ camera keys (one per beat) */
// The camera orbits a target: d = distance (m), b = bearing from the target in degrees (0 = +z, 90 = +x),
// e = elevation in degrees. sun = sun elevation, az = fixed sun azimuth (null = three-quarter light
// from the view), dof = blur strength, s = how far the subject sits right of centre on wide screens.
type Key = { t: THREE.Vector3; d: number; b: number; e: number; sun: number; az: number | null; dof: number; s?: number; orbit?: number };
const KEYS: Record<string, Key> = {
  intro: { t: V(15, 0, 10), d: 215, b: -130, e: 21, sun: 12, az: 70, dof: 0, s: 0.3, orbit: 24 },
  apply: { t: V(1.5, 1.6, -1.5), d: 7.5, b: 36, e: 7, sun: 16, az: null, dof: 1, s: 0.16 },
  fund: { t: V(-102, 5, -48), d: 36, b: -30, e: 12, sun: 24, az: null, dof: 0.5 },
  receive: { t: V(-45, 8, -24), d: 75, b: -110, e: 16, sun: 32, az: null, dof: 0.2 },
  buy: { t: V(97, 2.2, -49), d: 16, b: 22, e: 9, sun: 40, az: null, dof: 0.9 },
  card: { t: V(80, 2, -40), d: 26, b: -55, e: 13, sun: 45, az: null, dof: 0.6 },
  grow: { t: V(80, 1.2, 44), d: 13, b: -133, e: 8, sun: 50, az: null, dof: 1 },
  grow2: { t: V(94, 1, 50), d: 52, b: -125, e: 27, sun: 50, az: null, dof: 0.3 },
  harvest: { t: V(122, 1, 52), d: 24, b: 139, e: 13, sun: 36, az: null, dof: 0.7 },
  collect: { t: V(132, 2, 89), d: 26, b: -125, e: 13, sun: 28, az: null, dof: 0.7 },
  dispatch: { t: V(185, 1, 55), d: 36, b: -100, e: 15, sun: 21, az: null, dof: 0.4 },
  center: { t: V(120, 2.4, 84), d: 17, b: 16, e: 8, sun: 15, az: null, dof: 0.6 },
  paid: { t: V(1.5, 1.6, -1.5), d: 8, b: 50, e: 8, sun: 10, az: null, dof: 1, s: 0.16 },
  returns: { t: V(-90, 6, -48), d: 44, b: 40, e: 15, sun: 7, az: null, dof: 0.3 },
  outro: { t: V(20, 0, 20), d: 240, b: 46, e: 20, sun: 5, az: 200, dof: 0 },
};
const smoother = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

export type LabelAnchor = THREE.Vector3;

/* ------------------------------------------------------------------ materials */
const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, rough = 0.9, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const key = color + rough + JSON.stringify(Object.keys(extra));
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
    mats.set(key, m);
  }
  return m;
}
function mesh(g: THREE.BufferGeometry, m: THREE.Material, cast = true, recv = true) {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = recv;
  return o;
}

/** Adds wind sway to a standard material: displacement grows with height above the instance base. */
type Uniforms = { uTime: { value: number }; uGrow?: { value: number }; uRipen?: { value: number }; uHarvest?: { value: number } };
function windify(m: THREE.MeshStandardMaterial, uni: Uniforms, strength: number, height: number, crop = false) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        ${crop ? 'uniform float uGrow; uniform float uHarvest; attribute float aPlot; varying float vH;' : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float h = clamp(position.y / ${height.toFixed(2)}, 0.0, 1.0);
        ${
          crop
            ? `float cut = step(aPlot, uHarvest - 0.5);
               transformed.y *= mix(uGrow, 0.12, cut);
               transformed.xz *= mix(0.55 + 0.45 * uGrow, 0.7, cut);
               vH = h;`
            : ''
        }
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 ip = vec3(0.0);
        #endif
        float w = sin(uTime * 1.6 + ip.x * 0.11 + ip.z * 0.07) * 0.6 + sin(uTime * 2.7 + ip.x * 0.31) * 0.25 + sin(uTime*0.6 + ip.z*0.03)*0.5;
        transformed.x += w * ${strength.toFixed(3)} * h * h;
        transformed.z += w * ${(strength * 0.5).toFixed(3)} * h * h;`,
      );
    if (crop) {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform float uRipen;\nvarying float vH;`)
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          vec3 gold = vec3(0.86, 0.68, 0.30);
          diffuseColor.rgb = mix(diffuseColor.rgb, gold * (0.75 + 0.35 * vH), uRipen);
          diffuseColor.rgb *= 0.72 + 0.4 * vH;`,
        );
    }
  };
  m.customProgramCacheKey = () => 'wind' + strength + height + crop;
}

/* ------------------------------------------------------------------ the world */
export interface DeltaOptions {
  quality: Quality;
  onFrame?: (w: DeltaWorld) => void;
}

type Walker = { g: THREE.Group; parts: PersonParts; path: THREE.CatmullRomCurve3; speed: number; offset: number; mode: 'walk' | 'bend' | 'idle' };
type PersonParts = { legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D; torso: THREE.Object3D };
type Vehicle = { g: THREE.Group; wheels: THREE.Object3D[]; path: THREE.CatmullRomCurve3; beat: string; from: number; to: number; t0: number; t1: number };
type Arc = { mesh: THREE.Mesh; uni: { uProgress: { value: number }; uTime: { value: number }; uOpacity: { value: number } } };

export class DeltaWorld {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  progress = 0;
  target = 0;
  frameShift = 1;
  anchors: Record<string, THREE.Vector3> = {};

  private opts: DeltaOptions;
  private high: boolean;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private visible = true;
  private ids: string[];
  private vel = 0;
  private loopUni = { uTime: { value: 0 }, uOpacity: { value: 0 }, uDraw: { value: 0 } };
  private composer?: EffectComposer;
  private dof?: DepthOfFieldEffect;
  private ao?: N8AOPostPass;
  private sky!: Sky;
  private sun!: THREE.DirectionalLight;
  private hemi!: THREE.HemisphereLight;
  private sunDir = new THREE.Vector3();
  private pmrem!: THREE.PMREMGenerator;
  private envRT?: THREE.WebGLRenderTarget;
  private skyScene = new THREE.Scene();
  private lastEnvSun = -99;
  private water?: Water;
  private windUni: Uniforms = { uTime: { value: 0 } };
  private cropUni: Required<Uniforms> = { uTime: { value: 0 }, uGrow: { value: 0.25 }, uRipen: { value: 0 }, uHarvest: { value: 0 } };
  private plotCount = 0;
  private paddyMats: THREE.MeshStandardMaterial[] = [];
  private landMat!: THREE.MeshStandardMaterial;
  private walkers: Walker[] = [];
  private vehicles: Vehicle[] = [];
  private arcs: Record<string, Arc> = {};
  private pulses: THREE.Mesh[] = [];
  private phone!: THREE.Mesh;
  private farmer!: { g: THREE.Group; parts: PersonParts };
  private birds!: THREE.InstancedMesh;
  private birdMat!: THREE.MeshBasicMaterial;
  private smoke!: THREE.Points;
  private satellite!: THREE.Group;
  private drone!: THREE.Group;
  private sacks: THREE.Object3D[] = [];
  private shopSacks: THREE.Object3D[] = [];
  private boats: { g: THREE.Group; t: number; speed: number }[] = [];
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private aspect = 1.6;

  constructor(canvas: HTMLCanvasElement, beatIds: string[], opts: DeltaOptions) {
    this.opts = opts;
    this.high = opts.quality === 'high';
    this.ids = beatIds;
    const r = new THREE.WebGLRenderer({ canvas, antialias: !this.high, powerPreference: 'high-performance', stencil: false, depth: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.high ? 1.5 : 1.25));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = this.high ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.62;
    this.renderer = r;
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.3, 4000);
    this.pmrem = new THREE.PMREMGenerator(r);

    this.buildSky();
    this.buildLand();
    this.buildRiver();
    this.buildRoads();
    this.buildFields();
    this.buildHomestead();
    this.buildTown();
    this.buildBazaar();
    this.buildCenter();
    this.buildVillages();
    this.buildPeople();
    this.buildVehicles();
    this.buildBoats();
    this.buildArcs();
    this.buildSkyLife();
    if (this.high) this.buildComposer();
    this.resize();
    this.apply(0, 0);
  }

  /* ------------------------------ sky, sun, fog */
  private buildSky() {
    const sky = new Sky();
    sky.scale.setScalar(20000);
    const u = sky.material.uniforms;
    u.turbidity.value = 7;
    u.rayleigh.value = 1.6;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.86;
    this.sky = sky;
    this.scene.add(sky);
    const sky2 = new Sky();
    sky2.scale.setScalar(20000);
    sky2.material = sky.material;
    this.skyScene.add(sky2);

    this.scene.fog = new THREE.FogExp2('#c9d3c4', 0.0011);
    this.hemi = new THREE.HemisphereLight('#dfe9f2', '#5b6a3a', 0.45);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight('#fff1dc', 3.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.high ? 2048 : 1024, this.high ? 2048 : 1024);
    const c = sun.shadow.camera;
    c.left = -70;
    c.right = 70;
    c.top = 70;
    c.bottom = -70;
    c.near = 1;
    c.far = 500;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    this.sun = sun;
    this.scene.add(sun, sun.target);
  }

  private setSun(elev: number, az: number) {
    const phi = THREE.MathUtils.degToRad(90 - elev);
    const theta = THREE.MathUtils.degToRad(az);
    this.sunDir.setFromSphericalCoords(1, phi, theta);
    this.sky.material.uniforms.sunPosition.value.copy(this.sunDir);
    const low = 1 - smooth(4, 40, elev);
    this.sun.color.setRGB(1, lerp(0.95, 0.66, low), lerp(0.88, 0.42, low));
    this.sun.intensity = lerp(1.6, 4.2, smooth(0, 25, elev));
    this.hemi.intensity = lerp(0.18, 0.32, smooth(0, 30, elev));
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.setRGB(lerp(0.72, 0.93, low), lerp(0.8, 0.76, low), lerp(0.86, 0.64, low));
    if (this.water) {
      this.water.material.uniforms.sunDirection.value.copy(this.sunDir).normalize();
      this.water.material.uniforms.sunColor.value.copy(this.sun.color);
    }
    // the environment map follows the sky, refreshed only when the sun has moved enough
    if (Math.abs(elev - this.lastEnvSun) > 2.5) {
      this.lastEnvSun = elev;
      this.envRT?.dispose();
      this.envRT = this.pmrem.fromScene(this.skyScene as unknown as THREE.Scene, 0, 1, 25000);
      this.scene.environment = this.envRT.texture;
      this.scene.environmentIntensity = lerp(0.25, 0.55, smooth(0, 30, elev));
    }
  }

  /* ------------------------------ land: one big terrain with a painted field patchwork */
  private buildLand() {
    const size = 2400;
    const seg = this.high ? 220 : 140;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = riverDist(x, z);
      let y = (fbm(x * 0.01, z * 0.01, 3) - 0.5) * 0.6 - 0.45;
      const bank = smooth(RIVER_W / 2 + 14, RIVER_W / 2 - 2, d);
      y = lerp(y, -3.2, bank);
      pos.setY(i, y);
    }
    g.computeVertexNormals();

    // patchwork of paddy, painted once: plots in rotated blocks, bunds, groves, the river bank
    const N = 2048;
    const tex = canvasTex(
      N,
      N,
      (c) => {
        const px = (x: number) => ((x + size / 2) / size) * N;
        c.fillStyle = '#6f8f3c';
        c.fillRect(0, 0, N, N);
        const R = rng(5);
        const greens = ['#7da445', '#6c963a', '#86ab4a', '#5f8735', '#93b35a', '#748f3a', '#8a9a4a', '#6a8a4a'];
        for (let b = 0; b < 160; b++) {
          const cx = R() * N;
          const cy = R() * N;
          const ang = (R() - 0.5) * 0.5;
          const pw = 10 + R() * 14;
          const ph = 7 + R() * 8;
          c.save();
          c.translate(cx, cy);
          c.rotate(ang);
          for (let i = -6; i < 6; i++)
            for (let j = -5; j < 5; j++) {
              c.fillStyle = greens[Math.floor(R() * greens.length)];
              if (R() < 0.12) c.fillStyle = '#5d6d55';
              c.fillRect(i * pw, j * ph, pw - 0.8, ph - 0.8);
            }
          c.restore();
        }
        // river banks: wet silt
        c.strokeStyle = '#8f8a68';
        c.lineWidth = ((RIVER_W + 22) / size) * N;
        c.lineCap = 'round';
        c.beginPath();
        riverPts.forEach((p, i) => (i ? c.lineTo(px(p.x), px(p.z)) : c.moveTo(px(p.x), px(p.z))));
        c.stroke();
        // keep the main story area plain: detailed geometry sits on top
        c.fillStyle = '#6d8a3c';
        c.fillRect(px(-180), px(-140), (380 / size) * N, (260 / size) * N);
      },
      false,
    );
    this.landMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
    const land = mesh(g, this.landMat, false, true);
    this.scene.add(land);
    // beyond the patchwork, flat paddy to the horizon so no edge ever shows
    const outer = mesh(new THREE.RingGeometry(1150, 14000, 64, 1), new THREE.MeshStandardMaterial({ color: '#6f9040', roughness: 1 }), false, false);
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.5;
    this.scene.add(outer);

    // grass detail near the story: a tiled noise texture on a smaller plane
    const grass = canvasTex(256, 256, (c) => {
      const img = c.createImageData(256, 256);
      for (let y = 0; y < 256; y++)
        for (let x = 0; x < 256; x++) {
          const n = fbm(x / 9, y / 9, 3) * 0.7 + hash2(x, y) * 0.3;
          const i = (y * 256 + x) * 4;
          img.data[i] = 112 + n * 52;
          img.data[i + 1] = 150 + n * 50;
          img.data[i + 2] = 64 + n * 26;
          img.data[i + 3] = 255;
        }
      c.putImageData(img, 0, 0);
    });
    grass.repeat.set(90, 64);
    const near = new THREE.PlaneGeometry(380, 260, 120, 80);
    near.rotateX(-Math.PI / 2);
    near.translate(10, 0.02, -10);
    const np = near.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < np.count; i++) {
      const x = np.getX(i);
      const z = np.getZ(i);
      const d = riverDist(x, z);
      np.setY(i, lerp(0.02, -3.2, smooth(RIVER_W / 2 + 14, RIVER_W / 2 - 2, d)));
    }
    near.computeVertexNormals();
    const nearMat = new THREE.MeshStandardMaterial({ map: grass, roughness: 1, transparent: false });
    // fade the detail plane's edge into the patchwork with alpha
    const alpha = canvasTex(
      256,
      256,
      (c) => {
        const gr = c.createRadialGradient(128, 128, 60, 128, 128, 128);
        gr.addColorStop(0, '#fff');
        gr.addColorStop(1, '#000');
        c.fillStyle = gr;
        c.fillRect(0, 0, 256, 256);
      },
      false,
    );
    nearMat.alphaMap = alpha;
    nearMat.transparent = true;
    nearMat.depthWrite = true;
    // alphaMap uses uv, map uses repeat; give the alpha its own unrepeated channel
    nearMat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <alphamap_fragment>', 'diffuseColor.a *= texture2D(alphaMap, vAlphaMapUv / vec2(90.0, 64.0)).g;');
    };
    alpha.wrapS = alpha.wrapT = THREE.ClampToEdgeWrapping;
    nearMat.alphaMap.repeat.set(90, 64);
    const n = mesh(near, nearMat, false, true);
    this.scene.add(n);
  }

  /* ------------------------------ the river, with real reflections on high quality */
  private buildRiver() {
    // ribbon in local x/y (rotated flat later) so Water's mirror plane is correct
    const pts = RIVER.getSpacedPoints(300);
    const verts: number[] = [];
    const idx: number[] = [];
    const uvs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const t = RIVER.getTangentAt(i / (pts.length - 1));
      const n = V(-t.z, 0, t.x).multiplyScalar((RIVER_W + 18) / 2);
      const a = p.clone().add(n);
      const b = p.clone().sub(n);
      verts.push(a.x, -a.z, 0, b.x, -b.z, 0);
      uvs.push(0, i / 10, 1, i / 10);
      if (i > 0) {
        const k = i * 2;
        idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();

    const normals = this.waterNormals();
    if (this.high) {
      const w = new Water(g, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: normals,
        sunDirection: new THREE.Vector3(0.5, 0.5, 0),
        sunColor: 0xfff1dc,
        waterColor: 0x40523a,
        distortionScale: 2.2,
        fog: true,
      });
      w.material.uniforms.size.value = 3.5;
      w.material.side = THREE.DoubleSide;
      w.rotation.x = -Math.PI / 2;
      w.position.y = -1.35;
      this.water = w;
      this.scene.add(w);
    } else {
      const m = new THREE.MeshStandardMaterial({ color: '#4c5f44', roughness: 0.12, metalness: 0.1, normalMap: normals, side: THREE.DoubleSide });
      m.normalScale.set(0.3, 0.3);
      const w = mesh(g, m, false, false);
      w.rotation.x = -Math.PI / 2;
      w.position.y = -1.35;
      this.scene.add(w);
    }
  }

  private waterNormals() {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d')!;
    const img = g.createImageData(S, S);
    const h = (x: number, y: number) =>
      Math.sin((x / S) * Math.PI * 2 * 3 + Math.sin((y / S) * Math.PI * 2 * 2)) * 0.5 +
      Math.sin((y / S) * Math.PI * 2 * 5 + (x / S) * Math.PI * 2) * 0.35 +
      Math.sin(((x + y) / S) * Math.PI * 2 * 7) * 0.2;
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const dx = h(x + 1, y) - h(x - 1, y);
        const dy = h(x, y + 1) - h(x, y - 1);
        const v = V(-dx * 2, -dy * 2, 1).normalize();
        const i = (y * S + x) * 4;
        img.data[i] = (v.x * 0.5 + 0.5) * 255;
        img.data[i + 1] = (v.y * 0.5 + 0.5) * 255;
        img.data[i + 2] = (v.z * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  /* ------------------------------ roads: brick village roads and an asphalt highway */
  private roadCurves: Record<string, THREE.CatmullRomCurve3> = {};
  private buildRoads() {
    const brick = canvasTex(256, 256, (c) => {
      c.fillStyle = '#8d5a45';
      c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 16)
        for (let x = 0; x < 256; x += 32) {
          const off = (y / 16) % 2 ? 16 : 0;
          const v = 0.75 + hash2(x, y) * 0.4;
          c.fillStyle = `rgb(${150 * v | 0},${92 * v | 0},${70 * v | 0})`;
          c.fillRect(x + off + 1, y + 1, 30, 14);
        }
    });
    const asphalt = canvasTex(256, 256, (c) => {
      c.fillStyle = '#4b4b48';
      c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        c.fillStyle = `rgba(${hash2(i, 1) > 0.5 ? 255 : 0},${hash2(i, 1) > 0.5 ? 255 : 0},${hash2(i, 1) > 0.5 ? 255 : 0},0.05)`;
        c.fillRect(hash2(i, 2) * 256, hash2(i, 3) * 256, 2, 2);
      }
      c.fillStyle = 'rgba(240,240,230,0.7)';
      for (let y = 0; y < 256; y += 64) c.fillRect(126, y, 4, 34);
    });
    const ribbon = (curve: THREE.CatmullRomCurve3, w: number, tex: THREE.Texture, y: number, tile: number) => {
      const n = Math.floor(curve.getLength() / 2);
      const pts = curve.getSpacedPoints(n);
      const verts: number[] = [];
      const uvs: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= n; i++) {
        const t = curve.getTangentAt(i / n);
        const nrm = V(-t.z, 0, t.x).multiplyScalar(w / 2);
        const a = pts[i].clone().add(nrm);
        const b = pts[i].clone().sub(nrm);
        verts.push(a.x, y, a.z, b.x, y, b.z);
        uvs.push(0, (i * 2) / tile, 1, (i * 2) / tile);
        if (i) {
          const k = i * 2;
          idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
      this.scene.add(mesh(g, m, false, true));
    };
    this.roadCurves.village = new THREE.CatmullRomCurve3([V(-150, 0, -74), TOWN.clone().add(V(14, 0, 6)), V(-60, 0, -40), V(-18, 0, -18), V(10, 0, -16), V(50, 0, -30), BAZAAR.clone().add(V(-4, 0, 9)), V(150, 0, -46), V(260, 0, -30)]);
    this.roadCurves.field = new THREE.CatmullRomCurve3([V(12, 0, -16), V(16, 0, 10), V(14, 0, 40), V(40, 0, 88), V(80, 0, 90), CENTER.clone().add(V(-16, 0, -10))]);
    this.roadCurves.highway = new THREE.CatmullRomCurve3([CENTER.clone().add(V(-6, 0, -16)), V(160, 0, 70), V(210, 0, 42), V(300, 0, 10), V(480, 0, -20), V(800, 0, -40)]);
    ribbon(this.roadCurves.village, 4.2, brick, 0.09, 4);
    ribbon(this.roadCurves.field, 3.4, brick, 0.09, 4);
    ribbon(this.roadCurves.highway, 7.5, asphalt, 0.1, 14);

    // power poles and wires along the highway
    const pole = new THREE.CylinderGeometry(0.12, 0.16, 9, 6);
    pole.translate(0, 4.5, 0);
    const arm = new THREE.BoxGeometry(1.8, 0.12, 0.12);
    arm.translate(0, 8.4, 0);
    const poleG = mergeGeometries([pole, arm])!;
    const L = this.roadCurves.highway.getLength();
    const tops: THREE.Vector3[] = [];
    const poles = new THREE.InstancedMesh(poleG, mat('#8a8a84', 0.8), Math.floor(L / 35));
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < poles.count; i++) {
      const u = (i * 35) / L;
      const p = this.roadCurves.highway.getPointAt(u);
      const t = this.roadCurves.highway.getTangentAt(u);
      const side = V(-t.z, 0, t.x).multiplyScalar(6);
      p.add(side);
      m4.makeRotationY(Math.atan2(-t.z, t.x));
      m4.setPosition(p.x, 0, p.z);
      poles.setMatrixAt(i, m4);
      tops.push(p.clone().setY(8.4));
    }
    poles.castShadow = true;
    this.scene.add(poles);
    const wire: number[] = [];
    for (let i = 1; i < tops.length; i++)
      for (let s = 0; s < 12; s++) {
        const a = tops[i - 1].clone().lerp(tops[i], s / 12);
        const b = tops[i - 1].clone().lerp(tops[i], (s + 1) / 12);
        a.y -= Math.sin((s / 12) * Math.PI) * 0.8;
        b.y -= Math.sin(((s + 1) / 12) * Math.PI) * 0.8;
        wire.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
    this.scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#2b2b2b', transparent: true, opacity: 0.6 })));
  }

  /* ------------------------------ paddy: flooded plots with wind-blown rice */
  private buildFields() {
    const { x0, x1, z0, z1 } = FIELD;
    const pw = 20;
    const pd = 13;
    const bund = 1.1;
    const plots: { x: number; z: number }[] = [];
    for (let x = x0; x + pw <= x1; x += pw + bund)
      for (let z = z0; z + pd <= z1; z += pd + bund) if (riverDist(x + pw / 2, z + pd / 2) > RIVER_W / 2 + 12) plots.push({ x, z });
    // harvest order: from the centre outward
    plots.sort((a, b) => Math.hypot(a.x - 120, a.z - 56) - Math.hypot(b.x - 120, b.z - 56));
    this.plotCount = plots.length;

    const mud = canvasTex(256, 256, (c) => {
      const img = c.createImageData(256, 256);
      for (let y = 0; y < 256; y++)
        for (let x = 0; x < 256; x++) {
          const n = fbm(x / 14, y / 14, 4);
          const i = (y * 256 + x) * 4;
          img.data[i] = 78 + n * 40;
          img.data[i + 1] = 74 + n * 36;
          img.data[i + 2] = 52 + n * 22;
          img.data[i + 3] = 255;
        }
      c.putImageData(img, 0, 0);
    });
    mud.repeat.set(3, 2);
    const paddyMat = new THREE.MeshStandardMaterial({ map: mud, roughness: 0.08, metalness: 0.05, color: '#b8c0a8' });
    this.paddyMats.push(paddyMat);
    const bundMat = mat('#7c8a4a', 1);
    const plotG = new THREE.PlaneGeometry(pw, pd);
    plotG.rotateX(-Math.PI / 2);
    // plots sit just above the ground
    const bundG = new THREE.BoxGeometry(1, 0.35, 1);
    bundG.translate(0, 0.175, 0);
    const bunds = new THREE.InstancedMesh(bundG, bundMat, plots.length * 2);
    const m4 = new THREE.Matrix4();
    plots.forEach((p, i) => {
      const m = mesh(plotG, paddyMat, false, true);
      m.position.set(p.x + pw / 2, 0.08, p.z + pd / 2);
      this.scene.add(m);
      m4.compose(V(p.x + pw / 2, 0, p.z - bund / 2), new THREE.Quaternion(), V(pw + bund, 1, bund));
      bunds.setMatrixAt(i * 2, m4);
      m4.compose(V(p.x - bund / 2, 0, p.z + pd / 2), new THREE.Quaternion(), V(bund, 1, pd + bund));
      bunds.setMatrixAt(i * 2 + 1, m4);
    });
    bunds.receiveShadow = true;
    this.scene.add(bunds);

    // rice tuft: six curved blades
    const blade = (ang: number, lean: number, h: number) => {
      const segs = 4;
      const g = new THREE.BufferGeometry();
      const v: number[] = [];
      const idx: number[] = [];
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const w = 0.028 * (1 - t * 0.85);
        const bend = lean * t * t;
        const y = h * t;
        v.push(-w, y, bend, w, y, bend);
        if (s) {
          const k = s * 2;
          idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
        }
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      g.setIndex(idx);
      g.rotateY(ang);
      return g;
    };
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 7; i++) parts.push(blade((i / 7) * Math.PI * 2 + i, 0.18 + (i % 3) * 0.08, 0.85 + (i % 2) * 0.15));
    const tuft = mergeGeometries(parts)!;
    tuft.computeVertexNormals();
    const spacing = this.high ? 0.42 : 0.62;
    const perX = Math.floor(pw / spacing);
    const perZ = Math.floor(pd / spacing);
    const count = plots.length * perX * perZ;
    const riceMat = new THREE.MeshStandardMaterial({ color: '#6f9a2e', roughness: 0.75, side: THREE.DoubleSide });
    windify(riceMat, this.cropUni, 0.22, 1.0, true);
    const rice = new THREE.InstancedMesh(tuft, riceMat, count);
    const plotAttr = new Float32Array(count);
    const R = rng(9);
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    let k = 0;
    plots.forEach((p, pi) => {
      for (let i = 0; i < perX; i++)
        for (let j = 0; j < perZ; j++) {
          const x = p.x + (i + 0.5) * spacing + (R() - 0.5) * 0.08;
          const z = p.z + (j + 0.5) * spacing + (R() - 0.5) * 0.08;
          q.setFromAxisAngle(V(0, 1, 0), R() * Math.PI * 2);
          const s = 0.85 + R() * 0.3;
          m4.compose(V(x, 0.06, z), q, V(s, s * (0.9 + R() * 0.2), s));
          rice.setMatrixAt(k, m4);
          col.setHSL(0.22 + R() * 0.03, 0.55, 0.42 + R() * 0.08);
          rice.setColorAt(k, col);
          plotAttr[k] = pi;
          k++;
        }
    });
    tuft.setAttribute('aPlot', new THREE.InstancedBufferAttribute(plotAttr, 1));
    rice.castShadow = true;
    rice.receiveShadow = true;
    rice.frustumCulled = false;
    this.scene.add(rice);

    // soil sensor in the grow plot
    const s = new THREE.Group();
    const pole = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), mat('#9aa39c', 0.5, { metalness: 0.6 }));
    pole.position.y = 0.8;
    const box = mesh(new THREE.BoxGeometry(0.3, 0.22, 0.16), mat('#e9efe4', 0.5));
    box.position.y = 1.5;
    const panel = mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), mat('#1f3e64', 0.25, { metalness: 0.4 }));
    panel.position.set(0, 1.7, 0);
    panel.rotation.x = -0.5;
    const led = mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#c6ff5a' }));
    led.position.set(0.1, 1.52, 0.081);
    s.add(pole, box, panel, led);
    s.position.set(82, 0, 45);
    this.scene.add(s);
    this.anchors.sensor = V(82, 2.3, 45);
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 48), new THREE.MeshBasicMaterial({ color: '#ddff80', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      r.rotation.x = -Math.PI / 2;
      r.position.set(82, 0.35, 45);
      r.userData.kind = 'sensor';
      this.scene.add(r);
      this.pulses.push(r);
    }
  }

  /* ------------------------------ vegetation */
  /* ------------------------------ trees: leaf cards over a soft inner crown, textured palm fronds */
  private foliageTex?: { leaf: THREE.Texture; frond: THREE.Texture; banana: THREE.Texture };
  private foliage() {
    if (this.foliageTex) return this.foliageTex;
    const leaf = canvasTex(
      256,
      256,
      (c) => {
        const R = rng(7);
        for (let i = 0; i < 150; i++) {
          const a = R() * Math.PI * 2;
          const rr = Math.sqrt(R()) * 104;
          const x = 128 + Math.cos(a) * rr;
          const y = 128 + Math.sin(a) * rr;
          const len = 20 + R() * 18;
          const wid = 7 + R() * 6;
          const lum = 0.75 + R() * 0.5;
          c.save();
          c.translate(x, y);
          c.rotate(R() * Math.PI * 2);
          c.fillStyle = `rgb(${(58 * lum) | 0},${(104 * lum) | 0},${(38 * lum) | 0})`;
          c.beginPath();
          c.moveTo(-len / 2, 0);
          c.quadraticCurveTo(0, -wid, len / 2, 0);
          c.quadraticCurveTo(0, wid, -len / 2, 0);
          c.fill();
          c.strokeStyle = 'rgba(25,45,15,0.35)';
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(-len / 2, 0);
          c.lineTo(len / 2, 0);
          c.stroke();
          c.restore();
        }
      },
      false,
    );
    const frond = canvasTex(
      128,
      512,
      (c) => {
        const R = rng(9);
        c.strokeStyle = '#6b7f3a';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(64, 512);
        c.lineTo(64, 6);
        c.stroke();
        for (let y = 500; y > 10; y -= 6) {
          const t = 1 - y / 512;
          const len = 60 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.08)) + 6;
          for (const side of [-1, 1]) {
            const lum = 0.8 + R() * 0.4;
            c.strokeStyle = `rgb(${(66 * lum) | 0},${(112 * lum) | 0},${(40 * lum) | 0})`;
            c.lineWidth = 3.2 + R() * 1.4;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(64, y);
            const ex = 64 + side * len * (0.92 + R() * 0.08);
            const ey = y - len * 0.55;
            c.quadraticCurveTo(64 + side * len * 0.5, y - len * 0.2, ex, ey);
            c.stroke();
          }
        }
      },
      false,
    );
    const banana = canvasTex(
      256,
      512,
      (c) => {
        const R = rng(11);
        c.fillStyle = '#5f9a3a';
        c.beginPath();
        c.moveTo(128, 506);
        c.bezierCurveTo(6, 420, 6, 90, 128, 6);
        c.bezierCurveTo(250, 90, 250, 420, 128, 506);
        c.fill();
        for (let y = 20; y < 500; y += 5) {
          c.strokeStyle = `rgba(40,80,25,${0.18 + R() * 0.12})`;
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(128, y);
          c.lineTo(10, y - 40);
          c.moveTo(128, y);
          c.lineTo(246, y - 40);
          c.stroke();
        }
        c.strokeStyle = '#c9d68a';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(128, 510);
        c.lineTo(128, 10);
        c.stroke();
        // wind tears along the edges
        c.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 9; i++) {
          const y = 80 + R() * 380;
          const side = R() < 0.5 ? -1 : 1;
          c.lineWidth = 2 + R() * 2;
          c.beginPath();
          c.moveTo(128 + side * 120, y - 30);
          c.lineTo(128 + side * (24 + R() * 40), y);
          c.stroke();
        }
        c.globalCompositeOperation = 'source-over';
      },
      false,
    );
    this.foliageTex = { leaf, frond, banana };
    return this.foliageTex;
  }

  private treeParts?: Record<'crown' | 'crownFar' | 'palm' | 'banana' | 'areca', { geo: THREE.BufferGeometry; tex?: 'leaf' | 'frond' | 'banana' }[]>;
  private trees() {
    if (this.treeParts) return this.treeParts;
    const tint = (g: THREE.BufferGeometry, fn: (p: THREE.Vector3, n: THREE.Vector3, i: number) => THREE.Color) => {
      const p = g.attributes.position as THREE.BufferAttribute;
      const nr = g.attributes.normal as THREE.BufferAttribute;
      const cols = new Float32Array(p.count * 3);
      const pv = new THREE.Vector3();
      const nv = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        pv.fromBufferAttribute(p, i);
        nv.fromBufferAttribute(nr, i);
        const c = fn(pv, nv, i);
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      return g;
    };
    const solid = (g: THREE.BufferGeometry) => {
      g.deleteAttribute('uv');
      if (g.index) return g;
      g.deleteAttribute('normal');
      const m = mergeVertices(g);
      m.computeVertexNormals();
      return m;
    };
    const bark = new THREE.Color('#5b4636');
    const R = rng(21);

    // broad crown (mango / rain tree): trunk, branches, a dark soft inner crown and leaf cards
    const wood: THREE.BufferGeometry[] = [];
    const trunk = new THREE.CylinderGeometry(0.22, 0.4, 4.6, 10, 3);
    trunk.translate(0, 2.3, 0);
    wood.push(tint(solid(trunk), () => bark));
    for (let i = 0; i < 4; i++) {
      const br = new THREE.CylinderGeometry(0.08, 0.16, 2.6, 6);
      br.translate(0, 1.3, 0);
      br.rotateZ(0.7 + R() * 0.3);
      br.rotateY((i / 4) * Math.PI * 2 + R());
      br.translate(0, 3.6 + R() * 0.6, 0);
      wood.push(tint(solid(br), () => bark));
    }
    const blobs: { c: THREE.Vector3; r: number }[] = [];
    for (let i = 0; i < 6; i++) blobs.push({ c: V((R() - 0.5) * 3.4, 5.2 + R() * 2, (R() - 0.5) * 3.4), r: 1.7 + R() * 1.0 });
    const crownC = V(0, 6.2, 0);
    const blobGeo = (detail: number, shade: number) =>
      blobs.map((bl, i) => {
        const ico = new THREE.IcosahedronGeometry(bl.r, detail);
        ico.deleteAttribute('uv');
        ico.deleteAttribute('normal');
        const b = mergeVertices(ico);
        const p = b.attributes.position as THREE.BufferAttribute;
        for (let j = 0; j < p.count; j++) {
          const x = p.getX(j);
          const y = p.getY(j);
          const z = p.getZ(j);
          const d = 1 + (fbm(x * 0.8 + i * 3, z * 0.8 + y * 0.6, 2) - 0.5) * 0.45;
          p.setXYZ(j, x * d, y * d * 0.8, z * d);
        }
        b.computeVertexNormals();
        b.translate(bl.c.x, bl.c.y, bl.c.z);
        return tint(b, (pp, n) => {
          const t = shade * (0.6 + n.y * 0.28 + (fbm(pp.x * 1.5, pp.z * 1.5, 2) - 0.5) * 0.3);
          return new THREE.Color().setRGB(0.15 * t + 0.03, 0.32 * t + 0.05, 0.1 * t + 0.02);
        });
      });
    const crownWood = mergeGeometries([...wood, ...blobGeo(2, 0.75)])!;
    const cards: THREE.BufferGeometry[] = [];
    const q = new THREE.Quaternion();
    const nrm = new THREE.Vector3();
    for (let i = 0; i < 280; i++) {
      const bl = blobs[i % blobs.length];
      const dir = V(R() - 0.5, R() - 0.25, R() - 0.5).normalize();
      const c = bl.c.clone().addScaledVector(dir, bl.r * (0.8 + R() * 0.32));
      const pl = new THREE.PlaneGeometry(1.7, 1.7);
      q.setFromEuler(new THREE.Euler(R() * Math.PI, R() * Math.PI, R() * Math.PI));
      pl.applyQuaternion(q);
      pl.translate(c.x, c.y * 0.92, c.z);
      // light the card as part of the crown: normals point away from the crown centre
      nrm.copy(c).sub(crownC).normalize().lerp(dir, 0.4).normalize();
      const na = pl.attributes.normal as THREE.BufferAttribute;
      for (let j = 0; j < na.count; j++) na.setXYZ(j, nrm.x, nrm.y, nrm.z);
      const lum = 0.82 + R() * 0.36;
      const warm = R() * 0.08;
      tint(pl, () => new THREE.Color().setRGB(lum + warm, lum, lum * 0.92));
      cards.push(pl);
    }
    const crownLeaf = mergeGeometries(cards)!;
    // far crowns: soft rounded canopy only
    const crownFar = mergeGeometries([...wood.map((g) => g.clone()), ...blobGeo(1, 1)])!;

    // coconut palm: curved trunk and textured fronds
    const curve = new THREE.QuadraticBezierCurve3(V(0, 0, 0), V(0.4, 4, 0), V(1.4, 9, 0));
    const palmTrunk = tint(solid(new THREE.TubeGeometry(curve, 12, 0.18, 8, false)), (pp) => new THREE.Color('#6d5a45').multiplyScalar(0.85 + Math.sin(pp.y * 9) * 0.12));
    const frondGeo = (w: number, l: number, droop: number, fold: number) => {
      const fr = new THREE.PlaneGeometry(w, l, 2, 10);
      const fp = fr.attributes.position as THREE.BufferAttribute;
      for (let j = 0; j < fp.count; j++) {
        const y = fp.getY(j) + l / 2;
        const x = fp.getX(j);
        fp.setY(j, y);
        fp.setZ(j, -droop * y * y - Math.abs(x) * fold);
      }
      fr.computeVertexNormals();
      return fr;
    };
    const fronds: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 13; i++) {
      const fr = frondGeo(2.6, 5, 0.075 + R() * 0.03, 0.35);
      fr.rotateX(-0.35 - R() * 0.35);
      fr.rotateY((i / 13) * Math.PI * 2 + R() * 0.3);
      fr.translate(1.4, 9, 0);
      fronds.push(tint(fr, () => new THREE.Color().setScalar(0.85 + R() * 0.25)));
    }
    const palmLeaf = mergeGeometries(fronds)!;

    // banana: pseudo-stem and broad torn leaves
    const st = new THREE.CylinderGeometry(0.15, 0.24, 2.3, 8);
    st.translate(0, 1.15, 0);
    const banStem = tint(solid(st), () => new THREE.Color('#7e8a4a'));
    const bl: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 8; i++) {
      const lf = new THREE.PlaneGeometry(0.9, 2.6, 2, 6);
      const lp = lf.attributes.position as THREE.BufferAttribute;
      for (let j = 0; j < lp.count; j++) {
        const y = lp.getY(j) + 1.3;
        lp.setY(j, y * 0.9);
        lp.setZ(j, 0.22 * y * y - Math.abs(lp.getX(j)) * 0.35);
      }
      lf.computeVertexNormals();
      lf.rotateX(-1.0 + (i % 3) * 0.22);
      lf.rotateY((i / 8) * Math.PI * 2 + R() * 0.4);
      lf.translate(0, 2.2, 0);
      bl.push(tint(lf, () => new THREE.Color().setScalar(0.85 + R() * 0.25)));
    }
    const banLeaf = mergeGeometries(bl)!;

    // areca (supari) palm: tall and slender
    const at = new THREE.CylinderGeometry(0.1, 0.14, 12, 8, 4);
    at.translate(0, 6, 0);
    const arTrunk = tint(solid(at), (pp) => new THREE.Color('#8b8173').multiplyScalar(0.9 + Math.sin(pp.y * 6) * 0.08));
    const af: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 9; i++) {
      const fr = frondGeo(1.8, 3.4, 0.12, 0.3);
      fr.rotateX(-0.5 - R() * 0.3);
      fr.rotateY((i / 9) * Math.PI * 2 + R() * 0.3);
      fr.translate(0, 12, 0);
      af.push(tint(fr, () => new THREE.Color().setScalar(0.8 + R() * 0.25)));
    }
    const arLeaf = mergeGeometries(af)!;

    this.treeParts = {
      crown: [{ geo: crownWood }, { geo: crownLeaf, tex: 'leaf' }],
      crownFar: [{ geo: crownFar }],
      palm: [{ geo: palmTrunk }, { geo: palmLeaf, tex: 'frond' }],
      banana: [{ geo: banStem }, { geo: banLeaf, tex: 'banana' }],
      areca: [{ geo: arTrunk }, { geo: arLeaf, tex: 'frond' }],
    };
    return this.treeParts;
  }

  private plantTrees(spots: { p: THREE.Vector3; kind: 'crown' | 'palm' | 'banana' | 'areca'; s: number }[], near = true) {
    const parts = this.trees();
    const tex = this.foliage();
    const R = rng(spots.length + 3);
    (['crown', 'palm', 'banana', 'areca'] as const).forEach((kind) => {
      const list = spots.filter((s) => s.kind === kind);
      if (!list.length) return;
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const c = new THREE.Color();
      const mats4: THREE.Matrix4[] = [];
      const cols: THREE.Color[] = [];
      list.forEach((s) => {
        q.setFromAxisAngle(V(0, 1, 0), R() * Math.PI * 2);
        m4.compose(s.p, q, V(s.s, s.s * (0.85 + R() * 0.3), s.s));
        mats4.push(m4.clone());
        c.setRGB(0.85 + R() * 0.3, 0.85 + R() * 0.3, 0.8 + R() * 0.25);
        cols.push(c.clone());
      });
      const set = parts[kind === 'crown' && !near ? 'crownFar' : kind];
      const height = kind === 'areca' ? 12 : kind === 'palm' ? 9 : 7;
      const strength = kind === 'crown' ? 0.12 : 0.35;
      set.forEach((part) => {
        const m = part.tex
          ? new THREE.MeshStandardMaterial({ map: tex[part.tex], alphaTest: 0.5, vertexColors: true, roughness: 0.78, side: THREE.DoubleSide })
          : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
        windify(m, this.windUni, strength, height);
        const im = new THREE.InstancedMesh(part.geo, m, list.length);
        mats4.forEach((mm, i) => im.setMatrixAt(i, mm));
        cols.forEach((cc, i) => im.setColorAt(i, cc));
        im.castShadow = true;
        im.receiveShadow = true;
        this.scene.add(im);
      });
    });
  }

  /* ------------------------------ buildings */
  private tinTex?: THREE.Texture;
  private tin() {
    if (!this.tinTex)
      this.tinTex = canvasTex(128, 128, (c) => {
        for (let x = 0; x < 128; x++) {
          const v = 150 + Math.sin((x / 128) * Math.PI * 16) * 40;
          c.fillStyle = `rgb(${v},${v + 6},${v + 10})`;
          c.fillRect(x, 0, 1, 128);
        }
        for (let i = 0; i < 40; i++) {
          c.fillStyle = `rgba(140,80,40,${0.08 + hash2(i, 9) * 0.15})`;
          c.beginPath();
          c.arc(hash2(i, 1) * 128, hash2(i, 2) * 128, 4 + hash2(i, 3) * 14, 0, 7);
          c.fill();
        }
      });
    return this.tinTex;
  }
  private plasterTex?: THREE.Texture;
  private wallMats = new Map<string, THREE.MeshStandardMaterial>();
  private wallMat(color: string) {
    if (!this.plasterTex)
      this.plasterTex = canvasTex(256, 256, (c) => {
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 260; i++) {
          c.fillStyle = `rgba(${hash2(i, 2) > 0.5 ? '110,95,70' : '255,250,240'},${0.02 + hash2(i, 3) * 0.04})`;
          c.beginPath();
          c.arc(hash2(i, 4) * 256, hash2(i, 5) * 256, 3 + hash2(i, 6) * 22, 0, 7);
          c.fill();
        }
        // rain streaks and a mud-splashed base
        for (let x = 0; x < 256; x += 2) {
          c.fillStyle = `rgba(70,60,45,${hash2(x, 7) * 0.035})`;
          c.fillRect(x, 0, 2, 40 + hash2(x, 8) * 120);
        }
        const gr = c.createLinearGradient(0, 200, 0, 256);
        gr.addColorStop(0, 'rgba(95,75,50,0)');
        gr.addColorStop(1, 'rgba(95,75,50,0.28)');
        c.fillStyle = gr;
        c.fillRect(0, 200, 256, 56);
      });
    let m = this.wallMats.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ map: this.plasterTex, color, roughness: 0.95 });
      this.wallMats.set(color, m);
    }
    return m;
  }
  private house(w: number, h: number, d: number, wall: string, roof: 'tin' | 'straw' | 'slab' = 'tin') {
    const g = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(w, h, d), this.wallMat(wall));
    body.position.y = h / 2;
    g.add(body);
    if (roof === 'slab') {
      const s = mesh(new THREE.BoxGeometry(w + 0.3, 0.2, d + 0.3), mat('#cfc8b8', 0.9));
      s.position.y = h + 0.1;
      g.add(s);
    } else {
      const rh = roof === 'straw' ? 1.5 : 1.1;
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 - 0.4, 0);
      shape.lineTo(w / 2 + 0.4, 0);
      shape.lineTo(0, rh);
      shape.closePath();
      const rg = new THREE.ExtrudeGeometry(shape, { depth: d + 0.8, bevelEnabled: false });
      rg.translate(0, 0, -(d + 0.8) / 2);
      const rm =
        roof === 'tin'
          ? new THREE.MeshStandardMaterial({ map: this.tin(), roughness: 0.42, metalness: 0.55, color: '#d8dde0' })
          : mat('#b49557', 1);
      const r = mesh(rg, rm);
      r.position.y = h;
      g.add(r);
    }
    const door = mesh(new THREE.BoxGeometry(w * 0.2, h * 0.65, 0.06), mat('#5a3f2c', 0.8), false);
    door.position.set(0, (h * 0.65) / 2, d / 2 + 0.03);
    g.add(door);
    const plinth = mesh(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), mat('#8f8676', 0.95), false, true);
    plinth.position.y = 0.15;
    g.add(plinth);
    if (w > 4.5) {
      for (const sx of [-1, 1]) {
        const win = mesh(new THREE.BoxGeometry(w * 0.16, h * 0.28, 0.05), mat('#3b4a44', 0.6), false);
        win.position.set(sx * w * 0.3, h * 0.55, d / 2 + 0.03);
        g.add(win);
      }
    }
    return g;
  }
  private sign(text: string, w: number, h: number, bg: string, fg: string) {
    const t = canvasTex(
      512,
      Math.round((512 * h) / w),
      (c) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, 512, 512);
        c.fillStyle = fg;
        c.font = `700 ${Math.round(((512 * h) / w) * 0.5)}px Quicksand, system-ui, sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(text, 256, ((512 * h) / w) / 2 + 3);
      },
      false,
    );
    return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.08 }), false, false);
  }

  /* ------------------------------ the farmer's homestead (bari) */
  private buildHomestead() {
    const s = this.scene;
    const plinth = mesh(new THREE.CylinderGeometry(24, 26, 1, 48), mat('#8b7d55', 1), false, true);
    plinth.position.set(0, 0.4, -2);
    s.add(plinth);
    const yard = mesh(new THREE.CircleGeometry(9, 40), mat('#c2a47a', 1), false, true);
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(0, 0.92, -2);
    s.add(yard);
    const h1 = this.house(7, 2.6, 4.4, '#b9a081', 'tin');
    h1.position.set(-3, 0.9, -9);
    s.add(h1);
    const h2 = this.house(4.4, 2.2, 3.4, '#a88f6a', 'straw');
    h2.position.set(-9.5, 0.9, -1);
    h2.rotation.y = Math.PI / 2;
    s.add(h2);
    const h3 = this.house(5.5, 2.4, 3.6, '#c3b096', 'tin');
    h3.position.set(7.5, 0.9, -7);
    h3.rotation.y = -0.5;
    s.add(h3);
    // straw stack
    const stack = mesh(new THREE.ConeGeometry(1.8, 3.6, 18), mat('#c19d55', 1));
    stack.position.set(8, 2.6, 3);
    const stackB = mesh(new THREE.CylinderGeometry(1.8, 1.7, 1.2, 18), mat('#b8944d', 1));
    stackB.position.set(8, 1.5, 3);
    s.add(stack, stackB);
    // pond
    const pond = mesh(new THREE.CircleGeometry(7, 40), new THREE.MeshStandardMaterial({ color: '#3d4d3a', roughness: 0.05, metalness: 0.15 }), false, false);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-18, 0.25, 14);
    pond.scale.set(1.4, 1, 1);
    s.add(pond);
    // clay stove and a smoke source
    const stove = mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 10), mat('#8d6a50', 1));
    stove.position.set(-7.5, 1.15, 2.5);
    s.add(stove);
    this.anchors.stove = V(-7.5, 1.5, 2.5);
    // cow
    s.add(this.cow(V(-6, 0.9, 6), 2.2));

    const spots: { p: THREE.Vector3; kind: 'crown' | 'palm' | 'banana' | 'areca'; s: number }[] = [];
    const R = rng(33);
    for (let i = 0; i < 46; i++) {
      const a = R() * Math.PI * 2;
      const r = 13 + R() * 12;
      const p = V(Math.cos(a) * r, 0.9, -2 + Math.sin(a) * r);
      if (Math.hypot(p.x + 18, p.z - 14) < 10) continue; // pond
      if (p.x > 6 && p.z > 2 && p.x < 22 && p.z < 24) continue; // keep the camera side open
      if (p.x < -6 && p.x > -24 && p.z < -10 && p.z > -26) continue;
      spots.push({ p, kind: R() < 0.3 ? 'areca' : R() < 0.5 ? 'crown' : R() < 0.7 ? 'palm' : 'banana', s: 0.8 + R() * 0.4 });
    }
    this.plantTrees(spots);
    this.anchors.home = V(1.5, 3.2, -1.5);
  }

  private cow(at: THREE.Vector3, rot: number) {
    const g = new THREE.Group();
    const body = mesh(new THREE.CapsuleGeometry(0.42, 1.0, 4, 10), mat('#d9cfbf', 0.9));
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.05;
    const head = mesh(new THREE.BoxGeometry(0.42, 0.42, 0.34), mat('#d0c4b0', 0.9));
    head.position.set(0.95, 1.2, 0);
    g.add(body, head);
    [[-0.45, 0.2], [-0.45, -0.2], [0.45, 0.2], [0.45, -0.2]].forEach(([x, z]) => {
      const l = mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.75, 6), mat('#cfc3ae', 0.9));
      l.position.set(x, 0.38, z);
      g.add(l);
    });
    g.position.copy(at);
    g.rotation.y = rot;
    return g;
  }

  /* ------------------------------ market town: funders, banks, iHarvst */
  private buildTown() {
    const s = this.scene;
    const R = rng(44);
    const win = canvasTex(128, 128, (c) => {
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 900; i++) {
        c.fillStyle = `rgba(80,70,55,${hash2(i, 4) * 0.08})`;
        c.fillRect(hash2(i, 5) * 128, hash2(i, 6) * 128, 3, 3);
      }
      for (let x = 0; x < 128; x += 3) {
        c.fillStyle = `rgba(60,55,45,${hash2(x, 7) * 0.12})`;
        c.fillRect(x, 64 + hash2(x, 8) * 40, 2, 64);
      }
      c.fillStyle = '#2e3634';
      c.fillRect(26, 34, 30, 44);
      c.fillRect(72, 34, 30, 44);
      c.strokeStyle = 'rgba(240,236,226,0.8)';
      c.lineWidth = 4;
      c.strokeRect(26, 34, 30, 44);
      c.strokeRect(72, 34, 30, 44);
      c.fillStyle = 'rgba(70,60,48,0.35)';
      c.fillRect(0, 112, 128, 6);
    });
    const paints = ['#d9c7a8', '#c7b598', '#b9c4ba', '#d4bd9c', '#c4b8a4', '#e0d2b6', '#b8a68c', '#a9b8b0'];
    for (let i = 0; i < 26; i++) {
      const w = 6 + R() * 6;
      const d = 7 + R() * 5;
      const h = 3.6 + Math.floor(R() * 3) * 3.2;
      const tex = win.clone();
      tex.needsUpdate = true;
      tex.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 3.2)));
      const m = new THREE.MeshStandardMaterial({ map: tex, color: paints[i % paints.length], roughness: 0.95 });
      const b = mesh(new THREE.BoxGeometry(w, h, d), m);
      const gx = (i % 6) * 13 - 32 + (R() - 0.5) * 3;
      const gz = Math.floor(i / 6) * 14 - 28 + (R() - 0.5) * 3;
      b.position.set(TOWN.x + gx, h / 2, TOWN.z + gz);
      b.rotation.y = (R() - 0.5) * 0.08;
      s.add(b);
      // water tank on the roof
      if (R() < 0.6) {
        const t = mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 12), mat('#2e3d3a', 0.6));
        t.position.set(b.position.x + (R() - 0.5) * w * 0.5, h + 0.6, b.position.z + (R() - 0.5) * d * 0.5);
        s.add(t);
      }
    }
    // the bank, with a columned porch
    const bank = new THREE.Group();
    const bb = mesh(new THREE.BoxGeometry(16, 7, 10), mat('#efe9dc', 0.9));
    bb.position.y = 3.5;
    const porch = mesh(new THREE.BoxGeometry(17, 0.6, 3.4), mat('#d9d2c2', 0.9));
    porch.position.set(0, 7, 6.2);
    bank.add(bb, porch);
    for (let i = 0; i < 6; i++) {
      const c = mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 12), mat('#f6f2ea', 0.7));
      c.position.set(-7 + i * 2.8, 3.5, 7.4);
      bank.add(c);
    }
    const bs = this.sign('Partner Bank', 8, 1.2, '#123f47', '#ffffff');
    bs.position.set(0, 7.9, 8);
    bank.add(bs);
    bank.position.set(TOWN.x + 18, 0, TOWN.z + 22);
    bank.rotation.y = -0.6;
    s.add(bank);
    // iHarvst billboard on the road out of town
    const bill = new THREE.Group();
    const p1 = mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 8), mat('#6b6f6a', 0.6, { metalness: 0.5 }));
    p1.position.set(-3, 3.5, 0);
    const p2 = p1.clone();
    p2.position.x = 3;
    const panel = this.sign('iHarvst  ·  Fund real farms', 9, 3, '#038F2F', '#ffffff');
    panel.position.set(0, 7.2, 0.12);
    const back = mesh(new THREE.BoxGeometry(9.3, 3.3, 0.2), mat('#d9dfd6', 0.8));
    back.position.set(0, 7.2, 0);
    bill.add(p1, p2, back, panel);
    bill.position.set(-70, 0, -50);
    bill.lookAt(V(-30, 0, -2));
    s.add(bill);
    this.anchors.town = V(TOWN.x + 18, 11, TOWN.z + 22);

    const spots: { p: THREE.Vector3; kind: 'crown' | 'palm' | 'banana' | 'areca'; s: number }[] = [];
    for (let i = 0; i < 30; i++) spots.push({ p: V(TOWN.x + (R() - 0.5) * 120, 0, TOWN.z - 50 + (R() - 0.5) * 30), kind: R() < 0.5 ? 'crown' : 'areca', s: 0.9 + R() * 0.5 });
    for (let i = 0; i < 26; i++) spots.push({ p: V(TOWN.x - 40 + (i % 6) * 13 + 6.5, 0, TOWN.z - 35 + Math.floor(i / 6) * 14 + 7), kind: i % 3 ? 'crown' : 'palm', s: 0.7 + R() * 0.3 });
    this.plantTrees(spots);
  }

  /* ------------------------------ village bazaar with the KriShop partner shop */
  private buildBazaar() {
    const s = this.scene;
    const R = rng(55);
    const walls = ['#cdbb9c', '#bfae90', '#d6c8ad', '#b9c4ba', '#e0d2b6', '#c9b08f', '#d8cdb8', '#b7a98f', '#cfc3a6'];
    const tall = [1, 6, 8];
    for (let i = 0; i < 9; i++) {
      const two = tall.includes(i);
      const depth = 5.5 + (two ? 1 : R() * 0.6);
      const h = this.house(5, two ? 6.4 : 3 + R() * 0.5, depth, walls[i], two ? 'slab' : 'tin');
      // shop fronts stay in one line so the signs and awnings sit on them
      h.position.set(BAZAAR.x - 22 + i * 6, 0, BAZAAR.z - 1.3 - depth / 2);
      s.add(h);
      // awning
      const aw = mesh(new THREE.BoxGeometry(4.8, 0.08, 2), new THREE.MeshStandardMaterial({ map: this.tin(), roughness: 0.5, metalness: 0.4 }));
      aw.position.set(h.position.x, 2.6, BAZAAR.z - 0.6);
      aw.rotation.x = 0.18;
      s.add(aw);
      if (i !== 4) {
        const bd = mesh(new THREE.PlaneGeometry(3.6, 0.7), mat(['#c0392b', '#1f6fb2', '#e3a21a', '#2e8b57', '#8e44ad', '#d35400', '#16a085', '#b03a2e'][i % 8], 0.6), false, false);
        bd.position.set(h.position.x, 3.35, BAZAAR.z - 1.24);
        s.add(bd);
      }
    }
    // KriShop shop: the fourth shop gets the sign and stock
    const kx = BAZAAR.x - 22 + 4 * 6;
    const sg = this.sign('KriShop', 4.4, 0.9, '#17201B', '#ffffff');
    sg.position.set(kx, 3.35, BAZAAR.z - 1.2);
    s.add(sg);
    const leaf = mesh(new THREE.CircleGeometry(0.26, 16), new THREE.MeshStandardMaterial({ color: '#88BB41', emissive: '#88BB41', emissiveIntensity: 0.3 }), false, false);
    leaf.position.set(kx + 1.55, 3.36, BAZAAR.z - 1.18);
    s.add(leaf);
    for (let i = 0; i < 12; i++) {
      const sk = this.sack();
      sk.position.set(kx - 2 + (i % 4) * 0.8, 0.3 + Math.floor(i / 4) * 0.45, BAZAAR.z + 0.6 + (i % 2) * 0.3);
      sk.scale.setScalar(0.001);
      s.add(sk);
      this.shopSacks.push(sk);
    }
    this.anchors.shop = V(kx, 4.4, BAZAAR.z - 1);
    const spots: { p: THREE.Vector3; kind: 'crown' | 'palm' | 'banana' | 'areca'; s: number }[] = [];
    for (let i = 0; i < 22; i++) spots.push({ p: V(BAZAAR.x - 30 + R() * 60, 0, BAZAAR.z - 14 - R() * 20), kind: R() < 0.6 ? 'crown' : 'palm', s: 0.9 + R() * 0.4 });
    this.plantTrees(spots);
  }

  private sack() {
    const s = mesh(new THREE.CapsuleGeometry(0.26, 0.34, 4, 10), mat(hash2(this.sacks.length, 7) > 0.5 ? '#e6e0cf' : '#cbb38a', 0.95));
    s.rotation.z = Math.PI / 2;
    s.scale.set(1, 1, 0.7);
    return s;
  }

  /* ------------------------------ iFarmer Center and collection point at the river ghat */
  private buildCenter() {
    const s = this.scene;
    const c = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(12, 3.6, 7), mat('#e9e4d6', 0.9));
    body.position.y = 1.8;
    c.add(body);
    for (let i = 0; i < 5; i++) {
      const p = mesh(new THREE.BoxGeometry(0.45, 3.4, 0.45), mat('#3fb34f', 0.7));
      p.position.set(-5.4 + i * 2.7, 1.7, 4.1);
      c.add(p);
    }
    const veranda = mesh(new THREE.BoxGeometry(13, 0.18, 2.4), new THREE.MeshStandardMaterial({ map: this.tin(), roughness: 0.45, metalness: 0.5 }));
    veranda.position.set(0, 3.5, 4.4);
    veranda.rotation.x = 0.12;
    const roof = mesh(new THREE.BoxGeometry(12.6, 0.2, 7.6), new THREE.MeshStandardMaterial({ map: this.tin(), roughness: 0.45, metalness: 0.5 }));
    roof.position.y = 3.75;
    c.add(veranda, roof);
    const board = this.sign('iFarmer Center', 7, 1.3, '#3fb34f', '#ffffff');
    board.position.set(0, 4.7, 3.7);
    const bback = mesh(new THREE.BoxGeometry(7.2, 1.45, 0.12), mat('#2f8a3e', 0.7));
    bback.position.set(0, 4.7, 3.62);
    c.add(bback, board);
    // blue plastic chairs on the veranda
    for (let i = 0; i < 6; i++) {
      const ch = mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), mat('#2b8fb3', 0.5));
      ch.position.set(-4 + i * 1.5, 0.4, 4.9);
      c.add(ch);
    }
    c.position.set(CENTER.x, 0, CENTER.z - 14);
    c.rotation.y = 0.25;
    s.add(c);
    this.anchors.center = V(CENTER.x, 6.2, CENTER.z - 10);
    // open collection shed with sacks and crates
    const shed = new THREE.Group();
    const sr = mesh(new THREE.BoxGeometry(16, 0.15, 9), new THREE.MeshStandardMaterial({ map: this.tin(), roughness: 0.45, metalness: 0.5 }));
    sr.position.y = 4.2;
    sr.rotation.z = 0.06;
    shed.add(sr);
    [[-7.5, -4], [7.5, -4], [-7.5, 4], [7.5, 4], [0, -4], [0, 4]].forEach(([x, z]) => {
      const p = mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 6), mat('#6f6f68', 0.6, { metalness: 0.5 }));
      p.position.set(x, 2.1, z);
      shed.add(p);
    });
    for (let i = 0; i < 42; i++) {
      const sk = this.sack();
      sk.position.set(-6 + (i % 7) * 0.9, 0.3 + Math.floor(i / 21) * 0.45, -2.5 + (Math.floor(i / 7) % 3) * 0.9);
      shed.add(sk);
      this.sacks.push(sk);
    }
    const crateG = new THREE.BoxGeometry(0.7, 0.4, 0.5);
    const crates = new THREE.InstancedMesh(crateG, mat('#1f6fc0', 0.55), 60);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 60; i++) {
      m4.makeTranslation(1.5 + (i % 6) * 0.78, 0.2 + Math.floor(i / 30) * 0.42, -3 + (Math.floor(i / 6) % 5) * 0.58);
      crates.setMatrixAt(i, m4);
    }
    crates.castShadow = true;
    shed.add(crates);
    const veg = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.09, 0.3, 3, 6), mat('#86b54a', 0.6), 300);
    const R = rng(61);
    for (let i = 0; i < 300; i++) {
      m4.compose(V(1.5 + (i % 6) * 0.78 + (R() - 0.5) * 0.5, 0.45 + Math.floor((i % 60) / 30) * 0.42, -3 + (Math.floor((i % 30) / 6)) * 0.58 + (R() - 0.5) * 0.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, R() * 3, 0)), V(1, 1, 1));
      veg.setMatrixAt(i, m4);
    }
    shed.add(veg);
    shed.position.set(CENTER.x + 16, 0, CENTER.z - 6);
    shed.rotation.y = 0.25;
    s.add(shed);
    this.anchors.collect = V(CENTER.x + 16, 5.5, CENTER.z - 6);
    // ghat steps into the river
    for (let i = 0; i < 6; i++) {
      const st = mesh(new THREE.BoxGeometry(8, 0.3, 1.2), mat('#a99f8f', 0.95), false, true);
      st.position.set(CENTER.x + 4, -0.2 - i * 0.3, CENTER.z + 6 + i * 1.1);
      s.add(st);
    }
    const R2 = rng(71);
    const spots: { p: THREE.Vector3; kind: 'crown' | 'palm' | 'banana' | 'areca'; s: number }[] = [];
    for (let i = 0; i < 16; i++) spots.push({ p: V(CENTER.x - 20 + R2() * 50, 0, CENTER.z - 30 - R2() * 12), kind: R2() < 0.5 ? 'crown' : 'palm', s: 1 + R2() * 0.3 });
    this.plantTrees(spots);
  }

  /* ------------------------------ villages and groves to the horizon */
  private buildVillages() {
    const R = rng(81);
    const spots: { p: THREE.Vector3; kind: 'crown' | 'palm' | 'banana' | 'areca'; s: number }[] = [];
    const roofs: THREE.Matrix4[] = [];
    const m4 = new THREE.Matrix4();
    for (let v = 0; v < 70; v++) {
      const a = R() * Math.PI * 2;
      const d = 170 + R() * 650;
      const cx = 40 + Math.cos(a) * d;
      const cz = 30 + Math.sin(a) * d;
      if (riverDist(cx, cz) < RIVER_W + 30) continue;
      const n = 25 + Math.floor(R() * 45);
      for (let i = 0; i < n; i++) {
        const r = Math.sqrt(R()) * (20 + R() * 20);
        const t = R() * Math.PI * 2;
        spots.push({ p: V(cx + Math.cos(t) * r, 0, cz + Math.sin(t) * r), kind: R() < 0.55 ? 'crown' : R() < 0.75 ? 'areca' : 'palm', s: 0.9 + R() * 0.6 });
      }
      for (let i = 0; i < 3 + R() * 5; i++) {
        m4.compose(V(cx + (R() - 0.5) * 30, 1.4, cz + (R() - 0.5) * 30), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), R() * 3), V(1, 1, 1));
        roofs.push(m4.clone());
      }
    }
    // a line of trees along the river banks
    for (let i = 0; i < 160; i++) {
      const u = R();
      const p = RIVER.getPointAt(u);
      const t = RIVER.getTangentAt(u);
      const side = R() < 0.5 ? 1 : -1;
      const off = RIVER_W / 2 + 12 + R() * 10;
      const q = V(p.x - t.z * off * side, 0, p.z + t.x * off * side);
      if (q.distanceTo(CENTER) < 30 || (q.x > FIELD.x0 - 5 && q.x < FIELD.x1 + 5 && q.z < FIELD.z1 + 8 && q.z > FIELD.z0)) continue;
      spots.push({ p: q, kind: R() < 0.5 ? 'crown' : 'palm', s: 0.9 + R() * 0.4 });
    }
    this.plantTrees(spots, false);
    // distant houses: tin roofs catching the light
    const hg = new THREE.BoxGeometry(5, 2.8, 4);
    const houses = new THREE.InstancedMesh(hg, new THREE.MeshStandardMaterial({ map: this.tin(), color: '#cfd4d6', roughness: 0.45, metalness: 0.5 }), roofs.length);
    roofs.forEach((m, i) => houses.setMatrixAt(i, m));
    houses.castShadow = true;
    this.scene.add(houses);
  }

  /* ------------------------------ people */
  private plaidTex?: THREE.Texture;
  private plaidMats = new Map<string, THREE.MeshStandardMaterial>();
  private lungiMat(color: string) {
    if (!this.plaidTex) {
      this.plaidTex = canvasTex(64, 64, (c) => {
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, 64, 64);
        c.fillStyle = 'rgba(0,0,0,0.22)';
        for (let i = 0; i < 64; i += 16) {
          c.fillRect(i, 0, 6, 64);
          c.fillRect(0, i, 64, 6);
        }
        c.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 9; i < 64; i += 16) {
          c.fillRect(i, 0, 1.5, 64);
          c.fillRect(0, i, 64, 1.5);
        }
      });
      this.plaidTex.repeat.set(3, 2);
    }
    let m = this.plaidMats.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ map: this.plaidTex, color, roughness: 0.95 });
      this.plaidMats.set(color, m);
    }
    return m;
  }

  /** A villager: shaped torso, a face that shows which way they look, elbows, a checked lungi and sandals. Faces +z. */
  private person(shirt: string, lower: string, scale = 1): { g: THREE.Group; parts: PersonParts } {
    const g = new THREE.Group();
    const skin = mat('#86573a', 0.6);
    const cloth = mat(shirt, 0.92);
    const trim = mat(new THREE.Color(shirt).multiplyScalar(0.82).getStyle(), 0.9);
    const torso = new THREE.Group();
    torso.position.y = 0.95;
    const prof = [
      [0.001, 0], [0.15, 0], [0.158, 0.12], [0.152, 0.26], [0.172, 0.42], [0.19, 0.52], [0.15, 0.6], [0.06, 0.645], [0.001, 0.65],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const chestG = new THREE.LatheGeometry(prof, 18);
    chestG.scale(1.22, 1, 0.8);
    const chest = mesh(chestG, cloth);
    const placket = mesh(new THREE.BoxGeometry(0.022, 0.42, 0.012), trim, false);
    placket.position.set(0, 0.36, 0.128);
    const collar = mesh(new THREE.TorusGeometry(0.062, 0.016, 6, 14), trim, false);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.635;
    const neck = mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.1, 10), skin);
    neck.position.y = 0.69;
    const head = new THREE.Group();
    head.position.y = 0.8;
    const skull = mesh(new THREE.SphereGeometry(0.108, 18, 14), skin);
    skull.scale.set(0.92, 1.06, 1);
    const nose = mesh(new THREE.ConeGeometry(0.02, 0.05, 6), skin, false);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.012, 0.106);
    const hair = mesh(new THREE.SphereGeometry(0.115, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), mat('#18120e', 0.75));
    hair.position.set(0, 0.018, -0.012);
    hair.rotation.x = -0.25;
    const ears = [-1, 1].map((sx) => {
      const e = mesh(new THREE.SphereGeometry(0.022, 8, 6), skin, false);
      e.position.set(sx * 0.1, -0.005, -0.005);
      return e;
    });
    head.add(skull, nose, hair, ...ears);
    torso.add(chest, placket, collar, neck, head);
    const mkArm = (x: number) => {
      const a = new THREE.Group();
      a.position.set(x, 0.54, 0);
      const sh = mesh(new THREE.SphereGeometry(0.062, 10, 8), cloth);
      const up = mesh(new THREE.CapsuleGeometry(0.052, 0.24, 3, 8), cloth);
      up.position.y = -0.16;
      const elbow = new THREE.Group();
      elbow.position.y = -0.32;
      const fore = mesh(new THREE.CapsuleGeometry(0.042, 0.2, 3, 8), skin);
      fore.position.y = -0.13;
      const hand = mesh(new THREE.SphereGeometry(0.046, 8, 6), skin);
      hand.scale.set(0.8, 1.15, 0.9);
      hand.position.y = -0.29;
      elbow.add(fore, hand);
      a.add(sh, up, elbow);
      a.userData.elbow = elbow;
      torso.add(a);
      return a;
    };
    const armL = mkArm(-0.215);
    const armR = mkArm(0.215);
    const lungi = mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.62, 16, 1, true), this.lungiMat(lower));
    lungi.position.y = 0.66;
    const knot = mesh(new THREE.TorusGeometry(0.2, 0.022, 6, 18), mat(lower, 0.95), false);
    knot.rotation.x = Math.PI / 2;
    knot.position.y = 0.96;
    const mkLeg = (x: number) => {
      const l = new THREE.Group();
      l.position.set(x, 0.62, 0);
      const shin = mesh(new THREE.CapsuleGeometry(0.05, 0.42, 3, 8), skin);
      shin.position.y = -0.33;
      const foot = mesh(new THREE.BoxGeometry(0.085, 0.035, 0.2), mat('#2a2420', 0.8));
      foot.position.set(0, -0.6, 0.045);
      l.add(shin, foot);
      return l;
    };
    const legL = mkLeg(-0.08);
    const legR = mkLeg(0.08);
    g.add(torso, lungi, knot, legL, legR);
    g.scale.setScalar(scale);
    g.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o.castShadow = true), (o.receiveShadow = true)) : null));
    return { g, parts: { legL, legR, armL, armR, torso } };
  }

  private buildPeople() {
    const s = this.scene;
    // the farmer, with a phone
    const f = this.person('#f3efe6', '#2f6a86', 1.05);
    f.g.position.set(1.5, 0.92, -1.5);
    f.g.rotation.y = 0.3; // three-quarter to the camera, phone in hand
    s.add(f.g);
    this.farmer = f;
    f.parts.armR.rotation.set(-0.35, 0, 0.12);
    (f.parts.armR.userData.elbow as THREE.Group).rotation.x = -1.45;
    f.parts.armL.rotation.set(-0.2, 0, -0.08);
    (f.parts.armL.userData.elbow as THREE.Group).rotation.x = -0.25;
    (f.parts.torso.children.find((c) => c instanceof THREE.Group) as THREE.Group).rotation.x = 0.14;
    this.phone = mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color('#ddff80'), emissiveIntensity: 0.2, roughness: 0.3 }), false);
    this.phone.position.set(0, -0.3, 0.035);
    this.phone.rotation.x = 1.35;
    (f.parts.armR.userData.elbow as THREE.Group).add(this.phone);
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 6, 48), new THREE.MeshBasicMaterial({ color: '#ddff80', transparent: true, opacity: 0, depthWrite: false }));
      r.rotation.x = Math.PI / 2;
      r.position.set(1.5, 2.4, -1.5);
      r.userData.kind = 'phone';
      s.add(r);
      this.pulses.push(r);
    }
    // agronomist and farmer kneeling in the grow plot
    const ag = this.person('#ffffff', '#ece8de');
    ag.g.position.set(79, -0.1, 43);
    ag.g.rotation.y = -2.2;
    ag.parts.torso.rotation.x = 0.55;
    ag.parts.legL.rotation.x = -1.2;
    ag.parts.legR.rotation.x = -0.4;
    s.add(ag.g);
    const old = this.person('#2c2c2c', '#7a6a4a');
    old.g.position.set(80.4, -0.1, 44.2);
    old.g.rotation.y = 2.4;
    old.parts.torso.rotation.x = 0.7;
    s.add(old.g);
    this.anchors.field = V(80, 2.6, 44);

    // walkers on the roads and bunds, and harvesters later in the season
    const shirts = ['#d9534f', '#f0ad4e', '#5bc0de', '#ffffff', '#9b59b6', '#2ecc71', '#e8d8b0', '#34495e'];
    const lowers = ['#2f6a86', '#5a4a3a', '#3d5a40', '#7a6a4a', '#2c3e50'];
    const R = rng(91);
    const paths = [this.roadCurves.village, this.roadCurves.field, this.roadCurves.village, this.roadCurves.field, this.roadCurves.village];
    for (let i = 0; i < 16; i++) {
      const p = this.person(shirts[i % shirts.length], lowers[i % lowers.length], 0.95 + R() * 0.1);
      s.add(p.g);
      this.walkers.push({ ...p, path: paths[i % paths.length], speed: (0.6 + R() * 0.4) / paths[i % paths.length].getLength(), offset: R(), mode: 'walk' });
    }
    for (let i = 0; i < 10; i++) {
      const p = this.person(shirts[(i + 3) % shirts.length], lowers[i % lowers.length]);
      const x = 112 + (i % 5) * 4 + R() * 2;
      const z = 46 + Math.floor(i / 5) * 6 + R() * 2;
      p.g.position.set(x, 0.05, z);
      p.g.rotation.y = R() * 6;
      p.g.visible = false;
      s.add(p.g);
      this.walkers.push({ ...p, path: new THREE.CatmullRomCurve3([V(x, 0.05, z), V(x + 0.01, 0.05, z)]), speed: 0, offset: i, mode: 'bend' });
    }
    // people at the center
    for (let i = 0; i < 6; i++) {
      const p = this.person(shirts[(i + 1) % shirts.length], lowers[(i + 2) % lowers.length]);
      p.g.position.set(CENTER.x - 4 + i * 1.6, 0, CENTER.z - 8.5 + (i % 2) * 0.8);
      p.g.rotation.y = Math.PI + (R() - 0.5);
      s.add(p.g);
      this.walkers.push({ ...p, path: new THREE.CatmullRomCurve3([p.g.position.clone(), p.g.position.clone().add(V(0.01, 0, 0))]), speed: 0, offset: i, mode: 'idle' });
    }
  }

  /* ------------------------------ vehicles: a CNG, a delivery van, trucks */
  private vehicle(kind: 'cng' | 'van' | 'truck') {
    const g = new THREE.Group();
    const wheels: THREE.Object3D[] = [];
    const wheelG = new THREE.CylinderGeometry(kind === 'truck' ? 0.5 : 0.3, kind === 'truck' ? 0.5 : 0.3, 0.25, 14);
    wheelG.rotateX(Math.PI / 2);
    const wm = mat('#1e1e1e', 0.8);
    const addWheel = (x: number, z: number, r: number) => {
      const w = mesh(wheelG, wm);
      w.position.set(x, r, z);
      g.add(w);
      wheels.push(w);
    };
    if (kind === 'cng') {
      const body = mesh(new THREE.BoxGeometry(2.4, 1.0, 1.3), mat('#1f8a3a', 0.45, { metalness: 0.3 }));
      body.position.set(0, 0.85, 0);
      const cab = mesh(new THREE.BoxGeometry(2.2, 0.75, 1.3), mat('#1b1b1b', 0.7));
      cab.position.set(-0.1, 1.72, 0);
      const nose = mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 16, 1, false, 0, Math.PI), mat('#1f8a3a', 0.45, { metalness: 0.3 }));
      nose.rotation.x = Math.PI / 2;
      nose.rotation.z = -Math.PI / 2;
      nose.position.set(1.2, 0.98, 0);
      g.add(body, cab, nose);
      addWheel(1.15, 0, 0.3);
      addWheel(-0.8, 0.62, 0.3);
      addWheel(-0.8, -0.62, 0.3);
    } else {
      const L = kind === 'truck' ? 6.4 : 3.6;
      const cabC = kind === 'truck' ? '#e0832b' : '#f2f2ee';
      const cargo = mesh(new THREE.BoxGeometry(L, kind === 'truck' ? 1.6 : 1.5, 2.2), mat(kind === 'truck' ? '#c4462f' : '#3fa34f', 0.6));
      cargo.position.set(-0.6, kind === 'truck' ? 1.8 : 1.4, 0);
      const cab = mesh(new THREE.BoxGeometry(1.6, 1.8, 2.2), mat(cabC, 0.4, { metalness: 0.3 }));
      cab.position.set(L / 2 + 0.35, 1.5, 0);
      const glass = mesh(new THREE.BoxGeometry(0.05, 0.7, 1.9), new THREE.MeshStandardMaterial({ color: '#2a3a40', roughness: 0.05, metalness: 0.8 }));
      glass.position.set(L / 2 + 1.16, 1.85, 0);
      g.add(cargo, cab, glass);
      const r = kind === 'truck' ? 0.5 : 0.32;
      addWheel(L / 2 + 0.4, 1.05, r);
      addWheel(L / 2 + 0.4, -1.05, r);
      addWheel(-L / 2 + 0.4, 1.05, r);
      addWheel(-L / 2 + 0.4, -1.05, r);
      if (kind === 'truck')
        for (let i = 0; i < 12; i++) {
          const sk = this.sack();
          sk.position.set(-3 + (i % 6) * 0.9, 2.85 + Math.floor(i / 6) * 0.4, i % 2 ? 0.4 : -0.4);
          g.add(sk);
        }
      if (kind === 'van') {
        const lg = this.sign('KriShop', 2.2, 0.5, '#3fa34f', '#ffffff');
        lg.position.set(-0.6, 1.5, 1.115);
        g.add(lg);
      }
    }
    g.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null));
    return { g, wheels };
  }

  private buildVehicles() {
    const add = (kind: 'cng' | 'van' | 'truck', path: THREE.CatmullRomCurve3, beat: string, from: number, to: number, t0 = 0.05, t1 = 0.9) => {
      const v = this.vehicle(kind);
      this.scene.add(v.g);
      this.vehicles.push({ ...v, path, beat, from, to, t0, t1 });
    };
    const vill = this.roadCurves.village;
    add('van', vill, 'buy', 0.18, 0.66);
    add('cng', vill, 'apply', 0.25, 0.75, 0, 1);
    add('cng', vill, 'card', 0.85, 0.45, 0, 1);
    add('truck', this.roadCurves.highway, 'dispatch', 0.02, 0.32);
    add('truck', this.roadCurves.highway, 'dispatch', 0.0, 0.26, 0.2, 1);
    add('van', this.roadCurves.field, 'card', 0.0, 0.18);
  }

  /* ------------------------------ boats on the river */
  private buildBoats() {
    const R = rng(101);
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      const prof = new THREE.Shape();
      prof.moveTo(-3.4, 0.7);
      prof.quadraticCurveTo(-2.4, -0.1, -1.2, -0.3);
      prof.lineTo(1.2, -0.3);
      prof.quadraticCurveTo(2.4, -0.1, 3.4, 0.7);
      prof.lineTo(-3.4, 0.7);
      const hg = new THREE.ExtrudeGeometry(prof, { depth: 1.5, bevelEnabled: false });
      hg.translate(0, 0, -0.75);
      g.add(mesh(hg, mat('#5c4331', 0.85)));
      if (i % 3 !== 2) {
        const hood = mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.2, 14, 1, true, 0, Math.PI), mat('#a88a52', 1));
        hood.rotation.z = Math.PI / 2;
        hood.position.set(-0.3, 0.7, 0);
        g.add(hood);
      } else {
        for (let k = 0; k < 8; k++) {
          const sk = this.sack();
          sk.position.set(-1.6 + (k % 4) * 0.9, 0.9 + Math.floor(k / 4) * 0.35, 0);
          g.add(sk);
        }
      }
      const man = this.person('#e9e1cf', '#3f5e73', 0.95);
      man.g.position.set(2.5, 0.65, 0);
      man.parts.armL.rotation.x = -0.6;
      man.parts.armR.rotation.x = -0.6;
      const oar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 5), mat('#6b4f37', 0.8));
      oar.position.set(2.9, 0.9, 0.5);
      oar.rotation.z = 0.9;
      g.add(man.g, oar);
      g.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null));
      this.scene.add(g);
      this.boats.push({ g, t: i / 7 + R() * 0.05, speed: (0.0035 + R() * 0.003) * (R() < 0.5 ? 1 : -1) });
    }
  }

  /* ------------------------------ glowing money and data arcs */
  private buildArcs() {
    const make = (a: THREE.Vector3, b: THREE.Vector3, h: number, color: string) => {
      const mid = a.clone().lerp(b, 0.5).add(V(0, h, 0));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const g = new THREE.TubeGeometry(curve, 128, 0.14, 6, false);
      const uni = { uProgress: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: 0 } };
      const m = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { ...uni, uColor: { value: new THREE.Color(color) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform float uProgress; uniform float uTime; uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
          void main(){
            float head = uProgress * 1.15;
            float body = smoothstep(head - 0.55, head, vUv.x) * step(vUv.x, head);
            float dash = 0.55 + 0.45 * sin((vUv.x * 60.0 - uTime * 6.0));
            float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
            float a = body * dash * uOpacity * (0.35 + 0.65 * smoothstep(0.0, 0.6, edge));
            gl_FragColor = vec4(uColor * 2.4, a);
          }`,
      });
      const mm = new THREE.Mesh(g, m);
      mm.frustumCulled = false;
      this.scene.add(mm);
      return { mesh: mm, uni };
    };
    const home = V(1.5, 2.6, -1.5);
    const bank = V(TOWN.x + 18, 8, TOWN.z + 22);
    const centre = V(CENTER.x, 5, CENTER.z - 12);
    this.arcs.fund = make(V(-70, 9, -50), bank, 22, '#ddff80');
    this.arcs.receive = make(bank, home, 34, '#ddff80');
    this.arcs.buy = make(home, V(BAZAAR.x + 2, 3, BAZAAR.z), 20, '#ffd36a');
    this.arcs.paid = make(centre, home, 40, '#ddff80');
    this.arcs.returns = make(home, bank, 46, '#ffd36a');
    this.arcs.sell = make(centre, V(320, 4, 0), 50, '#9fe3ff');

    // the 360 loop shown on the opening and closing views: farmer -> finance -> inputs -> advice ->
    // market -> iFarmer Center -> back to the farmer, paid
    const stops = [V(1.5, 3, -1.5), V(TOWN.x + 18, 9, TOWN.z + 22), V(BAZAAR.x + 2, 5, BAZAAR.z), V(80, 3, 44), V(CENTER.x + 16, 6, CENTER.z - 6), V(CENTER.x, 6, CENTER.z - 12)];
    const pts: THREE.Vector3[] = [];
    stops.forEach((p0, k) => {
      const p1 = stops[(k + 1) % stops.length];
      const len = p0.distanceTo(p1);
      const mid = p0.clone().lerp(p1, 0.5).add(V(0, 6 + len * 0.16, 0));
      const leg = new THREE.QuadraticBezierCurve3(p0, mid, p1);
      const n = Math.max(6, Math.round(len / 6));
      for (let j = 0; j < n; j++) pts.push(leg.getPoint(j / n));
    });
    const loop = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    const lm = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: this.loopUni,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime; uniform float uOpacity; uniform float uDraw; varying vec2 vUv;
        void main(){
          float drawn = step(vUv.x, uDraw);
          float head = smoothstep(uDraw - 0.05, uDraw, vUv.x) * (1.0 - step(0.999, uDraw));
          float s = fract(vUv.x * 5.0 - uTime * 0.05);
          float pulse = smoothstep(0.0, 0.04, s) * (1.0 - smoothstep(0.04, 0.2, s));
          float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
          float a = drawn * uOpacity * (0.28 + 0.9 * pulse + 1.2 * head) * (0.35 + 0.65 * smoothstep(0.0, 0.6, edge));
          gl_FragColor = vec4(vec3(0.8, 1.0, 0.35) * 1.25, a * 0.85);
        }`,
    });
    const lmesh = new THREE.Mesh(new THREE.TubeGeometry(loop, 900, 0.4, 8, true), lm);
    lmesh.frustumCulled = false;
    this.scene.add(lmesh);
    this.anchors.harvest = V(121, 2.6, 52);
    this.anchors.highway = V(200, 5, 46);
  }

  /* ------------------------------ birds, smoke, satellite, drone */
  private buildSkyLife() {
    const bird = new THREE.BufferGeometry();
    bird.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, -0.9, 0, -0.1, 0, 0, -0.2, 0, 0, 0.25, 0.9, 0, -0.1, 0, 0, -0.2], 3));
    bird.computeVertexNormals();
    this.birdMat = new THREE.MeshBasicMaterial({ color: '#f4f1ea', side: THREE.DoubleSide, fog: true });
    const bm = this.birdMat;
    bm.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.windUni.uTime;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat ph = float(gl_InstanceID) * 1.7;\ntransformed.y += abs(position.x) * sin(uTime * 9.0 + ph) * 0.7;');
    };
    this.birds = new THREE.InstancedMesh(bird, bm, 24);
    this.birds.frustumCulled = false;
    this.scene.add(this.birds);

    const N = 60;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    const spr = canvasTex(
      64,
      64,
      (c) => {
        const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(230,230,225,0.55)');
        gr.addColorStop(1, 'rgba(230,230,225,0)');
        c.fillStyle = gr;
        c.fillRect(0, 0, 64, 64);
      },
      false,
    );
    this.smoke = new THREE.Points(g, new THREE.PointsMaterial({ map: spr, size: 2.6, transparent: true, depthWrite: false, sizeAttenuation: true }));
    this.smoke.frustumCulled = false;
    this.scene.add(this.smoke);

    const sat = new THREE.Group();
    sat.add(mesh(new THREE.BoxGeometry(1.4, 1.4, 2), mat('#e7e2d6', 0.4, { metalness: 0.6 }), false));
    const pl = mesh(new THREE.BoxGeometry(4.6, 0.06, 1.4), mat('#1f3e64', 0.2, { metalness: 0.7 }), false);
    pl.position.x = -3.2;
    const pr = pl.clone();
    pr.position.x = 3.2;
    sat.add(pl, pr);
    sat.visible = false;
    this.satellite = sat;
    this.scene.add(sat);

    const drone = new THREE.Group();
    drone.add(mesh(new THREE.BoxGeometry(0.6, 0.18, 0.6), mat('#2b2f33', 0.5)));
    for (let i = 0; i < 4; i++) {
      const arm = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 16), new THREE.MeshStandardMaterial({ color: '#cfd6d8', transparent: true, opacity: 0.45 }));
      arm.position.set(i % 2 ? 0.5 : -0.5, 0.12, i < 2 ? 0.5 : -0.5);
      drone.add(arm);
    }
    drone.visible = false;
    this.drone = drone;
    this.scene.add(drone);
  }

  /* ------------------------------ post-processing */
  private buildComposer() {
    const r = this.renderer;
    const composer = new EffectComposer(r, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
    composer.addPass(new RenderPass(this.scene, this.camera));
    const ao = new N8AOPostPass(this.scene, this.camera, 1, 1);
    ao.configuration.aoRadius = 4;
    ao.configuration.distanceFalloff = 1.5;
    ao.configuration.intensity = 2.2;
    ao.configuration.halfRes = true;
    ao.configuration.depthAwareUpsampling = true;
    ao.setQualityMode('Medium');
    composer.addPass(ao);
    this.ao = ao;
    const dof = new DepthOfFieldEffect(this.camera, { worldFocusDistance: 20, worldFocusRange: 30, bokehScale: 0, resolutionScale: 0.5 });
    this.dof = dof;
    composer.addPass(new EffectPass(this.camera, dof));
    const bloom = new BloomEffect({ intensity: 0.55, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, mipmapBlur: true });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    composer.addPass(new EffectPass(this.camera, bloom, new VignetteEffect({ darkness: 0.42, offset: 0.32 }), tone));
    composer.addPass(new EffectPass(this.camera, new SMAAEffect()));
    this.composer = composer;
  }

  /* ------------------------------ per-frame state */
  private beatAt(p: number) {
    const x = clamp01(p) * (this.ids.length - 1);
    const i = Math.min(this.ids.length - 2, Math.floor(x));
    return { i, f: x - i, x };
  }
  private local(id: string, x: number) {
    // 0..1 while the camera sits at beat `id` (from half a beat before to half after)
    const k = this.ids.indexOf(id);
    if (k < 0) return -1;
    return x - (k - 0.5);
  }

  private apply(p: number, time: number) {
    const { i, f, x } = this.beatAt(p);
    // hold at each key, then glide: the target slides across the ground while the camera keeps
    // orbiting it, pulling back and rising a little on long moves, so every frame looks at something
    const e = smoother(0.1, 0.9, f);
    const a = KEYS[this.ids[i]] ?? KEYS.intro;
    const b = KEYS[this.ids[i + 1]] ?? KEYS.intro;
    const tgt = this.tmp2.lerpVectors(a.t, b.t, e);
    const travel = a.t.distanceTo(b.t);
    const hop = Math.sin(Math.PI * e);
    const orbitA = (a.orbit ?? 0) * Math.sin(time * 0.05);
    const orbitB = (b.orbit ?? 0) * Math.sin(time * 0.05);
    const bA = a.b + orbitA;
    const bB = bA + wrapDeg(b.b + orbitB - bA);
    const sway = Math.sin(time * 0.07) * 1.6 * (1 - hop);
    const bear = THREE.MathUtils.degToRad(lerp(bA, bB, e) + sway);
    const elev = THREE.MathUtils.degToRad(lerp(a.e, b.e, e) + hop * 9 * clamp01(travel / 60));
    const dist = Math.exp(lerp(Math.log(a.d), Math.log(b.d), e)) + travel * 0.3 * hop;
    const pos = this.tmp.set(Math.sin(bear) * Math.cos(elev), Math.sin(elev), Math.cos(bear) * Math.cos(elev)).multiplyScalar(dist).add(tgt);
    pos.y = Math.max(pos.y, 1.4 + hop * Math.min(16, travel * 0.22));
    // breathing, like a camera on a crane
    pos.y += Math.sin(time * 0.23) * 0.06 * Math.min(1, dist / 10);
    this.camera.position.copy(pos);
    // leave room for the story on the left on wide screens
    const fwd = tgt.clone().sub(pos).normalize();
    const right = fwd.clone().cross(V(0, 1, 0)).normalize();
    const shift = (this.aspect > 1.1 ? lerp(a.s ?? 0.2, b.s ?? 0.2, e) : 0) * this.frameShift * dist;
    this.camera.lookAt(tgt.clone().addScaledVector(right, -shift));

    // sun through the day: three-quarter light from the view unless a key fixes it
    const sunElev = lerp(a.sun, b.sun, e);
    const autoAz = (k: Key, orbit: number) => (k.az ?? k.b + orbit + 38);
    const azA = autoAz(a, orbitA);
    const azB = azA + wrapDeg(autoAz(b, orbitB) - azA);
    const az = lerp(azA, azB, e);
    this.setSun(sunElev, az);
    const sunPos = tgt.clone().addScaledVector(this.sunDir, 260);
    this.sun.position.copy(sunPos);
    this.sun.target.position.copy(tgt);
    const span = Math.min(260, Math.max(40, dist * 1.4));
    const sc = this.sun.shadow.camera;
    if (Math.abs(sc.right - span) > 2) {
      sc.left = -span;
      sc.right = span;
      sc.top = span;
      sc.bottom = -span;
      sc.updateProjectionMatrix();
    }
    if (this.dof) {
      this.dof.cocMaterial.worldFocusDistance = dist;
      this.dof.cocMaterial.worldFocusRange = Math.max(6, dist * 0.9);
      this.dof.bokehScale = lerp(a.dof, b.dof, e) * 3.2;
    }

    // season: paddy grows, ripens, then is harvested
    const L = (id: string) => this.local(id, x);
    const grow = clamp01(smooth(0, 1, L('grow')) * 0.5 + smooth(0, 1, L('grow2')) * 0.5);
    this.cropUni.uGrow.value = 0.22 + 0.78 * Math.max(grow, x > this.ids.indexOf('grow2') ? 1 : 0);
    const ripen = clamp01(smooth(0.3, 1.2, L('grow2')) * 0.35 + smooth(0, 0.8, L('harvest')) * 0.65);
    this.cropUni.uRipen.value = x >= this.ids.indexOf('harvest') + 0.5 ? 1 : ripen;
    this.cropUni.uHarvest.value = x < this.ids.indexOf('harvest') ? 0 : this.plotCount * clamp01(smooth(0.2, 2.2, L('harvest')));
    this.paddyMats.forEach((m) => {
      m.roughness = lerp(0.08, 0.85, clamp01(smooth(0, 1.4, L('grow2'))));
      m.color.set('#b8c0a8').lerp(new THREE.Color('#d6c79a'), this.cropUni.uRipen.value * 0.6);
    });
    this.landMat.color.set('#ffffff').lerp(new THREE.Color('#f2dfa6'), this.cropUni.uRipen.value * 0.5);
    this.cropUni.uTime.value = time;
    this.windUni.uTime.value = time;

    // phone glow and data rings
    const applyL = L('apply');
    const receiveL = L('receive');
    const paidL = L('paid');
    const glow = (applyL > 0 && applyL < 1 ? 1 : 0) + (receiveL > 0.4 && receiveL < 1 ? 1 : 0) + (paidL > 0.3 && paidL < 1 ? 1 : 0);
    (this.phone.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + glow * (3 + Math.sin(time * 5));
    this.pulses.forEach((r, k) => {
      const ph = (time * 0.55 + (k % 3) / 3) % 1;
      const on = r.userData.kind === 'phone' ? (applyL > 0.15 && applyL < 1 ? 1 : 0) : L('grow') > 0.2 && L('grow2') < 0.8 ? 1 : 0;
      r.scale.setScalar(r.userData.kind === 'phone' ? 0.4 + ph * 2.4 : 1 + ph * 5);
      if (r.userData.kind === 'phone') r.position.y = 2.2 + ph * 1.6;
      (r.material as THREE.MeshBasicMaterial).opacity = on * (1 - ph) * 0.9;
    });
    this.farmer.parts.torso.rotation.y = Math.sin(time * 0.7) * 0.06;

    // arcs
    const arcAt = (key: string, id: string, a0: number, a1: number) => {
      const l = L(id);
      const pr = clamp01((l - a0) / (a1 - a0));
      const arc = this.arcs[key];
      arc.uni.uProgress.value = pr;
      arc.uni.uOpacity.value = l > a0 - 0.05 && l < 1.15 ? smooth(a0 - 0.05, a0 + 0.1, l) * (1 - smooth(0.95, 1.15, l)) : 0;
      arc.uni.uTime.value = time;
    };
    arcAt('fund', 'fund', 0.1, 0.8);
    arcAt('receive', 'receive', 0.05, 0.75);
    arcAt('buy', 'card', 0.05, 0.6);
    arcAt('sell', 'dispatch', 0.2, 0.9);
    arcAt('paid', 'paid', 0.0, 0.6);
    arcAt('returns', 'returns', 0.0, 0.7);

    // the 360 loop: drawn on arrival, shown on the opening and closing views
    const introFade = 1 - smooth(0.04, 0.55, x);
    const outroFade = smooth(0.05, 0.45, L('outro'));
    this.loopUni.uOpacity.value = Math.max(introFade, outroFade);
    this.loopUni.uDraw.value = Math.max(clamp01((time - 0.6) / 3.2), outroFade > 0.01 ? 1 : 0);
    this.loopUni.uTime.value = time;

    // shop restocked when the van arrives
    const buyL = L('buy');
    this.shopSacks.forEach((s, k) => s.scale.setScalar(Math.max(0.001, x > this.ids.indexOf('buy') + 0.5 ? 1 : smooth(0.55 + k * 0.02, 0.75 + k * 0.02, buyL))));
    // sacks leave the shed as trucks load
    const collectL = L('collect');
    const dispatchL = L('dispatch');
    this.sacks.forEach((s, k) => {
      const filled = x < this.ids.indexOf('harvest') + 0.3 ? 0 : 1;
      const gone = smooth(k / 42, k / 42 + 0.2, clamp01(dispatchL));
      s.scale.setScalar(Math.max(0.001, filled * smooth(0, 0.8, L('harvest') + (collectL > 0 ? 1 : 0)) * (1 - gone)));
    });

    // vehicles
    this.vehicles.forEach((v) => {
      const l = L(v.beat);
      const t = x < this.ids.indexOf(v.beat) - 0.5 ? 0 : x > this.ids.indexOf(v.beat) + 0.5 ? 1 : smooth(v.t0, v.t1, l);
      const s = lerp(v.from, v.to, t);
      const p = v.path.getPointAt(clamp01(s));
      const tan = v.path.getTangentAt(clamp01(s)).multiplyScalar(v.to > v.from ? 1 : -1);
      const side = V(-tan.z, 0, tan.x).multiplyScalar(v.g.userData.lane ?? 1.1);
      v.g.position.set(p.x + side.x, 0.1 + Math.sin(time * 12 + s * 300) * 0.015, p.z + side.z);
      v.g.rotation.y = Math.atan2(-tan.z, tan.x);
      v.wheels.forEach((w) => (w.rotation.z = -s * v.path.getLength() * 2));
    });

    // walkers
    this.walkers.forEach((w, k) => {
      if (w.mode === 'walk') {
        const s = (w.offset + time * w.speed) % 1;
        const p = w.path.getPointAt(s);
        const t = w.path.getTangentAt(s);
        const side = V(-t.z, 0, t.x).multiplyScalar(k % 2 ? 1.2 : -1.2);
        w.g.position.set(p.x + side.x, 0.1, p.z + side.z);
        w.g.rotation.y = Math.atan2(t.x, t.z);
        const sw = Math.sin(time * 6 + k) * 0.5;
        w.parts.legL.rotation.x = sw;
        w.parts.legR.rotation.x = -sw;
        w.parts.armL.rotation.x = -sw * 0.8;
        w.parts.armR.rotation.x = sw * 0.8;
      } else if (w.mode === 'bend') {
        const on = x > this.ids.indexOf('harvest') - 0.5 && x < this.ids.indexOf('collect') + 0.6;
        w.g.visible = on;
        w.parts.torso.rotation.x = 0.9 + Math.sin(time * 1.8 + k) * 0.18;
        w.parts.armL.rotation.x = -0.9 + Math.sin(time * 1.8 + k) * 0.3;
        w.parts.armR.rotation.x = -1.1 + Math.sin(time * 1.8 + k + 1) * 0.3;
      } else {
        w.parts.torso.rotation.y = Math.sin(time * 0.5 + k) * 0.15;
        w.parts.armR.rotation.x = Math.sin(time * 0.8 + k) * 0.15;
      }
    });

    // boats drift along the river
    this.boats.forEach((b) => {
      b.t = (b.t + b.speed * 0.016 + 1) % 1;
      const p = RIVER.getPointAt(b.t);
      const tan = RIVER.getTangentAt(b.t).multiplyScalar(Math.sign(b.speed));
      const side = V(-tan.z, 0, tan.x).multiplyScalar(8);
      b.g.position.set(p.x + side.x, -1.45 + Math.sin(time * 1.2 + b.t * 40) * 0.06, p.z + side.z);
      b.g.rotation.y = Math.atan2(-tan.z, tan.x);
      b.g.rotation.z = Math.sin(time * 0.9 + b.t * 30) * 0.03;
    });

    // birds: a flock of egrets looping over the fields
    const m4 = new THREE.Matrix4();
    for (let k = 0; k < this.birds.count; k++) {
      const a = time * 0.06 + (k % 12) * 0.03 + (k < 12 ? 0 : Math.PI);
      const cx = k < 12 ? 70 : -40;
      const cz = k < 12 ? 40 : -20;
      const r = 70 + (k % 5) * 3;
      const bp = V(cx + Math.cos(a) * r + (k % 3) * 1.5, 22 + (k % 4) * 1.2 + Math.sin(time + k) * 0.6, cz + Math.sin(a) * r + (k % 4) * 1.3);
      m4.makeRotationY(-a);
      m4.setPosition(bp);
      this.birds.setMatrixAt(k, m4);
    }
    this.birds.instanceMatrix.needsUpdate = true;

    // kitchen smoke
    const sp = this.smoke.geometry.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < sp.count; k++) {
      const ph = (time * 0.12 + k / sp.count) % 1;
      sp.setXYZ(k, this.anchors.stove.x + Math.sin(k * 3.1) * ph * 1.4 + ph * 2, this.anchors.stove.y + ph * 9, this.anchors.stove.z + Math.cos(k * 2.3) * ph * 1.2);
    }
    sp.needsUpdate = true;

    // satellite and drone during the grow beats
    const g2 = L('grow2');
    this.satellite.visible = g2 > 0 && g2 < 1.1;
    if (this.satellite.visible) this.satellite.position.set(lerp(-40, 220, g2), 70, lerp(-60, 80, g2));
    this.satellite.lookAt(V(110, 0, 56));
    const gr = L('grow');
    this.drone.visible = gr > 0 && gr < 1.1;
    if (this.drone.visible) this.drone.position.set(lerp(70, 96, gr), 5 + Math.sin(time * 2) * 0.15, lerp(40, 50, gr));
    if (this.water) this.water.material.uniforms.time.value = time * 0.6;
  }

  /* ------------------------------ public API */
  setProgress(p: number) {
    this.target = clamp01(p);
  }

  screen(anchor: string, out: { x: number; y: number; visible: boolean }) {
    const a = this.anchors[anchor];
    if (!a) {
      out.visible = false;
      return out;
    }
    const v = this.tmp.copy(a).project(this.camera);
    const el = this.renderer.domElement;
    out.x = (v.x * 0.5 + 0.5) * el.clientWidth;
    out.y = (-v.y * 0.5 + 0.5) * el.clientHeight;
    out.visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
    return out;
  }

  resize() {
    const el = this.renderer.domElement;
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 55 : w / h < 1.2 ? 44 : 36;
    this.camera.updateProjectionMatrix();
    this.composer?.setSize(w, h);
  }

  setVisible(v: boolean) {
    this.visible = v;
  }

  renderOnce() {
    const t = this.clock.getElapsedTime();
    this.apply(this.progress, t);
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!this.visible) return;
      // critically damped spring: the camera eases into and out of every move
      const k = 3.4;
      this.vel += ((this.target - this.progress) * k * k - 2 * k * this.vel) * dt;
      this.progress += this.vel * dt;
      if (Math.abs(this.target - this.progress) < 1e-5 && Math.abs(this.vel) < 1e-5) this.progress = this.target;
      this.renderOnce();
      this.opts.onFrame?.(this);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
    mats.forEach((m) => m.dispose());
    mats.clear();
    this.composer?.dispose();
    this.envRT?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}
