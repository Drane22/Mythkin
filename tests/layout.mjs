import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/viewport.css', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../src/components/WhyModal.tsx', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(app, /className="stage-actions"/);
assert.match(app, /aria-label="Creature information"/);
assert.match(app, /setWhyOpen\(true\)/);
assert.match(app, /className="desktop-details"/);
assert.match(css, /height: var\(--viewport-height, 100dvh\)/);
assert.match(css, /overflow: hidden/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /\.desktop-details \{ display: none; \}/);
assert.match(css, /\.info-backdrop \{ align-items: end/);
assert.match(css, /\.info-content \{ min-height: 0; overflow-y: auto/);
assert.match(modal, /<details className="info-anatomy">/);
assert.match(modal, /aria-labelledby="creature-info-title"/);
assert.match(html, /interactive-widget=resizes-content/);

console.log('Passed: viewport layout, mobile actions, internal info scrolling and keyboard-safe modal hooks.');
