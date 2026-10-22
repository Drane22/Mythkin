import * as THREE from 'three';
import type { SculptContext } from './context';

const random=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};

/** Rooted, tapered guard hairs in one mesh per moving surface. Sampling by area
 * avoids clumps at dense topology; children inherit the exact animated joint. */
export function groomSurfaces(c:SculptContext,root:THREE.Object3D,seed:string){
 let seedValue=0;for(const char of seed)seedValue=(seedValue*31+char.charCodeAt(0))>>>0;
 const surfaces:THREE.Mesh[]=[];
 root.traverse(o=>{if(o instanceof THREE.Mesh&&['fur','feathers'].includes((o.material as THREE.MeshStandardMaterial).userData.surfaceKind)&&o.geometry.userData.anatomicalContour)surfaces.push(o);});
 for(const [surfaceIndex,surface] of surfaces.entries()){
  if(/muzzle|nose|mandible|brow|palm|hoof/.test(surface.name))continue;
  const material=surface.material as THREE.MeshStandardMaterial,shag=material.userData.speciesId==='domovoi',feather=material.userData.surfaceKind==='feathers';
  if(feather&&!/torso|skull|neck/.test(surface.name))continue;
  const pos=surface.geometry.getAttribute('position'),normal=surface.geometry.getAttribute('normal'),ix=surface.geometry.index;
  if(!ix||!normal)continue;
  const areas:number[]=[],triangles:number[]=[];let area=0;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),d=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3();
  for(let i=0;i<ix.count;i+=3){a.fromBufferAttribute(pos,ix.getX(i));b.fromBufferAttribute(pos,ix.getX(i+1));d.fromBufferAttribute(pos,ix.getX(i+2));const size=ab.subVectors(b,a).cross(ac.subVectors(d,a)).length()*.5;if(size<.000001)continue;area+=size;areas.push(area);triangles.push(i);}
  if(!area)continue;
  const count=Math.min(1800,Math.floor(area*(feather?160:shag?1000:720))),positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let hair=0;hair<count;hair++){
   const salt=seedValue*.01+surfaceIndex*31+hair*7,target=random(salt)*area;
   let low=0,high=areas.length-1;while(low<high){const mid=(low+high)>>1;if(areas[mid]<target)low=mid+1;else high=mid;}
   const ti=triangles[low],ids=[ix.getX(ti),ix.getX(ti+1),ix.getX(ti+2)],u=Math.sqrt(random(salt+1)),v=random(salt+2),weights=[1-u,u*(1-v),u*v];
   const p=new THREE.Vector3(),n=new THREE.Vector3();
   for(let j=0;j<3;j++){p.addScaledVector(a.fromBufferAttribute(pos,ids[j]),weights[j]);n.addScaledVector(a.fromBufferAttribute(normal,ids[j]),weights[j]);}n.normalize();
   // Keep the eyes, lips and nose visible; a short coat wraps the temples and occiput.
   if(surface.name==='anatomy:skull'&&p.z>.10&&Math.abs(p.x)<.22&&p.y<.23)continue;
   const facial=surface.name==='anatomy:skull'||surface.name==='anatomy:cupped-ear';
   const length=(feather?(facial?.065:.13):shag?.13:facial?.035:.060)*(.65+random(salt+3)*.70),width=feather?(facial?.016:.029):shag?.0065:.0035;
   const flow=new THREE.Vector3(0,-1,-.28).addScaledVector(n,n.y+n.z*.28).normalize();
   if(flow.lengthSq()<.1)flow.set(1,0,0);
   const tangent=new THREE.Vector3().crossVectors(n,flow).normalize(),base=positions.length/3;
   const sides=feather?4:3;
   for(let ring=0;ring<3;ring++){
    const t=ring/2,center=p.clone().addScaledVector(n,-.002+length*(t*(feather?.32:.65)-t*t*.22)).addScaledVector(flow,length*t*(feather?1:.80));
    for(let side=0;side<sides;side++){const angle=side/sides*Math.PI*2,radius=width*(feather?Math.sin(t*Math.PI)*.98+.02:1-t)+.00012,point=center.clone().addScaledVector(tangent,Math.cos(angle)*radius).addScaledVector(n,Math.sin(angle)*radius*(feather?.22:1));positions.push(...point);uv.push(feather?side/sides:random(salt+4),t);}
    if(ring<2)for(let side=0;side<sides;side++){const q=base+ring*sides+side,next=base+ring*sides+(side+1)%sides;indices.push(q,next,q+sides,next,next+sides,q+sides);}
   }
  }
  if(!positions.length)continue;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const groom=c.mesh(surface,geometry,material);groom.name=feather?'surface:contour-feathers':'surface:groomed-fur';groom.userData[feather?'feathers':'strands']=positions.length/(feather?36:27);
 }
}
