import * as THREE from 'three';
import type { AnimRig } from './buildMonster';
import type { Gaze } from './gaze';
import type { IdlePersonality } from '../generator/types';

const easeOutBack = (t: number) => { const c1 = 1.4; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

import { reactionPose, type ReactionState } from './reaction';
export type { ReactionState } from './reaction';

export interface AnimState {
  /** 0..1 summon assembly progress; 1 = fully assembled */
  assemble: number;
  time: number;
  reducedMotion: boolean;
  reaction?: ReactionState;
  gaze?: Gaze;
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
  const { time } = state;
  const assemble = state.reducedMotion ? 1 : state.assemble;
  const t = time * idle.speed;
  const rm = state.reducedMotion ? 0 : 1;

  // ---- summon assembly
  for (const part of rig.assembleParts) {
    const style=rig.summon?.type;
    const assembling=!style||style==='sigil'||style==='parts'||style==='pixels'||style==='glitch';
    const local = assembling?clamp01((assemble - part.delay * (style==='parts'?.9:.55)) / (style==='parts'?.24:.45)):1;
    const e = easeOutBack(local);
    tmpV.copy(part.from).multiplyScalar(1 - e);
    part.obj.position.copy(part.basePos).add(tmpV);
    const s = Math.max(0.001, e);
    part.obj.scale.set(part.baseScale.x * s, part.baseScale.y * s, part.baseScale.z * s);
    part.obj.visible = local > 0.01;
  }
  if(rig.summon) {
    const type=rig.summon.type,e=1-Math.pow(1-assemble,3);
    rig.root.position.y=basePosition(rig.root,'y');rig.root.position.x=basePosition(rig.root,'x');
    if(type==='portal')rig.root.position.y+=(1-e)*3.5;
    if(type==='ground')rig.root.position.y-=(1-e)*2.6;
    if(type==='shadow')rig.root.position.y-=(1-e)*.9;
    if(type==='celestial')rig.root.position.y+=(1-e)*.8;
    if(type==='glitch'&&assemble<.8)rig.root.position.x+=Math.sin(Math.floor(assemble*12)*17)*.13*(1-e);
    if(type==='pixels')rig.root.rotation.y=baseRotation(rig.root,'y')+(1-e)*1.4;
    if(type==='shadow'||type==='celestial')rig.root.traverse(obj=>{
      if(!(obj instanceof THREE.Mesh))return;
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      for(const mat of mats)if('color' in mat && mat.color instanceof THREE.Color){
        mat.userData.restColor??=mat.color.clone();mat.color.copy(mat.userData.restColor).multiplyScalar(mat.userData.summonEye?1:type==='shadow'?.04+.96*clamp01((assemble-.25)/.65):.65+.35*e);
      }
    });
  }
  if(rig.summon?.type==='glitch')rig.creature.visible=assemble>.78||Math.floor(assemble*22)%3!==0;
  else rig.creature.visible=true;
  if(rig.pixelCloud){
    const {mesh,targets,origins}=rig.pixelCloud;mesh.visible=assemble<.9;
    const dummy=new THREE.Object3D(),progress=clamp01(assemble/.75),ease=1-Math.pow(1-progress,3);
    targets.forEach((target,i)=>{dummy.position.lerpVectors(origins[i],target,ease);dummy.rotation.set((1-ease)*i,.0,(1-ease)*i*.3);dummy.scale.setScalar(1-clamp01((assemble-.73)/.17));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;
    rig.creature.visible=assemble>.67;
  }
  const settled = assemble >= 0.98;
  const eyesOpen = rig.summon?.type==='shadow'?clamp01(assemble/.16):clamp01((assemble - 0.9) / 0.1);

  // Reset transient reaction offsets before applying this frame's pose.
  rig.creature.position.x = basePosition(rig.creature, 'x');
  rig.creature.position.z = basePosition(rig.creature, 'z');
  rig.creature.rotation.y = baseRotation(rig.creature, 'y');
  rig.root.rotation.x = baseRotation(rig.root, 'x');
  rig.root.rotation.z = baseRotation(rig.root, 'z');
  if (settled) rig.head.position.z = basePosition(rig.head, 'z');

  // ---- idle
  const breath = 1 + Math.sin(t * 2.1) * 0.025 * idle.breath * rm;
  const bodyPart = rig.assembleParts.find((p) => p.obj === rig.body);
  if (settled && bodyPart) rig.body.scale.set(bodyPart.baseScale.x, bodyPart.baseScale.y * breath, bodyPart.baseScale.z);
  const bob = (rig.floating ? Math.sin(t * 1.3) * 0.12 : Math.sin(t * 2.1) * 0.02) * (0.4 + idle.bob) * rm;
  rig.creature.position.y = basePosition(rig.creature, 'y') + bob;
  rig.creature.rotation.z = baseRotation(rig.creature, 'z') + Math.sin(t * 0.9) * 0.03 * idle.sway * rm;
  rig.root.rotation.y = baseRotation(rig.root, 'y') + Math.sin(t * 0.5) * 0.08 * idle.sway * rm;

  if(rig.summon?.type==='pixels')rig.root.rotation.y+=(1-assemble)*1.4*rm;

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
  const pose = reactionPose(state.reaction);
  const cheek = pose.taunt * rm;
  const gazeWeight = rm * (settled ? 1 : 0) * (1 - Math.max(pose.guard, pose.feint, pose.taunt) * 0.8);
  const gazeX = (state.gaze?.x ?? 0) * gazeWeight;
  const gazeY = (state.gaze?.y ?? 0) * gazeWeight;
  hb.rotation.y += gazeX * 0.24;
  hb.rotation.x -= gazeY * 0.13;
  rig.creature.scale.set(1 + anger * 0.035 * rm, 1 + anger * 0.07 * rm, 1 + anger * 0.035 * rm);
  rig.eyes.forEach((e, i) => {
    const side = Math.abs(e.group.position.x) > 0.01 ? Math.sign(e.group.position.x) : (i % 2 ? 1 : -1);
    e.group.scale.y = eyeScaleY * (1 - anger * 0.32) * (1 - (i === 0 && rig.eyes.length > 1 ? cheek * 0.8 : 0));
    e.group.rotation.z = baseRotation(e.group, 'z') + side * anger * 0.22;
    if (e.brow) {
      e.brow.visible = anger > 0.035;
      e.brow.scale.y = Math.max(0.001, anger * 1.5);
      e.brow.rotation.z = baseRotation(e.brow, 'z') + side * anger * 0.42 + (i === 0 ? cheek * 0.3 : 0);
      e.brow.position.y = basePosition(e.brow, 'y') - anger * 0.05;
    }
    if (e.pupil) {
      e.pupil.position.x = basePosition(e.pupil, 'x') + gazeX * 0.035 + Math.sin(t * 0.8 + i * 0.3) * 0.04 * idle.eyeWander * rm - reactionDirection * anger * 0.07;
      e.pupil.position.y = basePosition(e.pupil, 'y') + gazeY * 0.025 + Math.cos(t * 0.6 + i) * 0.02 * idle.eyeWander * rm - anger * 0.025;
    }
  });
  if (rig.snarl) {
    rig.snarl.visible = anger > 0.035;
    rig.snarl.scale.set(1 + anger * 0.16, Math.max(0.001, anger * 1.35), 1);
    rig.snarl.rotation.z = baseRotation(rig.snarl, 'z') - reactionDirection * (anger * 0.045 + cheek * 0.12);
  }

  rig.wings.forEach(wing=>wing.traverse(joint=>{
    if(!joint.userData.wingJoint)return;
    const side=wing.userData.side??1;
    const fast=wing.userData.wingType==='insect';
    const flap=Math.sin(t*(fast?19:1.6)+(fast?0:-.7));
    joint.rotation.y=baseRotation(joint,'y')+side*(fast?.16:.22)*flap*rm;
    joint.rotation.z=baseRotation(joint,'z')+side*(fast?.06:.13)*Math.max(0,flap)*rm;
  }));

  // jaw / tongue
  if (rig.jaw) rig.jaw.position.y = basePosition(rig.jaw, 'y') + Math.max(0, Math.sin(t * 1.4)) * -0.06 * idle.jaw * rm - anger * 0.19;
  if (rig.tongue) rig.tongue.rotation.x = baseRotation(rig.tongue, 'x') + Math.sin(t * 2.2) * 0.25 * (0.3 + idle.jaw) * rm + anger * 0.14 * rm;

  rig.ornaments?.forEach((o, i) => { o.rotation.z = baseRotation(o, 'z') + Math.sin(t * 1.7 + i * .6) * .045 * rm; });

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

  // Infrequent purposeful gestures with anticipation and recovery.
  // Each personality has a different cycle; adjacent parts follow through.
  const cycle = (t + idle.eyeWander * 4) % 9;
  const gesture = cycle < 2.4 ? Math.sin(cycle / 2.4 * Math.PI) ** 2 * rm * (settled ? 1 : 0) : 0;
  const look = Math.sin(t * 0.24) > 0 ? 1 : -1;
  hb.rotation.y += look * gesture * 0.28;
  hb.rotation.z = baseRotation(hb, 'z') + look * gesture * 0.1;
  if (rig.bodyType === 'serpent') {
    rig.creature.rotation.y = baseRotation(rig.creature, 'y') + Math.sin(t * 0.85) * 0.1 * rm;
    hb.position.z += gesture * 0.16;
    if (rig.tail) rig.tail.rotation.y += Math.sin(t * 0.85 - 0.8) * 0.2 * rm;
  } else if (rig.floating) {
    rig.creature.rotation.z += Math.sin(t * 0.65 + 1) * 0.055 * rm;
    rig.arms.forEach((arm, i) => { arm.rotation.z += (i % 2 ? -1 : 1) * gesture * 0.18; });
  } else {
    // Plant feet while shifting weight; lift one forefoot for a cautious step.
    rig.creature.rotation.z += look * gesture * 0.025;
    rig.legs.forEach((leg, i) => {
      leg.rotation.x = baseRotation(leg, 'x') + (i === 0 ? gesture * 0.16 : -gesture * 0.025);
      leg.rotation.z = baseRotation(leg, 'z') - look * gesture * 0.025;
    });
    if (rig.bodyType === 'quadruped') hb.rotation.x += gesture * 0.12;
    if (rig.jaw && rig.bodyType === 'barrel') rig.jaw.position.y -= gesture * 0.07;
  }
  rig.wings.forEach((wing, i) => {
    const side = i === 0 ? 1 : -1;
    wing.rotation.z = baseRotation(wing, 'z') + side * gesture * 0.12;
    wing.rotation.y += side * gesture * 0.4;
  });

  // Defensive retreat, a harmless bluff, then a smug recovery.
  const reaction = state.reaction;
  if (reaction && rm && settled) {
    const { guard, feint, taunt, settle } = pose;
    const side = reaction.direction;
    const heavy = rig.bodyType === 'barrel' || rig.bodyType === 'shell';
    const serpent = rig.bodyType === 'serpent';
    const beast = rig.bodyType === 'quadruped';
    const agility = heavy ? 0.55 : 1;
    rig.creature.position.x += side * (guard * 0.12 - taunt * 0.13) * agility;
    rig.creature.position.z += -guard * 0.16 + feint * (serpent ? 0.32 : 0.23) * agility;
    rig.creature.position.y += rig.floating ? guard * 0.12 + taunt * 0.06 : -guard * 0.035;
    rig.creature.rotation.y += side * (guard * 0.09 - taunt * 0.16) * agility;
    rig.creature.rotation.z += side * (taunt * 0.065 - settle * 0.015);
    hb.rotation.y -= side * (guard * 0.22 + taunt * 0.16);
    hb.rotation.x += guard * (beast ? 0.22 : 0.1) - feint * 0.15 - taunt * 0.1;
    hb.rotation.z += side * taunt * 0.12;
    if (serpent) hb.position.z += feint * 0.16 - guard * 0.06;
    rig.arms.forEach((arm, i) => {
      const armSide = i % 2 ? -1 : 1;
      arm.rotation.x -= guard * 0.6 + feint * 0.3;
      arm.rotation.z += armSide * (guard * 0.22 + taunt * 0.1);
      if (i === 0) arm.rotation.x -= taunt * 0.35;
    });
    rig.legs.forEach((leg, i) => {
      leg.rotation.x += (i < 2 ? 1 : -1) * guard * (beast ? 0.12 : 0.04);
    });
    if (rig.tail) rig.tail.rotation.y += side * (guard * 0.28 + Math.sin(reaction.age * 10) * taunt * 0.25);
    if (rig.jaw) rig.jaw.position.y -= feint * 0.08 + taunt * 0.035;
    if (rig.tongue) rig.tongue.rotation.x += taunt * 0.45;
    rig.ears.forEach((ear, i) => { ear.rotation.z += (i % 2 ? -1 : 1) * guard * 0.24; });
    rig.wings.forEach((wing, i) => {
      const wingSide = i === 0 ? 1 : -1;
      wing.rotation.y += wingSide * (guard * 0.48 + feint * 0.22);
      wing.rotation.z += wingSide * taunt * 0.16;
    });
  }
}
