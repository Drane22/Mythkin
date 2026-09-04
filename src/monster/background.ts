import { subRng } from "../generator/rng";
import type { MonsterGenotype } from "../generator/types";

/** Paints a deterministic low-res pixel background. Draw at small size, upscale with nearest-neighbour. */
export function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, g: MonsterGenotype) {
  const r = subRng(`v${g.version}:${g.seed}`, "bg-paint");
  const pal = g.palette;
  const px = Math.max(1, Math.round(w / 64)); // logical pixel size
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.42;
  const rect = (x: number, y: number, rw: number, rh: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / px) * px, Math.round(y / px) * px, Math.round(rw / px) * px, Math.round(rh / px) * px); };
  const circle = (x: number, y: number, rad: number, c: string, hollow = 0) => {
    for (let yy = -rad; yy <= rad; yy += px) for (let xx = -rad; xx <= rad; xx += px) {
      const d = Math.sqrt(xx * xx + yy * yy);
      if (d <= rad && d >= hollow) rect(x + xx, y + yy, px, px, c);
    }
  };
  const dim = (c: string, amt: number) => {
    const n = parseInt(c.slice(1), 16); const rr = (n >> 16) & 255, gg = (n >> 8) & 255, bb = n & 255;
    const f = (v: number) => Math.round(v * amt).toString(16).padStart(2, "0");
    return `#${f(rr)}${f(gg)}${f(bb)}`;
  };
  const accent = pal.backgroundAccent;
  switch (g.background) {
    case "void": break;
    case "solid": break;
    case "gradient": {
      const bands = 6;
      for (let i = 0; i < bands; i++) { rect(0, (h / bands) * i, w, h / bands + px, dim(accent, 0.25 + (i / bands) * 0.5)); }
      // dither line between bands
      for (let i = 1; i < bands; i++) for (let x = 0; x < w; x += px * 2) rect(x + (i % 2) * px, (h / bands) * i - px, px, px, dim(accent, 0.25 + (i / bands) * 0.5));
      break;
    }
    case "moon": {
      const rad = w * 0.22;
      circle(cx + w * 0.12, cy - h * 0.1, rad, dim(accent, 1.4));
      circle(cx + w * 0.12 + rad * 0.3, cy - h * 0.1 - rad * 0.2, rad * 0.22, dim(accent, 0.9));
      circle(cx + w * 0.12 - rad * 0.35, cy - h * 0.1 + rad * 0.3, rad * 0.14, dim(accent, 0.9));
      break;
    }
    case "portal": {
      for (let i = 5; i >= 1; i--) circle(cx, cy, w * 0.07 * i, dim(accent, 0.3 + i * 0.13), w * 0.07 * (i - 1) + px);
      break;
    }
    case "sigil": {
      circle(cx, cy, w * 0.36, accent, w * 0.36 - px);
      circle(cx, cy, w * 0.3, dim(accent, 0.7), w * 0.3 - px);
      ctx.strokeStyle = accent; ctx.lineWidth = px;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) { const ang = -Math.PI / 2 + (i / 3) * Math.PI * 2; const x = cx + Math.cos(ang) * w * 0.3, y = cy + Math.sin(ang) * w * 0.3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
      break;
    }
    case "stars": {
      for (let i = 0; i < 40; i++) { const s = r.chance(0.2) ? px * 2 : px; rect(r.range(0, w), r.range(0, h * 0.9), s, s, r.chance(0.7) ? dim(accent, 1.3) : "#ffffff"); }
      break;
    }
    case "glyph": {
      const n = 5; const size = w * 0.12;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if ((i + j) % 2 === 0 && r.chance(0.6)) rect(cx - (n / 2) * size + i * size + px, cy - (n / 2) * size + j * size + px, size - px * 2, size - px * 2, dim(accent, 0.45)); }
      break;
    }
    case "sun": {
      circle(cx, cy, w * 0.2, dim(accent, 1.2));
      for (let i = 0; i < 12; i++) { const ang = (i / 12) * Math.PI * 2; for (let k = 0; k < 4; k++) rect(cx + Math.cos(ang) * (w * 0.25 + k * px * 2), cy + Math.sin(ang) * (w * 0.25 + k * px * 2), px, px, dim(accent, 0.9)); }
      break;
    }
    case "fog": {
      for (let y = h * 0.55; y < h; y += px * 2) { const off = Math.sin(y * 0.05) * px * 4; const alpha = (y - h * 0.55) / (h * 0.45); ctx.globalAlpha = alpha * 0.6; rect(off, y, w, px * 2, accent); }
      ctx.globalAlpha = 1;
      break;
    }
  }
  // subtle ground line
  ctx.globalAlpha = 0.25; rect(0, h * 0.86, w, px, accent); ctx.globalAlpha = 1;
}
