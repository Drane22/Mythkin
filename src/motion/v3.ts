import * as THREE from 'three';
import type { IdlePersonality } from '../generator/types';
import type { AnimRig } from '../monster/buildMonster';
import { applyAnimation, type AnimState } from '../monster/animate';
import { reactionPose } from '../monster/reaction';

type Profile = 'brute' | 'beast' | 'serpent' | 'avian' | 'spirit' | 'trickster' | 'guardian';
interface RestPose { obj: THREE.Object3D; position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 }
interface MotionCache { rest: RestPose[]; creatureScale: THREE.Vector3; phase: number; legacyRig: AnimRig; assemblyParts: AnimRig['assembleParts'] }
const caches = new WeakMap<AnimRig, MotionCache>();
const profiles: Profile[] = ['brute', 'beast', 'serpent', 'avian', 'spirit', 'trickster', 'guardian'];
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const p = clamp(x); return p * p * (3 - 2 * p); };
const pulse = (time: number, start: number, end: number) => time <= start || time >= end ? 0 : Math.sin((time - start) / (end - start) * Math.PI) ** 2;
const extras = (rig: AnimRig, name: string): THREE.Object3D[] => rig.root.userData[name] ?? [];

function cacheFor(rig: AnimRig): MotionCache {
  const existing = caches.get(rig);
  if (existing) return existing;
  const objects = new Set<THREE.Object3D>([
    rig.root, rig.creature, rig.body, rig.head, ...rig.arms, ...rig.legs, ...rig.hands,
    ...rig.wings, ...rig.ears, ...(rig.ornaments ?? []),
    ...extras(rig, 'jaws'), ...extras(rig, 'serpentJoints'), ...extras(rig, 'secondaryHeads'), ...extras(rig, 'dangling'),
    ...rig.assembleParts.map(part => part.obj),
  ]);
  [rig.jaw, rig.tongue, rig.tail, rig.aura, rig.halo, rig.snarl].forEach(obj => { if (obj) objects.add(obj); });
  rig.eyes.forEach(eye => [eye.group, eye.pupil, eye.brow, eye.lid].forEach(obj => { if (obj) objects.add(obj); }));
  rig.wings.forEach(wing => wing.traverse(obj => { if (obj.userData.wingJoint) objects.add(obj); }));
  let hash = 0;
  for (const c of String(rig.root.userData.speciesId ?? 'mythkin')) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  // The shared parts reveal takes .24 of the timeline after a .9-weighted delay.
  // Dense v3 anatomy can have delays near 1; fit the final part inside the ending.
  const maxDelay = Math.max(0, ...rig.assembleParts.map(part => part.delay));
  const delayFit = maxDelay > 0 ? Math.min(1, .75 / (.9 * maxDelay)) : 1;
  const cache = {
    rest: [...objects].map(obj => ({ obj, position: obj.position.clone(), quaternion: obj.quaternion.clone(), scale: obj.scale.clone() })),
    creatureScale: rig.creature.scale.clone(), phase: (hash % 997) / 997 * Math.PI * 2,
    legacyRig: { ...rig }, assemblyParts: rig.assembleParts.map(part => ({ ...part, delay: part.delay * delayFit })),
  };
  caches.set(rig, cache);
  return cache;
}

/** Compose v3 locomotion with the shared blink, gaze and summon renderer.
 * The immutable rig pose is captured on the first call: animate only after assembly.
 * Resetting controlled nodes makes seeking, interruption and replay deterministic.
 */
