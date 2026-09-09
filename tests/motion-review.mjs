import './register-typescript.mjs';
import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {renderMesh} from './render-mesh.mjs';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {SUMMON_TYPES}=await import('../src/generator/visualTypes.ts');
mkdirSync('artifacts/motion-review',{recursive:true});
for(const type of SUMMON_TYPES){
 const g=generateMonster('motion-study');g.visual.summon.type=type;
 const sheet=createCanvas(256*12,320),ctx=sheet.getContext('2d');
 for(let frame=0;frame<12;frame++){const progress=Math.min(1,frame/9);const out=renderMesh(g,0,{assemble:progress,time:progress*2,reducedMotion:false});ctx.drawImage(out.canvas,frame*256,0);}
 writeFileSync(`artifacts/motion-review/${type}.png`,sheet.toBuffer('image/png'));
}
writeFileSync('artifacts/motion-review/index.html',`<!doctype html><meta charset="utf-8"><title>Mythkin summon motion review</title><style>body{background:#110d1b;color:#eee4ff;font:16px system-ui;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,256px);gap:24px}.motion{width:256px;height:320px;image-rendering:pixelated;animation:play 3s steps(12) infinite}@keyframes play{to{background-position:-3072px 0}}@media(prefers-reduced-motion:reduce){.motion{animation:none;background-position:-2304px 0}}</style><h1>Summon geometry review</h1><p>Software-rendered character motion. Browser lighting and ritual overlays are not included.</p><main>${SUMMON_TYPES.map(type=>`<section><h2>${type}</h2><div class="motion" style="background-image:url(${type}.png)"></div></section>`).join('')}</main>`);
console.log('Rendered eight animated summon previews, 12 frames each.');
