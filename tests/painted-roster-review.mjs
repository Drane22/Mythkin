import './register-typescript.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const {generateMonster}=await import('../src/generator/generateMonster.ts');
const {PAINTED_ARTWORKS}=await import('../src/painted/artworks.ts');

const origin=process.env.MYTHKIN_REVIEW_URL||'http://127.0.0.1:5174';
const tabs=await(await fetch('http://127.0.0.1:9333/json')).json();
const socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl),pending=new Map(),errors=[],requests=[];let seq=0;
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args);else if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);});
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async(expression)=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const waitFor=async(expression)=>{for(let i=0;i<180;i++){if(await evaluate(expression))return;await delay(200);}throw Error(expression+' '+JSON.stringify(errors));};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
// Runtime.enable also replays console entries from the tab's previous session.
// Begin the audit with navigation; preserve every error produced by that audit.
errors.length=0;
await send('Emulation.setDeviceMetricsOverride',{width:1100,height:900,deviceScaleFactor:1,mobile:false});
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
const ids=process.argv.slice(2).length?process.argv.slice(2):Object.keys(PAINTED_ARTWORKS);
const names=[...ids,...['Minotaur named Amihan','Minotaur named Mira','Minotaur named Lira']];
const board=createCanvas(360*3,480*Math.ceil(names.length/3)),ctx=board.getContext('2d');ctx.fillStyle='#19151e';ctx.fillRect(0,0,board.width,board.height);
const dir='artifacts/painted-folklore';mkdirSync(dir,{recursive:true});
for(const [i,name] of names.entries()){
 const genotype=generateMonster(name,4);requests.length=0;
 const query=new URLSearchParams({v:'4',s:genotype.seed.slice(0,8),n:Buffer.from(genotype.input).toString('base64url')});
 await send('Page.navigate',{url:`${origin}/?${query}`});
 await waitFor('document.querySelector(".painted-canvas")?.dataset.assembled==="true"');
 const status=await evaluate('document.querySelector(".painted-canvas").dataset.artStatus');
 if(status!=='ready')console.error('Artwork request failure',requests.filter(url=>url.includes('.png')));
 assert.equal(status,'ready');
 assert.equal(await evaluate('document.querySelector(".painted-canvas").dataset.art'),genotype.v3.primaryId);
 const first=await evaluate('document.querySelector(".painted-character").toDataURL()');await delay(450);
 assert.notEqual(await evaluate('document.querySelector(".painted-character").toDataURL()'),first,`${name} animates`);
 const clip=await evaluate('(()=>{const r=document.querySelector(".creature-frame").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()');
 const {data}=await send('Page.captureScreenshot',{format:'png',clip}),image=await loadImage(Buffer.from(data,'base64'));
 ctx.drawImage(image,i%3*360,Math.floor(i/3)*480,360,450);ctx.fillStyle='#e9ddea';ctx.font='17px sans-serif';ctx.fillText(name,i%3*360+14,Math.floor(i/3)*480+474);
 writeFileSync(`${dir}/${name.toLowerCase().replaceAll(' ','-')}.png`,Buffer.from(data,'base64'));
 const images=requests.filter(url=>url.startsWith(origin)&&/\.png(?:\?|$)/.test(url)&&!url.includes('?import'));
 // The landing specimen may begin loading before the share URL effect runs.
 assert.ok(images.length<=2,`${name}: loads selected artwork, not the entire roster (${images.length})`);
 console.log('Reviewed actual painting and animation:',name);
}
writeFileSync(`${dir}/roster-live.png`,board.toBuffer('image/png'));assert.deepEqual(errors,[],'No runtime or shader errors');
console.log('Passed: live painted roster, shader variants, animation pixels and lazy artwork requests.');socket.close();