export function applyAnimationV3(rig: AnimRig, idle: IdlePersonality, state: AnimState) {
  const cache = cacheFor(rig);
  for (const pose of cache.rest) {
    pose.obj.position.copy(pose.position);
    pose.obj.quaternion.copy(pose.quaternion);
    pose.obj.scale.copy(pose.scale);
  }
  const frame: AnimState = state.reducedMotion
    ? { assemble: 1, time: 0, reducedMotion: true }
    : { ...state, assemble: clamp(state.assemble) };
  cache.legacyRig.summon = rig.summon;
  cache.legacyRig.assembleParts = rig.summon?.type === 'parts' ? cache.assemblyParts : rig.assembleParts;
  applyAnimation(cache.legacyRig, idle, frame);
  // The shared animator assumes a unit creature group. V3 permits fitted proportions.
  // Anger changes posture, never inflates the entire anatomical structure.
  rig.creature.scale.copy(cache.creatureScale);
  if(frame.assemble>=1){
    const rest=cache.rest.find(p=>p.obj===rig.body)!;
    rig.body.scale.y=rest.scale.y*(1+THREE.MathUtils.clamp(rig.body.scale.y/rest.scale.y-1,-.018,.018));
    const base=rig.creature.userData.basePosY??0;
    rig.creature.position.y=base+THREE.MathUtils.clamp(rig.creature.position.y-base,-.16,.14);
  }
  if (state.reducedMotion) { constrainAnatomy(rig, cache, frame); return; }

  const requested = rig.root.userData.motion?.profile;
  const profile: Profile = profiles.includes(requested) ? requested : 'guardian';
  const mass = Math.max(.5, Math.min(3, rig.root.userData.motion?.mass ?? 1));
  const agility = 1 / Math.sqrt(mass);
  const t = frame.time * idle.speed;
  const phase = cache.phase;
  const p = frame.assemble;
  const settled = smooth((p - .75) / .25);
  const breath = Math.sin(t * (profile === 'brute' ? 1.35 : 1.8) + phase);
  // Long quiet intervals make the purposeful gestures legible beside breathing.
  const cycle = (t + phase) % 9;
  const notice = pulse(cycle, .5, 3.3) * settled;
  const stretch = pulse(cycle, 5.2, 7.7) * settled;
  const sway = Math.sin(t * .73 + phase) * settled;
  const pose = reactionPose(p >= .98 ? frame.reaction : undefined);
  const { guard, feint, taunt, startle, curious, delight } = pose;
  const reacting = Math.max(guard, feint, taunt, startle, curious, delight);
  const calm = 1 - reacting * .65;
  const side = (frame.reaction?.direction ?? 1) < 0 ? -1 : 1;
  const age = frame.reaction?.age ?? 0;
  const laugh = Math.sin(age * 14) * delight;
  const reach = settled * (curious * .16 + feint * .24 - guard * .12);

  switch (profile) {
    case 'brute':
      // Grounded weight, shoulder roll, then a measured challenge.
      rig.creature.position.y -= (notice * .06 + guard * .11) * agility;
      rig.creature.rotation.x += (.045 * breath * settled + feint * .13) * agility;
      rig.head.rotation.x += (notice * .15 - stretch * .12 - taunt * .2) * calm;
      rig.arms.forEach((arm, i) => { arm.rotation.z += (i % 2 ? -1 : 1) * (stretch * .2 + guard * .2 + delight * .14); });
      rig.legs.forEach((leg, i) => { leg.rotation.x += (i % 2 ? -1 : 1) * (sway * .035 + startle * .09); });
      break;
    case 'beast':
      // Nose leads the body; forelegs paw while the hindquarters stay planted.
      rig.head.position.z += notice * .09 * calm + reach;
      rig.head.rotation.x += notice * .2 * calm - startle * .16;
      rig.creature.rotation.y += sway * .035 + side * guard * .1;
      rig.legs.forEach((leg, i) => {
        leg.rotation.x += (i < 2 ? 1 : -.3) * stretch * .17 * calm;
        leg.rotation.z += (i % 2 ? -1 : 1) * (guard * .055 + delight * .07);
      });
      if (rig.tail) rig.tail.rotation.y += Math.sin(t * (2.4 + delight * 4)) * (.12 + delight * .25) * settled;
      rig.ears.forEach((ear, i) => { ear.rotation.z += (i % 2 ? -1 : 1) * (curious * .2 - startle * .3); });
      break;
    case 'serpent':
      // Slow S-curve; the head rises independently of the resting coil.
      rig.head.position.y += notice * .075 * calm + curious * .1;
      rig.head.position.z += reach;
      rig.creature.rotation.y += sway * .075;
      rig.head.rotation.z += Math.sin(t * .8 + phase + .7) * .09 * settled + side * taunt * .16;
      if (rig.tail) rig.tail.rotation.y += Math.sin(t * 1.1 + phase - 1.2) * .2 * settled + side * guard * .22;
      break;
    case 'avian':
      // Quick head inspection, wing stretch and a light landing response.
      rig.head.rotation.z += sway * .1 + notice * .2 * calm + side * curious * .15;
      rig.head.rotation.y += Math.sin(t * 1.8 + phase) * .08 * notice * calm;
      rig.creature.position.y += stretch * .05 + Math.abs(laugh) * .045;
      rig.wings.forEach((wing, i) => {
        const sign = wing.userData.side ?? (i % 2 ? -1 : 1);
        wing.rotation.y += sign * (stretch * .5 * calm + startle * .45 + delight * .18);
        wing.rotation.z += sign * (Math.sin(t * 1.4 + phase) * .06 * settled + taunt * .22);
      });
      rig.legs.forEach((leg, i) => { leg.rotation.x += (i % 2 ? -.3 : 1) * notice * .13; });
      break;
    case 'spirit':
      // Buoyant drift with hands and hanging relics following behind.
      rig.creature.position.y += Math.sin(t * .95 + phase) * .09 * settled + curious * .06;
      rig.creature.position.x += sway * .035 + side * taunt * .08;
      rig.creature.rotation.y += sway * .055 + side * startle * .16;
      rig.arms.forEach((arm, i) => { arm.rotation.z += (i % 2 ? -1 : 1) * (stretch * .18 + curious * .16 + delight * .2); });
      rig.head.rotation.x -= notice * .07 + delight * .12;
      break;
    case 'trickster':
      // Asymmetric lean, foot lift, conspiratorial look and a cheeky flourish.
      rig.creature.rotation.z += sway * .06 * calm + side * taunt * .14;
      rig.head.rotation.y -= notice * .21 * calm;
      rig.head.rotation.z += stretch * .15 * calm;
      rig.legs.forEach((leg, i) => { leg.rotation.x += (i % 2 ? -.04 : .23) * stretch + (i % 2 ? -1 : 1) * laugh * .1; });
      rig.hands.forEach((hand, i) => { hand.rotation.z += (i % 2 ? -1 : 1) * (notice * .18 + taunt * .38); });
      if (rig.tongue) rig.tongue.rotation.z += Math.sin(t * 3 + phase) * .12 * settled + side * taunt * .18;
      break;
    case 'guardian':
      // Deliberate watchfulness and a restrained, reassuring bow.
      rig.head.rotation.y += sway * .14 * calm;
      rig.head.rotation.x += notice * .07 * calm + delight * .13;
      rig.creature.rotation.y += side * guard * .1 - side * curious * .06;
      rig.arms.forEach((arm, i) => { arm.rotation.x -= stretch * .09 + (i === 0 ? curious * .22 + taunt * .12 : 0); });
      if (rig.halo) rig.halo.rotation.z += Math.sin(t * .6 + phase) * .06 * settled;
      break;
  }

  // Secondary anatomy keeps the movement language of its source creature.
  // Apply to pivot groups (never a whole mesh chain translated off its socket).
  extras(rig, 'serpentJoints').forEach((joint, i) => {
    joint.rotation.y += Math.sin(t * 1.1 + phase - i * .62) * .11 * settled * calm + side * (guard * .1 - feint * .07) / (1 + i * .15);
    joint.rotation.x += Math.sin(t * .8 + phase - i * .5) * .025 * settled + curious * .03;
  });
  extras(rig, 'secondaryHeads').forEach((head, i) => {
    const sign = i % 2 ? -1 : 1;
    head.rotation.y += Math.sin(t * .85 + phase + i * 1.7) * .15 * settled + sign * (guard * .15 + curious * .2);
    head.rotation.x += Math.sin(t * 1.2 + i) * .06 * settled - startle * .13 + delight * .1;
    head.rotation.z += sign * taunt * .14;
  });
  extras(rig, 'dangling').forEach((part, i) => {
    part.rotation.z += Math.sin(t * 1.5 + phase - i * .42) * .09 * settled + side * (startle * .19 - feint * .12) + laugh * .06;
    part.rotation.x += Math.sin(t * 1.1 + i * .6) * .045 * settled - curious * .05;
  });

  if (p < 1) summonGesture(rig, p, profile, agility);
  constrainAnatomy(rig, cache, frame);
}

