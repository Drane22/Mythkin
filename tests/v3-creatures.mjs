import './register-typescript.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';
import * as THREE from 'three';
const {SPECIES}=await import('../src/creatures/catalog/index.ts');
const {composeCreature}=await import('../src/creatures/composition/index.ts');
const {generateMonsterV3}=await import('../src/creatures/generateV3.ts');
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const {applyAnimationV3}=await import('../src/motion/v3.ts');
const {paintBackground}=await import('../src/monster/background.ts');
const {renderMesh}=await import('./render-mesh.mjs');
assert.equal(SPECIES.length,50);assert.equal(new Set(SPECIES.map(s=>s.id)).size,50);
for(const removed of ['penanggal','barong','toyol'])assert(!SPECIES.some(s=>s.id===removed));
for(const p of SPECIES)for(const s of SPECIES){
 const v=composeCreature(p.id,s.id);assert.deepEqual(v.anchors,[p.form,p.head,...p.features]);
 assert.equal(v.contributions.filter(c=>c.role==='primary').length,p.features.length);
 if(p!==s){const donor=v.contributions.filter(c=>c.role==='secondary');assert.equal(donor.length,1);assert.equal(donor[0].sourceId,s.id);assert.equal(donor[0].origin,s.origin);assert(donor[0].socket==='relic'||!v.contributions.some(c=>c.role==='primary'&&c.socket===donor[0].socket));}
 const g=generateMonsterV3(`${p.label} with ${s.label}`);assert.equal(g.v3.primaryId,p.id);assert.equal(g.v3.secondaryId,p===s?undefined:s.id);
}
const review=process.argv.includes('--review'),dir='artifacts/v3-design';if(review)mkdirSync(dir,{recursive:true});
const signatures=new Set();
for(let page=0;page<5;page++){
 const sheet=createCanvas(1280,780),ctx=sheet.getContext('2d');ctx.fillStyle='#161e27';ctx.fillRect(0,0,1280,780);
 for(let i=0;i<10;i++){
  const s=SPECIES[page*10+i],g=generateMonsterV3(s.label),{rig,dispose}=buildMonster(g);assert.equal(g.v3.primaryId,s.id);
  applyAnimationV3(rig,g.idle,{assemble:1,time:0,reducedMotion:true});rig.root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(rig.creature);assert(box.min.y>=-.3,s.id+' floor');assert(box.max.y<4.1,s.id+' height');
  const shape=[];rig.creature.traverse(o=>{if(o.isMesh){assert(o.geometry.attributes.position.count>0,s.id+' empty mesh');shape.push([o.geometry.attributes.position.count,o.position.toArray(),o.scale.toArray(),o.material.color.getHex()]);}});signatures.add(JSON.stringify(shape));
  assert.equal(rig.legs.length,g.anatomy.legCount,s.id+' legs');assert.equal(rig.arms.length,g.anatomy.armCount,s.id+' arms');assert.equal(rig.eyes.length,g.anatomy.eyes.count,s.id+' eyes');
  dispose();
  if(review){const x=i%5*256,y=Math.floor(i/5)*390;const bg=createCanvas(256,320);paintBackground(bg.getContext('2d'),256,320,g,0);ctx.drawImage(bg,x,y+22);ctx.drawImage(renderMesh(g,s.form==='quadruped'||s.form==='centaur'?.55:.12).canvas,x,y+22);ctx.fillStyle='#eee4ce';ctx.font='bold 18px sans-serif';ctx.fillText(s.label,x+12,y+363);ctx.fillStyle='#9faeaf';ctx.font='12px sans-serif';ctx.fillText(`${String(s.reference).padStart(2,'0')} / ${s.origin.toUpperCase()}`,x+12,y+383);}
 }
 if(review)writeFileSync(`${dir}/creatures-${page+1}.png`,sheet.toBuffer('image/png'));
}
assert.equal(signatures.size,50);
for(let i=0;i<50;i++){
 const g=generateMonsterV3(`${SPECIES[i].label} with ${SPECIES[(i+17)%50].label}`),{rig,dispose}=buildMonster(g);
 const donor=g.v3.contributions.find(c=>c.role==='secondary');let found=false;
 rig.root.traverse(o=>{if(o.name===`secondary:${donor.sourceId}:${donor.feature}`)o.traverse(child=>{if(child.isMesh)found=true;});});assert(found,g.input+' must construct the donated geometry');
 for(const time of [0,2,7]){applyAnimationV3(rig,g.idle,{assemble:1,time,reducedMotion:false});rig.root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(rig.creature);assert(Number.isFinite(box.max.y)&&box.max.y<4.6,g.input+' stable hybrid bounds');}
 dispose();
}
console.log('Passed: all 2,500 ordered pairings preserve anchors and provenance; 50 distinct primary rigs and 50 animated hybrid rigs with actual donor geometry.');
