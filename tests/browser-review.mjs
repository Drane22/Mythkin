// Local Chromium DevTools verification. Launch an isolated browser on port 9333
// and Vite on port 5173 before running; no application test hooks are required.
import { writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const tabs=await (await fetch('http://127.0.0.1:9333/json')).json();
const tab=tabs.find(t=>t.type==='page');
assert.ok(tab,'A local review tab must be available');
const socket=new WebSocket(tab.webSocketDebuggerUrl),pending=new Map();let serial=0;
const errors=[];
socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const request=pending.get(message.id);pending.delete(message.id);if(message.error)request.reject(message.error);else request.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);});
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async(expression)=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const waitFor=async(expression)=>{for(let i=0;i<120;i++){if(await evaluate(expression))return;await delay(250);}console.error(await evaluate('({url:location.href,text:document.body.innerText.slice(0,2000)})'),errors);throw new Error('Timed out: '+expression);};
mkdirSync('artifacts/surface-refinement',{recursive:true});
const screenshot=async(name)=>{const {data}=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`artifacts/surface-refinement/${name}.png`,Buffer.from(data,'base64'));};
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:5173/'});
await waitFor('!!document.querySelector(".name-input")');
await evaluate('document.fonts.ready');await delay(2500);await screenshot('desktop-home');
const summon=async(name)=>{await evaluate(`(()=>{const input=document.querySelector('.name-input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(name)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(60);await evaluate('document.querySelector(".summon-form").requestSubmit()');};
await summon('Minotaur named Amihan');
await waitFor('!!document.querySelector(".mk-ritual")');
// Freeze the CSS animation at its visible midpoint for a reproducible review.
await evaluate('document.querySelectorAll(".mk-ritual, .mk-ritual *").forEach(el=>el.getAnimations().forEach(a=>{a.pause();a.currentTime=350;}))');
await screenshot('desktop-loading');
await waitFor('document.querySelector(".app-shell")?.dataset.phase==="result"');await delay(500);
await screenshot('desktop-result');
assert.equal(await evaluate('document.querySelectorAll("canvas")[1].width'),640);
assert.equal(await evaluate('!!document.querySelector(".mk-ritual")'),false);
const checkLayout=()=>evaluate(`(()=>{const actions=[...document.querySelectorAll('.stage-actions button')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,bottom:r.bottom,left:r.left,right:r.right};});return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,actions};})()`);
for(const [width,height]of [[390,844],[360,640],[768,1024],[1440,900]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});await delay(300);
 const layout=await checkLayout();assert.ok(layout.scroll<=width,`No horizontal overflow at ${width}`);
 for(const rect of layout.actions){assert.ok(rect.height>=44&&rect.width>=44,'44px action targets');assert.ok(rect.bottom<=height&&rect.left>=0&&rect.right<=width,`Actions fit ${width}x${height}`);}
 if(width===390)await screenshot('mobile-result');
 console.log('Layout verified',width,height);
}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await evaluate('document.querySelector(".info-button").click()');await delay(300);await screenshot('mobile-info');
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
await waitFor('!document.querySelector(".info-panel")');
await evaluate('document.querySelector(".back-button").click()');await delay(500);await screenshot('mobile-home');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await summon('Leshy');await waitFor('document.querySelector(".app-shell")?.dataset.phase==="result"');
assert.equal(await evaluate('!!document.querySelector(".mk-ritual")'),false);
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
const samples=['Minotaur','Fenrir','Bakunawa','Harpy','Leshy','Grootslang','Draugr','Oni'];
const board=createCanvas(384*4,520*2),ctx=board.getContext('2d');ctx.fillStyle='#100e16';ctx.fillRect(0,0,board.width,board.height);
for(const [i,name]of samples.entries()){
 await evaluate('document.querySelector(".back-button").click()');await waitFor('!!document.querySelector(".name-input")');
 await summon(name);await waitFor('document.querySelector(".app-shell")?.dataset.phase==="result"');await delay(200);
 const clip=await evaluate('(()=>{const r=document.querySelector(".creature-frame").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()');
 const {data}=await send('Page.captureScreenshot',{format:'png',clip});const png=await loadImage(Buffer.from(data,'base64'));
 ctx.drawImage(png,(i%4)*384,Math.floor(i/4)*520,384,480);ctx.fillStyle='#e9ddee';ctx.font='20px sans-serif';ctx.fillText(name,(i%4)*384+16,Math.floor(i/4)*520+510);
 console.log('WebGL material review',name);
}
writeFileSync('artifacts/surface-refinement/materials-webgl.png',board.toBuffer('image/png'));
assert.deepEqual(errors,[],'No runtime exceptions');
console.log('Browser checks passed: real WebGL, responsive controls, info dismissal, reduced motion, no runtime exceptions.');
socket.close();
