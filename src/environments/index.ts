import type { MonsterGenotype } from '../generator/types';
import { subRng } from '../generator/rng';
import { paintBackgroundV2 } from '../monster/backgroundV2';
import { habitatFor, ORIGIN_PALETTES } from './habitats';
import { habitatBrush } from './primitives';
import { drawArchitecture } from './architecture';
import { drawAtmosphereV3, environmentTime } from './atmosphere';
import { drawDistantLayers,drawGroundDepth } from './layers';

export { HABITATS, ORIGIN_HABITATS, ORIGIN_PALETTES, habitatFor } from './habitats';
export type { Habitat, HabitatId } from './habitats';
export { paintAtmosphereV3 } from './atmosphere';

/**
 * V3 keeps the fifteen V2 environments for existing seeds and expands them with
 * fourteen primary-origin settings. Geometry/particles never depend on the old
 * four creature design families. Budget: 38 particles + 3 spirits, <= 4 fog banks.
 */
export function paintBackgroundV3(ctx: CanvasRenderingContext2D, w: number, h: number, g: MonsterGenotype, time = 0) {
  ctx.save();
  try {
    const habitat = habitatFor(g), t = environmentTime(g, time);
    if (!habitat) {
      // Existing profiles retain their authored habitats without mutating their genotype.
      if (g.visual) paintBackgroundV2(ctx, w, h, g, t);
      else { ctx.globalAlpha=1;ctx.fillStyle=g.palette.background;ctx.fillRect(0,0,w,h); }
      return;
    }
    ctx.scale(w / 128, h / 160);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    const p=ORIGIN_PALETTES[g.mythology.primary],b=habitatBrush(ctx),r=subRng(g.seed,'v3-habitat-sky');
    drawDistantLayers(ctx,g,t);
    for(let i=0;i<28;i++) {const x=r.range(0,128),y=r.range(0,100);ctx.globalAlpha=.08+.16*Math.sin(t*.18+i)**2;b.rect(x,y,1,1,p[4]);}
    ctx.globalAlpha=1;
    ctx.save();ctx.translate(Math.sin(t*.12)*.35,0);drawArchitecture(b,habitat,p,t);ctx.restore();
    drawGroundDepth(ctx,g,t);
    // Low continuous mist sits between architecture and specimen, never flashing.
    for(let i=0;i<4;i++) {
      const shift=Math.sin(t*.14+i*1.8)*9,y=112+i*10;
      ctx.globalAlpha=.055+(i%2)*.018;
      b.poly([[-18+shift,y],[27+shift,y-3],[72+shift,y+1],[144+shift,y-4],[144+shift,y+3],[50+shift,y+6],[-18+shift,y+3]],p[3]);
    }
    ctx.globalAlpha=.04;b.poly([[41,45],[87,45],[103,111],[87,135],[38,135],[26,110]],p[0]);
    drawAtmosphereV3(ctx,g,t,false);
  } finally { ctx.restore(); }
}
