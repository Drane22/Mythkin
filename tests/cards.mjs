import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
const { generateMonster } = await import('../src/generator/generateMonster.ts');
const { renderCard, FORMATS } = await import('../src/cards/exportCard.ts');
const { paintBackground } = await import('../src/monster/background.ts');
assert.ok(GlobalFonts.registerFromPath('node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff', 'DM Sans'));
assert.ok(GlobalFonts.registerFromPath('node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff', 'Cormorant Garamond'));
let textCalls = [];
globalThis.document = {
  fonts: { load: async () => [] },
  createElement() {
    const canvas = createCanvas(1, 1);
    const context = canvas.getContext('2d');
    const original = context.fillText.bind(context);
    context.fillText = (text, x, y, ...rest) => {
      textCalls.push({ text, x, y, width: context.measureText(text).width, size: Number(context.font.match(/([\d.]+)px/)[1]) });
      original(text, x, y, ...rest);
    };
    return canvas;
  }
};
mkdirSync('node_modules/.cache/mythkin-card-qa', { recursive: true });
const monster = createCanvas(256, 256);
const art = monster.getContext('2d');
// Deliberately labeled fixture: tests card layout, not WebGL rendering.
art.fillStyle = '#c5a0ff'; art.fillRect(64, 60, 128, 120);
art.fillStyle = '#21172d'; art.fillRect(84, 91, 24, 24); art.fillRect(148, 91, 24, 24);
art.font = '12px sans-serif'; art.fillStyle = '#ffffff'; art.fillText('ART TEST FIXTURE', 75, 205);
for (let i = 0; i < 20; i++) {
  const genotype = generateMonster(i === 0 ? 'drane' : `card-review-${i}`);
  const background = createCanvas(96, 96);
  paintBackground(background.getContext('2d'), 96, 96, genotype);
  for (const format of FORMATS) {
    textCalls = [];
    const displayName = i === 0 ? 'W'.repeat(64) : 'Alex';
    const card = await renderCard({ genotype, displayName, background, monster, url: 'https://example.test' }, { template: 'clean', format: format.id });
    assert.equal(card.width, format.w); assert.equal(card.height, format.h);
    for (const line of textCalls) {
      assert.ok(line.x >= 0 && line.y >= 0);
      assert.ok(line.x + line.width <= card.width - 18, `horizontal overflow: ${line.text}`);
      assert.ok(line.y + line.size <= card.height - 18, `vertical overflow: ${line.text}`);
    }
    for (let a = 0; a < textCalls.length; a++) for (let b = a + 1; b < textCalls.length; b++) {
      const one = textCalls[a], two = textCalls[b];
      const overlapX = one.x < two.x + two.width && two.x < one.x + one.width;
      const overlapY = one.y < two.y + two.size && two.y < one.y + one.size;
      assert.ok(!(overlapX && overlapY), `overlapping text: ${one.text} / ${two.text}`);
    }
    const printed = textCalls.map(c => c.text).join('').replace(/\s/g, '');
    assert.ok(printed.includes(genotype.identity.lore.replace(/\s/g, '')), 'complete lore must be printed');
    if (i === 1) writeFileSync(`node_modules/.cache/mythkin-card-qa/card-${format.id}.png`, card.toBuffer('image/png'));
  }
}
console.log('Passed: 60 real canvas card renders; complete lore, all formats, long names, text bounds.');
