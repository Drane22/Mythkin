import QRCode from "qrcode";
import type { MonsterGenotype } from "../generator/types";
import { MYTHOLOGIES } from "../generator/mythology";

export type CardTemplate = "bestiary" | "file" | "occult" | "minimal" | "arcade" | "archive";
export type CardFormat = "square" | "portrait" | "landscape";

export const TEMPLATES: { id: CardTemplate; label: string }[] = [
  { id: "bestiary", label: "Pixel Bestiary" },
  { id: "file", label: "Monster File" },
  { id: "occult", label: "Summoning Card" },
  { id: "minimal", label: "Minimal Poster" },
  { id: "arcade", label: "Arcade Card" },
  { id: "archive", label: "Mythology Archive" },
];
export const FORMATS: { id: CardFormat; label: string; w: number; h: number }[] = [
  { id: "square", label: "Square 1:1", w: 1080, h: 1080 },
  { id: "portrait", label: "Story 9:16", w: 1080, h: 1920 },
  { id: "landscape", label: "Landscape", w: 1200, h: 630 },
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
  monster: HTMLCanvasElement; // transparent, low-res
  background: HTMLCanvasElement; // low-res pixel bg
  url: string;
}

const PIX = '"Press Start 2P", "Courier New", monospace';
const MONO = '"VT323", "Courier New", monospace';

interface Rect { x: number; y: number; w: number; h: number }

function layout(f: CardFormat, W: number, H: number): { monster: Rect; text: Rect; qr: Rect } {
  if (f === "landscape") return { monster: { x: W * 0.04, y: H * 0.08, w: H * 0.84, h: H * 0.84 }, text: { x: H * 0.96, y: H * 0.1, w: W - H * 0.96 - W * 0.05, h: H * 0.8 }, qr: { x: W - 150, y: H - 150, w: 110, h: 110 } };
  if (f === "portrait") return { monster: { x: W * 0.08, y: H * 0.14, w: W * 0.84, h: W * 0.84 }, text: { x: W * 0.08, y: H * 0.14 + W * 0.84 + 60, w: W * 0.84, h: H * 0.86 - W * 0.84 - 120 }, qr: { x: W - 190, y: H - 190, w: 130, h: 130 } };
  return { monster: { x: W * 0.2, y: H * 0.06, w: W * 0.6, h: W * 0.6 }, text: { x: W * 0.08, y: H * 0.06 + W * 0.6 + 30, w: W * 0.84, h: H * 0.94 - W * 0.6 - 60 }, qr: { x: W - 160, y: H - 160, w: 110, h: 110 } };
}

function drawPixelImage(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, r: Rect, fill = false) {
  ctx.imageSmoothingEnabled = false;
  const scale = fill ? Math.ceil(Math.max(r.w / img.width, r.h / img.height)) : Math.max(1, Math.floor(Math.min(r.w / img.width, r.h / img.height)));
  const w = img.width * scale, h = img.height * scale;
  const x = Math.round(r.x + (r.w - w) / 2), y = Math.round(r.y + (r.h - h) / 2);
  if (fill) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.drawImage(img, x, y, w, h); ctx.restore(); }
  else ctx.drawImage(img, x, y, w, h);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" "); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

function textBlock(ctx: CanvasRenderingContext2D, lines: { text: string; font: string; color: string; gap?: number; align?: CanvasTextAlign }[], r: Rect, align: CanvasTextAlign = "center") {
  let y = r.y;
  for (const l of lines) {
    if (!l.text) { y += l.gap ?? 10; continue; }
    ctx.font = l.font; ctx.fillStyle = l.color; ctx.textAlign = l.align ?? align; ctx.textBaseline = "top";
    const px = parseInt(l.font, 10) || 20;
    const wrapped = wrap(ctx, l.text, r.w);
    const x = (l.align ?? align) === "center" ? r.x + r.w / 2 : (l.align ?? align) === "right" ? r.x + r.w : r.x;
    for (const w of wrapped) { ctx.fillText(w, x, y); y += px * 1.35; }
    y += l.gap ?? 8;
  }
  return y;
}

