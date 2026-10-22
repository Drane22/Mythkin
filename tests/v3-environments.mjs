import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
// Keep the environment test isolated from the creature generator under development.
const {generateMonster}=await import('../src/generator/generateMonsterV2.ts');
const {paintBackgroundV3,paintAtmosphereV3,HABITATS,ORIGIN_HABITATS}=await import('../src/environments/index.ts');
const {paintBackgroundV2}=await import('../src/monster/backgroundV2.ts');
const {ENVIRONMENTS}=await import('../src/generator/visualTypes.ts');

function png(painter,g,time,foreground=true) {
  const ctx=createCanvas(128,160).getContext('2d');
  ctx.globalAlpha=.72;
  painter(ctx,128,160,g,time,foreground);
  assert.ok(Math.abs(ctx.globalAlpha-.72)<.005,'painter restores caller globalAlpha');
  return ctx.canvas.toBuffer('image/png');
}
const signatures=new Set(),atmosphereSignatures=new Set();
const elapsed=[];
for(const [id,habitat] of Object.entries(HABITATS)) {
  const g=generateMonster('habitat-v3-review');
  g.v3={...g.v3,habitat:id};g.mythology.primary=habitat.origin;g.visual.environment.motion='drift';
  const serialized=JSON.stringify(g);
  const first=png(paintBackgroundV3,g,0),later=png(paintBackgroundV3,g,6);
  signatures.add(first.toString('base64'));
  assert.notDeepEqual(first,later,`${id} habitat has temporal motion`);
  assert.deepEqual(later,png(paintBackgroundV3,g,6),`${id} deterministic at exact time`);
  assert.deepEqual(first,png(paintBackgroundV3,g,0),`${id} time=0 repeats after later frame`);
  for(const foreground of [false,true]) {
    const a=png(paintAtmosphereV3,g,0,foreground),b=png(paintAtmosphereV3,g,6,foreground);
    assert.notDeepEqual(a,b,`${id} ${foreground?'near':'far'} particles move`);
    assert.deepEqual(b,png(paintAtmosphereV3,g,6,foreground),`${id} particles deterministic`);
    atmosphereSignatures.add(a.toString('base64'));
  }
  assert.equal(JSON.stringify(g),serialized,'painting never mutates lineage or visual profile');
  g.visual.environment.motion='none';
  assert.deepEqual(png(paintBackgroundV3,g,0),png(paintBackgroundV3,g,19),`${id} background respects disabled motion`);
  assert.deepEqual(png(paintAtmosphereV3,g,0),png(paintAtmosphereV3,g,19),`${id} particles respect disabled motion`);
  const ctx=createCanvas(256,320).getContext('2d');
  g.visual.environment.motion='drift';
  for(let i=0;i<3;i++)paintBackgroundV3(ctx,256,320,g,i*.2);
  const start=performance.now();
  for(let i=0;i<12;i++){paintBackgroundV3(ctx,256,320,g,i*.2);paintAtmosphereV3(ctx,256,320,g,i*.2);}
  elapsed.push([id,(performance.now()-start)/12]);
}
assert.equal(signatures.size,14,'every origin setting has distinct geometry');
assert.equal(atmosphereSignatures.size,28,'origin palette and depth produce distinct atmospheres');
assert.equal(new Set(Object.values(ORIGIN_HABITATS)).size,14);

// Compatibility: no v3 metadata means the original fifteen backgrounds survive unchanged.
for(const type of ENVIRONMENTS){
  const g=generateMonster('retained-habitats');delete g.v3;g.visual.environment.type=type;
  const ctx=createCanvas(128,160).getContext('2d');
  paintBackgroundV2(ctx,128,160,g,3);
  assert.deepEqual(png(paintBackgroundV3,g,3),ctx.canvas.toBuffer('image/png'),`${type} legacy habitat retained`);
}
const worst=elapsed.toSorted((a,b)=>b[1]-a[1])[0];
console.log(`Passed: 14 distinct v3 habitats, 28 deterministic particle layers, motion-off behavior, immutable genotypes and all 15 legacy habitats. Native-canvas 256x320 worst mean: ${worst[0]} ${worst[1].toFixed(2)} ms/frame (background + atmosphere; excludes WebGL).`);

if(process.argv.includes('--review')) {
  mkdirSync('artifacts/v3-habitats',{recursive:true});
  for(const time of [0,6]) {
    const board=createCanvas(1120,520),ctx=board.getContext('2d');
    ctx.fillStyle='#10191e';ctx.fillRect(0,0,1120,520);
    ctx.fillStyle='#e6d6b4';ctx.font='19px sans-serif';ctx.fillText('MYTHKIN V3 / ORIGIN HABITATS',20,29);
    ctx.fillStyle='#9ea9a4';ctx.font='11px sans-serif';ctx.fillText(`14 distinct miniature settings · application Canvas render · t = ${time}s`,20,49);
    let i=0;
    for(const [id,habitat] of Object.entries(HABITATS)) {
      const g=generateMonster('habitat-v3-review');g.v3={habitat:id};g.mythology.primary=habitat.origin;g.visual.environment.motion='drift';
      const c=createCanvas(128,160),cc=c.getContext('2d'),near=createCanvas(128,160);
      paintBackgroundV3(cc,128,160,g,time);paintAtmosphereV3(near.getContext('2d'),128,160,g,time);cc.drawImage(near,0,0);
      const x=16+(i%7)*158,y=66+Math.floor(i/7)*222;
      ctx.imageSmoothingEnabled=false;ctx.drawImage(c,x,y,144,180);
      ctx.fillStyle='#e6d6b4';ctx.font='11px sans-serif';ctx.fillText(habitat.label,x,y+197);
      ctx.fillStyle='#80948e';ctx.font='10px sans-serif';ctx.fillText(habitat.origin.toUpperCase(),x,y+212);
      i++;
    }
    writeFileSync(`artifacts/v3-habitats/board-${time}.png`,board.toBuffer('image/png'));
  }
  writeFileSync('artifacts/v3-habitats/index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mythkin v3 habitat review</title><style>body{margin:24px;background:#10191e;color:#e6d6b4;font:15px system-ui}img{max-width:100%;height:auto;image-rendering:pixelated}button{padding:10px 18px;margin:0 10px 16px 0;background:#293e42;color:inherit;border:1px solid #64756c;cursor:pointer}</style><p>Application-rendered habitats. Compare the same seeded settings at two timestamps; live animation runs in the app.</p><button onclick="document.querySelector('img').src='board-0.png'">Time 0s</button><button onclick="document.querySelector('img').src='board-6.png'">Time 6s</button><img src="board-0.png" alt="Fourteen Mythkin habitats with distinct regional architecture and primary lineage palettes"></html>`);
}
