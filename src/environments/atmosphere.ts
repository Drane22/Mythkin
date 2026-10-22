import type { MonsterGenotype } from '../generator/types';
import { subRng } from '../generator/rng';
import { HABITATS, habitatFor, ORIGIN_PALETTES } from './habitats';
import { habitatBrush } from './primitives';
import { drawNearScenery } from './layers';

/** Ambient time is supplied by the caller; reduced motion uses exactly time=0. */
export function environmentTime(g: MonsterGenotype, time: number) {
  return g.visual?.environment.motion === 'none' || !Number.isFinite(time) ? 0 : time;
}

/** Draws without clearing so the background can include a distant depth plane. */
export function drawAtmosphereV3(ctx: CanvasRenderingContext2D, g: MonsterGenotype, time: number, foreground: boolean) {
  const habitat = habitatFor(g);
  const particles = habitat ? HABITATS[habitat].particles : 'moth';
  const p = ORIGIN_PALETTES[g.mythology.primary];
  const r = subRng(g.seed, foreground ? 'v3-near-atmosphere' : 'v3-far-atmosphere');
  const t = environmentTime(g, time);
  const { rect, line, poly } = habitatBrush(ctx);
  const count = foreground ? 14 : 24;
  for (let i = 0; i < count; i++) {
    const phase = r.range(0, Math.PI * 2), speed = r.range(.4, 1.1);
    const baseX = foreground ? (i % 2 ? r.range(103, 124) : r.range(4, 25)) : r.range(0, 128);
    const baseY = r.range(0, 176), drift = Math.sin(t * .3 + phase) * 3;
    const falling = ['snow', 'petal', 'leaf', 'water'].includes(particles);
    const x = baseX + drift;
    const y = ((baseY + t * speed * (falling ? 2.8 : -1.7)) % 176 + 176) % 176 - 8;
    // Near particles frame the silhouette; the far plane is dim enough to stay behind it.
    ctx.globalAlpha = (foreground ? .32 : .13) + Math.sin(t * .65 + phase) ** 2 * (foreground ? .3 : .19);
    switch (particles) {
      case 'snow':
        rect(x, y, 1, 1, p[4]);
        if (i % 5 === 0) { rect(x - 1, y, 3, 1, p[3]); rect(x, y - 1, 1, 3, p[3]); }
        break;
      case 'petal':
        poly([[x-2,y],[x+Math.sin(t+phase)*2,y-2],[x+2,y],[x,y+1]],p[4]);
        break;
      case 'leaf':
        poly([[x-2,y],[x+1,y-2],[x+3,y],[x,y+1]],p[3]);
        line(x-1,y+1,x+2,y-1,p[4]);
        break;
      case 'water':
        rect(x,y,1,i%4===0?3:1,p[4]);
        if(i%4===0) {ctx.globalAlpha *= .4; rect(x-2,y+3,5,1,p[3]);}
        break;
      case 'cloud':
        if (i % 3 === 0) { rect(x - 4,y,8,1,p[3]); rect(x - 2,y-1,4,1,p[4]); }
        else rect(x,y,1,1,p[4]);
        break;
      case 'sand':
        rect(x,y,1,1,p[4]);
        if(i%5===0) {ctx.globalAlpha *= .35; rect(x-4,y+1,3,1,p[3]);}
        break;
      case 'ash':
        rect(x,y,1,i%4===0?2:1,p[4]);
        if(i%4===0) {ctx.globalAlpha *= .3; rect(x,y+2,1,3,p[3]);}
        break;
      case 'firefly':
        ctx.globalAlpha *= .5;rect(x-1,y-1,3,3,p[2]);ctx.globalAlpha *= 2;rect(x,y,1,1,p[4]);
        break;
      case 'moth': {
        const flap=Math.sin(t*3+phase),spread=flap>0?2:1;
        rect(x-spread,y,spread,1,p[3]);rect(x+1,y,spread,1,p[3]);rect(x,y-1,1,2,p[4]);
        break;
      }
    }
  }
  // Sparse side spirits trace loops; no center-crossing particles hide facial reactions.
  for(let i=0;i<(foreground?2:1);i++) {
    const phase=r.range(0,6),x=(i%2?111:17)+Math.sin(t*.31+phase)*4;
    const y=76+i*31+Math.sin(t*.43+phase)*8;
    ctx.globalAlpha=foreground?.16:.08;rect(x-3,y-3,7,7,p[4]);
    ctx.globalAlpha=foreground?.54:.24;rect(x-1,y-1,3,3,p[4]);
    for(let j=1;j<4;j++){ctx.globalAlpha=(foreground?.2:.09)*(1-j/4);rect(x+Math.sin(t*.8+j+phase)*2,y+j*3,2,2,p[3]);}
  }
}

/** Transparent canvas layer. Canvas alpha, transforms and fill state are preserved. */
export function paintAtmosphereV3(ctx: CanvasRenderingContext2D, w: number, h: number, g: MonsterGenotype, time = 0, foreground = true) {
  ctx.save();
  try {
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(w / 128, h / 160);
    if(foreground)drawNearScenery(ctx,g,environmentTime(g,time));
    drawAtmosphereV3(ctx, g, time, foreground);
  } finally { ctx.restore(); }
}
