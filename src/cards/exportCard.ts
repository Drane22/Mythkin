import type { MonsterGenotype } from '../generator/types';
import { MYTHOLOGIES } from '../generator/mythology';

export type CardTemplate = 'clean';
export type CardFormat = 'square' | 'portrait' | 'landscape';

export const TEMPLATES: { id: CardTemplate; label: string }[] = [{ id: 'clean', label: 'Clean' }];
export const FORMATS: { id: CardFormat; label: string; w: number; h: number }[] = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait', w: 1080, h: 1350 },
  { id: 'landscape', label: 'Wide', w: 1200, h: 630 },
];

export interface CardOptions {
  template: CardTemplate;
  format: CardFormat;
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

function drawPixelImage(ctx: CanvasRenderingContext2D, image: HTMLCanvasElement, rect: Rect, fill = false) {
  ctx.imageSmoothingEnabled = false;
  const scale = fill
    ? Math.ceil(Math.max(rect.w / image.width, rect.h / image.height))
    : Math.max(1, Math.floor(Math.min(rect.w / image.width, rect.h / image.height)));
  const width = image.width * scale;
  const height = image.height * scale;
  const x = Math.round(rect.x + (rect.w - width) / 2);
  const y = Math.round(rect.y + (rect.h - height) / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  maxWidth: number,
  maxLines = 1,
  lineHeight = 1.2,
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const fontSize = Number.parseInt(font, 10) || 20;
  const lines = wrap(ctx, value, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * fontSize * lineHeight));
  return y + lines.length * fontSize * lineHeight;
}

function fittedPixelFont(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, preferred: number, minimum: number) {
  let size = preferred;
  while (size > minimum) {
    ctx.font = `${size}px ${PIX}`;
    if (ctx.measureText(value).width <= maxWidth) break;
    size -= 2;
  }
  return `${size}px ${PIX}`;
}

function conciseLore(value: string, maxLength = 150) {
  const firstSentence = value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? value.trim();
  if (firstSentence.length <= maxLength) return firstSentence;
  return `${firstSentence.slice(0, maxLength - 1).trimEnd()}…`;
}

function drawSigil(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const half = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.035);
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.arc(0, 0, half, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -half * 0.62);
  ctx.lineTo(half * 0.58, 0);
  ctx.lineTo(0, half * 0.62);
  ctx.lineTo(-half * 0.58, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-half * 0.45, half * 0.32);
  ctx.lineTo(half * 0.45, -half * 0.32);
  ctx.stroke();
  ctx.restore();
}

function drawArt(ctx: CanvasRenderingContext2D, data: CardData, rect: Rect) {
  drawPixelImage(ctx, data.background, rect, true);
  ctx.fillStyle = 'rgba(5, 4, 8, 0.2)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawPixelImage(ctx, data.monster, rect);
}

function mythologyLabel(data: CardData) {
  const g = data.genotype;
  const primary = MYTHOLOGIES[g.mythology.primary].short;
  const secondary = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary].short : '';
  return secondary ? `${primary} / ${secondary}` : primary;
}

function drawSquare(ctx: CanvasRenderingContext2D, data: CardData, width: number, height: number) {
  const { identity: id, palette } = data.genotype;
  const panelY = 665;
  ctx.fillStyle = '#08070c';
  ctx.fillRect(0, 0, width, height);
  drawArt(ctx, data, { x: 0, y: 0, w: width, h: panelY + 30 });

  const fade = ctx.createLinearGradient(0, panelY - 110, 0, panelY + 35);
  fade.addColorStop(0, 'rgba(8,7,12,0)');
  fade.addColorStop(1, '#0b0a0f');
  ctx.fillStyle = fade;
  ctx.fillRect(0, panelY - 110, width, 145);
  ctx.fillStyle = '#0b0a0f';
  ctx.fillRect(0, panelY, width, height - panelY);

  const x = 64;
  const max = width - 128;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x, panelY + 1, 72, 4);
  drawText(ctx, `MYTHKIN  /  ${data.displayName.toUpperCase()}`, x, panelY + 36, `15px ${PIX}`, '#8f8b97', max, 1);
  drawText(ctx, id.generatedName.toUpperCase(), x, panelY + 77, fittedPixelFont(ctx, id.generatedName.toUpperCase(), max - 120, 38, 24), '#f4f1f7', max - 120, 1);
  drawText(ctx, id.title, x, panelY + 132, `29px ${MONO}`, palette.accent, max - 120, 1);
  drawText(ctx, mythologyLabel(data).toUpperCase(), x, panelY + 183, `14px ${PIX}`, '#aaa6b1', max, 1);
  drawText(ctx, id.traits.slice(0, 2).join('  •  ').toUpperCase(), x, panelY + 224, `22px ${MONO}`, '#d3cfd8', max, 1);
  drawText(ctx, conciseLore(id.lore), x, panelY + 274, `23px ${MONO}`, '#aaa6b1', max - 90, 2, 1.12);
  drawSigil(ctx, width - 102, panelY + 108, 68, palette.accent);
}

