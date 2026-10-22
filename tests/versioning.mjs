import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const { generateMonster } = await import('../src/generator/generateMonster.ts');
const { GENERATION_VERSION } = await import('../src/generator/types.ts');
const { buildShareUrl, parseShareUrl } = await import('../src/share/shareUrl.ts');

// Captured from the complete serialized genotypes before the v3 dispatch change.
// Includes visual profile, colors, proportions, identity, anatomy and animation data.
const fixtures = [
  [1, 'Drane', '5a266fa70260db1e9d7b4cf9c58cd5887adbae8bf14f4f33bbd4a9b388304375'],
  [1, 'Moonling', 'e21d6f5b7157fd623d91f180ffb73eb50ab74b977056a72b3683029bb7e54256'],
  [1, 'Jade', 'fc3ad4f90a67d491e0271a62c8e95181c37fe95915240206beec0ccaa85feb74'],
  [1, 'review-15', 'bf8db95f12529dc2989854f861b2d86ae32e2ef6ca491c135a3dfefd311429f5'],
  [1, '', 'a4a3b10117569ded08ba587f520257d834923d752ca042c9fa923a5af2050019'],
  [1, '  Laika  ', 'e31e734f26646e8ae0a90389aa6f61cd99568f04c5e70805c23081abf8482728'],
  [2, 'Drane', '5143c1866a50071bd7653b39390823088eda56afcf94ef0c09ef2e129aea3464'],
  [2, 'Moonling', 'e9da9686eee937ef296509dc2bbc6683fdeb2845498e8834fb435968667e7043'],
  [2, 'Jade', '0dd27aae22aaf293cadb936deceb04459922cdf8e6bc50f8b3d8b254e779278e'],
  [2, 'review-15', '97b799b6cd1e89d2f01bb991a3bf49fea685715569783c44e33f55dd9e78e03f'],
  [2, '', 'ad3a4adf42c75238675a8411ef8f884b51dd5bde9e52bb786c75131e872bf14f'],
  [2, '  Laika  ', 'f384d59d04ff47387ad92d1b4bd9578a3ec9a0bf76fbed56f75a24e055ba4289'],
];
for (const [version, name, expected] of fixtures) {
  const genotype = generateMonster(name, version);
  assert.equal(genotype.version, version);
  assert.equal(createHash('sha256').update(JSON.stringify(genotype)).digest('hex'), expected,
    `v${version} must preserve the complete original genotype for ${JSON.stringify(name)}`);
}
assert.equal(GENERATION_VERSION, 3);
assert.equal(generateMonster('version-dispatch').version, 3);
assert.deepEqual(generateMonster('version-dispatch'), generateMonster('version-dispatch', 3));

globalThis.window = { location: new URL('https://mythkin.example/?old=1#previous') };
for (const version of [1, 2, 3]) {
  for (const name of ['Drane', '  Laika  ', '', 'L\u00e9a']) {
    const url = buildShareUrl(name, version);
    window.location = new URL(url);
    const shared = parseShareUrl();
    assert.equal(shared.version, version);
    assert.equal(shared.name, generateMonster(name, version).input);
    assert.deepEqual(generateMonster(shared.name, shared.version), generateMonster(name, version));
    assert.equal(window.location.hash, '');
    assert.equal(window.location.searchParams.has('old'), false);
  }
}
window.location = new URL(buildShareUrl('new-default'));
assert.equal(parseShareUrl().version, 3);
for (const version of [0, -1, 4, 1.5, NaN, Infinity]) {
  assert.throws(() => generateMonster('invalid', version), /Unsupported generation version/);
  assert.throws(() => buildShareUrl('invalid', version), /Unsupported generation version/);
  const url = new URL(buildShareUrl('invalid', 3));
  url.searchParams.set('v', String(version));
  window.location = url;
  assert.equal(parseShareUrl(), null);
}
const tampered = new URL(buildShareUrl('Drane', 2));
tampered.searchParams.set('s', '00000000');
window.location = tampered;
assert.equal(parseShareUrl(), null, 'a mismatched seed must be rejected');
tampered.searchParams.set('n', '%invalid-base64');
window.location = tampered;
assert.equal(parseShareUrl(), null, 'malformed encoded names must be rejected');
console.log('Passed: 12 frozen v1/v2 complete genotype signatures, default v3 dispatch, all-version share round trips and invalid-link rejection.');
