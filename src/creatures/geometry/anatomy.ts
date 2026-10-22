import * as THREE from 'three';
import type { Point } from '../../monster/sculpt';

export interface Section { p:Point; w:number; d:number }
export type Relief=(x:number,y:number,z:number,angle:number,t:number)=>number;

/** Closed contour surface. Sections describe anatomical landmarks, not stacked balls.
 * The front frame is transported along the centerline so ventral details follow bends. */
export function contour(sections:Section[],sides=24,subdivisions=3,relief?:Relief,roundness=1){
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 const points=sections.map(s=>new THREE.Vector3(...s.p));
 const path=new THREE.CatmullRomCurve3(points,false,'centripetal');
 const radii=new THREE.CatmullRomCurve3(sections.map(s=>new THREE.Vector3(s.w,s.d,0)),false,'catmullrom',.20);
 const steps=(sections.length-1)*subdivisions;
 const direction=points[points.length-1].clone().sub(points[0]).normalize();
 const prefer=Math.abs(direction.z)>.65||Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))<.0001?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1);
 for(let i=0;i<=steps;i++){
  const t=i/steps,radius=radii.getPoint(t),w=Math.max(.0005,radius.x),d=Math.max(.0005,radius.y);
  const p=path.getPoint(t),tangent=path.getTangent(t).normalize();
  const front=prefer.clone().addScaledVector(tangent,-prefer.dot(tangent));
  if(front.lengthSq()<.01){front.set(1,0,0).addScaledVector(tangent,-tangent.x);}
  front.normalize();const across=tangent.clone().cross(front).normalize();
  for(let j=0;j<=sides;j++){
   const a=j/sides*Math.PI*2,sn=Math.sin(a),cs=Math.cos(a);
   const x=Math.sign(sn)*Math.abs(sn)**roundness*w,z=Math.sign(cs)*Math.abs(cs)**roundness*d;
   const v=p.clone().addScaledVector(across,x).addScaledVector(front,z);
   if(relief)v.addScaledVector(front,relief(v.x,v.y,v.z,a,t));
   positions.push(...v);uv.push(j/sides,t);
   if(i<steps&&j<sides){const q=i*(sides+1)+j;indices.push(q,q+1,q+sides+1,q+1,q+sides+2,q+sides+1);}
  }
 }
 // Both ends are capped. Limb roots remain embedded even when the joint rotates.
 for(const [ring,reverse] of [[0,true],[steps,false]] as const){
  const p=path.getPoint(ring/steps),center=positions.length/3;positions.push(...p);uv.push(.5,ring/steps);
  for(let j=0;j<sides;j++){const q=ring*(sides+1)+j;indices.push(...(reverse?[center,q+1,q]:[center,q,q+1]));}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData.anatomicalContour=true;geometry.userData.closed=true;
 // The UV seam duplicates vertices, but it must not split the smooth surface normal.
 const normals=geometry.getAttribute('normal'),seam=new THREE.Vector3();
 for(let i=0;i<=steps;i++){const first=i*(sides+1),last=first+sides;seam.fromBufferAttribute(normals,first).add(new THREE.Vector3().fromBufferAttribute(normals,last)).normalize();normals.setXYZ(first,seam.x,seam.y,seam.z);normals.setXYZ(last,seam.x,seam.y,seam.z);}
 // Store metric dimensions separately: constructors still need normalized UVs for
 // ventral bands, while the final material pass uses a consistent grain density.
 geometry.userData.surfaceSpan=[sections.reduce((sum,s)=>sum+Math.PI*(s.w+s.d),0)/sections.length,path.getLength()];
 return geometry;
}

export const sections=(rows:number[][]):Section[]=>rows.map(([y,w,d,x=0,z=0])=>({p:[x,y,z],w,d}));

/** A sharp ridge and unequal vanes create a feather/lock with actual thickness. */
export function blade(length:number,width:number,curve=.12,serrated=true){
 const vertices:number[]=[],uv:number[]=[],indices:number[]=[];const rows=12;
 for(let i=0;i<=rows;i++){
  const t=i/rows,span=Math.sin(Math.PI*t)**.65*width*(1-t*.32)*(serrated&&i%2?.85:1);
  for(const [x,z] of [[-span*.78,0],[0,.025*Math.sin(Math.PI*t)],[span,0]]){vertices.push(x,-t*length,curve*t*t+z);uv.push(x/Math.max(width,.001)/2+.5,t);}
  if(i<rows){const q=i*3;indices.push(q,q+3,q+1,q+1,q+3,q+4,q+1,q+4,q+2,q+2,q+4,q+5);}
 }
 // Back skin prevents feather edges disappearing as wings turn.
 const count=vertices.length/3,front=[...indices];for(let i=0;i<count;i++){vertices.push(vertices[i*3],vertices[i*3+1],vertices[i*3+2]-.016);uv.push(uv[i*2],uv[i*2+1]);}
 for(let i=0;i<front.length;i+=3)indices.push(front[i+2]+count,front[i+1]+count,front[i]+count);
 for(let i=0;i<rows;i++){const l=i*3,r=l+2;indices.push(l,l+count,l+3,l+3,l+count,l+count+3,r,r+3,r+count,r+3,r+count+3,r+count);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function dentalArch(width:number,length:number,zRoot:number,y:number):Point[]{
 return Array.from({length:17},(_,i)=>{const a=-Math.PI/2+i/16*Math.PI;return [Math.sin(a)*width,y,zRoot+Math.cos(a)*length];});
}
