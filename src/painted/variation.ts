import type * as THREE from 'three';
import type { Appearance } from '../creatures/types';
import type { PaintedRig,SkinWeights } from './motion';

export function individualPoint(x:number,y:number,weights:SkinWeights,rig:PaintedRig,appearance:Appearance|undefined,out:{x:number;y:number}) {
  if(!appearance||appearance.build==='reference')return out;
  const chest=(appearance.chest-1)*.60,head=(appearance.headWidth-1)*.7+(appearance.eyeScale-1)*.18;
  out.x+=(x-rig.chest[0])*chest*weights.chest;
  out.x+=(x-rig.head[0])*head*weights.head;
  const rise=appearance.build==='rangy'?-.014:appearance.build==='compact'?.012:0;
  out.y+=rise*weights.grounded;
  out.y+=(y-rig.head[1])*(appearance.muzzle-1)*.16*weights.head;
  const angle=appearance.brow*.22,hx=x-rig.head[0],hy=y-rig.head[1];
  out.x+=((Math.cos(angle)-1)*hx-Math.sin(angle)*hy)*weights.head;
  out.y+=(Math.sin(angle)*hx+(Math.cos(angle)-1)*hy)*weights.head;
  return out;
}

/** Keep the painting's light, brushwork and ivory surfaces while varying pigmented areas. */
export function individualMaterial(material:THREE.MeshBasicMaterial,appearance?:Appearance) {
  if(!appearance||appearance.aspect==='Original')return;
  const tone:Record<string,[number,number]>={Ember:[.03,.90],Moonlit:[.11,.50],Mossborn:[-.25,.65],Orchid:[.18,.65],Ochre:[-.10,.90],Ashen:[0,.25]};
  const [hue,saturation]=tone[appearance.aspect]??[0,1];
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{
      uCoatHue:{value:hue},uCoatSaturation:{value:saturation},
      uCoatPattern:{value:appearance.marking==='bands'?1:appearance.marking==='freckles'?2:3},
      uCoatSeed:{value:appearance.patternSeed*.013},
    });
    shader.fragmentShader=`uniform float uCoatHue;uniform float uCoatSaturation;uniform float uCoatPattern;uniform float uCoatSeed;\n${shader.fragmentShader}`;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec3 pigment=diffuseColor.rgb;
      float high=max(pigment.r,max(pigment.g,pigment.b));
      float low=min(pigment.r,min(pigment.g,pigment.b));
      float mask=.72*smoothstep(.06,.23,high-low)*smoothstep(.035,.13,high)*(1.-smoothstep(.80,.98,high))*(1.-smoothstep(.12,.30,low));
      float yy=dot(pigment,vec3(.299,.587,.114));
      float ii=dot(pigment,vec3(.596,-.274,-.322));
      float qq=dot(pigment,vec3(.211,-.523,.312));
      float ir=(ii*cos(uCoatHue)-qq*sin(uCoatHue))*uCoatSaturation;
      float qr=(ii*sin(uCoatHue)+qq*cos(uCoatHue))*uCoatSaturation;
      vec3 shifted=clamp(vec3(yy+.956*ir+.621*qr,yy-.272*ir-.647*qr,yy-1.106*ir+1.703*qr),0.,1.);
      float field=sin(vMapUv.y*31.+sin(vMapUv.x*17.)+uCoatSeed);
      if(uCoatPattern>1.5)field=sin(vMapUv.x*87.+uCoatSeed)*sin(vMapUv.y*73.);
      if(uCoatPattern>2.5)field=sin(vMapUv.x*19.+sin(vMapUv.y*27.)+uCoatSeed);
      float body=smoothstep(.20,.33,1.-vMapUv.y)*(1.-smoothstep(.82,.94,1.-vMapUv.y));
      shifted*=1.-.12*smoothstep(.5,.95,field)*body;
      diffuseColor.rgb=mix(pigment,shifted,mask);
    `);
  };
  material.customProgramCacheKey=()=>`painted-coat-${appearance.aspect}-${appearance.marking}-${appearance.patternSeed}`;
}
