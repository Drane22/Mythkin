import QRCode from 'qrcode';
import type { MonsterGenotype } from '../generator/types';
import { MYTHOLOGIES } from '../generator/mythology';

export type CardTemplate = 'archive';
export type CardFormat = 'square' | 'portrait' | 'landscape';

export const TEMPLATES: { id: CardTemplate; label: string }[] = [{ id: 'archive', label: 'Signature archive' }];
export const FORMATS: { id: CardFormat; label: string; w: number; h: number }[] = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait', w: 1080, h: 1920 },
  { id: 'landscape', label: 'Landscape', w: 1200, h: 630 },
];

export interface CardOptions {
  template: CardTemplate;
  format: CardFormat;
  showLore: boolean;
  showTraits: boolean;
  showMythology: boolean;
  showQR: boolean;
}

export interface CardData {
  genotype: MonsterGenotype;
  displayName: string;
  monster: HTMLCanvasElement;
  background: HTMLCanvasElement;
  url: string;
}

interface Rect { x: number; y: number; w: number; h: number }
const PIX = '"Press Start 2P", "Courier New", monospace';
const MONO = '"VT323", "Courier New", monospace';
const rarityColor: Record<string, string> = { COMMON: '#b8b8b8', UNCOMMON: '#8edc91', RARE: '#83b4ff', MYTHIC: '#d9a0ff', FORBIDDEN: '#ff806e' };

function drawPixelImage(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, r: Rect, fill = false) {
  ctx.imageSmoothingEnabled = false;
  const scale = fill ? Math.ceil(Math.max(r.w / img.width, r.h / img.height)) : Math.max(1, Math.floor(Math.min(r.w / img.width, r.h / img.height)));
  const w = img.width * scale, h = img.height * scale;
  const x = Math.round(r.x + (r.w - w) / 2), y = Math.round(r.y + (r.h - h) / 2);
  if (fill) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.drawImage(img, x, y, w, h); ctx.restore(); }
  else ctx.drawImage(img, x, y, w, h);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > maxW) { lines.push(current); current = word; } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, font: string, color: string, maxW?: number, maxLines = 99, align: CanvasTextAlign = 'left', lineGap = 1.28) {
  if (!value) return y;
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
  const px = parseInt(font, 10) || 20;
  const lines = wrap(ctx, value, maxW ?? Number.POSITIVE_INFINITY).slice(0, maxLines);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * px * lineGap));
  return y + lines.length * px * lineGap;
}

function pixelFrame(ctx: CanvasRenderingContext2D, W: number, H: number, accent: string) {
  const inset = 30;
  ctx.strokeStyle = 'rgba(238,233,220,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.strokeRect(inset + 14, inset + 14, W - (inset + 14) * 2, H - (inset + 14) * 2);
  ctx.fillStyle = accent;
  const size = Math.max(6, Math.round(W / 150));
  for (let x = inset + 28; x < W - inset - 28; x += size * 3) { ctx.fillRect(x, inset + 25, size, size); ctx.fillRect(x, H - inset - 25 - size, size, size); }
  for (let y = inset + 28; y < H - inset - 28; y += size * 3) { ctx.fillRect(inset + 25, y, size, size); ctx.fillRect(W - inset - 25 - size, y, size, size); }
}

function divider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, accent: string) {
  ctx.fillStyle = 'rgba(238,233,220,0.2)'; ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = accent; ctx.fillRect(x, y, Math.min(110, w * 0.22), 4);
}

function specimenWindow(ctx: CanvasRenderingContext2D, background: HTMLCanvasElement, monster: HTMLCanvasElement, r: Rect, accent: string) {
  ctx.fillStyle = 'rgba(4,4,7,0.34)'; ctx.fillRect(r.x - 16, r.y - 16, r.w + 32, r.h + 32);
  ctx.strokeStyle = 'rgba(238,233,220,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(r.x - 16, r.y - 16, r.w + 32, r.h + 32);
  drawPixelImage(ctx, background, r, true);
  ctx.fillStyle = 'rgba(5,4,8,0.18)'; ctx.fillRect(r.x, r.y, r.w, r.h);
  drawPixelImage(ctx, monster, r);
  ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.strokeRect(r.x, r.y, r.w, r.h);
}

