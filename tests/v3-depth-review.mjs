import './register-typescript.mjs';
import {createCanvas} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
const {generateMonsterV3}=await import('../src/creatures/generateV3.ts');
const {drawDistantLayers,drawGroundDepth}=await import('../src/environments/layers.ts');
const {drawArchitecture}=await import('../src/environments/architecture.ts');
const {habitatBrush}=await import('../src/environments/primitives.ts');
const {paintBackgroundV3,paintAtmosphereV3,ORIGIN_PALETTES,habitatFor}=await import('../src/environments/index.ts');
const board=createCanvas(1088,790),ctx=board.getContext('2d');
ctx.fillStyle='#10191e';ctx.fillRect(0,0,1088,790);ctx.font='20px sans-serif';ctx.fillStyle='#e6d6b4';ctx.fillText('MYTHKIN V3 / SCENERY DEPTH AND HUT CLEARANCE',18,29);
for(const [row,name] of ['Baba-Kin','Pontianak'].entries()){
 const g=generateMonsterV3(name),palette=ORIGIN_PALETTES[g.mythology.primary],id=habitatFor(g);
 for(let stage=0;stage<4;stage++){
  const c=createCanvas(128,160),cc=c.getContext('2d');
  if(stage===0)drawDistantLayers(cc,g,0);
  if(stage===1){drawArchitecture(habitatBrush(cc),id,palette,0);drawGroundDepth(cc,g,0);}
  if(stage===2)paintAtmosphereV3(cc,128,160,g,0,true);
  if(stage===3){paintBackgroundV3(cc,128,160,g,0);const foreground=createCanvas(128,160);paintAtmosphereV3(foreground.getContext('2d'),128,160,g,0,true);cc.drawImage(foreground,0,0);}
  const x=16+stage*268,y=53+row*363;ctx.fillStyle='#1d2d33';ctx.fillRect(x,y,256,320);ctx.imageSmoothingEnabled=false;ctx.drawImage(c,x,y,256,320);
  ctx.fillStyle='#bdc9bd';ctx.font='12px sans-serif';ctx.fillText(`${id} / ${['Distant planes','Architecture and ground','Separate foreground','Application composite'][stage]}`,x,y+340);
 }
}
mkdirSync('artifacts/v3-habitats',{recursive:true});writeFileSync('artifacts/v3-habitats/depth-layers.png',board.toBuffer('image/png'));
console.log('Rendered birch and mangrove depth planes and actual application composites.');
