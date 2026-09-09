import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync } from 'node:fs';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {MYTHOLOGIES}=await import('../src/generator/mythology.ts');
const {colorDistance}=await import('../src/generator/visualProfile.ts');
const {generateMonster:legacy}=await import('../src/generator/generateMonsterV1.ts');
const wanted=new Set(Object.values(MYTHOLOGIES).flatMap(f=>f.archetypes.map(a=>a.name.toUpperCase()))),witnesses={};
const stats={mythology:{},body:{},head:{},horns:{},rig:{},palette:{},garment:{},background:{},summon:{},mutation:{}};
const add=(category,value)=>stats[category][value]=(stats[category][value]??0)+1;
for(let i=0;i<20000;i++){
 const name=`diversity-${i}`,g=generateMonster(name),v=g.visual,c=v.colors;
 if(g.identity.archetype)witnesses[g.identity.archetype]??=name;
 if(i<1000){
  add('mythology',g.mythology.primary);add('body',g.anatomy.body);add('head',g.anatomy.head);add('horns',g.anatomy.horns);add('rig',v.rig);add('palette',v.paletteFamily);add('garment',v.garment);add('background',v.environment.type);add('summon',v.summon.type);add('mutation',v.paletteMutation??'none');
 }
 if(i<4000){
  assert.deepEqual(g,generateMonster(name));
  Object.values(c).forEach(x=>assert.match(x,/^#[0-9a-f]{6}$/i));
  for(const [x,y,min] of [['bodyPrimary','bodySecondary',.18],['eyePrimary','bodyPrimary',.28],['mouthInterior','bodyPrimary',.3]])assert.ok(colorDistance(c[x],c[y])>=min-1e-8,`${name}: ${x}/${y}`);
  assert.ok(Math.max(colorDistance(c.bodyPrimary,c.backgroundPrimary),colorDistance(c.bodyHighlight,c.backgroundPrimary))>=.32,'body or lit contour must separate from dark environment');
  assert.equal(g.palette.body,c.bodyPrimary);
  if(g.mythology.secondary)assert.ok(v.accessories.some(a=>a.source===g.mythology.secondary));
 }
}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/diversity-metrics.json',JSON.stringify({sample:1000,witnessSearch:20000,stats,witnesses,missing:[...wanted].filter(n=>!witnesses[n])},null,2));
assert.deepEqual([...wanted].filter(n=>!witnesses[n]),[],'Every archetype needs an actual generated name witness');
for(const name of ['Drane','Moonling','Jade','review-15'])assert.deepEqual(generateMonster(name,1),legacy(name));
for(const [category,count] of [['mythology',14],['body',8],['head',9],['horns',8],['palette',19],['background',15],['summon',8]])assert.equal(Object.keys(stats[category]).length,count,category);
assert.ok(stats.garment.none>200,'unclothed creatures remain common');
console.log('Passed: 53 real-name archetype witnesses, 4,000 palette checks, all palette/background/summon families, v1 identity compatibility.');