function archiveHeader(ctx: CanvasRenderingContext2D, W: number, seed: string, accent: string, landscape = false) {
  const x = landscape ? 55 : 70;
  const y = landscape ? 46 : 60;
  text(ctx, 'MYTHKIN / SPECIMEN ARCHIVE', x, y, `${landscape ? 13 : 16}px ${PIX}`, '#a7a294');
  text(ctx, `NO. ${seed.slice(0, 6).toUpperCase()}`, W - x, y, `${landscape ? 13 : 16}px ${PIX}`, accent, undefined, 1, 'right');
}

function drawSquare(ctx: CanvasRenderingContext2D, data: CardData, opts: CardOptions, W: number, H: number) {
  const g = data.genotype, id = g.identity, pal = g.palette;
  drawPixelImage(ctx, data.background, { x: 0, y: 0, w: W, h: H }, true);
  ctx.fillStyle = 'rgba(5,4,8,0.52)'; ctx.fillRect(0, 0, W, H);
  pixelFrame(ctx, W, H, pal.accent); archiveHeader(ctx, W, g.seed, pal.accent);
  specimenWindow(ctx, data.background, data.monster, { x: 180, y: 100, w: 720, h: 672 }, pal.accent);
  const left = 78, right = W - 78;
  text(ctx, `BOUND TO '${data.displayName.toUpperCase()}'`, left, 815, `15px ${PIX}`, '#a7a294');
  text(ctx, id.generatedName.toUpperCase(), left, 845, `34px ${PIX}`, '#eee9dc', 610, 2, 'left', 1.25);
  text(ctx, id.title.toUpperCase(), left, 918, `25px ${MONO}`, pal.accent, 610, 1);
  divider(ctx, left, 965, 924, pal.accent);
  const metaY = 985;
  text(ctx, `${id.rarity}  /  ${id.classification}`, left, metaY, `15px ${PIX}`, rarityColor[id.rarity]);
  text(ctx, opts.showMythology ? `${MYTHOLOGIES[g.mythology.primary].short}${g.mythology.secondary ? `  /  ${MYTHOLOGIES[g.mythology.secondary].short}` : ''}` : '', left, 1016, `21px ${MONO}`, '#a7a294');
  if (opts.showTraits) text(ctx, id.traits.join('  ·  '), right, 1016, `20px ${MONO}`, '#d5d0c5', 560, 1, 'right');
  if (opts.showQR) drawQR(ctx, data.url, { x: W - 155, y: 850, w: 78, h: 78 }, pal.accent, '#08080b');
}

function drawPortrait(ctx: CanvasRenderingContext2D, data: CardData, opts: CardOptions, W: number, H: number) {
  const g = data.genotype, id = g.identity, pal = g.palette;
  drawPixelImage(ctx, data.background, { x: 0, y: 0, w: W, h: H }, true);
  ctx.fillStyle = 'rgba(5,4,8,0.5)'; ctx.fillRect(0, 0, W, H);
  pixelFrame(ctx, W, H, pal.accent); archiveHeader(ctx, W, g.seed, pal.accent);
  specimenWindow(ctx, data.background, data.monster, { x: 120, y: 150, w: 840, h: 840 }, pal.accent);
  const x = 90, max = W - 180;
  text(ctx, `BOUND TO '${data.displayName.toUpperCase()}'`, x, 1085, `17px ${PIX}`, '#a7a294');
  text(ctx, id.generatedName.toUpperCase(), x, 1125, `45px ${PIX}`, '#eee9dc', max, 2, 'left', 1.25);
  text(ctx, id.title.toUpperCase(), x, 1245, `32px ${MONO}`, pal.accent, max, 2);
  divider(ctx, x, 1325, max, pal.accent);
  text(ctx, `${id.rarity}  /  ${id.classification}`, x, 1360, `18px ${PIX}`, rarityColor[id.rarity]);
  text(ctx, opts.showMythology ? `LINEAGE  ${MYTHOLOGIES[g.mythology.primary].label.toUpperCase()}${g.mythology.secondary ? `  /  ${MYTHOLOGIES[g.mythology.secondary].label.toUpperCase()}` : ''}` : '', x, 1410, `25px ${MONO}`, '#a7a294', max, 2);
  if (opts.showTraits) text(ctx, `TRAITS  ${id.traits.join('  ·  ')}`, x, 1480, `25px ${MONO}`, '#d5d0c5', max, 2);
  if (opts.showLore) text(ctx, id.lore, x, 1585, `27px ${MONO}`, '#eee9dc', max - (opts.showQR ? 150 : 0), 5, 'left', 1.18);
  if (opts.showQR) drawQR(ctx, data.url, { x: W - 205, y: H - 205, w: 125, h: 125 }, pal.accent, '#08080b');
  text(ctx, 'ONE NAME / ONE MONSTER / FOREVER', x, H - 92, `13px ${PIX}`, '#6f6b66');
}

