import type { MonsterGenotype } from '../generator/types';
import { subRng } from '../generator/rng';
/** Portrait environments use a dark field, three depth planes and sparse motion. */
export function paintBackgroundV2(ctx:CanvasRenderingContext2D,w:number,h:number,g:MonsterGenotype,time=0){
 const {colors:c,environment:e}=g.visual!,r=subRng(g.seed,'environment');
 const t=e.motion==='none'?0:time;
 ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;ctx.fillStyle=c.backgroundPrimary;ctx.fillRect(0,0,w,h);
 const rect=(x:number,y:number,rw:number,rh:number,color=c.backgroundSecondary)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(rw),Math.ceil(rh));};
 const line=(x:number,y:number,xx:number,yy:number,color=c.backgroundAccent)=>{const n=Math.max(Math.abs(xx-x),Math.abs(yy-y));for(let i=0;i<=n;i++)rect(x+(xx-x)*i/n,y+(yy-y)*i/n,1,1,color);};
 const disc=(x:number,y:number,rad:number,color:string,inner=0)=>{for(let dy=-Math.ceil(rad);dy<=rad;dy++){const edge=Math.floor(Math.sqrt(Math.max(0,rad*rad-dy*dy)));for(let dx=-edge;dx<=edge;dx++)if(dx*dx+dy*dy>=inner*inner)rect(x+dx,y+dy,1,1,color);}};
 const haze=(strength=.14)=>{ctx.globalAlpha=strength;for(let i=0;i<3;i++)rect(Math.sin(t*.09+i)*w*.13,h*(.65+i*.09),w,h*.027,c.backgroundAccent);ctx.globalAlpha=1;};
 const glow=(x:number,y:number,size:number)=>{for(let i=4;i>=1;i--){ctx.globalAlpha=.04;disc(x,y,size*i/4,c.backgroundAccent);}ctx.globalAlpha=1;};
 const motes=(count:number,speed=.35)=>{for(let i=0;i<count;i++){ctx.globalAlpha=.2+.5*Math.pow(Math.sin(t*.45+i),2);rect((r.float()*w+t*.12)%w,(r.float()*h-t*speed+h*100)%h,1,i%5===0?2:1,c.backgroundAccent);}ctx.globalAlpha=1;};
 switch(e.type){
 case 'void':glow(w*.5,h*.46,w*.55);break;
 case 'moon':{
   glow(w*.68,h*.26,w*.32);disc(w*.68,h*.26,w*.19,c.backgroundAccent);
   ctx.globalAlpha=.4;for(let i=0;i<7;i++)disc(w*(.59+r.float()*.16),h*(.16+r.float()*.17),r.range(1,3),c.backgroundSecondary);ctx.globalAlpha=1;
   disc(w*.74,h*.23,w*.17,c.backgroundPrimary);haze(.08);break;
 }
 case 'sun':glow(w*.5,h*.33,w*.42);disc(w*.5,h*.33,w*.23,c.backgroundAccent,w*.21);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;line(w*.5+Math.sin(a)*w*.26,h*.33+Math.cos(a)*w*.26,w*.5+Math.sin(a)*w*.29,h*.33+Math.cos(a)*w*.29);}disc(w*.5,h*.33,w*.19,c.backgroundSecondary);break;
 case 'gradient':case 'ocean':case 'ember':
   for(let i=0;i<12;i++){ctx.globalAlpha=.04+i*.025;rect(0,h*i/12,w,h/12,c.backgroundSecondary);}ctx.globalAlpha=1;
   glow(w*.5,e.type==='ember'?h:h*.1,w*.6);if(e.type==='ocean')haze(.09);break;
 case 'temple':
   for(const side of [-1,1]){const x=w*(side<0?.09:.82);rect(x,h*.13,w*.075,h*.75);rect(x-2,h*.12,w*.12,4,c.backgroundAccent);rect(x-3,h*.86,w*.14,5);line(x+2,h*.2,x+2,h*.81);for(let j=0;j<4;j++)rect(x+4,h*(.28+j*.12),2,3,c.backgroundAccent);}
   rect(w*.07,h*.07,w*.87,3);rect(w*.12,h*.1,w*.76,2);for(let i=0;i<3;i++)rect(w*(.04+i*.035),h*(.96-i*.025),w*(.92-i*.07),2);haze();break;
 case 'forest':
   for(let layer=0;layer<2;layer++){ctx.globalAlpha=layer?.95:.4;for(let i=0;i<5;i++){const x=(i/4*w+r.range(-5,5))+Math.sin(t*.1+i)*.5;rect(x,0,layer?4:2,h);for(let j=0;j<4;j++){const y=r.range(5,h*.6),side=j%2?1:-1;line(x,y,x+side*12,y-10,c.backgroundSecondary);line(x+side*7,y-6,x+side*7,y-14,c.backgroundSecondary);}}}ctx.globalAlpha=1;haze();break;
 case 'swamp':
   rect(0,h*.76,w,h*.24);for(let i=0;i<8;i++){const x=r.float()*w;line(x,h*.8,x-2,h*.64,c.backgroundSecondary);line(x-2,h*.7,x+3,h*.66,c.backgroundSecondary);}for(let i=0;i<7;i++)rect((r.float()*w+t*.4)%w,h*(.79+i*.025),r.range(4,13),1,c.backgroundAccent);haze(.2);break;
 case 'cave':
   for(let layer=0;layer<2;layer++){ctx.globalAlpha=layer?.85:.35;for(let i=0;i<12;i++){const depth=r.range(5,22);for(let j=0;j<depth;j++)rect(i*w/12+j*.12,j,w/12-j*.25,1);}}ctx.globalAlpha=1;
   rect(0,0,w*.07,h);rect(w*.94,0,w*.06,h);for(let i=0;i<6;i++)rect(i*w/5,h-r.range(3,9),w*.15,10);haze(.09);break;
 case 'stars':{
   const stars=Array.from({length:15},()=>[r.float()*w,r.float()*h]);ctx.globalAlpha=.2;for(let i=1;i<6;i++)line(...stars[i-1] as [number,number],...stars[i] as [number,number]);ctx.globalAlpha=1;
   for(const [i,[x,y]] of stars.entries()){ctx.globalAlpha=.4+.6*Math.pow(Math.sin(t*.4+i),2);rect(x,y,1,1,c.backgroundAccent);if(i%4===0){rect(x-1,y,3,1,c.backgroundAccent);rect(x,y-1,1,3,c.backgroundAccent);}}ctx.globalAlpha=1;break;
 }
 case 'ruins':
   for(let layer=0;layer<2;layer++){ctx.globalAlpha=layer?.8:.35;for(let i=0;i<6;i++){const x=i*w/5+r.range(-3,3),y=h*r.range(.53,.87);rect(x,y,w*.08,h-y);rect(x-2,y-2,w*.12,2);for(let j=0;j<3;j++)rect(x,y+j*6,w*.08,1,c.backgroundPrimary);}}ctx.globalAlpha=1;haze();break;
 case 'sigil':{
   glow(w*.5,h*.43,w*.46);ctx.save();ctx.translate(w*.5,h*.43);ctx.rotate(t*.025);ctx.translate(-w*.5,-h*.43);
   disc(w*.5,h*.43,w*.35,c.backgroundAccent,w*.34);disc(w*.5,h*.43,w*.27,c.backgroundSecondary,w*.26);
   const n=5+e.symbol%4;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+2)/n*Math.PI*2;ctx.globalAlpha=.35;line(w*.5+Math.sin(a)*w*.25,h*.43+Math.cos(a)*w*.25,w*.5+Math.sin(b)*w*.25,h*.43+Math.cos(b)*w*.25);ctx.globalAlpha=1;const x=w*.5+Math.sin(a)*w*.31,y=h*.43+Math.cos(a)*w*.31;line(x-2,y-2,x+2,y+2);line(x,y-3,x,y+3);}ctx.restore();break;
 }
 case 'mist':glow(w*.5,h*.4,w*.6);haze(.23);for(let i=0;i<4;i++){ctx.globalAlpha=.09;rect(Math.sin(t*.13+i)*w*.3,h*(.2+i*.17),w,h*.07,c.backgroundAccent);}ctx.globalAlpha=1;break;
 case 'pattern':
   for(let y=7;y<h;y+=18)for(let x=7;x<w;x+=18){ctx.globalAlpha=.3;line(x,y-5,x+5,y);line(x+5,y,x,y+5);line(x,y+5,x-5,y);line(x-5,y,x,y-5);ctx.globalAlpha=.65;rect(x,y,1,3,c.backgroundAccent);if(e.symbol%2)rect(x-2,y,5,1,c.backgroundAccent);}ctx.globalAlpha=1;break;
 }
 if(e.motion!=='none')motes(e.type==='ember'?18:8,e.type==='ember'?2:.35);
 if(e.motion==='pulse'){ctx.globalAlpha=.025*(1+Math.sin(t*.7));ctx.fillStyle=c.backgroundAccent;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;}
 if(e.motion==='ripple')for(let i=0;i<3;i++){ctx.globalAlpha=.35;rect(w*.2+Math.sin(t*.3+i)*3,h*(.82+i*.04),w*.6,1,c.backgroundAccent);}ctx.globalAlpha=1;
}
