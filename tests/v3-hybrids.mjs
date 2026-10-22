import './register-typescript.mjs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const {SPECIES}=await import('../src/creatures/catalog/index.ts');
const {generateMonsterV3}=await import('../src/creatures/generateV3.ts');
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const {applyAnimationV3}=await import('../src/motion/v3.ts');
function bounds(mesh,frame){mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox.clone().applyMatrix4(frame.matrixWorld.clone().invert().multiply(mesh.matrixWorld));}
let pairs=0,skullChecks=0;
for(const p of SPECIES)for(const s of SPECIES){
 const g=generateMonsterV3(`${p.label} with ${s.label}`),{rig,dispose}=buildMonster(g);
 const donor=g.v3.contributions.find(c=>c.role==='secondary'),skulls=[],cores=[];let donorMeshes=0;
 rig.body.traverse(o=>{
  if(o.name==='anatomy:skull')skulls.push(o);
  if(o.name==='anatomy:continuous-torso'||o.name==='anatomy:quadruped-torso')cores.push(o);
  if(donor&&o.userData.sourceId===donor.sourceId&&o.userData.role==='secondary')o.traverse(c=>{if(c.isMesh)donorMeshes++;});
 });
 assert(!donor||donorMeshes>0,g.input+' missing donor geometry');
 assert.equal(rig.arms.length,g.anatomy.armCount);assert.equal(rig.legs.length,g.anatomy.legCount);
 for(const frame of [undefined,...['guard','feint','taunt','startle','curious','delight'].map(kind=>({kind,age:.5,intensity:1,anger:.8,direction:1}))]){
  applyAnimationV3(rig,g.idle,{time:3.9,assemble:1,reducedMotion:false,reaction:frame});rig.root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(rig.creature);assert(box.min.toArray().every(Number.isFinite)&&box.max.toArray().every(Number.isFinite));
  for(let a=0;a<skulls.length;a++)for(let b=a+1;b<skulls.length;b++){
   assert(!bounds(skulls[a],rig.body).intersectsBox(bounds(skulls[b],rig.body)),`${g.input}: skull intersection in ${frame?.kind??'idle'}`);skullChecks++;
  }
  if(donor?.feature==='companion-crest'){
   for(const skull of skulls){let inherited=false;for(let parent=skull.parent;parent;parent=parent.parent)if(parent.userData.role==='secondary')inherited=true;
    if(inherited)for(const core of cores)assert(!bounds(skull,rig.body).intersectsBox(bounds(core,rig.body)),g.input+' donor skull intersects torso');
   }
  }
 }
 dispose();pairs++;if(pairs%500===0)console.log(`Checked ${pairs}/2500 built pairings.`);
}
console.log(`Passed ${pairs} actual built pairings, seven poses per pair, ${skullChecks} conservative skull separation checks, donor meshes and primary limb counts.`);
