// CPU geometry preview for silhouette review. Not a WebGL/browser screenshot.
import './register-typescript.mjs';
import * as THREE from 'three';
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
const { generateMonster } = await import('../src/generator/generateMonster.ts');
const { buildMonster } = await import('../src/monster/buildMonster.ts');
const reference = process.argv.includes('--reference');
const sheet = createCanvas(1280, reference ? 460 : 900), ctx = sheet.getContext('2d');
ctx.fillStyle = '#222222'; ctx.fillRect(0, 0, 1280, 900);
const chosen = new Map();
for (let i = 0; chosen.size < 8; i++) { const g = generateMonster(`review-${i}`); if (!chosen.has(g.anatomy.body)) chosen.set(g.anatomy.body, g); }
if(reference) {
  chosen.clear();
  const scores=new Map();
  for(let i=0;i<7000;i++) {
    const g=generateMonster(`study-${i}`),a=g.anatomy;
    const candidates={
      'Forest keeper': (a.horns==='antlers'?12:0)+(a.skin==='bark'||a.skin==='fur'?4:0)+(a.eyes.type==='hollow'?4:0)+(a.armCount===2?2:0)+(a.body==='barrel'?2:0)-(a.wings!=='none'?5:0),
      'Three-eyed oracle': (a.eyes.count===3?9:0)+(a.mouth==='tongue'?6:0)+(a.horns==='crown'||a.mutations.includes('halo')?8:0)+(a.body==='barrel'?4:0)-(a.wings!=='none'?5:0),
      'Horned trickster': (a.eyes.count===1?9:0)+(a.mouth==='tongue'?7:0)+(a.horns==='oni'?8:0)+(a.body==='tall'?4:0)-(a.wings!=='none'?5:0),
      'Crescent watcher': (a.eyes.count===1?9:0)+(a.horns==='crown'?10:0)+(a.skin==='bone'?4:0)+(a.body==='tall'||a.body==='barrel'?3:0)-(a.wings!=='none'?5:0),
    };
    for(const [label,score] of Object.entries(candidates))if(!scores.has(label)||score>scores.get(label)){scores.set(label,score);chosen.set(label,g);}
  }
}
let cell = 0;
for (const [type, g] of chosen) {
  const { rig, dispose } = buildMonster(g); rig.root.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(24, .8, .1, 100); camera.position.set(0, 2.1, 10.5); camera.lookAt(0, 1.65, 0); camera.updateMatrixWorld(true);
  const triangles = [], light = new THREE.Vector3(2, 4, 5).normalize();
  rig.root.traverse(o => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position, index = o.geometry.index, texcoord=o.geometry.attributes.uv;
    for (let i = 0; i < (index ? index.count : pos.count); i += 3) {
      const points = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(i + j) : i + j).applyMatrix4(o.matrixWorld));
      const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
      if (normal.dot(camera.position.clone().sub(points[0])) <= 0) continue;
      const color = o.material.color.clone().multiplyScalar(.5 + Math.max(0, normal.dot(light)) * .65);
      triangles.push({ points: points.map(p => p.clone().project(camera)), depth: points.reduce((s, p) => s + p.distanceTo(camera.position), 0), color: color.getStyle(), map:o.material.map?.image, uv:texcoord?[0,1,2].map(j=>{const k=index?index.getX(i+j):i+j;return [texcoord.getX(k),texcoord.getY(k)];}):null });
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
  const x = cell % 4 * 320, y = Math.floor(cell / 4) * 430;
  ctx.imageSmoothingEnabled = false; ctx.drawImage(tile, x, y, 320, 400);
  ctx.fillStyle = '#dfd4bf'; ctx.font = '18px sans-serif'; ctx.fillText(reference ? `${type}: ${g.input}` : `${type} / ${g.anatomy.skin}`, x + 24, y + 420);
  cell++; dispose();
}
ctx.fillStyle = '#aaa08d'; ctx.font = '15px sans-serif'; ctx.fillText('Geometry study: software projection. Live lighting and textures differ.', 24, reference ? 446 : 886);
mkdirSync('artifacts', { recursive: true }); writeFileSync(reference ? 'artifacts/reference-design-study.png' : 'artifacts/creature-geometry-study.png', sheet.toBuffer('image/png'));
