import type { MonsterGenotype, Rarity } from '../generator/types';
import { MYTHOLOGIES } from '../generator/mythology';

export type CardTemplate = 'clean';
export type CardFormat = 'square' | 'portrait' | 'landscape';
export const TEMPLATES = [{ id: 'clean' as const, label: 'Bestiary' }];
export const FORMATS: { id: CardFormat; label: string; w: number; h: number }[] = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait', w: 1080, h: 1350 },
  { id: 'landscape', label: 'Wide', w: 1200, h: 900 },
];
export interface CardOptions { template: CardTemplate; format: CardFormat; }
export interface CardData {
  genotype: MonsterGenotype;
  displayName: string;
  monster: HTMLCanvasElement;
  background: HTMLCanvasElement;
  url: string;
}
interface Rect { x: number; y: number; w: number; h: number; }
const DISPLAY = '"Cormorant Garamond", serif';
const BODY = '"DM Sans", sans-serif';
const RARITY_COLORS: Record<Rarity, string> = { COMMON: '#c8c3d5', UNCOMMON: '#b8d6af', RARE: '#a9cafa', MYTHIC: '#dfbd79', FORBIDDEN: '#df9ebe' };

function drawPixelImage(ctx: CanvasRenderingContext2D, image: HTMLCanvasElement, rect: Rect, fill = false) {
  ctx.imageSmoothingEnabled = false;
  const ratio = fill ? Math.max(rect.w / image.width, rect.h / image.height) : Math.min(rect.w / image.width, rect.h / image.height);
  const scale = fill && ratio >= 1 ? Math.ceil(ratio) : ratio;
  const w = image.width * scale, h = image.height * scale;
  ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  ctx.drawImage(image, Math.round(rect.x + (rect.w - w) / 2), Math.round(rect.y + (rect.h - h) / 2), w, h);
  ctx.restore();
}

export function wrapCardText(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width) { line = next; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const char of word) {
      if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Fit complete text into its own region; lore is never sliced to a teaser.
function textBlock(ctx: CanvasRenderingContext2D, value: string, rect: Rect, preferred: number, color: string, display = false) {
  let size = preferred;
  let lines: string[] = [];
  do {
    ctx.font = `${display ? 500 : 400} ${size}px ${display ? DISPLAY : BODY}`;
    lines = wrapCardText(ctx, value, rect.w);
    if (lines.length * size * 1.4 <= rect.h) break;
    size -= 1;
  } while (size > 8);
  ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((line, i) => ctx.fillText(line, rect.x, rect.y + i * size * 1.4));
}

function roundRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number, fill: string) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius); ctx.fill();
}

export async function renderCard(data: CardData, options: CardOptions): Promise<HTMLCanvasElement> {
  try { await Promise.all([document.fonts.load(`500 24px ${DISPLAY}`), document.fonts.load(`24px ${BODY}`)]); } catch { /* System font fallback. */ }
  const { w, h } = FORMATS.find(f => f.id === options.format) ?? FORMATS[1];
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const g = data.genotype, id = g.identity;
  const ink = g.visual?.colors.emissive ?? RARITY_COLORS[id.rarity];
  const wide = options.format === 'landscape';
  roundRect(ctx, { x: 0, y: 0, w, h }, 0, '#333333');
  roundRect(ctx, { x: 10, y: 10, w: w - 20, h: h - 20 }, 0, '#222222');
  ctx.strokeStyle = g.visual?.colors.accessorySecondary ?? '#6e518b'; ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, w - 40, h - 40);
  textBlock(ctx, 'MYTHKIN', { x: 52, y: 38, w: 400, h: 44 }, 30, '#d8cbb6', true);
  textBlock(ctx, id.rarity, { x: w - 282, y: 38, w: 230, h: 44 }, 28, ink);
  if(g.visual){
    ctx.strokeStyle=g.visual.colors.emissive;ctx.lineWidth=2;
    const symbol=g.visual.summon.symbol;
    for(let i=0;i<3+symbol;i++){const a=i/(3+symbol)*Math.PI*2;ctx.beginPath();ctx.moveTo(w/2+Math.sin(a)*9,55+Math.cos(a)*9);ctx.lineTo(w/2+Math.sin(a)*18,55+Math.cos(a)*18);ctx.stroke();}
  }
  const loreSize = wide ? 30 : 36;
  ctx.font = `400 ${loreSize}px ${BODY}`;
  const loreLines = wrapCardText(ctx, id.lore, w - 112);
  const loreHeight = loreLines.length * loreSize * 1.4;
  const footerHeight = data.displayName.length > 36 ? 92 : 52;
  const loreY = h - footerHeight - 48 - loreHeight;
  const portrait = options.format === 'portrait';
  const infoHeight = 282;
  const art: Rect = portrait
    ? { x: 52, y: 104, w: w - 104, h: Math.max(160, loreY - 104 - infoHeight - 26) }
    : { x: 52, y: 104, w: Math.round(w * .42), h: Math.max(150, loreY - 132) };
  ctx.save(); ctx.beginPath(); ctx.roundRect(art.x, art.y, art.w, art.h, 0); ctx.clip();
  drawPixelImage(ctx, data.background, art, true);
  drawPixelImage(ctx, data.monster, art);
  ctx.restore();
  const x = portrait ? 56 : art.x + art.w + 32;
  const y = portrait ? art.y + art.h + 20 : 106;
  const width = w - x - 56;
  textBlock(ctx, id.generatedName, { x, y, w: width, h: 85 }, wide ? 52 : 68, '#f5efdf', true);
  textBlock(ctx, id.title, { x, y: y + 87, w: width, h: 70 }, wide ? 28 : 32, '#cbb0f2');
  const origins = [MYTHOLOGIES[g.mythology.primary].short, ...(g.mythology.secondary ? [MYTHOLOGIES[g.mythology.secondary].short] : [])].join(' + ');
  textBlock(ctx, origins, { x, y: y + 161, w: width, h: 46 }, 28, '#cfc5b5');
  textBlock(ctx, id.traits.slice(0, 2).map(t => t.replace(/-/g, ' ')).join(' / '), { x, y: y + 212, w: width, h: 64 }, 28, ink);
  ctx.fillStyle = '#6e518b'; ctx.fillRect(56, loreY - 16, w - 112, 2);
  textBlock(ctx, id.lore, { x: 56, y: loreY, w: w - 112, h: loreHeight + 1 }, loreSize, '#eee5d6');
  textBlock(ctx, `Bound to ${data.displayName}`, { x: 56, y: h - footerHeight - 24, w: w - 112, h: footerHeight }, 26, '#c8baa4');
  return canvas;
}

export function renderMonsterImage(data: CardData, size = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  drawPixelImage(ctx, data.background, { x: 0, y: 0, w: size, h: size }, true);
  drawPixelImage(ctx, data.monster, { x: 0, y: 0, w: size, h: size - 80 });
  roundRect(ctx, { x: 24, y: size - 86, w: size - 48, h: 62 }, 12, '#18131fe8');
  textBlock(ctx, data.genotype.identity.generatedName, { x: 44, y: size - 76, w: size - 88, h: 48 }, 30, '#f5efdf', true);
  return canvas;
}