/** Jaw roots and limb sockets are fixed in the parent's anatomical frame. */
function constrainAnatomy(rig:AnimRig,cache:MotionCache,frame:AnimState){
 const reaction=reactionPose(frame.assemble>=.98?frame.reaction:undefined);
 const open=frame.reducedMotion?0:reaction.startle*.25+reaction.taunt*.19+reaction.delight*.12+reaction.feint*.12;
 const hinged=extras(rig,'jaws');
 for(const pose of cache.rest){
  if(hinged.includes(pose.obj)){
   pose.obj.position.copy(pose.position);pose.obj.quaternion.copy(pose.quaternion);
   pose.obj.rotation.x+=open+(frame.reducedMotion?0:Math.max(0,Math.sin(frame.time*1.7))*.022);
  }else if((pose.obj===rig.head||pose.obj.userData.anatomicalAnchor)&&!(rig.summon?.type==='parts'&&frame.assemble<1))pose.obj.position.copy(pose.position);
 }
 // The legacy arm convention folds mirrored v3 arms through the chest.
 // Keep gestures on the outward side of each embedded shoulder socket.
 rig.arms.forEach(arm=>{const side=arm.userData.side??(Math.sign(arm.position.x)||1),base=arm.userData.baseRotZ??0;arm.rotation.z=base+side*Math.min(1.02,Math.abs(arm.rotation.z-base));});
 extras(rig,'secondaryHeads').forEach(neck=>{neck.rotation.x=THREE.MathUtils.clamp(neck.rotation.x,-.10,.10);neck.rotation.y=THREE.MathUtils.clamp(neck.rotation.y,-.12,.12);neck.rotation.z=THREE.MathUtils.clamp(neck.rotation.z,-.065,.065);});
}

