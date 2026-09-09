import assert from 'node:assert/strict';
import './register-typescript.mjs';
const { generateMonster } = await import('../src/generator/generateMonster.ts');
const { buildMonster } = await import('../src/monster/buildMonster.ts');
const { applyAnimation } = await import('../src/monster/animate.ts');
const { initialReaction, pokeReaction, reactionPose, REACTION_DURATION } = await import('../src/monster/reaction.ts');
let reaction = pokeReaction(initialReaction(), 1, -1);
assert.equal(reaction.kind, 'guard');
assert.equal(reaction.direction, -1);
assert.equal(pokeReaction(reaction, 1.1, 1), reaction, 'rapid inputs must not restart anticipation');
reaction = pokeReaction(reaction, 1.5, 1);
assert.equal(reaction.kind, 'feint');
reaction = pokeReaction(reaction, 2, -1);
assert.equal(reaction.kind, 'taunt');
assert.equal(pokeReaction(reaction, 8, 1).kind, 'guard', 'a pause resets the interaction sequence');
for (let i = 0; i < 100; i++) reaction = pokeReaction(reaction, 8 + i * 0.3, 1);
assert.ok(reaction.anger <= 1);
for (const kind of ['guard', 'feint', 'taunt']) {
  assert.ok(Object.values(reactionPose({ age: 0, kind, intensity: 1 })).every(v => v === 0));
  assert.ok(Object.values(reactionPose({ age: REACTION_DURATION, kind, intensity: 1 })).every(v => v === 0));
}
const snapshot = rig => {
  const transforms = [];
  rig.root.traverse(o => transforms.push([...o.position, ...o.scale, o.rotation.x, o.rotation.y, o.rotation.z]));
  return transforms;
};
const { pointerGaze, easeGaze } = await import('../src/monster/gaze.ts');
assert.deepEqual(pointerGaze(100, 100, { left: 0, top: 0, width: 200, height: 200 }), { x: 0, y: 0 });
assert.deepEqual(pointerGaze(1000, -1000, { left: 0, top: 0, width: 200, height: 200 }), { x: 1, y: 1 });
assert.deepEqual(pointerGaze(100, 100, { left: 0, top: 0, width: 0, height: 0 }), { x: 0, y: 0 });
const eased = easeGaze({ x: 0, y: 0 }, { x: 1, y: -1 }, .016);
assert.ok(eased.x > 0 && eased.x < 1 && eased.y < 0 && eased.y > -1);
const seen = new Set();
for (let i = 0; i < 1000; i++) {
  const g = generateMonster(`review-${i}`);
  const a = g.anatomy;
  seen.add(a.body);
  assert.deepEqual(g, generateMonster(`review-${i}`));
  assert.equal(a.arms === 'none', a.armCount === 0);
  assert.equal(a.legs === 'none', a.legCount === 0);
  if (a.body === 'quadruped') assert.ok(a.armCount === 0 || g.visual.rig === 'centauroid');
  if (a.head === 'beak') assert.equal(a.mouth, 'beak');
  assert.ok(a.mutations.filter(x => ['four_legs', 'no_legs', 'serpent_lower'].includes(x)).length <= 1);
  assert.ok(!/undefined|\{.*\}/.test(g.identity.lore));
  assert.ok(g.identity.generatedName.length >= 3);
  if (i < 100) {
    const { rig, dispose } = buildMonster(g);
    for(const leg of rig.legs) assert.equal(leg.parent,rig.body,'hip must follow the breathing torso');
    for(const arm of rig.arms) assert.ok(arm.parent===rig.body||arm.parent.parent===rig.body,'shoulder must follow torso');
    for(const hand of rig.hands) assert.ok(rig.arms.includes(hand.parent),'wrist must stay attached to its arm');
    rig.root.traverse(o => {
      if (!o.isMesh) return;
      if(o.name!=='summon-pixel-cloud')assert.notEqual(o.geometry.type, 'BoxGeometry', 'anatomy must use curved geometry');
      assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite), 'mesh vertices must be finite');
    });
    for (const assemble of [0, 0.4, 0.9, 1]) {
      applyAnimation(rig, g.idle, { assemble, time: 4, reducedMotion: false });
      rig.root.traverse(o => assert.ok([...o.position, ...o.scale, o.rotation.x, o.rotation.y, o.rotation.z].every(Number.isFinite)));
    }
    applyAnimation(rig, g.idle, { assemble: 1, time: 0, reducedMotion: true });
    const neutral = rig.creature.position.clone();
    applyAnimation(rig, g.idle, { assemble: 1, time: 1, reducedMotion: false, reaction: { age: 0.2, intensity: 1, anger: 1, direction: 1 } });
    applyAnimation(rig, g.idle, { assemble: 1, time: 8, reducedMotion: true });
    assert.ok(rig.creature.position.distanceTo(neutral) < 0.00001, 'reaction must return to rest');
    applyAnimation(rig, g.idle, { assemble: 1, time: 8, reducedMotion: false });
    const resting = snapshot(rig);
    const originalYaw = rig.head.rotation.y;
    applyAnimation(rig, g.idle, { assemble: 1, time: 8, reducedMotion: false, gaze: { x: 1, y: 1 } });
    assert.ok(rig.head.rotation.y > originalYaw);
    applyAnimation(rig, g.idle, { assemble: 1, time: 8, reducedMotion: false });
    assert.deepEqual(snapshot(rig), resting, 'gaze returns to rest');
    for (const kind of ['guard', 'feint', 'taunt']) {
      for (const age of [0, 0.2, 0.6, 0.95, 1.4, 1.8]) {
        applyAnimation(rig, g.idle, { assemble: 1, time: 8, reducedMotion: false, reaction: { age, kind, intensity: 1, anger: 0.7, direction: -1 } });
        assert.ok(snapshot(rig).flat().every(Number.isFinite));
      }
      applyAnimation(rig, g.idle, { assemble: 1, time: 8, reducedMotion: false });
      assert.deepEqual(snapshot(rig), resting, `${kind} must restore every joint`);
    }
    const reducedReaction = { age: 0.6, kind: 'feint', intensity: 1, anger: 0.5, direction: 1 };
    applyAnimation(rig, g.idle, { assemble: 1, time: 0, reducedMotion: true, reaction: reducedReaction });
    const reducedPose = snapshot(rig);
    applyAnimation(rig, g.idle, { assemble: 1, time: 9, reducedMotion: true, reaction: { ...reducedReaction, age: 1.2 } });
    assert.deepEqual(snapshot(rig), reducedPose, 'reduced motion keeps a static expression');
    dispose();
  }
}
assert.equal(seen.size, 8);
console.log('Passed: 1,000 combinations; all 8 body types; 100 animated rigs; guard/feint/taunt recovery, input escalation and reduced motion.');

