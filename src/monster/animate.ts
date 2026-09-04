import * as THREE from "three";
import type { AnimRig } from "./buildMonster";
import type { IdlePersonality } from "../generator/types";

const easeOutBack = (t: number) => { const c1 = 1.4; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface AnimState {
  /** 0..1 summon assembly progress; 1 = fully assembled */
  assemble: number;
  time: number;
  reducedMotion: boolean;
}

const tmpV = new THREE.Vector3();

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
  rig.body.scale.y *= breath;
  const bob = (rig.floating ? Math.sin(t * 1.3) * 0.12 : Math.sin(t * 2.1) * 0.02) * (0.4 + idle.bob) * rm;
  rig.creature.position.y = (rig.creature.userData.baseY ??= rig.creature.position.y) + bob;
  rig.creature.rotation.z = Math.sin(t * 0.9) * 0.03 * idle.sway * rm;
  rig.root.rotation.y = (rig.root.userData.baseRot ??= rig.root.rotation.y) + Math.sin(t * 0.5) * 0.08 * idle.sway * rm;

  // head drift
  const hb = rig.head;
  hb.rotation.y = Math.sin(t * 0.7) * 0.12 * idle.headDrift * rm + Math.sin(t * 5.3) * 0.02 * idle.headDrift * (idle.headDrift > 0.6 ? 1 : 0) * rm;
  hb.rotation.x = Math.sin(t * 1.1 + 1) * 0.05 * idle.headDrift * rm;
  if (rig.floatingHead && settled) hb.position.y = rig.assembleParts.find((p) => p.obj === hb)!.basePos.y + Math.sin(t * 1.7) * 0.08 * rm;

  // blink + eye wander
  const blinkPeriod = 3.2 / idle.blinkRate;
  const bt = (t % blinkPeriod) / blinkPeriod;
  const blink = bt > 0.94 ? 1 - Math.abs((bt - 0.97) / 0.03) : 0;
  const eyeScaleY = Math.max(0.05, eyesOpen * (1 - blink * 0.95 * rm));
  rig.eyes.forEach((e, i) => {
    e.group.scale.y = eyeScaleY;
    if (e.pupil) {
      e.pupil.position.x = Math.sin(t * 0.8 + i * 0.3) * 0.04 * idle.eyeWander * rm;
      e.pupil.position.y = Math.cos(t * 0.6 + i) * 0.02 * idle.eyeWander * rm;
    }
  });

  // jaw / tongue
  if (rig.jaw) rig.jaw.position.y = Math.max(0, Math.sin(t * 1.4)) * -0.06 * idle.jaw * rm;
  if (rig.tongue) rig.tongue.rotation.x = Math.sin(t * 2.2) * 0.25 * (0.3 + idle.jaw) * rm;

  // tail / wings / ears / arms / hands
  if (rig.tail) rig.tail.rotation.y = Math.sin(t * 1.8) * 0.2 * idle.tailWag * rm;
  rig.wings.forEach((w, i) => { const s = i === 0 ? 1 : -1; w.rotation.y = s * Math.sin(t * 1.6) * 0.28 * idle.wingFlap * rm; });
  rig.ears.forEach((e, i) => { const tw = Math.max(0, Math.sin(t * 3.7 + i * 2.1)) ** 8; e.rotation.z = tw * 0.25 * idle.earTwitch * rm * (i === 0 ? 1 : -1); });
  rig.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 1.2 + i) * 0.05 * rm; });
  if (rig.hands.length && !rig.arms.length) rig.hands.forEach((h, i) => { h.position.y = (h.userData.baseY ??= h.position.y) + Math.sin(t * 1.5 + i * 1.3) * 0.08 * rm; });
  if (rig.aura) rig.aura.rotation.y = t * 0.4 * rm;
  if (rig.halo) rig.halo.rotation.y = t * 0.7 * rm;
}
