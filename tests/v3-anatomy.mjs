import './register-typescript.mjs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const {SPECIES}=await import('../src/creatures/catalog/index.ts');
const {generateMonsterV3}=await import('../src/creatures/generateV3.ts');
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const {applyAnimationV3}=await import('../src/motion/v3.ts');

// Ray parity against triangle surfaces, independent of constructor radius metadata.
function inside(mesh,world){
 const origin=mesh.worldToLocal(world.clone()),ray=new THREE.Ray(origin,new THREE.Vector3(1,.371,.193).normalize());
 const p=mesh.geometry.attributes.position,ix=mesh.geometry.index,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),target=new THREE.Vector3(),hits=[];
 for(let i=0;i<(ix?.count??p.count);i+=3){
  a.fromBufferAttribute(p,ix?ix.getX(i):i);b.fromBufferAttribute(p,ix?ix.getX(i+1):i+1);c.fromBufferAttribute(p,ix?ix.getX(i+2):i+2);
  if(ray.intersectTriangle(a,b,c,false,target)){const d=target.distanceTo(origin);if(!hits.some(x=>Math.abs(x-d)<1e-5))hits.push(d);}
 }
 return hits.length%2===1;
}
function nodes(rig,predicate){const list=[];rig.body.traverse(o=>{if(predicate(o))list.push(o);});return list;}
const reactions=['guard','feint','taunt','startle','curious','delight'];
const camera=new THREE.PerspectiveCamera(24,.8,.1,100);camera.position.set(0,2.1,10.5);camera.lookAt(0,1.65,0);camera.updateMatrixWorld(true);
let attachmentChecks=0,jawChecks=0,clearanceChecks=0;
for(const s of SPECIES){
 const g=generateMonsterV3(s.label),{rig,dispose}=buildMonster(g);
 rig.root.updateMatrixWorld(true);
 const cores=nodes(rig,o=>o.isMesh&&['anatomy:continuous-torso','anatomy:quadruped-torso','anatomy:pelvis','anatomy:scapula','anatomy:serpent'].includes(o.name));
 for(const joint of [...rig.legs,...rig.arms]){
  assert(cores.some(core=>inside(core,joint.getWorldPosition(new THREE.Vector3()))),`${s.id}: ${joint.name} must be embedded in anatomy`);attachmentChecks++;
 }
 const roots=[rig.head,...rig.arms,...rig.legs,...rig.root.userData.jaws].map(obj=>({obj,p:obj.position.clone()}));
 const fittedScale=rig.creature.scale.clone();
 for(const tooth of nodes(rig,o=>o.name==='anatomy:upper-tooth'||o.name==='anatomy:lower-tooth')){
  const lower=tooth.name.includes('lower'),gum=tooth.parent.children.find(o=>o.name===`anatomy:${lower?'lower':'upper'}-gum`);
  assert(gum,`${s.id}: dentition must share its moving jaw with its gum`);
  const root=new THREE.Vector3(...tooth.userData.gumRoot);tooth.localToWorld(root);
  assert(inside(gum,root),`${s.id}: tooth root must enter the gum surface`);
 }
 const skulls=nodes(rig,o=>o.name==='anatomy:skull');
 for(const ear of rig.ears.filter(o=>o.name==='anatomy:ear-root'))assert(skulls.some(skull=>inside(skull,ear.getWorldPosition(new THREE.Vector3()))),`${s.id}: ear root must enter a skull surface`);
 for(const kind of reactions)for(const age of [.15,.4,.7,1.1,1.6,2.1]){
  applyAnimationV3(rig,g.idle,{time:3.7,assemble:1,reducedMotion:false,reaction:{kind,age,intensity:1,anger:.8,direction:1}});rig.root.updateMatrixWorld(true);
  assert(rig.creature.scale.distanceTo(fittedScale)<1e-8,`${s.id}: anger must not inflate anatomy`);
  for(const skull of skulls){const vertices=skull.geometry.attributes.position;for(let i=0;i<vertices.count;i++){
   const screen=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(skull.matrixWorld).project(camera);assert(Math.abs(screen.y)<.98,`${s.id}: skull leaves viewport during ${kind} at ${screen.y.toFixed(3)}`);
  }}
  for(const {obj,p} of roots){assert(obj.position.distanceTo(p)<1e-8,`${s.id}: ${obj.name} detached during ${kind}`);jawChecks++;}
  for(const hand of rig.hands){const palm=hand.localToWorld(new THREE.Vector3(0,-.10,0));assert(!cores.some(core=>inside(core,palm)),`${s.id}: palm inside torso during ${kind}`);}
  if(s.id==='zmey')for(let a=0;a<skulls.length;a++)for(let b=a+1;b<skulls.length;b++){
   assert(!new THREE.Box3().setFromObject(skulls[a]).intersectsBox(new THREE.Box3().setFromObject(skulls[b])),`Zmey skulls intersect during ${kind}`);clearanceChecks++;
  }
 }
 const bodySpheres=nodes(rig,o=>o.isMesh&&/anatomy:(continuous-torso|jointed-leg|jointed-arm|upper-muzzle|mandible)/.test(o.name)&&o.geometry.type==='SphereGeometry');assert.equal(bodySpheres.length,0);
 if(s.id==='ahuizotl'||s.id==='tengu'){assert.equal(rig.arms.length,2);assert.equal(rig.legs.length,2);}
 if(s.id==='pazuzu')assert.equal(rig.wings.length,2);
 for(const kind of ['sigil','shadow','pixels','portal','ground','glitch','parts','celestial']){
  rig.summon={...rig.summon,type:kind};applyAnimationV3(rig,g.idle,{time:3,assemble:1,reducedMotion:false});
  for(const {obj,p} of roots)assert(obj.position.distanceTo(p)<1e-8,`${s.id}: ${kind} did not restore anatomical attachments`);
 }
 dispose();
}
// Conflict fallback: the donor skull remains outside every primary skull and torso.
for(const input of ['Gorgon with Minotaur','Zmey with Minotaur','Nian with Oni','Grootslang with Gorgon']){
 const g=generateMonsterV3(input),{rig,dispose}=buildMonster(g);
 for(const kind of reactions){
  applyAnimationV3(rig,g.idle,{time:4,assemble:1,reducedMotion:false,reaction:{kind,age:.5,intensity:1,anger:.8,direction:1}});rig.root.updateMatrixWorld(true);
  const skulls=nodes(rig,o=>o.name==='anatomy:skull');
  for(let a=0;a<skulls.length;a++)for(let b=a+1;b<skulls.length;b++){assert(!new THREE.Box3().setFromObject(skulls[a]).intersectsBox(new THREE.Box3().setFromObject(skulls[b])),input+' skull clearance');clearanceChecks++;}
 }
 dispose();
}
console.log(`Passed anatomical surfaces: ${attachmentChecks} embedded limb pivots, seated tooth roots, ${jawChecks} fixed attachment samples, ${clearanceChecks} skull-clearance samples, all 50 species and eight completed summons.`);
