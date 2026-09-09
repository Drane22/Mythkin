import './register-typescript.mjs';
import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
const {renderMesh}=await import('./render-mesh.mjs');
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {paintBackground}=await import('../src/monster/background.ts');
mkdirSync('artifacts/batch-review',{recursive:true});
let maxMeshes=0,maxTriangles=0,totalTriangles=0;
const started=Date.now();
for(let page=0;page<25;page++){
 const sheet=createCanvas(1280,1160),ctx=sheet.getContext('2d');ctx.fillStyle='#100e16';ctx.fillRect(0,0,1280,1160);
 for(let j=0;j<40;j++){
  const i=page*40+j,g=generateMonster(`diversity-${i}`),out=renderMesh(g),x=j%8*160,y=Math.floor(j/8)*225;
  maxMeshes=Math.max(maxMeshes,out.meshes);maxTriangles=Math.max(maxTriangles,out.triangles);totalTriangles+=out.triangles;
  const bg=createCanvas(160,200);paintBackground(bg.getContext('2d'),160,200,g);ctx.drawImage(bg,x,y);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(out.canvas,x,y,160,200);ctx.fillStyle='#ede3ff';ctx.font='10px sans-serif';ctx.fillText(`${i}: ${g.anatomy.body}`,x+4,y+211);ctx.fillText(`${g.visual.paletteFamily} / ${g.visual.garment}`,x+4,y+222);
 }
 ctx.fillStyle='#bca8d2';ctx.font='13px sans-serif';ctx.fillText(`Mythkin v2 — names diversity-${page*40} to diversity-${page*40+39}. CPU geometry + textures; live WebGL lighting differs.`,10,1144);
 writeFileSync(`artifacts/batch-review/${String(page+1).padStart(2,'0')}.png`,sheet.toBuffer('image/png'));
 console.log(`Rendered ${(page+1)*40}/1000`);
}
writeFileSync('artifacts/batch-review/index.html',`<!doctype html><meta charset="utf-8"><title>Mythkin v2 batch review</title><style>body{background:#100e16;color:#e4d8f4;font:16px system-ui;max-width:1280px;margin:auto}img{width:100%;image-rendering:pixelated}a{color:#c496ff}</style><h1>1,000 deterministic Mythkin</h1><p>Software projection of actual geometry and textures, with generated backgrounds. This is not a browser screenshot.</p>${Array.from({length:25},(_,i)=>`<h2>Names ${i*40}–${i*40+39}</h2><img loading="lazy" src="${String(i+1).padStart(2,'0')}.png">`).join('')}`);
writeFileSync('artifacts/geometry-budget.json',JSON.stringify({sample:1000,maxMeshes,maxTriangles,meanTriangles:Math.round(totalTriangles/1000),cpuReviewSeconds:(Date.now()-started)/1000,note:'Geometry measurements, not mobile frame-rate measurements.'},null,2));
