import './register-typescript.mjs';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {renderMesh} from './render-mesh.mjs';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const {applyAnimation}=await import('../src/monster/animate.ts');
const {paintBackground}=await import('../src/monster/background.ts');
const {GARMENTS,ENVIRONMENTS,SUMMON_TYPES}=await import('../src/generator/visualTypes.ts');
const base=generateMonster('presentation-review');Object.assign(base.anatomy,{body:'barrel',head:'wide',horns:'none',wings:'none',back:'none',skin:'bone',armCount:2,legCount:2,mutations:[]});Object.assign(base.visual,{garment:'none',accessories:[],rig:'biped',marking:'none'});base.visual.summon.type='sigil';
const entries=[...['bat','feather','insect','stub'].map(type=>['wing',type]),...GARMENTS.map(type=>['garment',type])];
const sheet=createCanvas(1536,Math.ceil(entries.length/6)*350),ctx=sheet.getContext('2d');ctx.fillStyle='#181320';ctx.fillRect(0,0,sheet.width,sheet.height);
for(let i=0;i<entries.length;i++){
 const [category,type]=entries[i],g=structuredClone(base);if(category==='wing')g.anatomy.wings=type;else g.visual.garment=type;
 const out=renderMesh(g);ctx.drawImage(out.canvas,i%6*256,Math.floor(i/6)*350);ctx.fillStyle='#eee3ff';ctx.font='16px sans-serif';ctx.fillText(`${category}: ${type}`,i%6*256+15,Math.floor(i/6)*350+338);
}
writeFileSync('artifacts/wing-garment-review.png',sheet.toBuffer('image/png'));
const backgrounds=createCanvas(1000,600),bc=backgrounds.getContext('2d');
for(const [i,type] of ENVIRONMENTS.entries()){
 const g=structuredClone(base);g.visual.environment.type=type;g.visual.environment.motion='drift';
 const c=createCanvas(96,96),c2=createCanvas(96,96);paintBackground(c.getContext('2d'),96,96,g,0);paintBackground(c2.getContext('2d'),96,96,g,7);
 assert.notDeepEqual(c.toBuffer('image/png'),c2.toBuffer('image/png'),`${type} drift must alter pixels`);
 bc.imageSmoothingEnabled=false;bc.drawImage(c,i%5*200,Math.floor(i/5)*200,200,180);bc.fillStyle='#17121e';bc.fillRect(i%5*200,Math.floor(i/5)*200+180,200,20);bc.fillStyle='#eee3ff';bc.font='13px sans-serif';bc.fillText(type,i%5*200+8,Math.floor(i/5)*200+195);
}
writeFileSync('artifacts/background-review.png',backgrounds.toBuffer('image/png'));
const signatures=new Set();
for(const type of SUMMON_TYPES){const g=structuredClone(base);g.visual.summon.type=type;const {rig,dispose}=buildMonster(g);applyAnimation(rig,g.idle,{assemble:.35,time:.5,reducedMotion:false});signatures.add(JSON.stringify([rig.root.position.toArray(),rig.root.rotation.toArray(),rig.body.scale.toArray(),rig.creature.visible,!!rig.pixelCloud]));if(type==='shadow'){const eyeMaterials=[];rig.head.traverse(o=>{if(o.isMesh&&o.material.userData.summonEye)eyeMaterials.push(o.material);});for(const mat of eyeMaterials)assert.ok(mat.color.equals(mat.userData.restColor),'shadow must preserve early eye brightness');}
 applyAnimation(rig,g.idle,{assemble:1,time:3,reducedMotion:false});assert.ok(rig.creature.visible,type);if(rig.pixelCloud)assert.equal(rig.pixelCloud.mesh.visible,false);dispose();}
assert.ok(signatures.size>=7,'summon motion must differ (sigil and parts also differ in timing)');
console.log('Passed: 15 backgrounds change over time; summon poses differ and settle; generated controlled wing/garment comparison sheet.');
