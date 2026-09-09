import './register-typescript.mjs';
import * as THREE from 'three';
import { createCanvas } from '@napi-rs/canvas';
const {buildMonster}=await import('../src/monster/buildMonster.ts');
const {applyAnimation}=await import('../src/monster/animate.ts');
export function renderMesh(g, rotation=0, state={assemble:1,time:0,reducedMotion:true}){
  const { rig, dispose } = buildMonster(g); applyAnimation(rig,g.idle,state); rig.root.rotation.y=rotation; rig.root.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(24, .8, .1, 100); camera.position.set(0, 2.1, 10.5); camera.lookAt(0, 1.65, 0); camera.updateMatrixWorld(true);
  let meshes=0,triangleCount=0;
  const triangles = [], light = new THREE.Vector3(2, 4, 5).normalize();
  rig.root.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    for(let ancestor=o.parent;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)return;
    for(let instance=0;instance<(o.isInstancedMesh?o.count:1);instance++){
    const transform=o.matrixWorld.clone(),instanceColor=new THREE.Color(1,1,1);
    if(o.isInstancedMesh){const local=new THREE.Matrix4();o.getMatrixAt(instance,local);transform.multiply(local);if(o.instanceColor)o.getColorAt(instance,instanceColor);}
    meshes++;triangleCount+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
    const pos = o.geometry.attributes.position, index = o.geometry.index, texcoord=o.geometry.attributes.uv;
    for (let i = 0; i < (index ? index.count : pos.count); i += 3) {
      const points = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(i + j) : i + j).applyMatrix4(transform));
      const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
      if (normal.dot(camera.position.clone().sub(points[0])) <= 0) continue;
      const color = o.material.color.clone().multiply(instanceColor).multiplyScalar(.5 + Math.max(0, normal.dot(light)) * .65);
      triangles.push({ points: points.map(p => p.clone().project(camera)), depth: points.reduce((s, p) => s + p.distanceTo(camera.position), 0), color: color.getStyle(), map:o.material.map?.image, uv:texcoord?[0,1,2].map(j=>{const k=index?index.getX(i+j):i+j;return [texcoord.getX(k),texcoord.getY(k)];}):null });
    }
    }
  });
  const tile = createCanvas(256, 320), t = tile.getContext('2d');
  // A real depth buffer prevents broad mask triangles hiding nearer face details.
  const pixels=t.createImageData(256,320), depth=new Float64Array(256*320).fill(Infinity);
  for(const tri of triangles) {
    const v=tri.points.map(p=>({x:(p.x+1)*128,y:(1-p.y)*160,z:p.z}));
    const [a,b,c]=v, area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    if(Math.abs(area)<.00001)continue;
    const minX=Math.max(0,Math.floor(Math.min(...v.map(p=>p.x)))),maxX=Math.min(255,Math.ceil(Math.max(...v.map(p=>p.x))));
    const minY=Math.max(0,Math.floor(Math.min(...v.map(p=>p.y)))),maxY=Math.min(319,Math.ceil(Math.max(...v.map(p=>p.y))));
    const rgb=tri.color.match(/[\d.]+/g).map(Number);
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++) {
      const px=x+.5,py=y+.5;
      const w1=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area;
      const w2=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area, w3=1-w1-w2;
      if(w1<0||w2<0||w3<0)continue;
      const z=w1*a.z+w2*b.z+w3*c.z,k=y*256+x;
      if(z>=depth[k])continue; depth[k]=z;
      let factor=1;
      if(tri.map?.data&&tri.uv) {
        const u=tri.uv[0][0]*w1+tri.uv[1][0]*w2+tri.uv[2][0]*w3,vv=tri.uv[0][1]*w1+tri.uv[1][1]*w2+tri.uv[2][1]*w3;
        const tx=Math.floor(((u%1+1)%1)*tri.map.width),ty=Math.floor(((vv%1+1)%1)*tri.map.height);
        factor=tri.map.data[(ty*tri.map.width+tx)*4]/255;
      }
      pixels.data.set([rgb[0]*factor,rgb[1]*factor,rgb[2]*factor,255],k*4);
    }
  }
  t.putImageData(pixels,0,0);
  dispose();return {canvas:tile,meshes,triangles:triangleCount};
}