function drawLandscape(ctx: CanvasRenderingContext2D, data: CardData, opts: CardOptions, W: number, H: number) {
  const g = data.genotype, id = g.identity, pal = g.palette;
  drawPixelImage(ctx, data.background, { x: 0, y: 0, w: W, h: H }, true);
  ctx.fillStyle = 'rgba(5,4,8,0.55)'; ctx.fillRect(0, 0, W, H);
  pixelFrame(ctx, W, H, pal.accent); archiveHeader(ctx, W, g.seed, pal.accent, true);
  specimenWindow(ctx, data.background, data.monster, { x: 58, y: 100, w: 450, h: 430 }, pal.accent);
  const x = 575, max = W - x - 60;
  text(ctx, `BOUND TO '${data.displayName.toUpperCase()}'`, x, 105, `13px ${PIX}`, '#a7a294');
  text(ctx, id.generatedName.toUpperCase(), x, 140, `29px ${PIX}`, '#eee9dc', max, 2, 'left', 1.25);
  text(ctx, id.title.toUpperCase(), x, 212, `24px ${MONO}`, pal.accent, max, 2);
  divider(ctx, x, 278, max, pal.accent);
  text(ctx, `${id.rarity}  /  ${id.classification}`, x, 300, `13px ${PIX}`, rarityColor[id.rarity]);
  text(ctx, opts.showMythology ? MYTHOLOGIES[g.mythology.primary].short : '', x, 334, `21px ${MONO}`, '#a7a294');
  if (opts.showTraits) text(ctx, id.traits.join('  ·  '), x, 370, `21px ${MONO}`, '#d5d0c5', max, 2);
  if (opts.showLore) text(ctx, id.lore, x, 420, `20px ${MONO}`, '#eee9dc', max - (opts.showQR ? 80 : 0), 3, 'left', 1.15);
  if (opts.showQR) drawQR(ctx, data.url, { x: W - 150, y: H - 135, w: 86, h: 86 }, pal.accent, '#08080b');
}

async function drawQR(ctx: CanvasRenderingContext2D, url: string, r: Rect, dark: string, light: string) {
  const c = document.createElement('canvas');
  await QRCode.toCanvas(c, url, { margin: 1, width: r.w, color: { dark, light }, errorCorrectionLevel: 'M' });
  ctx.imageSmoothingEnabled = false; ctx.drawImage(c, r.x, r.y, r.w, r.h);
}

export async function renderCard(data: CardData, opts: CardOptions): Promise<HTMLCanvasElement> {
  const fmt = FORMATS.find((item) => item.id === opts.format) ?? FORMATS[0];
  const canvas = document.createElement('canvas'); canvas.width = fmt.w; canvas.height = fmt.h;
  const ctx = canvas.getContext('2d')!;
  try { await Promise.all([document.fonts.load(`20px ${PIX}`), document.fonts.load(`20px ${MONO}`)]); } catch { /* optional fonts */ }
  if (opts.format === 'portrait') drawPortrait(ctx, data, opts, fmt.w, fmt.h);
  else if (opts.format === 'landscape') drawLandscape(ctx, data, opts, fmt.w, fmt.h);
  else drawSquare(ctx, data, opts, fmt.w, fmt.h);
  return canvas;
}

/** Fast image export for the utility action, without the dossier metadata. */
export function renderMonsterImage(data: CardData, size = 1024): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const ctx = c.getContext('2d')!, g = data.genotype;
  drawPixelImage(ctx, data.background, { x: 0, y: 0, w: size, h: size }, true);
  ctx.fillStyle = 'rgba(5,4,8,0.35)'; ctx.fillRect(0, 0, size, size);
  drawPixelImage(ctx, data.monster, { x: 0, y: 0, w: size, h: size });
  text(ctx, `${g.identity.generatedName.toUpperCase()}  /  ${data.displayName.toUpperCase()}`, size / 2, size - 46, `18px ${PIX}`, '#eee9dc', size - 80, 1, 'center');
  return c;
}
