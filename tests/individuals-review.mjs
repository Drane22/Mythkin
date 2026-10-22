import './register-typescript.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
const { generateMonsterV3 } = await import('../src/creatures/generateV3.ts');
const { paintBackground } = await import('../src/monster/background.ts');
const { renderMesh } = await import('./render-mesh.mjs');
const species = ['Minotaur', 'Fenrir', 'Bakunawa', 'Harpy', 'Leshy'];
const labels = ['', 'Amihan', 'Sol', 'Iris'];
const sheet = createCanvas(1024, 390 * species.length), ctx = sheet.getContext('2d');
ctx.fillStyle = '#17141e'; ctx.fillRect(0, 0, sheet.width, sheet.height);
for (let row = 0; row < species.length; row++) {
  for (let col = 0; col < labels.length; col++) {
    const g = generateMonsterV3(species[row] + (labels[col] ? ` named ${labels[col]}` : ''));
    const x = col * 256, y = row * 390;
    const bg = createCanvas(256, 320); paintBackground(bg.getContext('2d'), 256, 320, g, 0);
    ctx.drawImage(bg, x, y); ctx.drawImage(renderMesh(g, row === 1 ? .55 : .12).canvas, x, y);
    ctx.fillStyle = '#ebdced'; ctx.font = '16px sans-serif'; ctx.fillText(labels[col] || `${species[row]} / original`, x + 12, y + 345);
    const a = g.v3.appearance; ctx.fillStyle = '#baacc6'; ctx.font = '12px sans-serif'; ctx.fillText(`${a.aspect} · ${a.build} · ${a.marking}`, x + 12, y + 369);
  }
  console.log(`Rendered ${species[row]} reference and three individuals`);
}
mkdirSync('artifacts/v3-individuals', { recursive: true });
writeFileSync('artifacts/v3-individuals/lineages.png', sheet.toBuffer('image/png'));
