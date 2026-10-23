import { mkdirSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createCanvas,loadImage } from '@napi-rs/canvas';

const origin=process.env.MYTHKIN_REVIEW_URL || 'http://127.0.0.1:5174';
const tabs=await(await fetch('http://127.0.0.1:9333/json')).json();
const tab=tabs.find(t=>t.type==='page');assert.ok(tab);
const socket=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map(),errors=[];let serial=0;
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const request=pending.get(m.id);pending.delete(m.id);m.error?request.reject(m.error):request.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async(expression)=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const waitFor=async(expression)=>{for(let i=0;i<160;i++){if(await evaluate(expression))return;await delay(200);}throw Error('Timed out '+expression+' '+JSON.stringify(errors));};
const dir='artifacts/painted-folklore';mkdirSync(dir,{recursive:true});
const screenshot=async(name)=>{const {data}=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${dir}/${name}.png`,Buffer.from(data,'base64'));};
const artPixels=()=>evaluate('document.querySelector(".painted-character").toDataURL()');
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:origin});
await waitFor('document.querySelector(".painted-canvas")?.dataset.assembled==="true"');
await evaluate('document.fonts.ready');await screenshot('desktop-home');
await evaluate(`(()=>{const el=document.querySelector('.name-input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'Minotaur');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await delay(80);await evaluate('document.querySelector(".summon-form").requestSubmit()');
await waitFor('!!document.querySelector(".mk-ritual")');await screenshot('desktop-summoning');
await waitFor('document.querySelector(".app-shell")?.dataset.phase==="result"');
await delay(300);await screenshot('desktop-result');
assert.equal(await evaluate('document.querySelector(".painted-canvas").dataset.artStatus'),'ready');
assert.equal(await evaluate('!!document.querySelector(".reset-view")'),false,'Painted portrait must not advertise 360-degree rotation');
const first=await artPixels();await delay(600);const second=await artPixels();assert.notEqual(first,second,'Actual rendered pixels animate');

const board=createCanvas(1600,1000),bc=board.getContext('2d');bc.fillStyle='#1b1720';bc.fillRect(0,0,1600,1000);
for(let i=0;i<4;i++){
  const frame=await loadImage(await artPixels());bc.drawImage(frame,i*400,0,400,500);
  // Inspect the actual rendered face, not a separate concept image.
  bc.drawImage(frame,320,40,360,360,i*400,500,400,400);
  bc.fillStyle='#eaddea';bc.font='18px sans-serif';bc.fillText(`Live frame ${i+1}`,i*400+20,950);
  await delay(600);
}
writeFileSync(`${dir}/motion-frames.png`,board.toBuffer('image/png'));
const recording=await evaluate(`new Promise(resolve=>{
  const output=document.createElement('canvas');output.width=640;output.height=800;
  const ctx=output.getContext('2d'),stream=output.captureStream(30),chunks=[];
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2800000});
  let frame;
  const draw=()=>{ctx.clearRect(0,0,640,800);ctx.drawImage(document.querySelector('.painted-background'),0,0,640,800);ctx.drawImage(document.querySelector('.painted-character'),0,0,640,800);frame=requestAnimationFrame(draw);};draw();
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{cancelAnimationFrame(frame);stream.getTracks().forEach(track=>track.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};
  recorder.start();setTimeout(()=>document.querySelector('.monster-hit-target').click(),3000);setTimeout(()=>recorder.stop(),6500);
})`);
writeFileSync(`${dir}/minotaur-motion.webm`,Buffer.from(recording,'base64'));
await evaluate('document.querySelector(".monster-hit-target").click()');
assert.equal(await evaluate('document.querySelector(".painted-canvas").dataset.reacting'),'true');
await delay(1500);
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(200);
const still=await artPixels();await delay(600);assert.equal(await artPixels(),still,'Reduced motion freezes rendered artwork');
for(const [width,height] of [[390,844],[360,640],[768,1024],[1440,900]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});await delay(250);
  const result=await evaluate(`({scroll:document.documentElement.scrollWidth,rects:[...document.querySelectorAll('.stage-actions button')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom,width:r.width,height:r.height}})})`);
  assert.ok(result.scroll<=width);
  for(const r of result.rects)assert.ok(r.x>=0&&r.right<=width&&r.bottom<=height&&r.height>=44&&r.width>=44);
  if(width===390)await screenshot('mobile-result');
}
await evaluate('document.querySelector(".stage-actions .button-primary").click()');
await waitFor('!!document.querySelector(".modal-preview img")?.src');await screenshot('share-preview');
assert.equal(await evaluate('document.querySelector(".painted-character").width'),800);
assert.deepEqual(errors,[],'No runtime errors');
console.log('Passed: actual painted renderer, live motion, tap reaction, stable reduced-motion pixels, desktop/mobile layout, share preview, no runtime errors.');
socket.close();
