import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const { SPECIES_BY_ID }=await import('../src/creatures/catalog/index.ts');
const { surfaceMaps,surfaceKind,MATERIAL_RESPONSE }=await import('../src/creatures/geometry/surfaces.ts');
const { buildMonster }=await import('../src/monster/buildMonster.ts');
const { generateMonsterV3 }=await import('../src/creatures/generateV3.ts');
const { contour,sections }=await import('../src/creatures/geometry/anatomy.ts');
const materialExamples={fur:'fenrir',scales:'bakunawa',bark:'leshy',bone:'draugr',feathers:'harpy',hide:'grootslang',skin:'oni',cloth:'djinn'};
const hashes=new Set();
for(const [kind,id]of Object.entries(materialExamples)){
 const maps=surfaceMaps(SPECIES_BY_ID[id],kind);
 assert.equal(maps.kind,kind);if(kind!=='cloth')assert.equal(surfaceKind(SPECIES_BY_ID[id]),kind);
 assert.equal(maps.map.image.width,256);assert.notEqual(maps.map,maps.bump);assert.notEqual(maps.bump,maps.roughness);
 hashes.add(createHash('sha256').update(maps.map.image.data).digest('hex'));
 for(const texture of [maps.map,maps.bump,maps.roughness]){assert.ok(new Set(texture.image.data).size>4,`${kind} has real surface variation`);texture.dispose();}
}
assert.equal(hashes.size,8,'Every material needs a distinct field');
assert.ok(MATERIAL_RESPONSE.scales.roughness<MATERIAL_RESPONSE.fur.roughness);
assert.ok(MATERIAL_RESPONSE.bark.bump>MATERIAL_RESPONSE.skin.bump);
let maxTriangles=0,totalStrands=0;
for(const name of ['Fenrir','Minotaur named Amihan','Domovoi','Huli Jing','Bakunawa','Harpy','Leshy','Grootslang']){
 const {rig,dispose}=buildMonster(generateMonsterV3(name));let triangles=0,strands=0,feathers=0;
 rig.root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry;triangles+=(geometry.index?.count??geometry.attributes.position.count)/3;
  for(const attribute of ['position','normal','uv']){const values=geometry.attributes[attribute]?.array;if(values)for(const value of values)assert.ok(Number.isFinite(value),`${name}: finite ${attribute}`);}
  if(o.name==='surface:groomed-fur'){strands+=o.userData.strands;assert.ok(o.parent.isMesh,'Fur follows its animated surface');assert.equal(o.material.userData.surfaceKind,'fur');}
  if(o.name==='surface:contour-feathers')feathers+=o.userData.feathers;
  if(o.material.userData.surfaceKind)assert.ok(o.material.roughnessMap&&o.material.bumpMap);
 });
 if(['Bakunawa','Harpy','Leshy','Grootslang'].includes(name))assert.equal(strands,0,`${name} is not covered in fur`);
 else assert.ok(strands>500,`${name} has a modeled coat`);
 if(name==='Harpy')assert.ok(feathers>200,'Birds have body plumage as well as flight feathers');
 assert.ok(triangles<300000,`${name} stays within the portrait geometry budget: ${triangles}`);
 maxTriangles=Math.max(maxTriangles,triangles);totalStrands+=strands;
 const textures=new Set();rig.root.traverse(o=>{if(o.isMesh)for(const key of ['map','bumpMap','roughnessMap'])if(o.material[key])textures.add(o.material[key]);});
 const disposed=new Set();textures.forEach(t=>t.addEventListener('dispose',()=>disposed.add(t)));dispose();assert.equal(disposed.size,textures.size,'All texture resources disposed');
}
const round=contour(sections([[0,1,1],[1,1,1]]),32,2),position=round.attributes.position;
for(let i=0;i<33;i++)assert.ok(Math.abs(Math.hypot(position.getX(i),position.getZ(i))-1)<.00001,'Organic contours have rounded cross sections');
round.dispose();
console.log(`Passed: eight distinct PBR materials, rounded contours, ${totalStrands} rooted hairs, finite geometry, full texture disposal; largest sampled portrait ${maxTriangles} triangles.`);
