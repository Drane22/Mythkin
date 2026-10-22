import './register-typescript.mjs';
import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {renderMesh} from './render-mesh.mjs';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {REACTION_KINDS}=await import('../src/monster/reaction.ts');
mkdirSync('artifacts/face-motion',{recursive:true});
const chosen=new Map(), scores=new Map();
for(let i=0;i<7000;i++){
 const g=generateMonster(`study-${i}`),a=g.anatomy;
 const candidates={
  'Horned trickster':(a.eyes.count===1?9:0)+(a.mouth==='tongue'?7:0)+(a.horns==='oni'?8:0)+(a.body==='tall'?4:0)-(a.wings!=='none'?8:0)-(a.legCount!==2?10:0)-(a.eyes.type==='hollow'?10:0),
  'Crescent watcher':(a.eyes.count===1?9:0)+(a.horns==='crown'?10:0)+(a.skin==='bone'?4:0)+(a.body==='tall'||a.body==='barrel'?3:0)-(a.wings!=='none'?8:0)-(a.legCount!==2?10:0)-(a.eyes.type==='hollow'?10:0),
  'Forest keeper':(a.horns==='antlers'?12:0)+(a.skin==='bark'||a.skin==='fur'?4:0)+(a.eyes.type==='hollow'?4:0)+(a.armCount===2?2:0)+(a.body==='barrel'?2:0)-(a.wings!=='none'?8:0)-(a.proportions.hornScale>1.8?10:0),
  'Three-eyed oracle':(a.eyes.count===3?9:0)+(a.mouth==='tongue'?6:0)+(a.horns==='crown'||a.mutations.includes('halo')?8:0)+(a.body==='barrel'?4:0)-(a.wings!=='none'?8:0)-(a.legCount!==2?10:0)-(a.eyes.type==='hollow'?10:0),
 };
 for(const [label,score] of Object.entries(candidates))if(!scores.has(label)||score>scores.get(label)){scores.set(label,score);chosen.set(label,g);}
}
const sheet=createCanvas(1280,430),ctx=sheet.getContext('2d');ctx.fillStyle='#100e17';ctx.fillRect(0,0,1280,430);ctx.imageSmoothingEnabled=false;
let column=0;
for(const [label,g] of chosen){ctx.drawImage(renderMesh(g).canvas,column*320,0,320,400);ctx.fillStyle='#e5d8c2';ctx.font='14px sans-serif';ctx.fillText(`${label} / ${g.input}`,column*320+12,420);column++;}
writeFileSync('artifacts/face-motion/faces.png',sheet.toBuffer('image/png'));
const g=chosen.get('Horned trickster');
for(const kind of [...REACTION_KINDS,'idle','glitch']){
 const sample=structuredClone(g);if(kind==='glitch')sample.visual.summon.type='glitch';
 const strip=createCanvas(256*12,320),sc=strip.getContext('2d');
 for(let frame=0;frame<12;frame++){
  const age=frame/11*2.4;
  const state={assemble:kind==='glitch'?frame/11:1,time:kind==='idle'?frame/11*6.5:4+age,reducedMotion:false};
  if(REACTION_KINDS.includes(kind))state.reaction={kind,age,intensity:1,anger:0,direction:1};
  sc.drawImage(renderMesh(sample,0,state).canvas,frame*256,0);
 }
 writeFileSync(`artifacts/face-motion/${kind}.png`,strip.toBuffer('image/png'));
}
writeFileSync('artifacts/face-motion/index.html',`<!doctype html><meta charset="utf-8"><title>Mythkin faces and motion</title><style>body{background:#100e17;color:#e5d8c2;font:16px system-ui;margin:24px}img{max-width:100%;image-rendering:pixelated}.grid{display:grid;grid-template-columns:repeat(auto-fit,256px);gap:20px}.motion{width:256px;height:320px;image-rendering:pixelated;animation:play 2.8s steps(12) infinite}@keyframes play{to{background-position:-3072px 0}}@media(prefers-reduced-motion:reduce){.motion{animation:none;background-position:-1536px 0}}</style><h1>Face and motion review</h1><p>Actual generated creatures; software-rendered geometry. Browser lighting and ritual overlays differ.</p><img src="faces.png" alt="Four generated creatures inspired by the supplied references"><div class="grid">${[...REACTION_KINDS,'idle','glitch'].map(kind=>`<section><h2>${kind}</h2><div class="motion" style="background-image:url(${kind}.png);${kind==='idle'?'animation-duration:6.5s':''}"></div></section>`).join('')}</div>`);
console.log('Rendered four reference-inspired generated faces and eight motion strips.');
