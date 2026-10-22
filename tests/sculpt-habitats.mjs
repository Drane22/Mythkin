// V2 regression coverage: v3 catalog and composition have their own suites.
import './register-typescript.mjs';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import * as THREE from 'three';
const {generateMonster}=await import('../src/generator/generateMonsterV2.ts');
const {paintAtmosphere}=await import('../src/monster/atmosphere.ts');
const {paintBackgroundV2}=await import('../src/monster/backgroundV2.ts');
const {ENVIRONMENTS}=await import('../src/generator/visualTypes.ts');
const {carvedVolume,ellipsoid}=await import('../src/monster/sculpt.ts');
const {DESIGN_FAMILIES,referenceSpecimen}=await import('../src/monster/designLanguage.ts');
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const png=(paint,g,time)=>{const c=createCanvas(128,160);paint(c.getContext('2d'),128,160,g,time);return c.toBuffer('image/png');};
for(const family of DESIGN_FAMILIES){
 const g=referenceSpecimen(generateMonster('family-test'),family),built=buildMonster(g);
 assert.equal(built.rig.root.userData.designFamily,family);
 assert.equal(built.rig.eyes.length,g.anatomy.eyes.count);
 assert.ok(built.rig.root.getObjectByName('recessed-socket-walls'));
 built.dispose();
 assert.notDeepEqual(png(paintAtmosphere,g,0),png(paintAtmosphere,g,3),`${family} foreground moves`);
 assert.deepEqual(png(paintAtmosphere,g,3),png(paintAtmosphere,g,3),`${family} frame is reproducible`);
 g.visual.environment.motion='none';assert.deepEqual(png(paintAtmosphere,g,0),png(paintAtmosphere,g,8),'static motion setting freezes foreground');
}
const signatures=new Set();
for(const type of ENVIRONMENTS){
 const g=generateMonster('habitat-review');g.visual.environment.type=type;g.visual.environment.motion='drift';
 const first=png(paintBackgroundV2,g,0),later=png(paintBackgroundV2,g,4);
 assert.notDeepEqual(first,later,`${type} habitat moves`);signatures.add(first.toString('base64'));
}
assert.ok(signatures.size>=12,'environment families need distinct habitat geometry');
const solid=(x,y,z)=>ellipsoid(x,y,z,[0,0,0],[.6,.7,.5]);
const cut=(x,y,z)=>ellipsoid(x,y,z,[0,0,.48],[.24,.28,.36]);
const [outer,inner]=carvedVolume(solid,[cut],[.7,.8,.6]);
const material=new THREE.MeshBasicMaterial(),skin=new THREE.Mesh(outer,material);
const hits=new THREE.Raycaster(new THREE.Vector3(0,0,2),new THREE.Vector3(0,0,-1)).intersectObjects([skin,new THREE.Mesh(inner,material)]);
assert.ok(hits.length&&hits[0].point.z<.2,'socket removes front volume instead of painting a disk');
assert.ok(inner.getAttribute('position').count>0,'cavity has actual inner walls');outer.dispose();inner.dispose();material.dispose();
console.log('Passed: carved socket depth, four complete reference families, deterministic foreground motion and distinct living habitats.');
