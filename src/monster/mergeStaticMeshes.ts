import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge only siblings that never animate independently; retain every rig pivot. */
export function mergeStaticMeshes(root:THREE.Object3D,animated:Set<THREE.Object3D>,owned:THREE.BufferGeometry[]){
 const parents:THREE.Object3D[]=[];root.traverse(o=>parents.push(o));
 for(const parent of parents){
  const buckets=new Map<THREE.Material,THREE.Mesh[]>();
  for(const child of parent.children){
   if(!(child instanceof THREE.Mesh)||!child.visible||child.children.length||animated.has(child)||Array.isArray(child.material))continue;
   if(child.name&&!child.name.startsWith('skin-'))continue;
   const group=buckets.get(child.material)??[];group.push(child);buckets.set(child.material,group);
  }
  for(const [material,meshes] of buckets){
   if(meshes.length<2)continue;
   const copies=meshes.map(m=>{m.updateMatrix();const geometry=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geometry.applyMatrix4(m.matrix);return geometry;});
   const geometry=mergeGeometries(copies);copies.forEach(g=>g.dispose());if(!geometry)continue;
   owned.push(geometry);const merged=new THREE.Mesh(geometry,material);
   const surfaces=meshes.filter(m=>m.name.startsWith('skin-'));
   if(surfaces.length){merged.name='skin-merged';merged.userData.surfaceElements=surfaces.length;}
   meshes.forEach(m=>parent.remove(m));parent.add(merged);
  }
 }
}
