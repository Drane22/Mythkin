import type { MonsterGenotype } from '../generator/types';
import { habitatFor,ORIGIN_PALETTES } from './habitats';
import { habitatBrush } from './primitives';

const mix=(a:string,b:string,t:number)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const forests=new Set(['cedar-shrine','balete','birch','banyan-ghat','mangrove']);

/** Atmospheric perspective: the most distant forms have the least contrast. */
export function drawDistantLayers(ctx:CanvasRenderingContext2D,g:MonsterGenotype,t:number){
 const id=habitatFor(g),p=ORIGIN_PALETTES[g.mythology.primary],b=habitatBrush(ctx);
 ctx.save();
 for(let band=0;band<16;band++)b.rect(0,band*10,128,11,mix(p[0],p[1],Math.sin(band/16*Math.PI/2)*.72));
 ctx.translate(Math.sin(t*.11)*.65,0);
 for(let layer=0;layer<3;layer++){
  const horizon=79+layer*17,color=mix(p[0],p[2],.14+layer*.095);
  const skyline:[number,number][]=[[-6,160],[-6,horizon]];
  for(let i=0;i<10;i++)skyline.push([i*15-4,horizon-9-Math.sin(i*1.71+layer*2.1)*9-layer*2]);
  skyline.push([135,160]);b.poly(skyline,color);
  if(id&&forests.has(id))for(let i=0;i<10;i++){
   const x=i*15+Math.sin(i*7.3+layer)*4,y=horizon+14,height=28+i%4*8;
   b.rect(x,y-height,1+layer, height,color);
   if(id==='cedar-shrine')b.poly([[x-9,y-height+11],[x-3,y-height-3],[x+1,y-height-10],[x+4,y-height],[x+10,y-height+12]],color);
   else for(let crown=0;crown<3;crown++){
    const cx=x+(crown-1)*6,cy=y-height+crown%2*7,spread=id==='birch'?5:9;
    b.poly([[cx-spread,cy+4],[cx-spread+2,cy-3],[cx-2,cy-6],[cx+4,cy-4],[cx+spread,cy],[cx+spread-2,cy+6],[cx,cy+8]],color);
   }
   b.line(x,y-height*.7,x-7,y-height*.85,color);b.line(x,y-height*.6,x+8,y-height*.83,color);
  }
 }
 ctx.globalAlpha=.12;
 for(let i=0;i<3;i++){const x=Math.sin(t*.16+i*1.9)*12,y=76+i*18;b.poly([[-20+x,y],[18+x,y-3],[48+x,y+1],[92+x,y-3],[150+x,y],[150+x,y+5],[-20+x,y+6]],p[3]);}
 ctx.restore();
}

/** Ground recedes toward the architecture, with lit ridges over darker soil. */
export function drawGroundDepth(ctx:CanvasRenderingContext2D,g:MonsterGenotype,t:number){
 const p=ORIGIN_PALETTES[g.mythology.primary],b=habitatBrush(ctx),id=habitatFor(g),wet=['nile','mangrove','cenote','banyan-ghat'].includes(id??'');
 ctx.save();ctx.globalAlpha=.55;
 b.poly([[0,144],[25,137],[40,141],[89,139],[108,134],[128,141],[128,161],[0,161]],p[0]);
 ctx.globalAlpha=.28;
 for(let i=0;i<15;i++){
  const x=(i*31)%129,y=142+(i*7)%17;
  if(wet)b.rect(x+Math.sin(t*.3+i)*2,y,4+i%5*2,1,p[3]);
  else {b.poly([[x,y],[x+4,y-2],[x+8,y],[x+6,y+3],[x+1,y+2]],p[2]);b.line(x+1,y-1,x+5,y-1,p[3]);}
 }
 ctx.restore();
}

/** Near silhouettes live on the separate transparent plane in front of the rig. */
export function drawNearScenery(ctx:CanvasRenderingContext2D,g:MonsterGenotype,t:number){
 const p=ORIGIN_PALETTES[g.mythology.primary],b=habitatBrush(ctx),id=habitatFor(g),forest=forests.has(id??'');
 ctx.save();ctx.translate(Math.sin(t*.22)*1.2,0);
 for(const side of [-1,1]){
  const x=side<0?-3:130;
  if(forest){
   b.poly([[x-5,162],[x+5,162],[x+side*1,118],[x+side*7,79],[x+side*13,27],[x+side*5,-6],[x-side*5,-6],[x-side*1,73]],p[0]);
   for(let i=0;i<6;i++){
    const y=13+i*8,tip=x-side*(8+i%3*5);
    b.line(x,y,tip,y+4,p[0],2);
    b.poly([[tip+side*4,y+1],[tip-side*5,y-4],[tip-side*12,y],[tip-side*4,y+4]],mix(p[0],p[2],.30));
   }
  }
  for(let i=0;i<9;i++){
   const xx=side<0?i*2:128-i*2,y=159-i%3*2,lean=Math.sin(t*.5+i)*1.6;
   b.poly([[xx-1,y+4],[xx+1,y+4],[xx+lean-side*(2+i%3),y-8-i%4*2]],i%3?p[0]:mix(p[0],p[3],.37));
  }
 }
 ctx.restore();
}
