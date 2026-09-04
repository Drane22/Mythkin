import * as THREE from 'three';
import type { AnimRig } from './buildMonster';
import type { IdlePersonality } from '../generator/types';

const easeOutBack = (t: number) => { const c1 = 1.4; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface ReactionState {
  /** Seconds since the latest click. */
  age: number;
  /** One-shot recoil strength, decaying to zero. */
  intensity: number;
  /** Persistent irritation, slowly decaying between interactions. */
  anger: number;
  /** Which side the creature recoils toward. */
  direction: number;
}

export interface AnimState {
  /** 0..1 summon assembly progress; 1 = fully assembled */
  assemble: number;
  time: number;
  reducedMotion: boolean;
  reaction?: ReactionState;
}

const tmpV = new THREE.Vector3();

function baseRotation(obj: THREE.Object3D, axis: 'x' | 'y' | 'z') {
  const key = `baseRot${axis.toUpperCase()}`;
  if (typeof obj.userData[key] !== 'number') obj.userData[key] = obj.rotation[axis];
  return obj.userData[key] as number;
}

function basePosition(obj: THREE.Object3D, axis: 'x' | 'y' | 'z') {
  const key = `basePos${axis.toUpperCase()}`;
  if (typeof obj.userData[key] !== 'number') obj.userData[key] = obj.position[axis];
  return obj.userData[key] as number;
}

export function applyAnimation(rig: AnimRig, idle: IdlePersonality, state: AnimState) {
  const { assemble, time } = state;
  const t = time * idle.speed;
  const rm = state.reducedMotion ? 0 : 1;

  // ---- summon assembly
  for (const part of rig.assembleParts) {
    const local = clamp01((assemble - part.delay * 0.55) / 0.45);
    const e = easeOutBack(local);
    tmpV.copy(part.from).multiplyScalar(1 - e);
    part.obj.position.copy(part.basePos).add(tmpV);
    const s = Math.max(0.001, e);
    part.obj.scale.set(part.baseScale.x * s, part.baseScale.y * s, part.baseScale.z * s);
    part.obj.visible = local > 0.01;
  }
  const settled = assemble >= 0.98;
  const eyesOpen = clamp01((assemble - 0.9) / 0.1);

  // ---- idle
  const breath = 1 + Math.sin(t * 2.1) * 0.025 * idle.breath * rm;
  const bodyPart = rig.assembleParts.find((p) => p.obj === rig.body);
  if (settled && bodyPart) rig.body.scale.set(bodyPart.baseScale.x, bodyPart.baseScale.y * breath, bodyPart.baseScale.z);
  const bob = (rig.floating ? Math.sin(t * 1.3) * 0.12 : Math.sin(t * 2.1) * 0.02) * (0.4 + idle.bob) * rm;
  rig.creature.position.y = basePosition(rig.creature, 'y') + bob;
  rig.creature.rotation.z = baseRotation(rig.creature, 'z') + Math.sin(t * 0.9) * 0.03 * idle.sway * rm;
  rig.root.rotation.y = baseRotation(rig.root, 'y') + Math.sin(t * 0.5) * 0.08 * idle.sway * rm;

  // head drift
  const hb = rig.head;
  hb.rotation.y = baseRotation(hb, 'y') + Math.sin(t * 0.7) * 0.12 * idle.headDrift * rm + Math.sin(t * 5.3) * 0.02 * idle.headDrift * (idle.headDrift > 0.6 ? 1 : 0) * rm;
  hb.rotation.x = baseRotation(hb, 'x') + Math.sin(t * 1.1 + 1) * 0.05 * idle.headDrift * rm;
  if (rig.floatingHead && settled) hb.position.y = basePosition(hb, 'y') + Math.sin(t * 1.7) * 0.08 * rm;

  // blink + eye wander
  const blinkPeriod = 3.2 / idle.blinkRate;
  const bt = (t % blinkPeriod) / blinkPeriod;
  const blink = bt > 0.94 ? 1 - Math.abs((bt - 0.97) / 0.03) : 0;
  const eyeScaleY = Math.max(0.05, eyesOpen * (1 - blink * 0.95 * rm));
  const anger = state.reaction?.anger ?? 0;
  rig.eyes.forEach((e, i) => {
    e.group.scale.y = eyeScaleY * (1 + anger * 0.14 * rm);
    if (e.pupil) {
      e.pupil.position.x = Math.sin(t * 0.8 + i * 0.3) * 0.04 * idle.eyeWander * rm;
      e.pupil.position.y = Math.cos(t * 0.6 + i) * 0.02 * idle.eyeWander * rm;
    }
  });

  // jaw / tongue
  if (rig.jaw) rig.jaw.position.y = basePosition(rig.jaw, 'y') + Math.max(0, Math.sin(t * 1.4)) * -0.06 * idle.jaw * rm - anger * 0.075 * rm;
  if (rig.tongue) rig.tongue.rotation.x = baseRotation(rig.tongue, 'x') + Math.sin(t * 2.2) * 0.25 * (0.3 + idle.jaw) * rm + anger * 0.14 * rm;

  // tail / wings / ears / arms / hands
  if (rig.tail) {
    rig.tail.rotation.y = baseRotation(rig.tail, 'y') + Math.sin(t * 1.8) * 0.2 * idle.tailWag * rm;
    rig.tail.rotation.x = baseRotation(rig.tail, 'x') - anger * 0.1 * rm;
  }
  rig.wings.forEach((w, i) => { const s = i === 0 ? 1 : -1; w.rotation.y = baseRotation(w, 'y') + s * Math.sin(t * 1.6) * 0.28 * idle.wingFlap * rm + s * anger * 0.08 * rm; });
  rig.ears.forEach((e, i) => { const tw = Math.max(0, Math.sin(t * 3.7 + i * 2.1)) ** 8; e.rotation.z = baseRotation(e, 'z') + tw * 0.25 * idle.earTwitch * rm * (i === 0 ? 1 : -1) - anger * 0.08 * rm * (i === 0 ? 1 : -1); });
  rig.arms.forEach((a, i) => {
    a.rotation.x = baseRotation(a, 'x') + Math.sin(t * 1.2 + i) * 0.05 * rm;
    a.rotation.z = baseRotation(a, 'z') + anger * 0.16 * rm * (i % 2 ? -1 : 1);
  });
  if (rig.hands.length && !rig.arms.length) rig.hands.forEach((h, i) => { h.position.y = basePosition(h, 'y') + Math.sin(t * 1.5 + i * 1.3) * 0.08 * rm; });
  if (rig.aura) rig.aura.rotation.y = baseRotation(rig.aura, 'y') + t * 0.4 * rm;
  if (rig.halo) rig.halo.rotation.y = baseRotation(rig.halo, 'y') + t * 0.7 * rm;

  // ---- direct interaction: a fast recoil followed by a tense, angry hold
  const reaction = state.reaction;
  if (reaction && rm && settled) {
    const recoil = Math.sin(reaction.age * 34) * Math.exp(-reaction.age * 9) * reaction.intensity;
    const snap = Math.sin(reaction.age * 22) * Math.exp(-reaction.age * 13) * reaction.intensity;
    const rage = reaction.anger;
    rig.creature.position.x = basePosition(rig.creature, 'x') + reaction.direction * recoil * 0.18;
    rig.creature.position.z = basePosition(rig.creature, 'z') - Math.abs(recoil) * 0.06;
    rig.creature.rotation.z += -reaction.direction * recoil * 0.08;
    rig.root.rotation.x = baseRotation(rig.root, 'x') - Math.abs(recoil) * 0.05 - rage * 0.035;
    rig.root.rotation.z = baseRotation(rig.root, 'z') + reaction.direction * recoil * 0.07;
    hb.rotation.y += reaction.direction * recoil * 0.22 - reaction.direction * rage * 0.14;
    hb.rotation.x += -Math.abs(recoil) * 0.12 - rage * 0.05;
    rig.arms.forEach((a, i) => { a.rotation.z += reaction.direction * snap * 0.18 * (i % 2 ? -1 : 1) + rage * 0.06 * (i % 2 ? -1 : 1); });
    if (rig.tail) rig.tail.rotation.y += reaction.direction * snap * 0.32 + rage * 0.12 * reaction.direction;
    if (rig.jaw) rig.jaw.position.y -= Math.max(0, snap) * 0.09;
    rig.wings.forEach((w, i) => { w.rotation.y += (i === 0 ? 1 : -1) * Math.max(0, snap) * 0.2; });
  }
}
