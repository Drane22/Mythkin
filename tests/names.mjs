import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { createNameGenerator, GIVEN_NAMES } = await import('../src/data/randomNames.ts');
for (const random of [() => 0, () => .999999, Math.random]) {
  const next = createNameGenerator(random);
  let previous = '';
  for (let cycle=0;cycle<20;cycle++) {
    const seen = new Set();
    for (let i=0;i<GIVEN_NAMES.length;i++) {
      const name = next();
      assert.ok(GIVEN_NAMES.includes(name));
      assert.match(name, /^[A-Z][a-z]+$/);
      assert.notEqual(name,previous);
      assert.ok(!seen.has(name));
      seen.add(name); previous=name;
    }
  }
}
const source=readFileSync('src/data/randomNames.ts','utf8');
assert.ok(!/fetch\(|localStorage|FileReader|showOpenFilePicker|Department of Health/.test(source));
console.log('Passed: names-only generation, full-pool variety, no repeats at refill, no external data source.');
