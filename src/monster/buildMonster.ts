import * as THREE from "three";
import type { MonsterGenotype } from "../generator/types";
import { subRng, type Rng } from "../generator/rng";

export interface EyeRig { group: THREE.Group; pupil?: THREE.Object3D; brow?: THREE.Object3D; }
export interface AnimRig {
  root: THREE.Group;
  creature: THREE.Group; // sways / bobs
  body: THREE.Group;
  head: THREE.Group;
  eyes: EyeRig[];
  snarl?: THREE.Group;
  jaw?: THREE.Object3D;
  tongue?: THREE.Object3D;
  tail?: THREE.Object3D;
  wings: THREE.Object3D[];
  ears: THREE.Object3D[];
  arms: THREE.Object3D[];
  hands: THREE.Object3D[];
  legs: THREE.Object3D[];
  bodyType: MonsterGenotype["anatomy"]["body"];
  aura?: THREE.Object3D;
  halo?: THREE.Object3D;
  floatingHead: boolean;
  floating: boolean;
  /** parts that fly in during the summon */
  assembleParts: { obj: THREE.Object3D; from: THREE.Vector3; delay: number; basePos: THREE.Vector3; baseScale: THREE.Vector3 }[];
  height: number;
}

// ---------- materials
let gradientMap: THREE.DataTexture | null = null;
function getGradientMap() {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([70, 150, 255]);
  gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

class Mats {
  private cache = new Map<string, THREE.Material>();
  get(color: string, emissive = false): THREE.Material {
    const key = color + (emissive ? "!" : "");
    let m = this.cache.get(key);
    if (!m) {
      if (emissive) m = new THREE.MeshBasicMaterial({ color });
      else m = new THREE.MeshToonMaterial({ color, gradientMap: getGradientMap() });
      this.cache.set(key, m);
    }
    return m;
  }
  dispose() { this.cache.forEach((m) => m.dispose()); }
}

// ---------- geometry helpers
const geoCache = new Map<string, THREE.BufferGeometry>();
function box(w: number, h: number, d: number) {
  const k = `b${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(k, g); }
  return g;
}
function sphere(r: number, ws = 8, hs = 6) {
  const k = `s${r.toFixed(3)},${ws},${hs}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.SphereGeometry(r, ws, hs); geoCache.set(k, g); }
  return g;
}
function cone(r: number, h: number, seg = 6) {
  const k = `c${r.toFixed(3)},${h.toFixed(3)},${seg}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.ConeGeometry(r, h, seg); geoCache.set(k, g); }
  return g;
}
function cyl(rt: number, rb: number, h: number, seg = 8) {
  const k = `y${rt.toFixed(3)},${rb.toFixed(3)},${h.toFixed(3)},${seg}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, h, seg); geoCache.set(k, g); }
  return g;
}
function flatPoly(points: [number, number][], depth = 0.08) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

