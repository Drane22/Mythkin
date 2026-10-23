import './register-typescript.mjs';
import assert from 'node:assert/strict';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { paintedMotion, skinWeights, deformPoint } from '../src/painted/motion.ts';

const rig = { head:[.62,.34], headBottom:.37, chest:[.52,.43], shoulders:[[.29,.30],[.77,.33]], eyes:[[.581,.210],[.699,.219]], eyeRadius:[.020,.012], ground:.92, tail:[.16,.80] };
const out = { x:0, y:0 };
const at = (x,y,motion) => ({...deformPoint(x,y,skinWeights(x,y,rig),rig,motion,out)});
let blinkFrames = 0;
for (let time = 0; time < 18; time += 1/60) {
  const motion = paintedMotion(time, 1.3, Math.sin(time), time % 2);
  if (paintedMotion(time,1.3,0).blink > .5) blinkFrames++;
  for (const x of [.25,.35,.7,.8]) {
    const foot = at(x,.96,motion);
    assert.ok(Math.abs(foot.x-x)<1e-10 && Math.abs(foot.y-.96)<1e-10, 'Hooves must stay planted through breathing, attention and recoil');
  }
  for (const point of [[.5,.15],[.6,.32],[.27,.5],[.86,.56],[.16,.8]]) {
    const p = at(...point,motion);
    assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
    assert.ok(Math.hypot(p.x-point[0],p.y-point[1])<.04,'Motion stays within the portrait margin');
  }
}
assert.ok(blinkFrames>3 && blinkFrames<80,'Blink closes briefly, not continuously');
const rest = paintedMotion(4,3,1,.1,true);
for (const p of [[.6,.2],[.4,.45],[.15,.55],[.8,.8]]) assert.deepEqual(at(...p,rest),{x:p[0],y:p[1]},'Reduced motion leaves the original painting unchanged');
const inhale = at(.35,.43,paintedMotion(1.2,0,0));
const exhale = at(.35,.43,paintedMotion(3.6,0,0));
assert.ok(Math.abs(inhale.x-exhale.x)>.003,'Breathing changes the chest locally');

const image = await loadImage(new URL('../src/painted/assets/minotaur.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));
assert.equal(image.width,1122);assert.equal(image.height,1402);
const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
const pixels=ctx.getImageData(0,0,image.width,image.height).data;
let transparent=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparent++;
assert.ok(transparent/(image.width*image.height)>.25,'Real alpha cutout, no painted background rectangle');
console.log('Passed: painted motion keeps feet anchored, deforms the chest, blinks briefly, stays within bounds, freezes for reduced motion, and uses real alpha artwork.');
