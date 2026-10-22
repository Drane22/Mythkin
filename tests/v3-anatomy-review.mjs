import './register-typescript.mjs';
import {mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const {SPECIES}=await import('../src/creatures/catalog/index.ts');
const {generateMonsterV3}=await import('../src/creatures/generateV3.ts');
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const {renderMesh}=await import('./render-mesh.mjs');
const dir='artifacts/v3-anatomy-rebuild';mkdirSync(dir,{recursive:true});
const inventory=JSON.parse(readFileSync('artifacts/v3-reference-audit/inventory.json','utf8'));
for(let i=1;i<=5;i++)copyFileSync(`artifacts/v3-design/creatures-${i}.png`,`${dir}/creatures-${i}.png`);
const metrics=[];
for(const s of SPECIES){
 const g=generateMonsterV3(s.label),{rig,dispose}=buildMonster(g);let meshes=0,spheres=0,contours=0;
 rig.creature.traverse(o=>{if(o.isMesh){meshes++;if(o.geometry.type==='SphereGeometry')spheres++;if(o.geometry.userData.anatomicalContour)contours++;}});
 metrics.push({id:s.id,meshes,spheres,contours,arms:rig.arms.length,legs:rig.legs.length,wings:rig.wings.length,jaws:rig.root.userData.jaws.length});dispose();
 const sheet=createCanvas(1280,350),ctx=sheet.getContext('2d');ctx.fillStyle='#19232b';ctx.fillRect(0,0,1280,350);
 for(let i=0;i<5;i++){
  const frame=i===4?{assemble:1,time:4,reducedMotion:false,reaction:{kind:'startle',age:.5,intensity:1,anger:.8,direction:1}}:{assemble:1,time:0,reducedMotion:true};
  ctx.drawImage(renderMesh(g,[0,.75,Math.PI/2,Math.PI,.30][i],frame).canvas,i*256,0);ctx.fillStyle='#c6cabc';ctx.font='13px sans-serif';ctx.fillText(['Front','Three quarter','Side','Back','Startle'][i],i*256+12,339);
 }
 writeFileSync(`${dir}/${s.id}-views.png`,sheet.toBuffer('image/png'));
 if(s.reference%10===0)console.log(`Rendered ${s.reference}/50 anatomy comparisons.`);
}
writeFileSync(`${dir}/geometry.json`,JSON.stringify(metrics,null,2));
for(let page=0;page<5;page++){
 const board=createCanvas(1280,1360),ctx=board.getContext('2d');ctx.fillStyle='#19232b';ctx.fillRect(0,0,1280,1360);
 for(let item=0;item<10;item++){
  const s=metrics[page*10+item],im=await loadImage(`${dir}/${s.id}-views.png`);
  for(let view=0;view<2;view++){
   const slot=item*2+view,x=slot%5*256,y=Math.floor(slot/5)*340;
   ctx.drawImage(im,(2+view)*256,0,256,320,x,y,256,320);ctx.fillStyle='#c6cabc';ctx.font='12px sans-serif';ctx.fillText(`${s.id} / ${view?'back':'side'}`,x+9,y+335);
  }
 }
 writeFileSync(`${dir}/side-back-${page+1}.png`,board.toBuffer('image/png'));
}
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=SPECIES.map((s,i)=>{
 const ref=`../../${encodeURI(inventory[s.reference-1].file)}`,pos=`-${i%5*256}px -${Math.floor(i%10/5)*390+22}px`,page=Math.floor(i/10)+1;
 return `<article data-origin="${s.origin}" id="${s.id}"><h2>${String(s.reference).padStart(2,'0')} / ${esc(s.label)} <small>${s.origin}</small></h2><div class="compare"><figure><a href="${ref}"><img loading="lazy" src="${ref}" alt="Supplied ${esc(s.label)} reference"></a><figcaption>YOUR REFERENCE</figcaption></figure><figure><div class="crop" role="img" aria-label="${esc(s.label)} before rebuild" style="background-image:url(../v3-anatomy-audit/creatures-${page}.png);background-position:${pos}"></div><figcaption>BEFORE / AUDITED SNAPSHOT</figcaption></figure><figure><div class="crop" role="img" aria-label="${esc(s.label)} rebuilt geometry" style="background-image:url(creatures-${page}.png);background-position:${pos}"></div><figcaption>REBUILT GEOMETRY</figcaption></figure></div><details><summary>Inspect front, three quarter, side, back and reaction</summary><img class="views" loading="lazy" src="${s.id}-views.png" alt="Five geometry views of ${esc(s.label)}"></details></article>`;
}).join('');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mythkin v3 / Anatomy rebuild</title><style>*{box-sizing:border-box}body{margin:0;background:#10191f;color:#e6dfd2;font:15px/1.6 system-ui}main{max-width:1120px;padding:48px 24px;margin:auto}h1,h2{font-weight:400;font-family:Georgia,serif;line-height:1.2}h1{font-size:48px;max-width:760px}h2{font-size:28px}p{max-width:880px;color:#b8c4c1}a{color:#e4bd82}nav{display:flex;gap:22px;flex-wrap:wrap}small{font:12px system-ui;color:#91aaa6}.eyebrow{font-size:11px;letter-spacing:.13em;color:#c3a77e}article{border-top:1px solid #344b4c;padding:24px 0 32px}.compare{display:grid;grid-template-columns:repeat(3,256px);gap:26px;justify-content:space-between}figure{margin:0;background:#19232b}figure img{width:256px;height:384px;object-fit:contain;image-rendering:pixelated;display:block}.crop{width:256px;height:320px;margin-block:32px;image-rendering:pixelated}figcaption{padding:10px;font-size:10px;letter-spacing:.09em;color:#a7c0b8}summary{cursor:pointer;padding:12px;border-bottom:1px solid #344b4c}details{margin-top:20px}.views{display:block;width:100%;height:auto;image-rendering:pixelated}select{font:inherit;padding:10px;color:#e6dfd2;background:#203139;border:1px solid #57716c}li{margin-bottom:8px}[hidden]{display:none!important}@media(max-width:870px){.compare{grid-template-columns:repeat(2,256px);justify-content:start}.compare figure:first-child{grid-column:1/-1}.compare figure:first-child img{height:320px}.compare figure:first-child{width:256px}}@media(max-width:580px){main{padding:24px 14px}h1{font-size:36px}.compare{grid-template-columns:256px;justify-content:center}.compare figure:first-child{grid-column:auto}}</style><body><main><div class="eyebrow">MYTHKIN / V3 / IMPLEMENTED GEOMETRY REVIEW</div><h1>Connected anatomy.<br>Shaped surfaces. Hinged faces.</h1><p>All 50 creatures shown against their supplied reference and the frozen audit snapshot. These are the implemented Three.js meshes. Expand a creature to inspect five additional angles and poses.</p><nav><a href="#catalog">50 comparisons</a><a href="../v3-design/index.html#mix">Hybrid and motion studies</a><a href="../v3-design/rituals.html">Summoning timelines</a><a href="../../docs/v3-anatomy-rebuild.md">Implementation and validation notes</a></nav><h2>What changed</h2><ul><li>Continuous torso contours with reference-specific chest, waist, hip and neck proportions; muscle relief belongs to the surface.</li><li>Embedded hip and shoulder pivots, shaped limbs, planted hoof and claw geometry, and sleeves attached to moving arms.</li><li>Skull contours, nasal bridges and nostrils, separate muzzles and mandibles, seated gum arches, and rotating jaw hinges.</li><li>Directional colour and bump textures; layered feather/fur shapes, folded garments and body-following serpent belly bands.</li><li>Upright Ahuizotl, armed Tengu, one wing pair for Pazuzu, cervid skulls, separated Zmey necks and external companion crests.</li></ul><p>Software rendering shows geometry, colour maps and sampled poses. It does not reproduce the browser's complete lighting or bump shading. A browser was unavailable for live WebGL and touch verification. The audit remains available as the record of the original defects; these comparisons let the visual result be assessed directly.</p><section id="catalog"><h2>The full collection</h2><label>Origin <select id="origin"><option value="all">All 50 creatures</option>${[...new Set(SPECIES.map(s=>s.origin))].map(s=>`<option>${s}</option>`).join('')}</select></label>${cards}</section></main><script>document.querySelector('#origin').addEventListener('change',e=>document.querySelectorAll('[data-origin]').forEach(x=>x.hidden=e.target.value!=='all'&&x.dataset.origin!==e.target.value));</script></body></html>`;
writeFileSync(`${dir}/index.html`,html);console.log('Wrote 50 before/reference/after comparisons and 250 angle/reaction renders.');
