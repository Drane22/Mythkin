import * as THREE from 'three';
import type { Species, Appearance } from '../types';
import { PAINTED_MATERIALS } from '../materials/painted';
const decoded=new Map<string,Uint8Array>();
const pixels=(kind:string)=>{let data=decoded.get(kind);if(!data){data=Uint8Array.from(atob(PAINTED_MATERIALS[kind]),c=>c.charCodeAt(0));decoded.set(kind,data);}return data;};
export type SurfaceKind='skin'|'fur'|'scales'|'bark'|'bone'|'feathers'|'hide'|'cloth';
export function surfaceKind(s:Species):SurfaceKind {
 if(s.id==='leshy')return 'bark';
 if(['draugr','cernunnos','tzitzimitl','vetala','pazuzu'].includes(s.id))return 'bone';
 if(s.id==='grootslang'||s.id==='troll')return 'hide';
 if(s.form==='serpent'||['dragon','crocodile','turtle','cobra'].includes(s.head))return 'scales';
 if(s.form==='avian')return 'feathers';
 if(s.head==='elephant'||s.head==='bat')return 'hide';
 if(['bull','wolf','fox','cat','horse'].includes(s.head)||s.id==='domovoi')return 'fur';
 return 'skin';
}
const fract=(x:number)=>x-Math.floor(x);
const noise=(x:number,y:number)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export const MATERIAL_RESPONSE:Record<SurfaceKind,{roughness:number;bump:number}>={
 skin:{roughness:.72,bump:.009},fur:{roughness:.98,bump:.008},scales:{roughness:.53,bump:.026},
 bark:{roughness:.97,bump:.047},bone:{roughness:.74,bump:.012},feathers:{roughness:.86,bump:.015},
 hide:{roughness:.84,bump:.027},cloth:{roughness:1,bump:.012},
};
/** Material-sized colour, relief and roughness fields. Pigment stays subordinate
 * to grain: scales overlap, hair follows a grain, and bark has deep vertical fissures. */
export function surfaceMaps(s:Species,override?:SurfaceKind,individual?:Appearance,ventral=false){
 const kind=override??surfaceKind(s),size=256,color=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4);
 const source=pixels(kind==='fur'&&s.id==='domovoi'?'shag':kind);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const index=y*size+x,sample=source[Math.floor(y/2)*128+Math.floor(x/2)]/255;
  const phase=(individual?.patternSeed??0)*.013;
  const u=x/size,v=y/size;
  let pigment=1,relief=.5,grain=.85;
  if(individual?.marking==='bands')pigment=.88+.12*smooth((Math.sin(v*Math.PI*6+Math.sin(u*Math.PI*2)*.8+phase)+.25)*2);
  if(individual?.marking==='freckles')pigment=1-.19*smooth((Math.cos(u*Math.PI*12+Math.sin(v*Math.PI*2)+phase)*Math.cos(v*Math.PI*10)-.50)*4);
  if(individual?.marking==='marbled')pigment=.94+.06*Math.sin(u*Math.PI*4+Math.sin(v*Math.PI*6)*1.3+phase);
  const fine=noise(x,y),streak=Math.sin(u*Math.PI*128+Math.sin(v*Math.PI*8)*1.7);
  if(kind==='fur'){
   relief=.48+.075*streak+.09*sample;grain=.87+.035*streak+.07*sample;
  }else if(kind==='scales'&&ventral){
   const plate=1-smooth((Math.abs(fract(v*18)-.5)-.39)*12);
   relief=.28+.40*plate;grain=.83+.11*plate+.035*sample;
  }else if(kind==='scales'){
   const row=Math.floor(v*16),sx=fract(u*12+(row%2)*.5)-.5,sy=fract(v*16);
   const edge=Math.sqrt((sx*1.9)**2+((sy-.18)*1.15)**2),plate=1-smooth((edge-.65)*5);
   relief=.16+.68*plate*(.65+.35*sy);grain=.61+.30*plate+.07*sample;
  }else if(kind==='bark'){
   const ridge=Math.abs(Math.sin(u*Math.PI*18+Math.sin(v*Math.PI*4)*.65+Math.sin(v*Math.PI*12)*.12));
   relief=.12+.66*smooth(ridge*1.4)+.15*sample;grain=.49+.39*smooth(ridge*2)+.08*sample;
  }else if(kind==='feathers'){
   const axis=Math.abs(fract(u*9)-.5),barb=Math.sin(v*Math.PI*108+axis*38);
   relief=.45+.14*barb+.15*(1-axis*2);grain=.80+.08*barb+.09*sample;
  }else if(kind==='hide'){
   const crease=Math.abs(Math.sin(u*Math.PI*20+Math.sin(v*Math.PI*8))*Math.sin(v*Math.PI*18+Math.sin(u*Math.PI*6)));
   relief=.32+.43*smooth(crease*4)+fine*.09;grain=.73+.14*smooth(crease*4)+sample*.08;
  }else if(kind==='cloth'){
   const weave=Math.sin(u*Math.PI*104)*Math.cos(v*Math.PI*104);relief=.5+weave*.22;grain=.84+.08*weave+.05*sample;
  }else{
   relief=.46+fine*.10+sample*.11;grain=(kind==='bone'?.88:.91)+sample*.06-fine*.035;
  }
  const value=Math.max(0,Math.min(255,Math.round(255*grain*pigment))),bump=Math.round(Math.max(0,Math.min(1,relief))*255);
  const rough=Math.round(255*(.82+.18*(1-relief)));
  color.set([value,value,value,255],index*4);height.set([bump,bump,bump,255],index*4);roughness.set([rough,rough,rough,255],index*4);
 }
 const texture=(data:Uint8Array)=>{const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;};
 const map=texture(color);map.colorSpace=THREE.SRGBColorSpace;
 return {map,bump:texture(height),roughness:texture(roughness),kind};
}
