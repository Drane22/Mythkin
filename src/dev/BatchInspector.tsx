import { useEffect,useMemo,useState } from 'react';
import * as THREE from 'three';
import { generateMonster } from '../generator/generateMonster';
import { buildMonster } from '../monster/buildMonster';
import { applyAnimation } from '../monster/animate';
import { paintBackground } from '../monster/background';
import { MonsterCanvas } from '../monster/MonsterCanvas';

export default function BatchInspector(){
 const batch=useMemo(()=>Array.from({length:1000},(_,i)=>generateMonster(`diversity-${i}`)),[]);
 const [images,setImages]=useState<string[]>([]),[selected,setSelected]=useState(0),[error,setError]=useState('');
 const stats=useMemo(()=>{
  const result:Record<string,Record<string,number>>={};
  for(const g of batch){const v=g.visual!;for(const [category,key] of Object.entries({mythology:g.mythology.primary,body:g.anatomy.body,head:g.anatomy.head,horns:g.anatomy.horns,rig:v.rig,palette:v.paletteFamily,garment:v.garment,background:v.environment.type,summon:v.summon.type})){result[category]??={};result[category][key]=(result[category][key]??0)+1;}}
  return result;
 },[batch]);
 useEffect(()=>{
  let cancelled=false,frame=0,index=0;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});}catch{setError('WebGL is unavailable; the inspector and frequency tables remain available.');return;}
  renderer.setSize(128,160);renderer.setPixelRatio(1);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(24,.8,.1,100);
  camera.position.set(0,2.1,10.5);camera.lookAt(0,1.65,0);
  scene.add(new THREE.AmbientLight('#ffffff',1.1));const light=new THREE.DirectionalLight('#ffffff',2);light.position.set(2.5,4,3.5);scene.add(light);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const ctx=canvas.getContext('2d')!;
  const urls:string[]=[];
  const next=()=>{
   if(cancelled||index>=batch.length)return;
   const g=batch[index],built=buildMonster(g);scene.add(built.rig.root);
   applyAnimation(built.rig,g.idle,{assemble:1,time:0,reducedMotion:true});renderer.render(scene,camera);
   paintBackground(ctx,128,160,g);ctx.drawImage(renderer.domElement,0,0);urls.push(canvas.toDataURL('image/webp',.85));
   scene.remove(built.rig.root);built.dispose();index++;
   if(index%8===0||index===batch.length)setImages([...urls]);
   frame=requestAnimationFrame(next);
  };
  frame=requestAnimationFrame(next);
  return()=>{cancelled=true;cancelAnimationFrame(frame);renderer.dispose();renderer.forceContextLoss();};
 },[batch]);
 const g=batch[selected];
 return <main style={{padding:24,maxWidth:1500,margin:'auto'}}>
  <h1>Diversity laboratory</h1><p>Development only. {images.length} / 1,000 actual WebGL thumbnails. Rendering uses one shared context.</p>
  {error&&<p role="alert">{error}</p>}
  <details><summary>Frequency tables</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(stats,null,2)}</pre></details>
  <div style={{display:'grid',gridTemplateColumns:'minmax(220px,380px) minmax(0,1fr)',gap:24,marginBlock:24}}>
   <MonsterCanvas genotype={g} summonToken={selected} showBackground/>
   <div><h2>{g.input}</h2><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{Object.entries(g.visual!.colors).map(([name,color])=><span key={name} title={`${name}: ${color}`} style={{background:color,width:24,height:24,border:'1px solid #aaa'}}/>)}</div><details open><summary>Full genotype and presentation</summary><pre style={{maxHeight:420,overflow:'auto',fontSize:12}}>{JSON.stringify(g,null,2)}</pre></details></div>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(135px,1fr))',gap:12}}>{batch.map((item,i)=><button key={item.seed} onClick={()=>setSelected(i)} style={{border:'1px solid #5c4375',background:'#17111f',textAlign:'left',padding:6}}>
   {images[i]?<img loading="lazy" src={images[i]} alt={item.identity.classification} style={{width:'100%',aspectRatio:'4/5',imageRendering:'pixelated'}}/>:<div style={{aspectRatio:'4/5',display:'grid',placeItems:'center'}}>Pending</div>}
   <div>{item.input}</div><small>{item.anatomy.body} · {item.visual!.paletteFamily}</small>
  </button>)}</div>
 </main>;
}
