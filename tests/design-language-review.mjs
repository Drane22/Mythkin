import './register-typescript.mjs';
import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {renderMesh} from './render-mesh.mjs';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {DESIGN_FAMILIES,DESIGN_COLORS,referenceSpecimen}=await import('../src/monster/designLanguage.ts');
const {paintBackground}=await import('../src/monster/background.ts');
const {paintAtmosphere}=await import('../src/monster/atmosphere.ts');
const {REACTION_KINDS}=await import('../src/monster/reaction.ts');
mkdirSync('artifacts/design-language',{recursive:true});
const descriptions={trickster:['THE TALISMAN IMP','Split red horns / uneven grin / long tongue'],solar:['THE CRESCENT WATCHER','Golden crescent / slit eye / ritual collar'],warden:['THE MOSS KEEPER','Antler skull / leaf mantle / spirit staff'],oracle:['THE THREE-EYED ORACLE','Hanging halo / three eyes / open palms']};
const specimens=DESIGN_FAMILIES.map(family=>referenceSpecimen(generateMonster('reference-'+family),family));
function frame(g,time=0,state={assemble:1,time,reducedMotion:true}){
 const out=createCanvas(256,320),ctx=out.getContext('2d'),bg=createCanvas(128,160),fg=createCanvas(128,160);
 paintBackground(bg.getContext('2d'),128,160,g,time);ctx.imageSmoothingEnabled=false;ctx.drawImage(bg,0,0,256,320);
 ctx.drawImage(renderMesh(g,0,state).canvas,0,0);
 paintAtmosphere(fg.getContext('2d'),128,160,g,time,true);ctx.drawImage(fg,0,0,256,320);
 return out;
}
const board=createCanvas(1728,1000),ctx=board.getContext('2d');ctx.fillStyle='#10161a';ctx.fillRect(0,0,1728,1000);ctx.imageSmoothingEnabled=false;
ctx.fillStyle='#d7c7ac';ctx.font='15px sans-serif';ctx.fillText('MYTHKIN  /  NEW DESIGN LANGUAGE',40,40);
ctx.font='42px serif';ctx.fillText('The carved bestiary',40,99);ctx.font='17px sans-serif';ctx.fillStyle='#96a39b';ctx.fillText('Warm bone. Ritual relics. Living miniature habitats.',42,134);
for(const [i,family] of DESIGN_FAMILIES.entries()){
 const g=specimens[i],x=40+i*416;
 const picture=frame(g,2);ctx.drawImage(picture,x,171,400,500);
 ctx.fillStyle='#d7c7ac';ctx.font='20px serif';ctx.fillText(descriptions[family][0],x,710);
 ctx.fillStyle='#96a39b';ctx.font='13px sans-serif';ctx.fillText(descriptions[family][1],x,737);
 const image=renderMesh(g).canvas;writeFileSync(`artifacts/design-language/${family}.png`,image.toBuffer('image/png'));
}
ctx.fillStyle='#293334';ctx.fillRect(40,777,1648,1);
ctx.fillStyle='#d7c7ac';ctx.font='18px serif';ctx.fillText('Material language',40,821);
const swatches=[['Bone',DESIGN_COLORS.bone],['Shadow',DESIGN_COLORS.socket],['Vermilion',DESIGN_COLORS.vermilion],['Old gold',DESIGN_COLORS.gold],['Moss',DESIGN_COLORS.moss],['Teal',DESIGN_COLORS.teal],['Spirit light',DESIGN_COLORS.spirit]];
for(const [i,[label,color]] of swatches.entries()){ctx.fillStyle=color;ctx.fillRect(40+i*154,842,132,39);ctx.fillStyle='#aab2a6';ctx.font='13px sans-serif';ctx.fillText(label,40+i*154,904);}
ctx.fillStyle='#7e8a85';ctx.font='14px sans-serif';ctx.fillText('Controlled reference specimens rendered from the rewritten application geometry, materials and habitats.',40,952);
ctx.fillText('Software rendering; live WebGL lighting can differ.',40,976);
writeFileSync('artifacts/design-language/board.png',board.toBuffer('image/png'));
console.log('Rendered final design board.');
const variants=createCanvas(1280,780),vc=variants.getContext('2d');vc.fillStyle='#10161a';vc.fillRect(0,0,1280,780);vc.imageSmoothingEnabled=false;
const names=['Amihan','Rafael','Nadia','Yuki','Tala','Santiago','Mira','Kofi','Aisha','Mateo','Hana','Basil'];
for(const [i,name] of names.entries()){const g=generateMonster(name),x=i%6*212,y=Math.floor(i/6)*375;vc.drawImage(frame(g,2),x,y,212,265);vc.fillStyle='#d7c7ac';vc.font='17px serif';vc.fillText(name,x+12,y+294);vc.fillStyle='#84938c';vc.font='12px sans-serif';vc.fillText(`${g.anatomy.body} / ${g.anatomy.eyes.count} eyes`,x+12,y+317);}
writeFileSync('artifacts/design-language/generated-names.png',variants.toBuffer('image/png'));
console.log('Rendered twelve unmodified generated names.');
const frameCount=24,duration=6;
for(const [i,family] of DESIGN_FAMILIES.entries()){
 const strip=createCanvas(256*frameCount,320),sc=strip.getContext('2d');
 for(let f=0;f<frameCount;f++){const time=f/frameCount*duration;sc.drawImage(frame(specimens[i],time,{assemble:1,time,reducedMotion:false}),f*256,0);}
 writeFileSync(`artifacts/design-language/${family}-idle.png`,strip.toBuffer('image/png'));
 console.log(`Rendered ${family} living habitat and idle strip.`);
}
for(const kind of [...REACTION_KINDS,'glitch']){
 const g=structuredClone(specimens[0]);if(kind==='glitch')g.visual.summon.type='glitch';
 const strip=createCanvas(256*12,320),sc=strip.getContext('2d');
 for(let f=0;f<12;f++){
  const age=f/11*2.4,state={assemble:kind==='glitch'?f/11:1,time:age+4,reducedMotion:false};
  if(kind!=='glitch')state.reaction={kind,age,intensity:1,anger:0,direction:1};
  sc.drawImage(frame(g,age,state),f*256,0);
 }
 writeFileSync(`artifacts/design-language/${kind}.png`,strip.toBuffer('image/png'));
}
writeFileSync('artifacts/design-language/index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mythkin — the carved bestiary</title><style>*{box-sizing:border-box}body{background:#10161a;color:#d7c7ac;font:16px system-ui;margin:0;padding:32px}main{max-width:1728px;margin:auto}h1,h2{font-family:Georgia,serif;font-weight:400}h1{font-size:44px}p{color:#a2afa5;line-height:1.6}img{max-width:100%;image-rendering:pixelated}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(256px,1fr));gap:24px;margin-block:32px}.motion{width:256px;height:320px;image-rendering:pixelated;animation:play var(--duration,6s) steps(var(--frames,24)) infinite;background-repeat:no-repeat}section{padding:20px;background:#151e21;border:1px solid #2a3535}button{border:1px solid #596b62;background:#202e2b;color:#e7d7bb;padding:12px 20px;font:inherit;cursor:pointer}body.paused .motion{animation-play-state:paused}@keyframes play{to{background-position:var(--end,-6144px) 0}}@media(prefers-reduced-motion:reduce){.motion{animation:none;background-position:-1536px 0}}@media(max-width:600px){body{padding:16px}h1{font-size:32px}}</style><main><h1>The carved bestiary</h1><p>The rebuilt geometry and living habitats. These are rendered animation frames from the application, not concept illustrations. Live WebGL lighting can differ.</p><button id="pause" type="button" aria-pressed="false">Pause motion</button><img src="board.png" alt="Four reference specimens, habitats and the bone, red, moss, gold and spirit-light palette"><h2>Living habitats and idle gestures</h2><div class="grid">${DESIGN_FAMILIES.map(f=>`<section><h2>${descriptions[f][0]}</h2><div class="motion" role="img" aria-label="Animated ${f} with moving habitat" style="background-image:url(${f}-idle.png)"></div><p>${descriptions[f][1]}</p></section>`).join('')}</div><h2>Reactions and glitch reconstruction</h2><div class="grid">${[...REACTION_KINDS,'glitch'].map(kind=>`<section><h2>${kind}</h2><div class="motion" role="img" aria-label="${kind} animation" style="--frames:12;--duration:2.6s;--end:-3072px;background-image:url(${kind}.png)"></div></section>`).join('')}</div><h2>Actual name-generated variants</h2><p>Twelve ordinary names passed directly to the generator. No specimen overrides.</p><img src="generated-names.png" alt="Twelve actual generated Mythkin"></main><script>const button=document.getElementById('pause');button.onclick=()=>{const paused=document.body.classList.toggle('paused');button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));};const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.style.animationPlayState=entry.isIntersecting?'':'paused'));document.querySelectorAll('.motion').forEach(el=>observer.observe(el));</script></html>`);
console.log('Completed design-language board, generated variants, four habitats and seven reaction/summon previews.');
