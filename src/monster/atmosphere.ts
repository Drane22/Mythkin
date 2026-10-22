import type { MonsterGenotype } from '../generator/types';
import { subRng } from '../generator/rng';
import { designFamily } from './designLanguage';
import { paintAtmosphereV3 } from '../environments/index';

/** Transparent near-plane particles; deterministic positions, no per-frame randomness. */
export function paintAtmosphere(ctx:CanvasRenderingContext2D,w:number,h:number,g:MonsterGenotype,time:number,foreground=true) {
  if(g.version===3){paintAtmosphereV3(ctx,w,h,g,time,foreground);return;}
  ctx.clearRect(0,0,w,h);
  drawAtmosphere(ctx,w,h,g,time,foreground);
}
export function drawAtmosphere(ctx:CanvasRenderingContext2D,w:number,h:number,g:MonsterGenotype,time:number,foreground=false) {
  const r=subRng(g.seed,foreground?'near-atmosphere':'far-atmosphere'),family=designFamily(g);
  const t=g.visual?.environment.motion==='none'?0:time;
  const rect=(x:number,y:number,ww:number,hh:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),ww,hh);};
  const count=foreground?12:30;
  for(let i=0;i<count;i++){
    const phase=r.float()*Math.PI*2,speed=r.range(.45,1),side=i%2?1:-1;
    const baseX=foreground?(side<0?r.range(.03,.21):r.range(.79,.97))*w:r.float()*w;
    const x=baseX+Math.sin(t*.38+phase)*w*(foreground?.035:.025);
    const y=((r.float()*h-t*speed*(family==='trickster'?4:2.1))%(h+12)+(h+12))%(h+12)-6;
    ctx.globalAlpha=(foreground?.32:.2)+(foreground?.3:.4)*Math.sin(t*.9+phase)**2;
    if(family==='warden'){
      if(i%3===0){rect(x,y,3,1,'#9ba766');rect(x+1,y-1,2,3,'#727c49');}
      else {rect(x-1,y-1,3,3,'#426c4e');rect(x,y,1,1,'#c8dd89');}
    }else if(family==='trickster'){
      rect(x,y,1,i%4===0?3:1,i%3?'#d79257':'#a95850');
      if(i%4===0){ctx.globalAlpha*=.3;rect(x,y+3,1,4,'#a95850');}
    }else{
      const color=family==='solar'?'#c6a354':'#85bcb8';rect(x,y,1,1,color);
      if(i%5===0){ctx.globalAlpha*=.65;rect(x-2,y,5,1,color);rect(x,y-2,1,5,color);}
    }
  }
  // Living spirit lights follow curved paths and carry short wispy tails.
  for(let i=0;i<(foreground?2:3);i++){
    const side=i%2?1:-1,phase=i*2.9+r.float(),x=w*(side<0?.15:.85)+Math.sin(t*.43+phase)*w*.045;
    const y=h*(.47+i*.14)+Math.sin(t*.61+phase)*h*.055;
    const color=family==='warden'||family==='oracle'?'#8ccdc1':'#d6af67';
    ctx.globalAlpha=foreground?.32:.23;
    rect(x-3,y-2,7,6,color);ctx.globalAlpha=foreground?.7:.5;
    rect(x-1,y-2,3,4,color);rect(x,y-4,1,2,color);
    for(let j=1;j<4;j++){ctx.globalAlpha=(foreground?.2:.12)*(1-j/4);rect(x+Math.sin(t*1.8+j)*2,y+j*3,2,2,color);}
  }
  ctx.globalAlpha=1;
}
