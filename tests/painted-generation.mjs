import './register-typescript.mjs';
import assert from 'node:assert/strict';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {SPECIES}=await import('../src/creatures/catalog/index.ts');
const {PAINTED_ARTWORKS}=await import('../src/painted/artworks.ts');
const {skinWeights,deformPoint,paintedMotion}=await import('../src/painted/motion.ts');
const {individualPoint}=await import('../src/painted/variation.ts');
const {portraitRect}=await import('../src/painted/portrait.ts');

for(const species of SPECIES){
 const direct=generateMonster(species.label,4);
 assert.equal(direct.v3.primaryId,species.id);assert.equal(direct.v3.secondaryId,undefined);assert.equal(direct.v3.appearance.aspect,'Original');
 assert.ok(direct.v3.contributions.every(c=>c.sourceId===species.id));
 assert.deepEqual(direct,generateMonster(species.label,4));
 const a=generateMonster(`${species.label} named Amihan`,4),b=generateMonster(`${species.label} named Mira`,4);
 assert.notDeepEqual(a.v3.appearance,b.v3.appearance);
}
const selected=new Set();
for(let i=0;i<800;i++){
 const g=generateMonster(`painted-person-${i}`,4);selected.add(g.v3.primaryId);
 assert.equal(g.v3.secondaryId,undefined);assert.equal(g.mythology.secondary,undefined);
 assert.deepEqual(g,generateMonster(`painted-person-${i}`,4));
}
assert.equal(selected.size,50,'All 50 species remain reachable by ordinary names');
assert.deepEqual(generateMonster('  Amihan  ',4),generateMonster('amihan',4));
for(const art of Object.values(PAINTED_ARTWORKS)){
 const rect=portraitRect(art,800,1000);assert.ok(Math.abs(rect.w/rect.h-art.width/art.height)<1e-10);
 const out={x:0,y:0};
 for(const anchor of art.rig.anchors??[])for(const time of [0,1,2,4,5]){
   const [x,y]=anchor.center,w=skinWeights(x,y,art.rig),m=paintedMotion(time,0,1,.15,false,art.rig.profile);
   deformPoint(x,y,w,art.rig,m,out);
   assert.ok(Math.abs(out.x-x)<.00001&&Math.abs(out.y-y)<.00001,`${art.id}: authored ground contact stays fixed`);
 }
 const a=generateMonster(`${art.id} named Amihan`,4).v3.appearance,b=generateMonster(`${art.id} named Mira`,4).v3.appearance;
 let displacement=0;
 for(let y=.05;y<1;y+=.05)for(let x=.05;x<1;x+=.05){
   const w=skinWeights(x,y,art.rig);const pa=individualPoint(x,y,w,art.rig,a,{x,y}),pb=individualPoint(x,y,w,art.rig,b,{x,y});
   displacement+=Math.hypot(pa.x-pb.x,pa.y-pb.y);
 }
 assert.ok(displacement>.05,`${art.id}: individuals have visible shape variation as well as pigment`);
}
console.log(`Passed: 50 species reachable, deterministic v4 names, single-species anatomy, distinct individuals, and ${Object.keys(PAINTED_ARTWORKS).length} authored rigs with correct aspect and anchored feet.`);