function summonGesture(rig: AnimRig, p: number, profile: Profile, agility: number) {
  const open = 1 - smooth((p - .25) / .65);
  const arrival = pulse(p, .35, .96);
  const release = pulse(p, .68, 1);
  // Each path keeps the shared reveal/particles but gets a physical arrival.
  switch (rig.summon?.type) {
    case 'portal':
      rig.creature.rotation.x -= open * .19;
      rig.creature.position.y -= release * .11 / agility;
      rig.head.rotation.x += arrival * .13;
      break;
    case 'ground':
      rig.creature.rotation.x += open * .21;
      rig.head.rotation.x -= arrival * .18;
      rig.arms.forEach(arm => { arm.rotation.x -= arrival * .34; });
      break;
    case 'shadow':
      rig.creature.rotation.y += open * .27;
      rig.head.rotation.y -= open * .2;
      rig.creature.position.z -= open * .16;
      break;
    case 'celestial':
      rig.head.rotation.x -= arrival * .17;
      rig.creature.rotation.z += Math.sin(p * Math.PI * 2) * open * .06;
      break;
    case 'parts':
      rig.head.rotation.z += Math.sin(p * Math.PI * 3) * open * .14;
      rig.hands.forEach((hand, i) => { hand.rotation.z += (i % 2 ? -1 : 1) * open * .22; });
      break;
    case 'pixels':
      rig.head.rotation.y -= open * .25;
      rig.creature.rotation.x += arrival * .07;
      break;
    case 'glitch':
      // Quantized interference gives way to a smooth, continuous final recovery.
      rig.root.rotation.z += Math.sin(Math.floor(p * 18) * 13) * .07 * (1 - smooth(p / .8));
      rig.head.rotation.y += Math.sin(Math.floor(p * 14) * 7) * .16 * (1 - smooth(p / .85));
      break;
    case 'sigil':
    default:
      rig.creature.rotation.y += open * .35;
      rig.head.rotation.x += arrival * .14;
      break;
  }
  const spread = (profile === 'avian' ? .55 : .3) * arrival;
  rig.wings.forEach((wing, i) => { wing.rotation.y += (wing.userData.side ?? (i % 2 ? -1 : 1)) * spread; });
  rig.legs.forEach((leg, i) => { leg.rotation.x += (i % 2 ? -1 : 1) * release * .09 * agility; });
  extras(rig, 'dangling').forEach((part, i) => { part.rotation.z += Math.sin(p * Math.PI * 3 - i * .35) * arrival * .13; });
}
