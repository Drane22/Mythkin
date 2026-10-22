import './register-typescript.mjs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const { applyAnimationV3 } = await import('../src/motion/v3.ts');
const { REACTION_KINDS, REACTION_DURATION } = await import('../src/monster/reaction.ts');
const { SUMMON_TYPES } = await import('../src/generator/visualTypes.ts');
const profiles = ['brute', 'beast', 'serpent', 'avian', 'spirit', 'trickster', 'guardian'];
const idle = { breath: .5, bob: .5, headDrift: .5, blinkRate: 1, eyeWander: .5, tailWag: .5, wingFlap: .5, earTwitch: .5, jaw: .5, sway: .5, speed: 1 };

function fixture(profile, summon = 'sigil') {
  const root = new THREE.Group(), creature = new THREE.Group(); root.add(creature);
  root.scale.setScalar(.87); creature.scale.set(1.1, .9, 1.05);
  const node = (parent = creature, index = 0) => {
    const group = new THREE.Group(); group.position.set(index * .1, .2, -.05);
    group.rotation.set(.02, -.03, .04); parent.add(group); return group;
  };
  const body = node(), head = node(), jaw = node(head), tongue = node(jaw), tail = node();
  const arms = [node(), node()], legs = [node(), node(), node(), node()];
  const hands = arms.map(arm => node(arm)), wings = [node(), node()], ears = [node(head), node(head)];
  wings.forEach((wing, i) => { wing.userData.side = i ? -1 : 1; node(wing).userData.wingJoint = true; });
  const eye = node(head), pupil = node(eye), brow = node(eye), lid = node(eye);
  root.userData.motion = { profile, mass: profile === 'brute' ? 2.4 : 1 };
  root.userData.speciesId = 'fixture';
  root.userData.serpentJoints = Array.from({ length: 5 }, (_, i) => node(body, i));
  root.userData.secondaryHeads = [node(), node()];
  root.userData.dangling = [node(head), node(body)];
  const rig = { root, creature, body, head, jaw, tongue, tail, arms, legs, hands, wings, ears,
    eyes: [{ group: eye, pupil, brow, lid }], ornaments: [node(head)], halo: node(head), aura: node(),
    floating: profile === 'spirit', floatingHead: profile === 'spirit', height: 3,
    bodyType: profile === 'serpent' ? 'serpent' : profile === 'beast' ? 'quadruped' : 'barrel',
    summon: { type: summon, duration: 2.4, symbol: 0, entrance: 'gather', particles: 30, flash: 'soft' },
    assembleParts: [body, head, ...arms, ...legs, tail, ...wings].map((obj, i) => ({
      obj, basePos: obj.position.clone(), baseScale: obj.scale.clone(), from: new THREE.Vector3(.2, 1, -.3), delay: i * .04,
    })),
  };
  return rig;
}
function signature(rig) {
  const values = [];
  rig.root.traverse(obj => values.push(...obj.position.toArray(), ...obj.quaternion.toArray(), ...obj.scale.toArray(), Number(obj.visible)));
  assert.ok(values.every(Number.isFinite), 'all transforms must remain finite');
  return values.map(n => Math.round(n * 1e10) / 1e10);
}
const animate = (rig, overrides = {}) => applyAnimationV3(rig, idle, { time: 4, assemble: 1, reducedMotion: false, ...overrides });
const profilePoses = new Set();
for (const profile of profiles) {
  const rig = fixture(profile);
  animate(rig); const rest = signature(rig); profilePoses.add(JSON.stringify(rest));
  for (let i = 0; i < 50; i++) animate(rig);
  assert.deepEqual(signature(rig), rest, `${profile}: repeated frames cannot accumulate`);
  const reactions = new Set();
  for (const kind of REACTION_KINDS) {
    animate(rig, { reaction: { kind, age: .7, intensity: 1, anger: 0, direction: 1 } });
    reactions.add(JSON.stringify(signature(rig)));
    animate(rig, { reaction: { kind, age: REACTION_DURATION, intensity: 1, anger: 0, direction: 1 } });
    assert.deepEqual(signature(rig), rest, `${profile}/${kind}: recovery must match idle`);
  }
  assert.equal(reactions.size, 6, `${profile}: every reaction must have a distinct pose`);
  animate(rig, { time: 6.2 }); assert.notDeepEqual(signature(rig), rest, `${profile}: idle must move`);
  animate(rig); assert.deepEqual(signature(rig), rest, `${profile}: arbitrary timeline seeking must be deterministic`);
  animate(rig, { reducedMotion: true, time: 0 }); const reduced = signature(rig);
  animate(rig, { reducedMotion: true, time: 125, assemble: .1, gaze: { x: 1, y: 1 }, reaction: { kind: 'startle', age: .4, intensity: 1, anger: .8, direction: -1 } });
  assert.deepEqual(signature(rig), reduced, `${profile}: reduced motion must be entirely stable`);
  assert.deepEqual(rig.creature.scale.toArray(), [1.1, .9, 1.05], 'rest proportions must survive animation');
}
assert.equal(profilePoses.size, 7, 'seven locomotion profiles must have different idle poses');
const summonPoses = new Set();
for (const type of SUMMON_TYPES) {
  const rig = fixture('avian', type);
  animate(rig); const idlePose = signature(rig);
  for (const assemble of [0, .1, .3, .6, .85, .98, 1]) {
    animate(rig, { assemble }); signature(rig);
    if (assemble === .6) summonPoses.add(JSON.stringify(signature(rig)));
  }
  assert.deepEqual(signature(rig), idlePose, `${type}: summon completion must match settled geometry`);
  assert.equal(rig.creature.visible, true, `${type}: completed creature must be visible`);
  assert.ok(rig.assembleParts.every(part => part.obj.visible), `${type}: every anatomy part must return`);
  animate(rig, { assemble: .3, reducedMotion: true }); const stable = signature(rig);
  animate(rig, { assemble: .9, time: 30, reducedMotion: true });
  assert.deepEqual(signature(rig), stable, `${type}: reduced motion must skip assembly`);
}
assert.equal(summonPoses.size, 8, 'all eight summoning paths must have distinct choreography');
// Production geometry nests the head/limbs under a scaled body, and has many
// more assembly slots than the synthetic rig. Exercise that actual hierarchy.
const { generateMonsterV3 } = await import('../src/creatures/generateV3.ts');
const { buildCreatureV3 } = await import('../src/creatures/geometry/build.ts');
for (const name of ['Minotaur', 'Fenrir', 'Naga', 'Roc', 'Djinn', 'Hitotsume', 'Centaur', 'Zmey']) {
  const genotype = generateMonsterV3(name);
  genotype.visual.summon.type = 'parts';
  const { rig, dispose } = buildCreatureV3(genotype);
  const fittedScale = rig.creature.scale.clone();
  applyAnimationV3(rig, genotype.idle, { time: 0, assemble: 1, reducedMotion: true });
  const resting = signature(rig);
  assert.deepEqual(rig.creature.scale.toArray(), fittedScale.toArray(), `${name}: preserve uniform fitting`);
  for (const part of rig.assembleParts) {
    assert.ok(part.obj.scale.distanceTo(part.baseScale) < 1e-10, `${name}: final ${part.obj.name || part.obj.type} must assemble at full size`);
  }
  for (const assemble of [.1, .5, .8, 1]) applyAnimationV3(rig, genotype.idle, { time: assemble * 2.6, assemble, reducedMotion: false });
  applyAnimationV3(rig, genotype.idle, { time: 20, assemble: 1, reducedMotion: true });
  assert.deepEqual(signature(rig), resting, `${name}: actual hierarchy must recover exactly`);
  dispose();
}
console.log('Passed v3 motion: seven profiles × six reactions, deterministic recovery/seeking, preserved proportions, stable reduced motion and eight summon paths.');