function pixelBorder(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, size = 8, inset = 24) {
  ctx.fillStyle = color;
  for (let x = inset; x < W - inset; x += size * 2) { ctx.fillRect(x, inset, size, size); ctx.fillRect(x, H - inset - size, size, size); }
  for (let y = inset; y < H - inset; y += size * 2) { ctx.fillRect(inset, y, size, size); ctx.fillRect(W - inset - size, y, size, size); }
}

async function drawQR(ctx: CanvasRenderingContext2D, url: string, r: Rect, dark: string, light: string) {
  const c = document.createElement("canvas");
  await QRCode.toCanvas(c, url, { margin: 1, width: r.w, color: { dark, light }, errorCorrectionLevel: "M" });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, r.x, r.y, r.w, r.h);
}

const rarityColor: Record<string, string> = { COMMON: "#b8b8b8", UNCOMMON: "#7fd67f", RARE: "#6fa8ff", MYTHIC: "#d98cff", FORBIDDEN: "#ff5c5c" };

export async function renderCard(data: CardData, opts: CardOptions): Promise<HTMLCanvasElement> {
  const fmt = FORMATS.find((f) => f.id === opts.format)!;
  const W = fmt.w, H = fmt.h;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  try { await Promise.all([document.fonts.load(`20px ${PIX}`), document.fonts.load(`20px ${MONO}`)]); } catch { /* fonts optional */ }
  const g = data.genotype, id = g.identity, pal = g.palette;
  const L = layout(opts.format, W, H);
  const myth = `${MYTHOLOGIES[g.mythology.primary].short}${g.mythology.secondary ? " / " + MYTHOLOGIES[g.mythology.secondary].short : ""}`;
  const name = data.displayName.toUpperCase();
  const small = opts.format === "landscape";
  const S = small ? 0.8 : 1;
  const traits = id.traits.join(" • ");

  // ---------- template paint
  switch (opts.template) {
    case "bestiary": {
      ctx.fillStyle = "#08070c"; ctx.fillRect(0, 0, W, H);
      drawPixelImage(ctx, data.background, L.monster, true);
      pixelBorder(ctx, W, H, pal.accent, 8, 20);
      ctx.font = `${16 * S}px ${PIX}`; ctx.fillStyle = "#8a8797"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(`MYTHOS ARCHIVE // ${g.seed.slice(0, 6)}`, 48, 48);
      ctx.textAlign = "right"; ctx.fillText(`v${g.version}`, W - 48, 48);
      drawPixelImage(ctx, data.monster, L.monster);
      textBlock(ctx, [
        { text: name, font: `${22 * S}px ${PIX}`, color: "#8a8797", gap: 14 },
        { text: id.generatedName.toUpperCase(), font: `${44 * S}px ${PIX}`, color: "#ffffff", gap: 10 },
        { text: id.title.toUpperCase(), font: `${18 * S}px ${PIX}`, color: pal.accent, gap: 18 },
        { text: id.rarity, font: `${20 * S}px ${PIX}`, color: rarityColor[id.rarity], gap: 14 },
        { text: opts.showTraits ? traits : "", font: `${28 * S}px ${MONO}`, color: "#cfcbe0", gap: 6 },
        { text: opts.showMythology ? myth : "", font: `${26 * S}px ${MONO}`, color: "#8a8797", gap: 10 },
        { text: opts.showLore ? id.lore : "", font: `${30 * S}px ${MONO}`, color: "#e6e2f5" },
      ], L.text);
      if (opts.showQR) await drawQR(ctx, data.url, L.qr, "#ffffff", "#08070c");
      break;
    }
    case "file": {
      ctx.fillStyle = "#efe9d8"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#d9d1bb"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = "#1d1a17"; ctx.lineWidth = 6; ctx.strokeRect(30, 30, W - 60, H - 60);
      ctx.font = `${18 * S}px ${PIX}`; ctx.fillStyle = "#1d1a17"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("SPECIMEN FILE", 60, 58); ctx.textAlign = "right"; ctx.fillText(`NO. ${g.seed.slice(0, 6)}`, W - 60, 58);
      ctx.fillStyle = "#e4dcc6"; ctx.fillRect(L.monster.x, L.monster.y, L.monster.w, L.monster.h);
      ctx.strokeStyle = "#1d1a17"; ctx.lineWidth = 4; ctx.strokeRect(L.monster.x, L.monster.y, L.monster.w, L.monster.h);
      drawPixelImage(ctx, data.monster, L.monster);
      const rows: [string, string][] = [["SUBJECT", name], ["DESIGNATION", id.generatedName.toUpperCase()], ["TITLE", id.title], ["CLASS", id.classification], ["RARITY", id.rarity]];
      if (opts.showMythology) rows.push(["ORIGIN", myth]);
      rows.push(["EYES / ARMS / LEGS", `${g.anatomy.eyes.count} / ${g.anatomy.armCount} / ${g.anatomy.legCount}`]);
      if (opts.showTraits) rows.push(["TRAITS", traits]);
      let y = L.text.y;
      const lh = 30 * S;
      for (const [k, v] of rows) {
        ctx.font = `${14 * S}px ${PIX}`; ctx.fillStyle = "#6b6357"; ctx.textAlign = "left"; ctx.fillText(k, L.text.x, y);
        ctx.font = `${30 * S}px ${MONO}`; ctx.fillStyle = "#1d1a17";
        const lines = wrap(ctx, v, L.text.w - 260 * S);
        lines.forEach((l, i) => ctx.fillText(l, L.text.x + 250 * S, y - 6 + i * lh));
        y += Math.max(1, lines.length) * lh + 10 * S;
        ctx.fillStyle = "#c9c0a8"; ctx.fillRect(L.text.x, y - 6, L.text.w, 2);
      }
      if (opts.showLore) { ctx.font = `${28 * S}px ${MONO}`; ctx.fillStyle = "#1d1a17"; wrap(ctx, `FIELD NOTE: ${id.lore}`, L.text.w).forEach((l, i) => ctx.fillText(l, L.text.x, y + 12 + i * lh)); }
      // stamp
      ctx.save(); ctx.translate(W - 200 * S, L.monster.y + 70 * S); ctx.rotate(-0.25);
      ctx.strokeStyle = "#b8352a"; ctx.lineWidth = 6; ctx.strokeRect(-110 * S, -32 * S, 220 * S, 64 * S);
      ctx.font = `${22 * S}px ${PIX}`; ctx.fillStyle = "#b8352a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(id.rarity, 0, 0); ctx.restore();
      if (opts.showQR) await drawQR(ctx, data.url, L.qr, "#1d1a17", "#efe9d8");
      break;
    }
    case "occult": {
      ctx.fillStyle = "#050308"; ctx.fillRect(0, 0, W, H);
      const cx = L.monster.x + L.monster.w / 2, cy = L.monster.y + L.monster.h / 2, R = L.monster.w * 0.48;
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); for (let i = 0; i < 7; i++) { const a1 = -Math.PI / 2 + (i / 7) * Math.PI * 2; const a2 = -Math.PI / 2 + (((i + 3) % 7) / 7) * Math.PI * 2; ctx.moveTo(cx + Math.cos(a1) * R * 0.9, cy + Math.sin(a1) * R * 0.9); ctx.lineTo(cx + Math.cos(a2) * R * 0.9, cy + Math.sin(a2) * R * 0.9); } ctx.stroke();
      ctx.fillStyle = pal.accent;
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; ctx.fillRect(cx + Math.cos(a) * R * 0.95 - 5, cy + Math.sin(a) * R * 0.95 - 5, 10, 10); }
      ctx.fillStyle = "rgba(5,3,8,0.55)"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2); ctx.fill();
      drawPixelImage(ctx, data.monster, L.monster);
      ctx.font = `${14 * S}px ${PIX}`; ctx.fillStyle = pal.accent; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(`✦ SUMMONED BY ${name} ✦`, W / 2, small ? 26 : 50);
      textBlock(ctx, [
        { text: id.generatedName.toUpperCase(), font: `${44 * S}px ${PIX}`, color: "#f3ecff", gap: 10 },
        { text: id.title, font: `${34 * S}px ${MONO}`, color: pal.accent, gap: 14 },
        { text: `${id.classification} · ${id.rarity}`, font: `${16 * S}px ${PIX}`, color: rarityColor[id.rarity], gap: 14 },
        { text: opts.showMythology ? `LINEAGE — ${myth}` : "", font: `${26 * S}px ${MONO}`, color: "#9b93b3", gap: 8 },
        { text: opts.showTraits ? traits : "", font: `${26 * S}px ${MONO}`, color: "#cfc7e6", gap: 8 },
        { text: opts.showLore ? `“${id.lore}”` : "", font: `${28 * S}px ${MONO}`, color: "#e6e0f5" },
      ], L.text);
      if (opts.showQR) await drawQR(ctx, data.url, L.qr, pal.accent, "#050308");
      break;
    }
    case "minimal": {
      ctx.fillStyle = pal.background; ctx.fillRect(0, 0, W, H);
      drawPixelImage(ctx, data.background, { x: 0, y: 0, w: W, h: H }, true);
      const big = opts.format === "landscape" ? { x: 0, y: 0, w: H * 1.1, h: H } : { x: 0, y: H * 0.02, w: W, h: opts.format === "portrait" ? W : H * 0.72 };
      drawPixelImage(ctx, data.monster, big);
      const tr = opts.format === "landscape" ? { x: H * 1.05, y: H * 0.3, w: W - H * 1.05 - 60, h: H } : { x: 60, y: big.y + big.h + (opts.format === "portrait" ? 60 : 10), w: W - 120, h: H };
      textBlock(ctx, [
        { text: id.generatedName.toUpperCase(), font: `${52 * S}px ${PIX}`, color: "#ffffff", gap: 12 },
        { text: id.title, font: `${40 * S}px ${MONO}`, color: pal.accent, gap: 16 },
        { text: name, font: `${16 * S}px ${PIX}`, color: "rgba(255,255,255,0.55)", gap: 12 },
        { text: opts.showTraits ? traits : "", font: `${26 * S}px ${MONO}`, color: "rgba(255,255,255,0.7)", gap: 6 },
        { text: opts.showMythology ? myth : "", font: `${24 * S}px ${MONO}`, color: "rgba(255,255,255,0.5)", gap: 6 },
        { text: opts.showLore ? id.lore : "", font: `${26 * S}px ${MONO}`, color: "rgba(255,255,255,0.8)" },
      ], tr, opts.format === "landscape" ? "left" : "center");
      if (opts.showQR) await drawQR(ctx, data.url, L.qr, "#ffffff", pal.background);
      break;
    }
    case "arcade": {
      ctx.fillStyle = pal.secondary; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let y = 0; y < H; y += 48) for (let x = (y / 48) % 2 ? 48 : 0; x < W; x += 96) ctx.fillRect(x, y, 48, 48);
      ctx.fillStyle = "#0d0b14"; ctx.fillRect(28, 28, W - 56, H - 56);
      pixelBorder(ctx, W, H, "#ffe14d", 10, 40);
      ctx.font = `${18 * S}px ${PIX}`; ctx.fillStyle = "#ffe14d"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(`PLAYER  ${name.slice(0, 16)}`, 70, 68);
      ctx.textAlign = "right"; ctx.fillStyle = "#ff6fd8"; ctx.fillText("NEW MONSTER!", W - 70, 68);
      ctx.fillStyle = pal.background; ctx.fillRect(L.monster.x, L.monster.y, L.monster.w, L.monster.h);
      drawPixelImage(ctx, data.background, L.monster, true);
      drawPixelImage(ctx, data.monster, L.monster);
      const stars = { COMMON: 1, UNCOMMON: 2, RARE: 3, MYTHIC: 4, FORBIDDEN: 5 }[id.rarity];
      textBlock(ctx, [
        { text: id.generatedName.toUpperCase(), font: `${44 * S}px ${PIX}`, color: "#ffffff", gap: 10 },
        { text: id.title.toUpperCase(), font: `${16 * S}px ${PIX}`, color: "#7cf5ff", gap: 16 },
        { text: `${"★".repeat(stars)}${"☆".repeat(5 - stars)}  ${id.rarity}`, font: `${22 * S}px ${PIX}`, color: rarityColor[id.rarity], gap: 14 },
        { text: opts.showTraits ? traits : "", font: `${28 * S}px ${MONO}`, color: "#ffe14d", gap: 6 },
        { text: opts.showMythology ? `STAGE: ${myth}` : "", font: `${26 * S}px ${MONO}`, color: "#c9c4e6", gap: 8 },
        { text: opts.showLore ? id.lore : "", font: `${28 * S}px ${MONO}`, color: "#ffffff", gap: 8 },
        { text: "PRESS START TO FIND YOURS", font: `${12 * S}px ${PIX}`, color: "#ff6fd8" },
      ], L.text);
      if (opts.showQR) await drawQR(ctx, data.url, L.qr, "#ffe14d", "#0d0b14");
      break;
    }
    case "archive": {
      ctx.fillStyle = "#1f1a16"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#d9c9a3"; ctx.fillRect(24, 24, W - 48, H - 48);
      ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 3; ctx.strokeRect(44, 44, W - 88, H - 88); ctx.lineWidth = 1; ctx.strokeRect(56, 56, W - 112, H - 112);
      ctx.font = `${13 * S}px ${PIX}`; ctx.fillStyle = "#5a4630"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(`BESTIARY FOLIO ${g.seed.slice(0, 4)} · ${MYTHOLOGIES[g.mythology.primary].label.toUpperCase()}`, W / 2, 76);
      ctx.fillStyle = "#cbb88c"; ctx.fillRect(L.monster.x, L.monster.y, L.monster.w, L.monster.h);
      ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 3; ctx.strokeRect(L.monster.x, L.monster.y, L.monster.w, L.monster.h);
      drawPixelImage(ctx, data.monster, L.monster);
      textBlock(ctx, [
        { text: id.generatedName.toUpperCase(), font: `${40 * S}px ${PIX}`, color: "#2b2118", gap: 8 },
        { text: `“${id.title}”`, font: `${36 * S}px ${MONO}`, color: "#5a4630", gap: 12 },
        { text: `${id.classification}${id.archetype ? " · CLOSEST ARCHETYPE: " + id.archetype : ""}`, font: `${14 * S}px ${PIX}`, color: "#2b2118", gap: 10 },
        { text: `RARITY: ${id.rarity} · RECORDED UNDER THE NAME “${name}”`, font: `${26 * S}px ${MONO}`, color: "#5a4630", gap: 12 },
        { text: opts.showMythology ? `Lineage: ${MYTHOLOGIES[g.mythology.primary].label}${g.mythology.secondary ? ", with traces of " + MYTHOLOGIES[g.mythology.secondary].label : ""}.` : "", font: `${28 * S}px ${MONO}`, color: "#2b2118", gap: 8 },
        { text: opts.showTraits ? `Known habits: ${id.traits.map((t) => t.toLowerCase()).join(", ")}.` : "", font: `${28 * S}px ${MONO}`, color: "#2b2118", gap: 8 },
        { text: opts.showLore ? id.lore : "", font: `${30 * S}px ${MONO}`, color: "#2b2118" },
      ], L.text);
      if (opts.showQR) await drawQR(ctx, data.url, L.qr, "#2b2118", "#d9c9a3");
      break;
    }
  }
  return canvas;
}

/** Simple "just the monster" image (monster on its pixel background) for quick copy/download. */
export function renderMonsterImage(data: CardData, size = 1024): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = data.genotype.palette.background; ctx.fillRect(0, 0, size, size);
  drawPixelImage(ctx, data.background, { x: 0, y: 0, w: size, h: size }, true);
  drawPixelImage(ctx, data.monster, { x: 0, y: 0, w: size, h: size });
  ctx.font = `18px ${PIX}`; ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
  ctx.fillText(`${data.genotype.identity.generatedName.toUpperCase()} · ${data.displayName.toUpperCase()}`, size / 2, size - 28);
  return c;
}
