import type { MonsterGenotype } from '../generator/types';
import { subRng } from '../generator/rng';
import { designFamily } from './designLanguage';
import { drawAtmosphere } from './atmosphere';

/** Layered miniature habitats, painted on the same pixel grid as the creatures. */
export function paintBackgroundV2(ctx:CanvasRenderingContext2D,w:number,h:number,g:MonsterGenotype,time=0){
  const e=g.visual!.environment,family=designFamily(g),r=subRng(g.seed,'living-habitat');
  const t=e.motion==='none'?0:time;
  const palette=family==='warden'?['#111b1c','#243934','#48614a','#9aac73']:family==='solar'?['#191820','#3b3536','#756345','#c8a766']:family==='oracle'?['#131722','#273b48','#456771','#8cc8bf']:['#1e151c','#49302f','#795044','#c88960'];
  const [night,shadow,mid,accent]=palette;
  ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
  ctx.fillStyle=night;ctx.fillRect(0,0,w,h);
  const rect=(x:number,y:number,ww:number,hh:number,color=mid)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(ww),Math.ceil(hh));};
  const line=(x:number,y:number,xx:number,yy:number,color=mid,thick=1)=>{
    const length=Math.max(1,Math.ceil(Math.max(Math.abs(xx-x),Math.abs(yy-y))));
    for(let i=0;i<=length;i++)rect(x+(xx-x)*i/length,y+(yy-y)*i/length,thick,thick,color);
  };
  const disc=(x:number,y:number,radius:number,color=mid,inner=0)=>{
    for(let yy=-Math.ceil(radius);yy<=radius;yy++)for(let xx=-Math.ceil(radius);xx<=radius;xx++)if(xx*xx+yy*yy<=radius*radius&&xx*xx+yy*yy>=inner*inner)rect(x+xx,y+yy,1,1,color);
  };
  const poly=(points:number[][],color=shadow)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill();};
  const glow=(x:number,y:number,rx:number,ry:number,strength:number,color=accent)=>{
    ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);const gradient=ctx.createRadialGradient(0,0,0,0,0,rx);gradient.addColorStop(0,color);gradient.addColorStop(1,night);ctx.globalAlpha=strength;ctx.fillStyle=gradient;ctx.fillRect(-rx,-rx,rx*2,rx*2);ctx.restore();
  };
  const fog=(level:number,phase:number,strength=.12)=>{
    for(let i=0;i<4;i++){ctx.globalAlpha=strength*(1-i/5);const shift=Math.sin(t*.16+phase+i*.7)*w*.13;poly([[-w*.2+shift,h*level+i*2],[w*.22+shift,h*level-3+i*2],[w*.6+shift,h*level+2+i*2],[w*1.2+shift,h*level-2+i*2],[w*1.2+shift,h*level+4+i*2],[-w*.2+shift,h*level+6+i*2]],mid);}
    ctx.globalAlpha=1;
  };
  // Ambient vignette, distant dust and horizon give every habitat spatial depth.
  glow(w*.5,h*.46,w*.65,h*.58,.32);
  for(let i=0;i<34;i++){ctx.globalAlpha=.08+.16*Math.sin(t*.3+i)**2;rect(r.float()*w,r.float()*h*.8,1,1,accent);}ctx.globalAlpha=1;
  const cosmic=['stars','sigil','void','pattern'].includes(e.type);
  const woodland=['forest','swamp','mist'].includes(e.type);
  const shrine=['temple','ruins'].includes(e.type);
  if(woodland){
    // Three parallax depths of crooked trunks and softly massed canopy.
    for(let layer=0;layer<3;layer++){
      const color=layer===0?shadow:layer===1?mid:night;ctx.globalAlpha=layer===1?.48:1;
      for(let i=0;i<5;i++){
        const side=i%2?1:-1,x=layer===2?(side<0?.025:.96)*w:(i/4)*w+r.range(-4,4),width=layer===2?5:layer===1?3:2;
        const sway=Math.sin(t*.15+i+layer)*.8;
        poly([[x-width,h*.93],[x+width,h*.93],[x+width+sway,h*.33],[x+side*8+sway,0],[x-width+side*7+sway,0],[x-width+sway,h*.3]],color);
        for(let j=0;j<3;j++){const y=h*(.17+j*.18);line(x,y,x+side*(9+j*3)+sway,y-12,color,width*.5);line(x+side*7,y-8,x+side*4,y-19,color);}
      }
    }
    ctx.globalAlpha=.6;for(let i=0;i<14;i++)disc(i*w/13,r.range(-3,13),r.range(8,18),shadow);ctx.globalAlpha=1;
    glow(w*.62,h*.18,w*.2,h*.15,.35,'#9faf79');disc(w*.64,h*.16,w*.064,'#8d9a72');disc(w*.67,h*.145,w*.057,shadow);
    if(e.type==='swamp'){
      rect(0,h*.82,w,h*.18,shadow);
      for(let j=0;j<9;j++){ctx.globalAlpha=.14;rect((r.float()*w+t*(j%2?1:-1))%w,h*(.83+j*.018),r.range(7,22),1,accent);}ctx.globalAlpha=1;
    }
    fog(.67,0,.13);fog(.85,1,.17);
  }else if(shrine){
    glow(w*.5,h*.29,w*.35,h*.33,.33);
    const centerX=w*.5,centerY=h*.23;
    ctx.globalAlpha=.24;disc(centerX,centerY,w*.23,accent,w*.215);ctx.globalAlpha=1;
    for(let depth=0;depth<2;depth++)for(const side of [-1,1]){
      const x=w*(side<0?.06+depth*.09:.89-depth*.09),top=h*(.13+depth*.11),base=h*(.86-depth*.025),width=depth?5:7;
      ctx.globalAlpha=depth?.3:.8;rect(x,top,width,base-top,shadow);rect(x-2,top-2,width+4,3,mid);rect(x-3,base,width+6,3,mid);line(x+1,top+5,x+1,base,mid);
      for(let j=0;j<6;j++){line(x,top+j*13,x+width,top+j*13,night);if(j%2)rect(x+3,top+j*13+4,2,3,accent);}
    }
    ctx.globalAlpha=1;
    for(let j=0;j<4;j++){rect(w*(.08+j*.05),h*(.95-j*.035),w*(.84-j*.1),3,shadow);rect(w*(.08+j*.05),h*(.95-j*.035),w*(.84-j*.1),1,mid);}
    if(e.type==='ruins')for(let i=0;i<7;i++){const x=r.float()*w,y=h*r.range(.76,.93);poly([[x,y],[x+4,y-7],[x+10,y-5],[x+12,y+4]],mid);}
    fog(.84,.3,.13);
  }else if(cosmic){
    // Broken orbital arcs, slowly orbiting stones, constellations and occasional meteors.
    const cx=w*.5,cy=h*.37;
    glow(cx,cy,w*.44,h*.37,.34);
    for(let ring=0;ring<3;ring++){
      const radius=w*(.29+ring*.075);ctx.globalAlpha=.15+ring*.03;
      for(let i=0;i<96;i++){const angle=i/96*Math.PI*2+t*(ring%2?-.035:.025);if((i+e.symbol*3)%23<5)continue;rect(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius*.7,1,1,accent);}
    }
    for(let i=0;i<8;i++){
      const angle=i/8*Math.PI*2+t*.065,radius=w*.4,x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius*.72;
      ctx.globalAlpha=.48;poly([[x-2,y-3],[x+3,y-4],[x+4,y+2],[x,y+4],[x-3,y+1]],i%2?mid:shadow);line(x-2,y-3,x+3,y-4,accent);
    }
    const meteor=(t+e.symbol*1.7)%11;
    if(meteor<1.5&&t>0){ctx.globalAlpha=Math.sin(meteor/1.5*Math.PI)*.45;const x=w*(.06+meteor*.6),y=h*(.05+meteor*.18);line(x-7,y-4,x,y,accent);}
    ctx.globalAlpha=1;
    if(e.type==='pattern')for(let i=0;i<6;i++){const angle=i/6*Math.PI*2,x=cx+Math.cos(angle)*w*.38,y=cy+Math.sin(angle)*w*.29;ctx.globalAlpha=.35;line(x-2,y-3,x+2,y+3,accent);line(x+2,y-3,x-2,y+3,accent);ctx.globalAlpha=1;}
    fog(.9,2,.08);
  }else if(e.type==='ocean'){
    for(let i=0;i<5;i++){ctx.globalAlpha=.04;poly([[w*(i*.25-.15),0],[w*(i*.25-.05),0],[w*(i*.25+.36)+Math.sin(t*.13+i)*4,h],[w*(i*.25+.12),h]],accent);}ctx.globalAlpha=1;
    for(let side of [-1,1])for(let i=0;i<6;i++){const x=w*(side<0?.04+i*.025:.96-i*.025);for(let j=0;j<9;j++){line(x+Math.sin(j*.8+t*.4+i)*3,h*(1-j*.024),x+Math.sin((j+1)*.8+t*.4+i)*3,h*(1-(j+1)*.024),mid,2);}}
    for(let i=0;i<9;i++){const x=r.float()*w,y=(r.float()*h-t*2.4+h*100)%h;ctx.globalAlpha=.27;disc(x,y,1.8,accent,1.1);}ctx.globalAlpha=1;fog(.83,0,.09);
  }else if(e.type==='cave'){
    for(let layer=0;layer<3;layer++){ctx.globalAlpha=layer===0?.3:.75;for(let i=0;i<12;i++){const x=i*w/11;poly([[x-5,-2],[x+8,-2],[x+4,h*r.range(.08,.23)+layer*2]],layer===2?night:shadow);}}
    ctx.globalAlpha=1;
    for(const side of [-1,1])for(let i=0;i<4;i++){const x=w*(side<0?.04+i*.028:.96-i*.028);poly([[x-3,h*.93],[x-2,h*(.78-i*.02)],[x+1,h*(.72-i*.02)],[x+4,h*.91]],i%2?mid:shadow);}
    fog(.83,1,.18);
  }else{
    // Lunar, solar, ember and gradient habitats share a horizon, not an empty fill.
    const lunar=e.type==='moon',sun=e.type==='sun';
    const cx=w*.7,cy=h*.19,rr=w*(sun?.17:.12);
    if(lunar||sun){glow(cx,cy,rr*2.1,rr*2.1,.38);ctx.globalAlpha=.65;disc(cx,cy,rr,accent);if(lunar)disc(cx+rr*.42,cy-rr*.21,rr*.89,night);else disc(cx,cy,rr*.82,shadow);ctx.globalAlpha=1;}
    for(let layer=0;layer<3;layer++){
      const points:number[][]=[[0,h]];for(let i=0;i<=8;i++)points.push([i/8*w,h*(.68+layer*.08)+r.range(-7,7)]);points.push([w,h]);ctx.globalAlpha=layer===0?.4:.8;poly(points,layer===2?night:shadow);
    }ctx.globalAlpha=1;
    if(e.type==='ember'){glow(w*.5,h*.98,w*.62,h*.27,.3,'#bb6841');for(let i=0;i<8;i++){const x=r.float()*w,y=h*r.range(.85,.98);line(x,y,x+4,y-2,'#8b4936');}}
    fog(.81,2,.12);
  }
  // Foreground silhouettes frame the feet without obscuring the face.
  for(let i=0;i<11;i++){
    const x=r.float()*w,y=h*r.range(.91,.98);ctx.globalAlpha=.78;
    poly([[x-4,y+3],[x-5,y-1],[x,y-4],[x+5,y-2],[x+6,y+3]],shadow);line(x-4,y-1,x,y-4,mid);
    if(woodland)for(let j=0;j<3;j++)line(x+j*2,y,x+(j-1)*4+Math.sin(t*.4+i),y-7-j*2,mid);
  }
  ctx.globalAlpha=1;
  drawAtmosphere(ctx,w,h,g,t,false);
  // A quiet central field keeps the bone silhouette readable against a busy habitat.
  glow(w*.5,h*.58,w*.28,h*.38,.1,night);
  ctx.globalAlpha=1;
}