const { dragOrbit, isRotationDrag } = await import('../src/monster/orbit.ts');
assert.equal(isRotationDrag(3, 2), false);
assert.equal(isRotationDrag(20, 0), true);
assert.ok(Math.abs(dragOrbit({ yaw: 0, pitch: 0 }, 400, 0, 400).yaw + Math.PI * 2) < .0001);
assert.equal(dragOrbit({ yaw: 0, pitch: 0 }, 0, 10000, 400).pitch, .45);
assert.equal(dragOrbit({ yaw: 0, pitch: 0 }, 0, 100, 400, true).pitch, 0);
const { createSkinTexture } = await import('../src/monster/skin.ts');
const { NearestFilter } = await import('three');
const surfaces = new Set();
for (const skin of ['smooth', 'fur', 'scales', 'bone', 'stone', 'feathers', 'chitin', 'bark']) {
  const texture = createSkinTexture(skin, 'skin-test');
  const again = createSkinTexture(skin, 'skin-test');
  assert.deepEqual(texture.image.data, again.image.data);
  assert.equal(texture.magFilter, NearestFilter);
  surfaces.add(Buffer.from(texture.image.data).toString('base64'));
  const sample = structuredClone(generateMonster('drane'));
  sample.anatomy.skin = skin;
  const { rig, dispose } = buildMonster(sample);
  let tufts = 0;
  rig.root.traverse(o => { if (o.name.startsWith('skin-')) tufts += o.userData.surfaceElements ?? 1; });
  if (skin === 'fur' || skin === 'feathers') assert.ok(tufts > 10, `${skin} needs visible tufts`);
  dispose(); texture.dispose(); again.dispose();
}
assert.equal(surfaces.size, 8);
console.log('Passed: full rotation, drag threshold, touch scrolling, 8 deterministic skin textures and fur geometry.');
