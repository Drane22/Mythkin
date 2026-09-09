import './register-typescript.mjs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {writeFileSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';
import {renderMesh} from './render-mesh.mjs';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const samples=new Map();
for(let i=0;samples.size<9&&i<10000;i++){const g=generateMonster(`head-review-${i}`);if(g.anatomy.horns!=='antlers'&&!g.anatomy.mutations.includes('skeletal_face')&&!samples.has(g.anatomy.head))samples.set(g.anatomy.head,g);}
assert.equal(samples.size,9);
const sheet=createCanvas(960,9*340),ctx=sheet.getContext('2d');ctx.fillStyle='#17131f';ctx.fillRect(0,0,sheet.width,sheet.height);
let row=0;
for(const [type,g] of samples){
 const {rig,dispose}=buildMonster(g);let cranium;
 rig.root.traverse(o=>{if(o.name.startsWith('cranium-'))cranium=o;});assert.ok(cranium,type);
 const nape=rig.root.getObjectByName('closed-nape');assert.ok(nape,`${type} needs a solid rear closure`);
 nape.updateWorldMatrix(true,false);const center=new THREE.Vector3();new THREE.Box3().setFromObject(nape).getCenter(center);
 const rearDirection=new THREE.Vector3(0,0,1).transformDirection(nape.parent.matrixWorld);
 const ray=new THREE.Raycaster(center.clone().addScaledVector(rearDirection,-2),rearDirection);
 assert.ok(ray.intersectObject(nape).length,`${type} rear closure must face outward and block sight through the head`);
 cranium.geometry.computeBoundingBox();const b=cranium.geometry.boundingBox;assert.ok(b.max.z-b.min.z>.3,`${type} must have full cranial depth`);dispose();
 for(let angle=0;angle<3;angle++){const out=renderMesh(g,angle*Math.PI/2);ctx.drawImage(out.canvas,angle*320+32,row*340);ctx.fillStyle='#ede3ff';ctx.font='15px sans-serif';ctx.fillText(`${type}: ${['front','side','back'][angle]}`,angle*320+20,row*340+331);}
 row++;
}
writeFileSync('artifacts/head-turnaround.png',sheet.toBuffer('image/png'));
console.log('Passed: all nine head types have full cranial depth; rendered front, side and rear geometry.');