function drawPortrait(ctx: CanvasRenderingContext2D, data: CardData, width: number, height: number) {
  const { identity: id, palette } = data.genotype;
  const panelY = 855;
  ctx.fillStyle = '#08070c';
  ctx.fillRect(0, 0, width, height);
  drawArt(ctx, data, { x: 0, y: 0, w: width, h: panelY + 35 });

  const fade = ctx.createLinearGradient(0, panelY - 140, 0, panelY + 35);
  fade.addColorStop(0, 'rgba(8,7,12,0)');
  fade.addColorStop(1, '#0b0a0f');
  ctx.fillStyle = fade;
  ctx.fillRect(0, panelY - 140, width, 175);
  ctx.fillStyle = '#0b0a0f';
  ctx.fillRect(0, panelY, width, height - panelY);

  const x = 72;
  const max = width - 144;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x, panelY + 1, 78, 4);
  drawText(ctx, `MYTHKIN  /  ${data.displayName.toUpperCase()}`, x, panelY + 42, `16px ${PIX}`, '#8f8b97', max, 1);
  drawText(ctx, id.generatedName.toUpperCase(), x, panelY + 92, fittedPixelFont(ctx, id.generatedName.toUpperCase(), max - 120, 42, 26), '#f4f1f7', max - 120, 1);
  drawText(ctx, id.title, x, panelY + 154, `31px ${MONO}`, palette.accent, max - 120, 1);
  drawText(ctx, mythologyLabel(data).toUpperCase(), x, panelY + 216, `15px ${PIX}`, '#aaa6b1', max, 1);
  drawText(ctx, id.traits.slice(0, 2).join('  •  ').toUpperCase(), x, panelY + 263, `24px ${MONO}`, '#d3cfd8', max, 1);
  drawText(ctx, conciseLore(id.lore), x, panelY + 320, `26px ${MONO}`, '#aaa6b1', max - 90, 3, 1.16);
  drawSigil(ctx, width - 112, panelY + 130, 76, palette.accent);
}

function drawLandscape(ctx: CanvasRenderingContext2D, data: CardData, width: number, height: number) {
  const { identity: id, palette } = data.genotype;
  const split = 650;
  ctx.fillStyle = '#0b0a0f';
  ctx.fillRect(0, 0, width, height);
  drawArt(ctx, data, { x: 0, y: 0, w: split, h: height });

  const fade = ctx.createLinearGradient(split - 110, 0, split + 40, 0);
  fade.addColorStop(0, 'rgba(11,10,15,0)');
  fade.addColorStop(1, '#0b0a0f');
  ctx.fillStyle = fade;
  ctx.fillRect(split - 110, 0, 150, height);

  const x = 700;
  const max = width - x - 54;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x, 48, 68, 4);
  drawText(ctx, `MYTHKIN  /  ${data.displayName.toUpperCase()}`, x, 78, `12px ${PIX}`, '#8f8b97', max, 1);
  drawText(ctx, id.generatedName.toUpperCase(), x, 122, fittedPixelFont(ctx, id.generatedName.toUpperCase(), max, 30, 19), '#f4f1f7', max, 2, 1.35);
  drawText(ctx, id.title, x, 210, `26px ${MONO}`, palette.accent, max, 2);
  drawText(ctx, mythologyLabel(data).toUpperCase(), x, 279, `12px ${PIX}`, '#aaa6b1', max, 1);
  drawText(ctx, id.traits.slice(0, 2).join('  •  ').toUpperCase(), x, 325, `21px ${MONO}`, '#d3cfd8', max, 2, 1.1);
  drawText(ctx, conciseLore(id.lore, 125), x, 395, `22px ${MONO}`, '#aaa6b1', max, 4, 1.08);
  drawSigil(ctx, width - 92, height - 76, 54, palette.accent);
}

export async function renderCard(data: CardData, options: CardOptions): Promise<HTMLCanvasElement> {
  const format = FORMATS.find((item) => item.id === options.format) ?? FORMATS[0];
  const canvas = document.createElement('canvas');
  canvas.width = format.w;
  canvas.height = format.h;
  const ctx = canvas.getContext('2d')!;
  try {
    await Promise.all([document.fonts.load(`20px ${PIX}`), document.fonts.load(`20px ${MONO}`)]);
  } catch {
    // System fallbacks keep export working if the web fonts are unavailable.
  }

  if (options.format === 'portrait') drawPortrait(ctx, data, format.w, format.h);
  else if (options.format === 'landscape') drawLandscape(ctx, data, format.w, format.h);
  else drawSquare(ctx, data, format.w, format.h);

  ctx.strokeStyle = 'rgba(244,241,247,0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, format.w - 2, format.h - 2);
  return canvas;
}

export function renderMonsterImage(data: CardData, size = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = data.genotype;
  drawPixelImage(ctx, data.background, { x: 0, y: 0, w: size, h: size }, true);
  ctx.fillStyle = 'rgba(5,4,8,0.24)';
  ctx.fillRect(0, 0, size, size);
  drawPixelImage(ctx, data.monster, { x: 0, y: 0, w: size, h: size });
  const gradient = ctx.createLinearGradient(0, size * 0.72, 0, size);
  gradient.addColorStop(0, 'rgba(7,6,10,0)');
  gradient.addColorStop(1, 'rgba(7,6,10,0.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, size * 0.7, size, size * 0.3);
  ctx.font = `18px ${PIX}`;
  ctx.fillStyle = '#f4f1f7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(g.identity.generatedName.toUpperCase(), size / 2, size - 45);
  return canvas;
}
