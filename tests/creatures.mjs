import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText, shortCircuit: true };
    return next(url, context);
  }
});
const { generateMonster } = await import('../src/generator/generateMonster.ts');
const { buildMonster } = await import('../src/monster/buildMonster.ts');
const { applyAnimation } = await import('../src/monster/animate.ts');
const seen = new Set();
for (let i = 0; i < 1000; i++) {
  const g = generateMonster(`review-${i}`);
  const a = g.anatomy;
  seen.add(a.body);
  assert.deepEqual(g, generateMonster(`review-${i}`));
  assert.equal(a.arms === 'none', a.armCount === 0);
  assert.equal(a.legs === 'none', a.legCount === 0);
  if (a.body === 'quadruped') assert.equal(a.armCount, 0);
  if (a.head === 'beak') assert.equal(a.mouth, 'beak');
  assert.ok(a.mutations.filter(x => ['four_legs', 'no_legs', 'serpent_lower'].includes(x)).length <= 1);
  assert.ok(!/undefined|\{.*\}/.test(g.identity.lore));
  assert.ok(g.identity.generatedName.length >= 3);
  if (i < 100) {
    const { rig, dispose } = buildMonster(g);
    for (const assemble of [0, 0.4, 0.9, 1]) {
      applyAnimation(rig, g.idle, { assemble, time: 4, reducedMotion: false });
      rig.root.traverse(o => assert.ok([...o.position, ...o.scale, o.rotation.x, o.rotation.y, o.rotation.z].every(Number.isFinite)));
    }
    applyAnimation(rig, g.idle, { assemble: 1, time: 0, reducedMotion: true });
    const neutral = rig.creature.position.clone();
    applyAnimation(rig, g.idle, { assemble: 1, time: 1, reducedMotion: false, reaction: { age: 0.2, intensity: 1, anger: 1, direction: 1 } });
    applyAnimation(rig, g.idle, { assemble: 1, time: 8, reducedMotion: true });
    assert.ok(rig.creature.position.distanceTo(neutral) < 0.00001, 'reaction must return to rest');
    dispose();
  }
}
assert.equal(seen.size, 8);
console.log('Passed: 1,000 combinations; all 8 body types; 100 animated rigs; reaction reset and reduced motion.');
