import * as THREE from 'three';
import { makeSculptor } from '../../monster/sculpt';
import type { EyeRig } from '../../monster/buildMonster';
import type { Species, Appearance } from '../types';
import { contour } from './anatomy';
import { surfaceMaps, MATERIAL_RESPONSE } from './surfaces';
import type { Point } from '../../monster/sculpt';
export function createContext(primaryId?:string,appearance?:Appearance){
 const individual=(s:Species)=>s.id===primaryId?appearance:undefined;
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[],textures:THREE.DataTexture[]=[];
 const sculpt=makeSculptor(geometries,{steps:40,sides:10}),cache=new Map<string,THREE.MeshStandardMaterial>();
 const mat=(color:string,glow=false)=>{const key=color+glow;let m=cache.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.82,flatShading:false,emissive:glow?color:0,emissiveIntensity:glow?.28:0});m.userData.summonEye=glow;cache.set(key,m);materials.push(m);}return m;};
 const skinCache=new Map<string,THREE.MeshStandardMaterial>(),lightCache=new Map<string,THREE.MeshStandardMaterial>();
 const palette=(s:Species)=>{
  let skin=skinCache.get(s.id);
  if(!skin){const maps=surfaceMaps(s,undefined,individual(s)),response=MATERIAL_RESPONSE[maps.kind];skin=new THREE.MeshStandardMaterial({color:s.body,roughness:response.roughness,map:maps.map,bumpMap:maps.bump,bumpScale:response.bump,roughnessMap:maps.roughness,flatShading:false});skin.userData.surfaceKind=maps.kind;skin.userData.speciesId=s.id;materials.push(skin);textures.push(maps.map,maps.bump,maps.roughness);skinCache.set(s.id,skin);}
  let light=lightCache.get(s.id);if(!light){light=skin.clone();light.color.set(s.secondary);lightCache.set(s.id,light);materials.push(light);}
  return {skin,light,accent:mat(s.accent),dark:mat('#241e25'),ivory:mat('#e7d6b1'),eye:mat(s.accent,true),pink:mat('#98505b')};
 };
 const clothCache=new Map<string,THREE.MeshStandardMaterial>();
 const ventral=(s:Species)=>{const maps=surfaceMaps(s,'scales',undefined,true),material=new THREE.MeshStandardMaterial({color:s.secondary,map:maps.map,bumpMap:maps.bump,roughnessMap:maps.roughness,roughness:.78,bumpScale:.018});material.userData.surfaceKind='scales';materials.push(material);textures.push(maps.map,maps.bump,maps.roughness);return material;};
 const cloth=(s:Species,color=s.secondary)=>{let material=clothCache.get(s.id+color);if(!material){const maps=surfaceMaps(s,'cloth');material=new THREE.MeshStandardMaterial({color,roughness:1,map:maps.map,bumpMap:maps.bump,bumpScale:.013,roughnessMap:maps.roughness,flatShading:false});materials.push(material);textures.push(maps.map,maps.bump,maps.roughness);clothCache.set(s.id+color,material);}return material;};
 // V3 appendages have capped ends. Legacy sculptor defaults remain frozen.
 const tube=(parent:THREE.Object3D,points:Point[],radius:number,material:THREE.Material,end=.1)=>sculpt.mesh(parent,contour(points.map((p,i)=>({p,w:Math.max(.0005,radius*(1-i/(points.length-1)*(1-end))),d:Math.max(.0005,radius*(1-i/(points.length-1)*(1-end)))})),10,5,undefined,1),material);
 const joints={eyes:[] as EyeRig[],arms:[] as THREE.Object3D[],hands:[] as THREE.Object3D[],legs:[] as THREE.Object3D[],wings:[] as THREE.Object3D[],ears:[] as THREE.Object3D[],ornaments:[] as THREE.Object3D[],secondaryHeads:[] as THREE.Object3D[],jaws:[] as THREE.Object3D[],serpentJoints:[] as THREE.Object3D[],dangling:[] as THREE.Object3D[],jaw:undefined as THREE.Object3D|undefined,tongue:undefined as THREE.Object3D|undefined,tail:undefined as THREE.Object3D|undefined};
 return {...sculpt,tube,mat,cloth,ventral,palette,individual,joints,geometries,materials,textures};
}
export type SculptContext=ReturnType<typeof createContext>;