export function buildMonster(g: MonsterGenotype): { rig: AnimRig; dispose: () => void } {
  const mats = new Mats();
  const M = (c: string, e = false) => mats.get(c, e);
  const a = g.anatomy;
  const p = a.proportions;
  const pal = g.palette;
  const rng: Rng = subRng(`v${g.version}:${g.seed}`, "build");
  const summonRng: Rng = subRng(`v${g.version}:${g.seed}`, "summon");
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material) => new THREE.Mesh(geo, mat);

  const root = new THREE.Group();
  const creature = new THREE.Group();
  root.add(creature);
  const body = new THREE.Group();
  creature.add(body);
  const head = new THREE.Group();
  const eyes: EyeRig[] = [];
  const wings: THREE.Object3D[] = [];
  const ears: THREE.Object3D[] = [];
  const arms: THREE.Object3D[] = [];
  const hands: THREE.Object3D[] = [];
  const legs: THREE.Object3D[] = [];
  const assembleParts: AnimRig["assembleParts"] = [];
  let snarl: THREE.Group | undefined, jaw: THREE.Object3D | undefined, tongue: THREE.Object3D | undefined, tail: THREE.Object3D | undefined;
  let aura: THREE.Object3D | undefined, halo: THREE.Object3D | undefined;

  const registerPart = (obj: THREE.Object3D, delayBase = 0) => {
    const dir = new THREE.Vector3(summonRng.range(-1, 1), summonRng.range(-0.6, 1.2), summonRng.range(-0.6, 0.8)).normalize().multiplyScalar(summonRng.range(1.6, 3.2));
    assembleParts.push({ obj, from: dir, delay: delayBase + summonRng.range(0, 0.35), basePos: obj.position.clone(), baseScale: obj.scale.clone() });
  };

  const skinColor = a.mutations.includes("skeletal_face") ? pal.body : pal.body;
  const bodyMat = M(skinColor);
  const secMat = M(pal.secondary);
  const hornMat = M(pal.horn);
  const eyeMat = M(pal.eye, a.eyes.type === "glow" || a.mutations.includes("glowing_markings"));
  const pupilMat = M(pal.pupil);
  const mouthMat = M(pal.mouth);
  const toothMat = M("#f1ecdc");
  const accentMat = M(pal.accent, true);
  const boneMat = M("#e8e1cf");

  // ---------- BODY
  const W = 1.2 * p.bodyW, H = 1.3 * p.bodyH, D = 1.0 * p.bodyD;
  let bodyTop = H / 2, bodyBottom = -H / 2, bodyHalfW = W / 2, bodyFrontZ = D / 2, bodyBackZ = -D / 2;
  let legAttachZ = 0;
  const bodyType = a.body;
  const isQuad = bodyType === "quadruped";
  if (bodyType === "blob") {
    const m = mesh(sphere(1, 9, 6), bodyMat); m.scale.set(W * 0.8, H * 0.6, D * 0.75); body.add(m);
    bodyTop = H * 0.55; bodyBottom = -H * 0.55; bodyHalfW = W * 0.78; bodyFrontZ = D * 0.7; bodyBackZ = -D * 0.7;
  } else if (bodyType === "tall") {
    body.add(mesh(box(W * 0.65, H * 1.6, D * 0.6), bodyMat));
    bodyTop = H * 0.8; bodyBottom = -H * 0.8; bodyHalfW = W * 0.33; bodyFrontZ = D * 0.3; bodyBackZ = -D * 0.3;
  } else if (bodyType === "barrel") {
    body.add(mesh(cyl(W * 0.5, W * 0.62, H * 1.1, 8), bodyMat));
    bodyTop = H * 0.55; bodyBottom = -H * 0.55; bodyHalfW = W * 0.58; bodyFrontZ = W * 0.55; bodyBackZ = -W * 0.55;
  } else if (bodyType === "hunched") {
    const m = mesh(box(W * 0.9, H * 1.1, D * 0.8), bodyMat); m.rotation.x = 0.38; body.add(m);
    const hump = mesh(sphere(1, 8, 6), bodyMat); hump.scale.set(W * 0.5, H * 0.35, D * 0.4); hump.position.set(0, H * 0.45, -D * 0.25); body.add(hump);
    bodyTop = H * 0.5; bodyBottom = -H * 0.5; bodyHalfW = W * 0.45; bodyFrontZ = D * 0.55; bodyBackZ = -D * 0.5;
  } else if (bodyType === "shell") {
    const m = mesh(sphere(1, 8, 6), bodyMat); m.scale.set(W * 0.6, H * 0.45, D * 0.6); body.add(m);
    const shell = mesh(sphere(1, 8, 5, ), secMat); shell.scale.set(W * 0.75, H * 0.5, D * 0.75); shell.position.set(0, H * 0.12, -D * 0.15); body.add(shell);
    bodyTop = H * 0.55; bodyBottom = -H * 0.45; bodyHalfW = W * 0.62; bodyFrontZ = D * 0.55; bodyBackZ = -D * 0.85;
  } else if (bodyType === "floating") {
    const m = mesh(sphere(1, 8, 6), bodyMat); m.scale.set(W * 0.6, H * 0.55, D * 0.6); body.add(m);
    const tip = mesh(cone(W * 0.5, H * 0.9, 6), bodyMat); tip.rotation.x = Math.PI; tip.position.y = -H * 0.7; body.add(tip);
    bodyTop = H * 0.5; bodyBottom = -H * 1.1; bodyHalfW = W * 0.6; bodyFrontZ = D * 0.55; bodyBackZ = -D * 0.55;
  } else if (bodyType === "quadruped") {
    body.add(mesh(box(W * 0.8, H * 0.7, D * 1.9), bodyMat));
    bodyTop = H * 0.35; bodyBottom = -H * 0.35; bodyHalfW = W * 0.4; bodyFrontZ = D * 0.95; bodyBackZ = -D * 0.95; legAttachZ = D * 0.65;
  } else if (bodyType === "serpent") {
    body.add(mesh(box(W * 0.7, H * 0.8, D * 0.6), bodyMat));
    bodyTop = H * 0.4; bodyBottom = -H * 0.4; bodyHalfW = W * 0.35; bodyFrontZ = D * 0.3; bodyBackZ = -D * 0.3;
    const coil = new THREE.Group();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const s = W * (0.65 - t * 0.4);
      const seg = mesh(box(s, s * 0.9, s), i % 2 === 0 || a.skin !== "scales" ? bodyMat : secMat);
      const ang = t * Math.PI * 1.7 * (p.asym < 0 ? -1 : 1);
      seg.position.set(Math.sin(ang) * W * 0.55, -H * 0.5 - t * H * 1.05, (Math.cos(ang) - 1) * 0.35 + 0.1);
      coil.add(seg);
    }
    body.add(coil);
    bodyBottom = -H * 1.6;
  }
  registerPart(body, 0);

  // ---------- skin decoration
  const decoRng = subRng(`v${g.version}:${g.seed}`, "deco");
  if (a.skin === "fur") {
    for (let i = 0; i < 6; i++) {
      const t = mesh(box(0.16, 0.22, 0.14), secMat);
      t.position.set(decoRng.range(-bodyHalfW, bodyHalfW) * 0.9, bodyTop - 0.05 + decoRng.range(0, 0.15), decoRng.range(bodyBackZ, bodyFrontZ) * 0.8);
      t.rotation.z = decoRng.range(-0.5, 0.5); body.add(t);
    }
  } else if (a.skin === "scales") {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const s = mesh(box(0.18, 0.12, 0.06), secMat);
      s.position.set((c - 1) * bodyHalfW * 0.5, bodyBottom + (r + 1) * (bodyTop - bodyBottom) / 4, bodyFrontZ + 0.02);
      body.add(s);
    }
  } else if (a.skin === "stone") {
    for (let i = 0; i < 5; i++) {
      const s = mesh(box(0.22, 0.2, 0.2), secMat);
      s.position.set(decoRng.range(-bodyHalfW, bodyHalfW) * 0.9, decoRng.range(bodyBottom, bodyTop) * 0.8, decoRng.range(0, bodyFrontZ) * 0.9);
      s.rotation.set(decoRng.range(0, 1), decoRng.range(0, 1), 0); body.add(s);
    }
  } else if (a.skin === "bone") {
    for (let i = 0; i < 3; i++) {
      const s = mesh(box(bodyHalfW * 1.4, 0.08, 0.08), boneMat);
      s.position.set(0, bodyBottom + (i + 1) * (bodyTop - bodyBottom) / 4.2, bodyFrontZ + 0.02); body.add(s);
    }
  }
  if (a.markings) {
    const glow = a.mutations.includes("glowing_markings");
    const mm = glow ? accentMat : secMat;
    const n = decoRng.int(3, 6);
    for (let i = 0; i < n; i++) {
      const s = mesh(box(0.12, decoRng.range(0.12, 0.3), 0.05), mm);
      s.position.set(decoRng.range(-bodyHalfW, bodyHalfW) * 0.85, decoRng.range(bodyBottom, bodyTop) * 0.7, bodyFrontZ + 0.03);
      body.add(s);
    }
  }
  if (a.back === "spikes") {
    const n = isQuad ? 5 : 4;
    for (let i = 0; i < n; i++) {
      const s = mesh(cone(0.14, 0.4, 4), secMat);
      if (isQuad) s.position.set(0, bodyTop + 0.15, bodyBackZ + (i + 0.5) * (bodyFrontZ - bodyBackZ) / n);
      else { s.position.set(0, bodyBottom + (i + 0.5) * (bodyTop - bodyBottom) / n, bodyBackZ - 0.1); s.rotation.x = -Math.PI / 2; }
      body.add(s);
    }
  } else if (a.back === "fins") {
    const fin = mesh(flatPoly([[0, 0], [0.6, 0.55], [1.2, 0.2], [1.8, 0.6], [2.2, 0]], 0.08), secMat);
    const len = isQuad ? bodyFrontZ - bodyBackZ : bodyTop - bodyBottom;
    fin.scale.set(len / 2.2, 0.9, 1);
    if (isQuad) { fin.rotation.y = Math.PI / 2; fin.position.set(0, bodyTop, bodyFrontZ); }
    else { fin.rotation.set(0, -Math.PI / 2, Math.PI / 2); fin.position.set(0, bodyBottom, bodyBackZ); }
    body.add(fin);
  } else if (a.back === "shell" && bodyType !== "shell") {
    const shell = mesh(sphere(1, 8, 5), secMat); shell.scale.set(bodyHalfW * 1.1, (bodyTop - bodyBottom) * 0.45, 0.35);
    shell.position.set(0, (bodyTop + bodyBottom) / 2, bodyBackZ - 0.15); body.add(shell);
  }

  // ---------- LEGS
  const legRng = subRng(`v${g.version}:${g.seed}`, "legs-build");
  let legLen = 0;
  const makeLeg = (side: number, thick: number): { g: THREE.Group; len: number } => {
    const lg = new THREE.Group();
    const L = a.legs;
    const t = 0.26 * p.legThick * thick;
    let len = 0.9 * p.legLength;
    if (L === "stubby") len = 0.4 * p.legLength;
    if (L === "long") len = 1.5 * p.legLength;
    if (L === "thick") { len = 0.8 * p.legLength; }
    const tt = L === "thick" ? t * 1.8 : L === "long" || L === "bird" ? t * 0.7 : t;
    if (L === "hoof") {
      const upper = mesh(box(tt, len * 0.55, tt), bodyMat); upper.position.set(0, -len * 0.27, 0); upper.rotation.x = 0.35; lg.add(upper);
      const lower = mesh(box(tt * 0.85, len * 0.55, tt * 0.85), bodyMat); lower.position.set(0, -len * 0.75, -len * 0.12); lower.rotation.x = -0.3; lg.add(lower);
      const hoof = mesh(box(tt * 1.3, tt * 0.7, tt * 1.4), pupilMat); hoof.position.set(0, -len - tt * 0.3, 0.02); lg.add(hoof);
      len += tt * 0.6;
    } else if (L === "bird") {
      const shin = mesh(box(tt, len, tt), secMat); shin.position.y = -len / 2; lg.add(shin);
      for (let i = -1; i <= 1; i++) {
        const toe = mesh(box(tt * 0.6, tt * 0.5, len * 0.35), secMat); toe.position.set(i * tt * 0.7, -len - tt * 0.2, len * 0.15); toe.rotation.y = i * 0.5; lg.add(toe);
      }
      len += tt * 0.4;
    } else {
      const shin = mesh(box(tt, len, tt), bodyMat); shin.position.y = -len / 2; lg.add(shin);
      const foot = mesh(box(tt * 1.2, tt * 0.6, tt * 1.7), L === "thick" ? bodyMat : secMat); foot.position.set(side * tt * 0.1, -len - tt * 0.3, tt * 0.35); lg.add(foot);
      len += tt * 0.6;
    }
    return { g: lg, len };
  };
  if (a.legCount > 0 && a.legs !== "none") {
    const positions: [number, number][] = [];
    if (a.legCount === 4) {
      const zf = isQuad ? legAttachZ : Math.max(0.25, bodyFrontZ * 0.6);
      positions.push([-1, zf], [1, zf], [-1, -zf], [1, -zf]);
    } else positions.push([-1, 0], [1, 0]);
    positions.forEach(([side, z], i) => {
      const { g: lg, len } = makeLeg(side, 1);
      const spread = isQuad ? bodyHalfW * 0.75 : bodyHalfW * (bodyType === "tall" ? 0.7 : 0.55);
      lg.position.set(side * spread, bodyBottom + 0.08, z);
      if (a.legCount === 2 && Math.abs(p.asym) > 0.55) lg.rotation.z = side * 0.12 * Math.sign(p.asym);
      creature.add(lg);
      legs.push(lg);
      legLen = Math.max(legLen, len - 0.08);
      registerPart(lg, 0.15 + i * 0.05);
      void legRng;
    });
  }
  const hoverGap = bodyType === "floating" ? 0.55 : a.legCount === 0 && bodyType !== "serpent" ? 0.35 : 0;
  const groundY = bodyBottom - legLen - hoverGap;

  // ---------- HEAD
  const S = 0.85 * p.headScale;
  const headMat = a.mutations.includes("skeletal_face") ? boneMat : bodyMat;
  let headH = S, headFrontZ = S * 0.45, headHalfW = S * 0.5, headTop = S * 0.5, headBottom = -S * 0.5;
  let mouthZOverride: number | undefined, mouthYOverride: number | undefined;
  const ht = a.head;
  if (ht === "cube") { head.add(mesh(box(S, S * 0.92, S * 0.9), headMat)); headH = S * 0.92; headFrontZ = S * 0.45; headTop = S * 0.46; headBottom = -S * 0.46; }
  else if (ht === "sphere") { head.add(mesh(sphere(S * 0.56, 9, 7), headMat)); headH = S * 1.1; headFrontZ = S * 0.5; headHalfW = S * 0.56; headTop = S * 0.5; headBottom = -S * 0.5; }
  else if (ht === "skull") {
    head.add(mesh(box(S * 0.9, S * 0.85, S * 0.85), headMat));
    const j = mesh(box(S * 0.7, S * 0.35, S * 0.7), headMat); j.position.set(0, -S * 0.55, S * 0.02); head.add(j);
    headFrontZ = S * 0.43; headTop = S * 0.43; headBottom = -S * 0.72; headHalfW = S * 0.45;
  } else if (ht === "snout") {
    head.add(mesh(box(S * 0.85, S * 0.85, S * 0.75), headMat));
    const sn = mesh(box(S * 0.5, S * 0.45, S * 0.65), secMat); sn.position.set(0, -S * 0.15, S * 0.6); head.add(sn);
    const nose = mesh(box(S * 0.22, S * 0.12, S * 0.1), pupilMat); nose.position.set(0, S * 0.02, S * 0.92); head.add(nose);
    headFrontZ = S * 0.37; headTop = S * 0.43; headBottom = -S * 0.43; headHalfW = S * 0.43;
    mouthZOverride = S * 0.93; mouthYOverride = -S * 0.3;
  } else if (ht === "beak") {
    head.add(mesh(sphere(S * 0.5, 8, 6), headMat));
    const bk = mesh(cone(S * 0.28, S * 0.9, 4), hornMat); bk.rotation.x = Math.PI / 2; bk.rotation.y = Math.PI / 4; bk.position.set(0, -S * 0.08, S * 0.8); head.add(bk);
    headFrontZ = S * 0.42; headTop = S * 0.5; headBottom = -S * 0.5;
  } else if (ht === "wide") { head.add(mesh(box(S * 1.6, S * 0.62, S * 0.8), headMat)); headH = S * 0.62; headFrontZ = S * 0.4; headHalfW = S * 0.8; headTop = S * 0.31; headBottom = -S * 0.31; }
  else if (ht === "tall") { head.add(mesh(box(S * 0.7, S * 1.55, S * 0.7), headMat)); headH = S * 1.55; headFrontZ = S * 0.35; headHalfW = S * 0.35; headTop = S * 0.77; headBottom = -S * 0.77; }
  else if (ht === "flame") {
    const c = mesh(cone(S * 0.55, S * 1.4, 6), headMat); c.position.y = S * 0.2; head.add(c);
    const c2 = mesh(cone(S * 0.3, S * 0.7, 5), accentMat); c2.position.set(S * 0.15 * Math.sign(p.asym || 1), S * 0.9, 0); head.add(c2);
    headH = S * 1.4; headFrontZ = S * 0.3; headHalfW = S * 0.45; headTop = S * 0.9; headBottom = -S * 0.5;
  } else if (ht === "jar") {
    head.add(mesh(cyl(S * 0.42, S * 0.5, S * 1.05, 8), headMat));
    const lid = mesh(cyl(S * 0.5, S * 0.5, S * 0.14, 8), secMat); lid.position.y = S * 0.58; head.add(lid);
    headH = S * 1.05; headFrontZ = S * 0.42; headHalfW = S * 0.5; headTop = S * 0.65; headBottom = -S * 0.52;
  }
  head.position.set(0, bodyTop + headH * 0.5 - headBottom - headH * 0.5 + p.neckLength * 0.6 + (isQuad ? 0.1 : 0.02), isQuad ? bodyFrontZ - 0.1 : bodyType === "hunched" ? bodyFrontZ * 0.5 : 0.05);
  if (a.mutations.includes("floating_head")) head.position.y += 0.45;
  if (p.neckLength > 0.12 && !a.mutations.includes("floating_head")) {
    const neck = mesh(box(Math.min(S * 0.65, bodyHalfW), p.neckLength * 0.9 + 0.28, S * 0.55), bodyMat);
    neck.position.set(head.position.x, bodyTop + p.neckLength * 0.3, head.position.z); body.add(neck);
  }
  head.rotation.z = p.headTilt;
  creature.add(head);
  registerPart(head, 0.35);

  // ---------- FACE (eyes + mouth) - can be duplicated for two_faces
  const makeFace = (target: THREE.Group, frontZ: number, collectEyes: boolean) => {
    const es = 0.16 * p.eyeScale * Math.sqrt(S);
    const spread = Math.min(headHalfW * 0.8, headHalfW * 0.55 * p.eyeSpread);
    const ey = headH * 0.12 + p.eyeHeight * headH * 0.5;
    const positions: [number, number, number][] = []; // x,y,scale
    const n = a.eyes.count;
    if (a.mutations.includes("one_giant_eye") || (n === 1)) positions.push([0, ey, a.mutations.includes("one_giant_eye") ? 2.6 : 1.6]);
    else if (a.mutations.includes("crown_of_eyes")) {
      for (let i = 0; i < 5; i++) { const t = (i - 2) / 2; positions.push([t * headHalfW * 0.8, headTop * 0.7 - Math.abs(t) * headH * 0.25, 0.8]); }
    } else if (a.mutations.includes("stacked_eyes")) {
      for (let i = 0; i < n; i++) positions.push([0, headBottom * 0.2 + i * headH * 0.28, 0.9]);
    } else if (n === 2) positions.push([-spread, ey, 1], [spread, ey, 1]);
    else if (n === 3) { positions.push([-spread, ey, 1], [spread, ey, 1], [0, ey + es * 1.8, 1.1]); }
    else if (n === 4) positions.push([-spread, ey + es, 1], [spread, ey + es, 1], [-spread * 0.6, ey - es * 1.2, 0.7], [spread * 0.6, ey - es * 1.2, 0.7]);
    else if (n >= 5) { for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) positions.push([(c - 0.5) * spread * 1.5, ey + (1 - r) * es * 2.1, 0.75]); }
    // asymmetry: one eye bigger
    if (Math.abs(p.asym) > 0.6 && positions.length >= 2 && !a.mutations.includes("one_giant_eye")) positions[p.asym > 0 ? 0 : 1][2] *= 1.5;

    for (const [x, y, sc] of positions) {
      const eg = new THREE.Group();
      eg.position.set(x, y, frontZ);
      const size = es * sc;
      let pupil: THREE.Object3D | undefined;
      if (a.mutations.includes("mouth_eyes")) {
        eg.add(mesh(box(size * 1.6, size * 0.5, 0.08), mouthMat));
        for (let i = -1; i <= 1; i++) { const t = mesh(box(size * 0.25, size * 0.25, 0.09), toothMat); t.position.set(i * size * 0.5, size * 0.1, 0.01); eg.add(t); }
      } else if (a.eyes.type === "hollow") {
        eg.add(mesh(box(size * 1.1, size * 1.1, 0.12), pupilMat));
        const dot = mesh(box(size * 0.25, size * 0.25, 0.06), eyeMat); dot.position.z = 0.06; eg.add(dot); pupil = dot;
      } else if (a.eyes.type === "glow") {
        eg.add(mesh(box(size * 1.1, size * 0.9, 0.12), eyeMat));
      } else if (a.eyes.type === "cross") {
        const b1 = mesh(box(size * 1.4, size * 0.3, 0.1), pupilMat); b1.rotation.z = Math.PI / 4; eg.add(b1);
        const b2 = mesh(box(size * 1.4, size * 0.3, 0.1), pupilMat); b2.rotation.z = -Math.PI / 4; eg.add(b2);
      } else if (a.eyes.type === "slit") {
        eg.add(mesh(box(size * 1.3, size * 0.8, 0.1), eyeMat));
        const pp = mesh(box(size * 0.3, size * 0.7, 0.08), pupilMat); pp.position.z = 0.06; eg.add(pp); pupil = pp;
      } else if (a.eyes.type === "ring") {
        eg.add(mesh(box(size * 1.3, size * 1.3, 0.1), secMat));
        const w = mesh(box(size * 0.9, size * 0.9, 0.1), eyeMat); w.position.z = 0.03; eg.add(w);
        const pp = mesh(box(size * 0.4, size * 0.4, 0.08), pupilMat); pp.position.z = 0.08; eg.add(pp); pupil = pp;
      } else {
        eg.add(mesh(box(size * 1.1, size * 1.1, 0.1), eyeMat));
        const pp = mesh(box(size * 0.5, size * 0.55, 0.08), pupilMat); pp.position.z = 0.06; eg.add(pp); pupil = pp;
      }
      let brow: THREE.Object3D | undefined;
      if (collectEyes) {
        brow = mesh(box(size * 1.35, Math.max(0.035, size * 0.2), 0.08), pupilMat);
        brow.position.set(0, size * 0.95, 0.13);
        brow.scale.y = 0.001;
        brow.visible = false;
        eg.add(brow);
      }
      target.add(eg);
      if (collectEyes) eyes.push({ group: eg, pupil, brow });
    }

    // mouth
    const mw = Math.min(headHalfW * 1.7, headHalfW * 1.1 * p.mouthWidth);
    const my = mouthYOverride ?? headBottom + headH * 0.22;
    const mt = a.mouth;
    const mg = new THREE.Group(); mg.position.set(0, my, collectEyes && mouthZOverride ? mouthZOverride : frontZ);
    const addTeeth = (count: number, y: number, up: boolean, w: number) => {
      for (let i = 0; i < count; i++) {
        const t = mesh(box(w, w * 1.4, 0.1), toothMat);
        t.position.set((i - (count - 1) / 2) * (mw / count), y + (up ? w * 0.6 : -w * 0.6), 0.02); mg.add(t);
      }
    };
    if (mt === "grin") { mg.add(mesh(box(mw, 0.13, 0.1), mouthMat)); addTeeth(Math.max(3, Math.round(mw * 6)), -0.02, true, 0.09); }
    else if (mt === "fangs") {
      mg.add(mesh(box(mw, 0.16, 0.1), mouthMat));
      for (const s of [-1, 1]) { const f = mesh(cone(0.07, 0.26, 4), toothMat); f.rotation.x = Math.PI; f.position.set(s * mw * 0.38, -0.2, 0.02); mg.add(f); }
    } else if (mt === "tusks") {
      mg.add(mesh(box(mw, 0.14, 0.1), mouthMat));
      for (const s of [-1, 1]) { const f = mesh(cone(0.08, 0.36, 4), toothMat); f.rotation.z = -s * 0.25; f.position.set(s * mw * 0.45, 0.16, 0.05); mg.add(f); }
    } else if (mt === "maw") {
      const jawG = new THREE.Group();
      const upper = mesh(box(mw, headH * 0.14, 0.12), mouthMat); upper.position.y = 0.04; mg.add(upper);
      const lower = mesh(box(mw, headH * 0.16, 0.12), mouthMat); lower.position.y = -headH * 0.08; jawG.add(lower);
      const chin = mesh(box(mw * 1.05, 0.1, 0.12), headMat); chin.position.y = -headH * 0.17; jawG.add(chin);
      mg.add(jawG); jaw = jawG;
      addTeeth(4, 0.1, false, 0.08);
      for (let i = 0; i < 3; i++) { const t = mesh(box(0.08, 0.12, 0.1), toothMat); t.position.set((i - 1) * mw * 0.3, -headH * 0.1, 0.03); jawG.add(t); }
    } else if (mt === "tongue" || a.mutations.includes("giant_tongue")) {
      mg.add(mesh(box(mw, 0.15, 0.1), mouthMat));
      const tl = a.mutations.includes("giant_tongue") ? 0.9 : 0.4;
      const tg = new THREE.Group(); tg.position.set(0, -0.06, 0.02);
      const tm = mesh(box(mw * 0.35, tl, 0.09), accentMat); tm.position.y = -tl / 2; tg.add(tm);
      mg.add(tg); tongue = tg;
    } else if (mt === "beak" && ht !== "beak") {
      const bk = mesh(cone(0.16, 0.4, 4), hornMat); bk.rotation.x = Math.PI / 2; bk.rotation.y = Math.PI / 4; bk.position.z = 0.15; mg.add(bk);
    } else if (mt === "flat") { mg.add(mesh(box(mw * 0.8, 0.08, 0.1), mouthMat)); }
    if (a.mutations.includes("extra_jaw") && mt !== "none") {
      const m2 = mesh(box(mw * 0.6, 0.1, 0.1), mouthMat); m2.position.y = -0.2; mg.add(m2);
      for (let i = -1; i <= 1; i++) { const t = mesh(box(0.07, 0.1, 0.1), toothMat); t.position.set(i * mw * 0.2, -0.14, 0.02); mg.add(t); }
    }
    target.add(mg);
    if (collectEyes) {
      const sg = new THREE.Group();
      sg.position.set(0, my - headH * 0.04, (mouthZOverride ?? frontZ) + 0.13);
      const cavity = mesh(box(mw * 0.9, Math.max(0.1, headH * 0.13), 0.09), mouthMat);
      sg.add(cavity);
      for (const side of [-1, 1]) {
        const fang = mesh(cone(Math.max(0.045, mw * 0.055), Math.max(0.16, headH * 0.22), 4), toothMat);
        fang.rotation.x = Math.PI;
        fang.position.set(side * mw * 0.29, -headH * 0.09, 0.06);
        sg.add(fang);
      }
      sg.scale.y = 0.001;
      sg.visible = false;
      target.add(sg);
      snarl = sg;
    }
    if (a.mutations.includes("skeletal_face")) {
      // nasal cavity
      const nc = mesh(box(0.1, 0.14, 0.1), pupilMat); nc.position.set(0, ey - es * 1.6, frontZ); target.add(nc);
    }
  };
  makeFace(head, headFrontZ + 0.02, true);
  if (a.mutations.includes("two_faces")) {
    const f2 = new THREE.Group(); f2.rotation.y = -Math.PI / 2; head.add(f2);
    makeFace(f2, headHalfW + 0.02, false);
  }

  // ---------- HORNS
  const hornRoot = new THREE.Group(); head.add(hornRoot);
  const hs = 0.55 * p.hornScale * Math.sqrt(S);
  const hornSideScale = (side: number) => {
    let s = 1;
    if (a.mutations.includes("asymmetric_horns")) s = side > 0 ? 0.55 : 1.35;
    if (p.brokenHorn && side === (p.asym > 0 ? 1 : -1)) s *= 0.45;
    return s;
  };
  const addHornPair = (build: (side: number) => THREE.Object3D) => {
    for (const side of [-1, 1]) {
      const h = build(side);
      h.scale.multiplyScalar(hornSideScale(side));
      hornRoot.add(h);
    }
  };
  const HT = a.horns;
  if (HT === "curved") addHornPair((side) => {
    const gp = new THREE.Group(); gp.position.set(side * headHalfW * 0.6, headTop, 0);
    for (let i = 0; i < 3; i++) { const seg = mesh(box(hs * 0.28 * (1 - i * 0.2), hs * 0.4, hs * 0.28 * (1 - i * 0.2)), hornMat); seg.position.set(side * i * hs * 0.16 * (1 + p.hornCurve), hs * 0.32 * i + hs * 0.15, 0); seg.rotation.z = -side * (0.3 + i * 0.35 * (1 + p.hornCurve)); gp.add(seg); }
    return gp;
  });
  else if (HT === "straight") addHornPair((side) => { const c = mesh(cone(hs * 0.18, hs * 1.1, 4), hornMat); c.position.set(side * headHalfW * 0.55, headTop + hs * 0.45, 0); c.rotation.z = -side * (0.25 + p.hornCurve * 0.3); return c; });
  else if (HT === "oni") addHornPair((side) => { const c = mesh(cone(hs * 0.24, hs * 0.7, 5), hornMat); c.position.set(side * headHalfW * 0.5, headTop + hs * 0.3, headFrontZ * 0.3); c.rotation.x = -0.25; c.rotation.z = -side * 0.15; return c; });
  else if (HT === "single") { const c = mesh(cone(hs * 0.22, hs * 1.2, 5), hornMat); c.position.set(0, headTop * 0.6 + hs * 0.4, headFrontZ * 0.6); c.rotation.x = -0.6 + p.hornCurve * 0.4; hornRoot.add(c); }
  else if (HT === "ram") addHornPair((side) => {
    const gp = new THREE.Group(); gp.position.set(side * headHalfW * 0.9, headTop * 0.5, 0);
    for (let i = 0; i < 5; i++) { const ang = i * 0.9; const seg = mesh(box(hs * 0.22, hs * 0.3, hs * 0.3 * (1 - i * 0.12)), hornMat); seg.position.set(side * hs * 0.1, Math.sin(ang) * hs * 0.4 + hs * 0.2, -Math.cos(ang) * hs * 0.4 + hs * 0.2); seg.rotation.x = -ang; gp.add(seg); }
    return gp;
  });
  else if (HT === "antlers") addHornPair((side) => {
    const gp = new THREE.Group(); gp.position.set(side * headHalfW * 0.55, headTop, 0);
    const main = mesh(box(hs * 0.14, hs * 1.4, hs * 0.14), hornMat); main.position.y = hs * 0.7; main.rotation.z = -side * 0.35; gp.add(main);
    for (let i = 0; i < 2; i++) { const br = mesh(box(hs * 0.12, hs * 0.6, hs * 0.12), hornMat); br.position.set(side * (hs * 0.25 + i * hs * 0.3), hs * 0.55 + i * hs * 0.45, 0); br.rotation.z = -side * 1.0; gp.add(br); }
    return gp;
  });
  else if (HT === "crown") { for (let i = 0; i < 5; i++) { const ang = (i / 5) * Math.PI * 2; const c = mesh(cone(hs * 0.12, hs * 0.6, 4), hornMat); c.position.set(Math.sin(ang) * headHalfW * 0.6, headTop + hs * 0.25, Math.cos(ang) * headHalfW * 0.6); c.scale.multiplyScalar(i === 0 ? 1.4 : 1); hornRoot.add(c); } }
  if (hornRoot.children.length) registerPart(hornRoot, 0.55);

  // ---------- EARS
  const earRoot = new THREE.Group(); head.add(earRoot);
  const ES = 0.35 * Math.sqrt(S);
  if (a.ears !== "none") for (const side of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(side * headHalfW, headTop * 0.4, 0);
    const oddScale = Math.abs(p.asym) > 0.7 && side === Math.sign(p.asym) ? 1.45 : 1;
    if (a.ears === "pointed") { const c = mesh(cone(ES * 0.4, ES * 1.1, 4), bodyMat); c.position.set(side * ES * 0.25, ES * 0.4, 0); c.rotation.z = -side * 0.6; eg.add(c); }
    else if (a.ears === "round") { const c = mesh(sphere(ES * 0.45, 7, 5), bodyMat); c.scale.z = 0.5; c.position.set(side * ES * 0.3, ES * 0.35, 0); eg.add(c); const inner = mesh(sphere(ES * 0.25, 6, 4), secMat); inner.scale.z = 0.3; inner.position.set(side * ES * 0.3, ES * 0.35, ES * 0.2); eg.add(inner); }
    else if (a.ears === "long") { const c = mesh(box(ES * 0.35, ES * 1.5, ES * 0.2), bodyMat); c.position.set(side * ES * 0.3, ES * 0.6, 0); c.rotation.z = -side * 0.4; eg.add(c); const inner = mesh(box(ES * 0.15, ES * 1.0, ES * 0.12), secMat); inner.position.set(side * ES * 0.3, ES * 0.6, ES * 0.08); inner.rotation.z = -side * 0.4; eg.add(inner); }
    else if (a.ears === "fin") { const f = mesh(flatPoly([[0, 0], [0.6, 0.6], [0.9, 0.1], [0.5, -0.3]], 0.07), secMat); f.scale.set(ES * 1.4 * side, ES * 1.4, 1); f.rotation.y = side * 0.4; eg.add(f); }
    eg.scale.multiplyScalar(oddScale);
    earRoot.add(eg); ears.push(eg);
  }

  // ---------- ARMS
  const armRoot = new THREE.Group(); creature.add(armRoot);
  const AT = a.arms;
  const at = 0.2 * p.armThick;
  const makeArm = (side: number, scale: number) => {
    const ag = new THREE.Group();
    const len = 0.9 * p.armLength * scale;
    if (AT === "stubby") { const m = mesh(box(at * 1.3, at * 1.3, len * 0.5), bodyMat); m.position.set(side * at * 0.5, -len * 0.1, len * 0.25); ag.add(m); const hand = mesh(box(at * 1.5, at * 1.5, at * 1.2), secMat); hand.position.set(side * at * 0.5, -len * 0.15, len * 0.55); ag.add(hand); hands.push(hand); }
    else if (AT === "tentacle") { for (let i = 0; i < 5; i++) { const r = at * (1.1 - i * 0.15); const s = mesh(sphere(r, 7, 5), i % 2 ? secMat : bodyMat); const ang = i * 0.45; s.position.set(side * (Math.sin(ang) * len * 0.5 + i * at * 0.5), -i * len * 0.24, i * 0.12); ag.add(s); } }
    else if (AT === "blade") { const b = mesh(box(at * 0.6, len * 1.4, at * 2.2), hornMat); b.position.set(side * at * 0.6, -len * 0.6, 0); b.rotation.z = side * 0.25; b.rotation.x = 0.3; ag.add(b); }
    else {
      const upper = mesh(box(at, len * 0.55, at), bodyMat); upper.position.set(side * at * 0.3, -len * 0.25, 0); upper.rotation.z = side * 0.35; ag.add(upper);
      const fore = mesh(box(at * 0.9, len * 0.55, at * 0.9), bodyMat); fore.position.set(side * (at * 0.3 + len * 0.18), -len * 0.65, len * 0.15); fore.rotation.x = -0.5; ag.add(fore);
      const hx = side * (at * 0.3 + len * 0.2), hy = -len * 0.92, hz = len * 0.3;
      if (AT === "claw") { for (let i = -1; i <= 1; i++) { const c = mesh(cone(at * 0.35, at * 1.6, 4), hornMat); c.rotation.x = Math.PI / 2; c.position.set(hx + i * at * 0.55, hy, hz + at * 0.5); ag.add(c); hands.push(c); } }
      else { const hand = mesh(box(at * 1.4, at * 1.3, at * 1.2), secMat); hand.position.set(hx, hy, hz); ag.add(hand); hands.push(hand); }
    }
    return ag;
  };
  if (AT !== "none" && a.armCount > 0) {
    const pairs = a.armCount / 2;
    for (let pi = 0; pi < pairs; pi++) for (const side of [-1, 1]) {
      const oddScale = p.oddArm ? (side === Math.sign(p.asym || 1) ? 1.4 : 0.75) : 1;
      const ag = makeArm(side, oddScale);
      const y = bodyTop - (bodyTop - bodyBottom) * (0.22 + pi * 0.28);
      ag.position.set(side * (bodyHalfW + at * 0.2), y, isQuad ? bodyFrontZ * 0.6 : 0.02);
      if (Math.abs(p.asym) > 0.4 && side === Math.sign(p.asym)) ag.rotation.z = side * 0.25;
      armRoot.add(ag); arms.push(ag);
      registerPart(ag, 0.25 + pi * 0.08);
    }
  } else if (a.mutations.includes("detached_hands")) {
    for (const side of [-1, 1]) {
      const hand = mesh(box(at * 1.6, at * 1.5, at * 1.4), secMat);
      hand.position.set(side * (bodyHalfW + 0.55), bodyTop - 0.3, 0.3);
      creature.add(hand); hands.push(hand); registerPart(hand, 0.4);
    }
  }
  if (a.mutations.includes("detached_hands") && AT !== "none") {
    // hands drift away from the arms: move them outward
    hands.forEach((h) => { h.position.x += Math.sign(h.position.x || 1) * 0.35; h.position.y -= 0.15; });
  }

  // ---------- WINGS
  const ws = 0.9 * p.wingScale;
  if (a.wings !== "none") for (const side of [-1, 1]) {
    const wg = new THREE.Group(); wg.position.set(side * bodyHalfW * 0.5, bodyTop * 0.6, bodyBackZ - 0.05);
    if (a.wings === "bat") { const m = mesh(flatPoly([[0, 0], [0.9, 0.9], [1.9, 1.0], [1.7, 0.4], [2.1, -0.4], [1.3, -0.3], [0.5, -0.6]], 0.08), secMat); m.scale.set(side * ws, ws, 1); wg.add(m); const bone = mesh(box(1.0 * ws, 0.1, 0.1), bodyMat); bone.position.set(side * 0.5 * ws, 0.45 * ws, 0.05); bone.rotation.z = side * 0.75; wg.add(bone); }
    else if (a.wings === "feather") { for (let i = 0; i < 4; i++) { const f = mesh(box(1.4 * ws * (1 - i * 0.1), 0.24 * ws, 0.08), i % 2 ? secMat : bodyMat); f.position.set(side * 0.7 * ws, i * -0.2 * ws + 0.3 * ws, -i * 0.04); f.rotation.z = side * (0.6 - i * 0.28); wg.add(f); } }
    else if (a.wings === "stub") { const s = mesh(box(0.35 * ws, 0.45 * ws, 0.15), secMat); s.position.set(side * 0.2 * ws, 0.1, 0); s.rotation.z = side * 0.6; wg.add(s); }
    else if (a.wings === "insect") { for (let i = 0; i < 2; i++) { const m = mesh(sphere(1, 8, 4), accentMat); m.scale.set(0.9 * ws, 0.3 * ws, 0.04); m.position.set(side * 0.8 * ws, i * -0.35 * ws + 0.2, 0); m.rotation.z = side * (0.5 - i * 0.6); wg.add(m); } }
    creature.add(wg); wings.push(wg); registerPart(wg, 0.45);
  }

  // ---------- TAIL
  if (a.tail !== "none" && bodyType !== "serpent") {
    const tg = new THREE.Group();
    tg.position.set(0, bodyBottom + (bodyTop - bodyBottom) * 0.25, bodyBackZ);
    const tl = 0.8 * p.tailLength;
    const T = a.tail;
    if (T === "fan") { const f = mesh(flatPoly([[0, 0], [-0.9, 0.5], [-1.0, 1.2], [-0.4, 1.6], [0.4, 1.6], [1.0, 1.2], [0.9, 0.5]], 0.08), secMat); f.scale.set(tl * 0.9, tl * 0.9, 1); f.position.set(0, -0.1, -0.1); tg.add(f); for (let i = -1; i <= 1; i++) { const d = mesh(box(0.15, 0.15, 0.1), accentMat); d.position.set(i * tl * 0.55, tl * 1.05, -0.05); tg.add(d); } }
    else {
      const n = T === "serpent" ? 7 : T === "thick" ? 5 : 4;
      const base = T === "thick" || T === "serpent" ? 0.3 : 0.16;
      for (let i = 0; i < n; i++) {
        const t = i / n; const s = base * (1 - t * 0.6);
        const seg = mesh(box(s, s, tl * 0.3), i % 2 && a.skin === "scales" ? secMat : bodyMat);
        const curl = T === "serpent" ? i * 0.35 : i * 0.22;
        seg.position.set(Math.sin(curl) * tl * 0.3 * Math.sign(p.asym || 1), Math.sin(curl) * tl * 0.25 - t * 0.1, -tl * 0.28 * i - 0.1);
        seg.rotation.x = -curl * 0.5; tg.add(seg);
      }
      const endZ = -tl * 0.28 * n - 0.1;
      const endY = Math.sin((n - 1) * (T === "serpent" ? 0.35 : 0.22)) * tl * 0.25;
      if (T === "spike") { const c = mesh(cone(0.14, 0.45, 4), hornMat); c.position.set(0, endY, endZ); c.rotation.x = -Math.PI / 2; tg.add(c); }
      if (T === "fish") { const f = mesh(flatPoly([[0, 0], [-0.6, 0.6], [-0.4, 0], [-0.6, -0.6]], 0.08), secMat); f.scale.set(tl, tl, 1); f.rotation.y = -Math.PI / 2; f.position.set(0, endY, endZ); tg.add(f); }
    }
    creature.add(tg); tail = tg; registerPart(tg, 0.4);
  }

  // ---------- MANE
  if (a.back === "mane") {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = mesh(box(0.18, 0.32, 0.16), secMat);
      const ang = (i / (n - 1) - 0.5) * Math.PI * 1.1;
      t.position.set(Math.sin(ang) * headHalfW * 1.15, headTop * 0.4 + Math.cos(ang) * headHalfW * 0.9 - 0.1, -headFrontZ * 0.6);
      t.rotation.z = -ang; head.add(t);
    }
  }

  // ---------- HALO / AURA
  if (a.mutations.includes("halo")) {
    const hl = new THREE.Group();
    for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; const c = mesh(box(0.14, 0.08, 0.14), accentMat); c.position.set(Math.cos(ang) * headHalfW * 1.1, 0, Math.sin(ang) * headHalfW * 1.1); hl.add(c); }
    hl.position.set(0, headTop + hs * 0.6 + 0.35, 0); head.add(hl); halo = hl; registerPart(hl, 0.7);
  }
  if (a.aura) {
    const au = new THREE.Group();
    const n = g.identity.rarity === "FORBIDDEN" ? 10 : 6;
    const R = Math.max(bodyHalfW, headHalfW) + 0.7;
    for (let i = 0; i < n; i++) { const ang = (i / n) * Math.PI * 2; const c = mesh(box(0.1, 0.1, 0.1), accentMat); c.position.set(Math.cos(ang) * R, rng.range(-0.3, 0.3) + (i % 2) * 0.4, Math.sin(ang) * R * 0.7); au.add(c); }
    au.position.y = (bodyTop + bodyBottom) / 2;
    creature.add(au); aura = au;
  }

  // ---------- ground shadow
  const floating = bodyType === "floating" || (a.legCount === 0 && bodyType !== "serpent");
  const shadow = mesh(new THREE.CircleGeometry(1, 10), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.35 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(Math.max(bodyHalfW, headHalfW * 0.8) * 1.1, Math.max(bodyFrontZ - bodyBackZ, 0.8) * 0.6, 1);
  shadow.position.y = groundY + 0.01;
  root.add(shadow);

  // ---------- normalise: feet at 0, centre horizontally, fit height
  creature.position.y = -groundY;
  shadow.position.y = 0.01;
  creature.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(creature);
  const height = bb.max.y - bb.min.y;
  const width = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
  const fit = 3.3 / Math.max(height, width * 0.95, 1.6);
  root.scale.setScalar(fit);
  root.position.x = -((bb.max.x + bb.min.x) / 2) * fit;
  root.rotation.y = isQuad ? 0.55 : 0.3;

  // Store rest transforms before assembly displaces any joints.
  root.traverse(obj => {
    for (const axis of ['x', 'y', 'z'] as const) {
      obj.userData[`basePos${axis.toUpperCase()}`] = obj.position[axis];
      obj.userData[`baseRot${axis.toUpperCase()}`] = obj.rotation[axis];
    }
  });

  const rig: AnimRig = {
    root, creature, body, head, eyes, snarl, jaw, tongue, tail, wings, ears, arms, hands, legs, bodyType, aura, halo,
    floatingHead: a.mutations.includes("floating_head"), floating, assembleParts, height: height * fit,
  };
  return { rig, dispose: () => mats.dispose() };
}
