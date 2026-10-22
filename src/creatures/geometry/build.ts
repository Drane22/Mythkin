import * as THREE from 'three';
import type { MonsterGenotype } from '../../generator/types';
import type { AnimRig } from '../../monster/buildMonster';
import { subRng } from '../../generator/rng';
import { SPECIES_BY_ID } from '../catalog/index';
import { createContext } from './context';
import { buildBody } from './body';
import { buildFeature } from './features';
import { individualSpecies } from '../appearance';
import { groomSurfaces } from './groom';

export function buildCreatureV3(g:MonsterGenotype){
 if(!g.v3)throw new Error('V3 creature profile required');
 const s=individualSpecies(SPECIES_BY_ID[g.v3.primaryId],g.v3.appearance),c=createContext(s.id,g.v3.appearance),root=new THREE.Group(),creature=c.group(root);
 const b=buildBody(c,creature,s),r=subRng(g.seed,'geometry-v3');
 for(const contribution of g.v3.contributions)buildFeature(c,b,contribution.sourceId===s.id?s:SPECIES_BY_ID[contribution.sourceId],contribution);
 groomSurfaces(c,creature,g.seed);
 const mapped=new Set<THREE.BufferGeometry>();
 creature.traverse(o=>{if(!(o instanceof THREE.Mesh)||!o.material.map||mapped.has(o.geometry))return;
  const span=o.geometry.userData.surfaceSpan,uv=o.geometry.getAttribute('uv');if(!span||!uv)return;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.max(.25,span[0]/.85),uv.getY(i)*Math.max(.25,span[1]/.85));
  uv.needsUpdate=true;mapped.add(o.geometry);
 });
 b.body.scale.x*=g.anatomy.proportions.bodyW;b.body.scale.y*=g.anatomy.proportions.bodyH;b.head.scale.multiplyScalar(g.anatomy.proportions.headScale);
 root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(creature),size=bounds.getSize(new THREE.Vector3());
 // A single uniform fit preserves all proportions and bounds wide wings/nine tails.
 const scale=Math.min(3.20/size.y,3.0/size.x,(s.form==='quadruped'||s.form==='centaur'?4.0:2.7)/size.z);creature.scale.setScalar(scale);
 creature.position.set(-(bounds.min.x+bounds.max.x)*scale/2,.12-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
 root.rotation.y=s.form==='quadruped'||s.form==='centaur'?.48:.10;
 root.userData.motion={profile:s.motion,mass:s.form==='brute'?1.4:.85};root.userData.speciesId=s.id;
 root.userData.jaws=c.joints.jaws;root.userData.serpentJoints=c.joints.serpentJoints;root.userData.secondaryHeads=c.joints.secondaryHeads;root.userData.dangling=c.joints.dangling;
 let pixelCloud:AnimRig['pixelCloud'],glitchCloud:AnimRig['glitchCloud'];
 if(g.visual?.summon.type==='pixels'||g.visual?.summon.type==='glitch'){
  root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),surfaces:THREE.Mesh[]=[];
  creature.traverse(o=>{if(o instanceof THREE.Mesh&&o.geometry.getAttribute('position').count)surfaces.push(o);});
  const glitch=g.visual.summon.type==='glitch',count=glitch?64:90,geo=new THREE.IcosahedronGeometry(.022,0);c.geometries.push(geo);
  const cloudMaterial=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.55,depthWrite:false});c.materials.push(cloudMaterial);
  const cloud=new THREE.InstancedMesh(geo,cloudMaterial,count);cloud.frustumCulled=false;root.add(cloud);
  const targets:THREE.Vector3[]=[],origins:THREE.Vector3[]=[];
  for(let i=0;i<count;i++){const mesh=r.pick(surfaces),positions=mesh.geometry.getAttribute('position'),target=new THREE.Vector3().fromBufferAttribute(positions,r.int(0,positions.count-1)).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);targets.push(target);origins.push(target.clone().add(new THREE.Vector3(r.range(-2,2),r.range(-2,3),r.range(-1,1))));cloud.setColorAt(i,new THREE.Color(i%2?'#d5b7e5':'#96829f'));}
  if(glitch)glitchCloud={mesh:cloud,targets};else pixelCloud={mesh:cloud,targets,origins};
 }
 const parts=[b.body,b.head,...c.joints.arms,...c.joints.legs,...c.joints.wings,...c.joints.ornaments];
 const assembleParts=parts.map((obj,i)=>({obj,from:new THREE.Vector3(r.range(-1,1),r.range(.2,.9),-.5),delay:i/(parts.length+1),basePos:obj.position.clone(),baseScale:obj.scale.clone()}));
 root.traverse(o=>{for(const axis of ['x','y','z'] as const){o.userData[`basePos${axis.toUpperCase()}`]=o.position[axis];o.userData[`baseRot${axis.toUpperCase()}`]=o.rotation[axis];}});
 const rig:AnimRig={root,creature,body:b.body,head:b.head,...c.joints,bodyType:g.anatomy.body,floatingHead:false,floating:s.form==='spirit',assembleParts,summon:g.visual?.summon,pixelCloud,glitchCloud,height:size.y*scale};
 return {rig,dispose(){pixelCloud?.mesh.dispose();glitchCloud?.mesh.dispose();c.geometries.forEach(x=>x.dispose());c.materials.forEach(x=>x.dispose());c.textures.forEach(x=>x.dispose());}};
}
