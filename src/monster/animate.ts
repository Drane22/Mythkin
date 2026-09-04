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
  const reactionDirection = state.reaction?.direction ?? 1;
  rig.creature.scale.set(1 + anger * 0.035 * rm, 1 + anger * 0.07 * rm, 1 + anger * 0.035 * rm);
  rig.eyes.forEach((e, i) => {
    const side = Math.abs(e.group.position.x) > 0.01 ? Math.sign(e.group.position.x) : (i % 2 ? 1 : -1);
    e.group.scale.y = eyeScaleY * (1 - anger * 0.42);
    e.group.rotation.z = baseRotation(e.group, 'z') + side * anger * 0.22;
    if (e.brow) {
      e.brow.visible = anger > 0.035;
      e.brow.scale.y = Math.max(0.001, anger * 1.5);
      e.brow.rotation.z = baseRotation(e.brow, 'z') + side * anger * 0.42;
      e.brow.position.y = basePosition(e.brow, 'y') - anger * 0.05;
    }
    if (e.pupil) {
      e.pupil.position.x = Math.sin(t * 0.8 + i * 0.3) * 0.04 * idle.eyeWander * rm - reactionDirection * anger * 0.07;
      e.pupil.position.y = Math.cos(t * 0.6 + i) * 0.02 * idle.eyeWander * rm - anger * 0.025;
    }
  });
  if (rig.snarl) {
    rig.snarl.visible = anger > 0.035;
    rig.snarl.scale.set(1 + anger * 0.16, Math.max(0.001, anger * 1.35), 1);
    rig.snarl.rotation.z = baseRotation(rig.snarl, 'z') - reactionDirection * anger * 0.045;
  }

  // jaw / tongue
  if (rig.jaw) rig.jaw.position.y = basePosition(rig.jaw, 'y') + Math.max(0, Math.sin(t * 1.4)) * -0.06 * idle.jaw * rm - anger * 0.19;
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
  if (rig.aura) {
    rig.aura.rotation.y = baseRotation(rig.aura, 'y') + t * (0.4 + anger * 2.2) * rm;
    rig.aura.scale.setScalar(1 + anger * 0.22 * rm);
  }
  if (rig.halo) rig.halo.rotation.y = baseRotation(rig.halo, 'y') + t * 0.7 * rm;

  // ---- direct interaction: recoil, lock-on, then a forceful silent lunge
  const reaction = state.reaction;
  if (reaction && rm && settled) {
    const attackT = clamp01((reaction.age - 0.06) / 0.42);
    const lunge = Math.sin(attackT * Math.PI) * reaction.intensity;
    const recoil = -Math.sin(clamp01(reaction.age / 0.1) * Math.PI) * Math.exp(-reaction.age * 7) * reaction.intensity;
    const shake = Math.sin(reaction.age * 52) * Math.exp(-reaction.age * 4.6) * reaction.intensity;
    const rage = reaction.anger;
    rig.creature.position.x = basePosition(rig.creature, 'x') + reaction.direction * (recoil * 0.22 + shake * 0.055);
    rig.creature.position.z = basePosition(rig.creature, 'z') + lunge * (0.42 + rage * 0.22) - Math.abs(recoil) * 0.1;
    rig.creature.rotation.z = baseRotation(rig.creature, 'z') - reaction.direction * shake * 0.045;
    rig.root.rotation.x = baseRotation(rig.root, 'x') - lunge * 0.1 - rage * 0.055;
    rig.root.rotation.z = baseRotation(rig.root, 'z') + reaction.direction * (recoil * 0.1 + shake * 0.035);
    hb.position.z = basePosition(hb, 'z') + lunge * 0.16;
    hb.rotation.y += reaction.direction * recoil * 0.25 - reaction.direction * rage * 0.18;
    hb.rotation.x += -lunge * 0.19 - rage * 0.11;
    rig.arms.forEach((arm, i) => {
      const side = i % 2 ? -1 : 1;
      arm.rotation.x += -lunge * 0.28;
      arm.rotation.z += side * (rage * 0.28 + lunge * 0.32) + reaction.direction * shake * 0.08;
    });
    if (rig.tail) rig.tail.rotation.y += reaction.direction * (shake * 0.42 + rage * 0.2);
    if (rig.jaw) rig.jaw.position.y -= lunge * 0.18;
    rig.wings.forEach((wing, i) => { wing.rotation.y += (i === 0 ? 1 : -1) * (rage * 0.28 + lunge * 0.36); });
  }
}
