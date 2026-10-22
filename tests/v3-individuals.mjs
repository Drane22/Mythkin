import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
const { SPECIES } = await import('../src/creatures/catalog/index.ts');
const { generateMonsterV3 } = await import('../src/creatures/generateV3.ts');
const { buildMonster } = await import('../src/monster/buildMonster.ts');
const { applyAnimationV3 } = await import('../src/motion/v3.ts');
const { createNameGenerator, GIVEN_NAMES } = await import('../src/data/randomNames.ts');
const { buildShareUrl, parseShareUrl } = await import('../src/share/shareUrl.ts');

function signature(rig, geometryOnly = false) {
  const hash = createHash('sha256');
  rig.root.updateMatrixWorld(true);
  rig.creature.traverse(o => {
    if (!o.isMesh) return;
    hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));
    hash.update(JSON.stringify(o.matrixWorld.toArray()));
    if (!geometryOnly) {
      hash.update(String(o.material.color.getHex()));
      if (o.material.map?.image?.data) hash.update(o.material.map.image.data);
    }
  });
  return hash.digest('hex');
}

const catalogBefore = JSON.stringify(SPECIES);
let count = 0;
for (const species of SPECIES) {
  const forms = new Set(), geometry = new Set(), surfaces = new Set();
  for (const name of ['Amihan', 'Sol', 'Iris']) {
    const input = `${species.label} named ${name}`;
    const g = generateMonsterV3(input);
    assert.deepEqual(g, generateMonsterV3(input.toUpperCase().replaceAll(' ', '  ')));
    assert.equal(g.v3.primaryId, species.id);
    assert.equal(g.v3.secondaryId, undefined);
    assert.deepEqual(g.v3.anchors, [species.form, species.head, ...species.features]);
    const { rig, dispose } = buildMonster(g);
    assert.equal(rig.arms.length, g.anatomy.armCount);
    assert.equal(rig.legs.length, g.anatomy.legCount);
    assert.equal(rig.eyes.length, g.anatomy.eyes.count);
    forms.add(signature(rig)); geometry.add(signature(rig, true));
    const skin = rig.body.getObjectByName('anatomy:skull').material;
    assert.equal(skin.color.getHexString(), g.palette.body.slice(1));
    surfaces.add(createHash('sha256').update(skin.map.image.data).digest('hex'));
    for (const kind of ['guard', 'taunt', 'startle']) {
      applyAnimationV3(rig, g.idle, { assemble: 1, time: 3, reducedMotion: false, reaction: { kind, age: .6, intensity: 1, anger: .6, direction: 1 } });
      rig.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(rig.creature);
      assert(Number.isFinite(bounds.max.y) && bounds.max.y < 4.8 && bounds.min.y > -.7, `${input}: reaction bounds`);
    }
    dispose(); count++;
  }
  assert.equal(forms.size, 3, `${species.label}: renders must differ`);
  assert.equal(geometry.size, 3, `${species.label}: not just recolored copies`);
  assert.equal(surfaces.size, 3, `${species.label}: distinct painted patterns`);
}
assert.equal(JSON.stringify(SPECIES), catalogBefore, 'No shared catalog mutation');
const original = generateMonsterV3('Minotaur');
assert.equal(original.v3.appearance.aspect, 'Original');
const mixed = generateMonsterV3('Minotaur with Gorgon named Luna');
assert.equal(mixed.v3.primaryId, 'minotaur'); assert.equal(mixed.v3.secondaryId, 'gorgon');
globalThis.window = { location: new URL('https://mythkin.example/') };
window.location = new URL(buildShareUrl(mixed.input, 3));
assert.deepEqual(generateMonsterV3(parseShareUrl().name), mixed);
const namedPerson = generateMonsterV3('A person named Sol');
assert.equal(namedPerson.input, 'a person named sol');

const next = createNameGenerator(() => .37), names = [];
for (let i = 0; i < GIVEN_NAMES.length; i++) names.push(next(name => name.startsWith('A')));
assert.equal(new Set(names).size, GIVEN_NAMES.length, 'Preferences must preserve the no-repeat bag');
console.log(`Passed: ${count} named individuals, distinct actual geometry and textures for all 50 species, anatomy counts, reaction bounds, immutable catalog, share round trip and discovery bag.`);
