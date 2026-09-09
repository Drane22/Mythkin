import { mergeStaticMeshes } from './mergeStaticMeshes';
import { rigTemplate } from './rigTemplates';
import * as THREE from 'three';
import type { MonsterGenotype } from '../generator/types';
import type { AnimRig, EyeRig } from './buildMonster';
import { createSkinTexture, createClothTexture } from './skin';
import { subRng } from '../generator/rng';

type Point = [number, number, number];

/** Curved anatomy remains actual geometry: pixel edges come from the renderer. */
export function buildOrganicMonster(g: MonsterGenotype): { rig: AnimRig; dispose: () => void } {
  const a = g.anatomy, p = a.proportions;
  const template=rigTemplate(g);
  const rng = subRng(`v${g.version}:${g.seed}`, 'organic-art');
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];
  const texture = createSkinTexture(a.skin, g.seed);
  const boneTexture = createSkinTexture('bone', g.seed);
  const clothTexture = createClothTexture(g.seed);
  const v=g.visual!;const c=v.colors;
  const material = (color: THREE.ColorRepresentation, map = false) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: .92, map: map ? texture : null }); materials.push(m); return m;
  };
  const skin=material(c.bodyPrimary,true),soft=material(c.bodySecondary,true),bone=material(c.bodyPrimary);bone.map=boneTexture;
  const teethMat=material(c.teeth),hornMat=material(c.hornPrimary),clawMat=material(c.claws);
  const flesh=material(c.tongue),dark=material(c.mouthInterior),cloth=material(c.accessoryPrimary),gold=material(c.metal);cloth.map=clothTexture;
  const iris=material(c.eyePrimary),pupil=material(c.eyeSecondary),light=material(c.bodyHighlight);iris.userData.summonEye=true;
  if(v.paletteMutation==='bioluminescent'||a.mutations.includes('glowing_markings')){soft.emissive.set(c.emissive);soft.emissiveIntensity=.45;}
  const mesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: Point = [0, 0, 0]) => {
    geometries.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(...pos); parent.add(m); return m;
  };
  const oval = (parent: THREE.Object3D, pos: Point, size: Point, mat = skin) => {
    const m = mesh(parent, new THREE.SphereGeometry(1, 18, 12), mat, pos); m.scale.set(...size); return m;
  };
  // Taper along a transported frame, so claws, horns and tendrils have curved tips.
  const curve = (parent: THREE.Object3D, points: Point[], radius: number, mat = skin, end = .12) => {
    const path = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)));
    const steps = 16, sides = 7, frames = path.computeFrenetFrames(steps, false);
    const vertices: number[] = [], indices: number[] = [], uv: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, center = path.getPointAt(t), r = radius * (1 - t * (1 - end));
      for (let j = 0; j <= sides; j++) {
        const angle = j / sides * Math.PI * 2;
        const v = center.clone().addScaledVector(frames.normals[i], Math.cos(angle) * r).addScaledVector(frames.binormals[i], Math.sin(angle) * r);
        vertices.push(v.x, v.y, v.z); uv.push(j / sides, t);
        if (i < steps && j < sides) { const k = i * (sides + 1) + j; indices.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1); }
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(indices); geo.computeVertexNormals();
    return mesh(parent, geo, mat);
  };
  const group = (parent: THREE.Object3D, pos: Point = [0, 0, 0]) => { const o = new THREE.Group(); parent.add(o); o.position.set(...pos); return o; };
  const root = new THREE.Group(), creature = group(root), body = group(creature), head = group(creature);
  const eyes: EyeRig[] = [], arms: THREE.Object3D[] = [], hands: THREE.Object3D[] = [], legs: THREE.Object3D[] = [], ears: THREE.Object3D[] = [], wings: THREE.Object3D[] = [];
  const quad = a.body === 'quadruped', snake = a.body === 'serpent', floating = a.body === 'floating' || a.legs === 'none';
  const dims: Record<typeof a.body, Point> = { blob: [.58, .55, .43], tall: [.34, .73, .3], barrel: [.59, .64, .43], serpent: [.35, .58, .34], quadruped: [.48, .43, .8], floating: [.44, .62, .36], hunched: [.53, .64, .45], shell: [.58, .53, .48] };
  const [bw, bh, bd] = dims[a.body].map((n, i) => n * [p.bodyW, p.bodyH, p.bodyD][i]) as Point;
  const legLength = (a.legs === 'long' || a.legs === 'bird' ? .65 : .38) * p.legLength;
  body.position.y = floating ? .9 : legLength + bh;
  const profiles: Record<typeof a.body, [number, number][]> = {
    tall: [[.07,-1],[.4,-.75],[.48,-.25],[.3,.22],[.66,.65],[.3,1]],
    barrel: [[.2,-1],[.83,-.82],[1,-.2],[.78,.45],[.42,1]],
    blob: [[.2,-1],[.94,-.65],[1,.05],[.7,.68],[.22,1]],
    floating: [[0,-1.4],[.5,-.83],[.95,-.1],[.63,.65],[.25,1]],
    serpent: [[.35,-1],[.65,-.4],[.55,.25],[.42,1]],
    quadruped: [[.3,-1],[.85,-.62],[1,.25],[.55,1]],
    hunched: [[.25,-1],[.65,-.7],[.95,.1],[1,.55],[.35,1]],
    shell: [[.2,-1],[.8,-.8],[1,.0],[.7,.7],[.2,1]],
  };
  const torso = mesh(body, new THREE.LatheGeometry(profiles[a.body].map(([r,y]) => new THREE.Vector2(r * bw, y * bh)), 18), skin);
  torso.scale.z = bd / bw;
  const radiusAt = (height: number) => {
    const profile = profiles[a.body], y = height / bh;
    for (let i=1;i<profile.length;i++) {
      const [r0,y0]=profile[i-1],[r1,y1]=profile[i];
      if(y<=y1) return bw * THREE.MathUtils.lerp(r0,r1,THREE.MathUtils.clamp((y-y0)/(y1-y0),0,1));
    }
    return profile[profile.length-1][0]*bw;
  };

  if (a.body === 'hunched') oval(body, [0, bh * .28, -bd * .42], [bw * .9, bh * .83, bd * .86]);
  if (quad || a.body === 'barrel') oval(body, [0, -.12, bd * .55], [bw * .65, bh * .64, bd * .24], soft);
  const upper=template.upperTorso?group(body,[0,bh*.55,template.horizontal?bd*.68:0]):undefined;
  if(upper) {oval(upper,[0,template.horizontal?.42:.12,0],[bw*.62,template.horizontal?.62:.38,bd*.64]);}
  if(template.horizontal) {
    torso.visible=false;
    oval(body,[0,0,0],[bw,bh,bd*1.15]);
    for(const end of [-1,1])oval(body,[0,.02,end*bd*.6],[bw*.85,bh*.92,bd*.52]);
  }
  if(template.coiled){
    torso.visible=false;
    curve(body,[[0,bh*.85,0],[-.17,.1,0],[-.55,-.35,.12],[-.45,-.65,.4],[.4,-.72,.5],[.9,-.55,.0],[.72,-.3,-.3]],bw*.75,skin,.2);
  }
  const hs = template.headMultiplier * Math.max(.65, Math.min(p.headScale, 1.5));
  const woodland = a.horns === 'antlers' || a.skin === 'bark';
  const visage = woodland ? 'stag' : a.mutations.includes('skeletal_face') ? 'wraith' : a.head === 'beak' ? 'avian' : quad || a.head === 'snout' ? 'beast' : a.head === 'sphere' && a.eyes.count === 1 ? 'cyclops' : a.head === 'tall' || a.eyes.type === 'hollow' ? 'wraith' : a.mouth === 'tongue' || a.horns === 'oni' ? 'imp' : a.head === 'wide' ? 'toad' : 'mask';
  const hw = ({ stag: .62, avian: .42, beast: .44, cyclops: .59, wraith: .39, imp: .7, toad: .78, mask: .57 }[visage]) * hs;
  const hh = ({ stag: .77, avian: .54, beast: .47, cyclops: .65, wraith: .88, imp: .56, toad: .43, mask: .7 }[visage]) * hs;
  head.position.set(0, body.position.y + bh * .64 + hh * .7, quad ? .83 : .04);
  if(template.horizontal) head.position.set(0,body.position.y+(upper?1.27:bh*.4),bd*(upper?.68:1.12));
  if(a.body==='hunched') {head.position.y-=.22;head.position.z+=bd*.6;}
  if (a.mutations.includes('floating_head')) head.position.y += .22;
  head.rotation.z = p.headTilt * .6;
  const skull = ['stag', 'wraith', 'cyclops', 'mask', 'imp'].includes(visage) || a.mutations.includes('skeletal_face');
  const faceMaterial = skull ? bone : skin;
  // One continuous cranial volume joins the sockets, temples, jaw and nape.
  const contour = new THREE.Shape();
  if (visage === 'stag') {
    contour.moveTo(0, hh); contour.bezierCurveTo(-hw * .65, hh, -hw * .8, hh * .5, -hw, -.05);
    contour.lineTo(-hw * .48, -hh * .34); contour.lineTo(-hw * .23, -hh); contour.lineTo(0, -hh * .79); contour.lineTo(hw * .23, -hh); contour.lineTo(hw * .48, -hh * .34); contour.lineTo(hw, -.05); contour.bezierCurveTo(hw * .8, hh * .5, hw * .65, hh, 0, hh);
  } else if (a.head === 'jar') {
    contour.moveTo(-hw*.55,hh);contour.lineTo(hw*.55,hh);contour.lineTo(hw*.48,hh*.56);
    contour.bezierCurveTo(hw*1.1,hh*.28,hw,-hh*.72,hw*.52,-hh);contour.lineTo(-hw*.52,-hh);
    contour.bezierCurveTo(-hw,-hh*.72,-hw*1.1,hh*.28,-hw*.48,hh*.56);contour.closePath();
  } else if (a.head === 'flame') {
    contour.moveTo(-hw*.75,-hh*.55);contour.quadraticCurveTo(-hw*1.1,hh*.05,-hw*.4,hh*.7);
    contour.lineTo(-hw*.2,hh*.3);contour.quadraticCurveTo(hw*.3,hh*.65,hw*.2,hh*1.2);
    contour.quadraticCurveTo(hw*1.1,hh*.55,hw*.65,-hh*.55);contour.quadraticCurveTo(0,-hh*1.2,-hw*.75,-hh*.55);
  } else if (visage === 'beast' || visage === 'avian') {
    contour.moveTo(-hw*.4,hh);contour.quadraticCurveTo(-hw*.95,hh*.7,-hw,hh*.1);
    contour.lineTo(-hw*.65,-hh*.35);contour.lineTo(-hw*.5,-hh);contour.lineTo(hw*.5,-hh);
    contour.lineTo(hw*.65,-hh*.35);contour.lineTo(hw,hh*.1);contour.quadraticCurveTo(hw*.95,hh*.7,hw*.4,hh);contour.closePath();
  } else if (visage === 'toad') {
    contour.moveTo(-hw,hh*.3);contour.bezierCurveTo(-hw,hh*1.3,-hw*.4,hh*1.2,0,hh*.6);
    contour.bezierCurveTo(hw*.4,hh*1.2,hw,hh*1.3,hw,hh*.3);contour.quadraticCurveTo(hw*1.1,-hh*.7,0,-hh);contour.quadraticCurveTo(-hw*1.1,-hh*.7,-hw,hh*.3);
  } else if (a.head === 'cube' && !woodland) {
    contour.moveTo(-hw*.72,hh*.9);contour.quadraticCurveTo(-hw,hh*.8,-hw,hh*.45);contour.lineTo(-hw*.9,-hh*.48);contour.quadraticCurveTo(-hw*.76,-hh,0,-hh);contour.quadraticCurveTo(hw*.92,-hh,hw*.94,-hh*.3);contour.lineTo(hw,hh*.45);contour.quadraticCurveTo(hw,hh*.98,hw*.55,hh*.98);contour.lineTo(-hw*.72,hh*.9);
  } else if (visage === 'cyclops' || visage === 'imp') {
    contour.moveTo(0, hh); contour.bezierCurveTo(-hw * .8, hh * 1.03, -hw, hh * .35, -hw, 0);
    contour.bezierCurveTo(-hw, -hh * .7, -hw * .38, -hh, hw * .15, -hh * .9); contour.bezierCurveTo(hw * .92, -hh * .8, hw * 1.13, -hh * .25, hw * .9, hh * .35); contour.quadraticCurveTo(hw * .5, hh, 0, hh);
  } else {
    contour.moveTo(0, hh); contour.bezierCurveTo(-hw * .78, hh * .95, -hw * .8, hh * .42, -hw, -.03);
    contour.quadraticCurveTo(-hw * .8, -hh * .28, -hw * .87, -hh * .36); contour.quadraticCurveTo(-hw * .76, -hh, 0, -hh);
    contour.quadraticCurveTo(hw * .76, -hh, hw * .87, -hh * .36); contour.quadraticCurveTo(hw * .86, -hh * .26, hw, -.03); contour.bezierCurveTo(hw * .83, hh * .42, hw * .8, hh, 0, hh);
  }
  const faceZ = .31 * hs;
  const hole = (x: number, y: number, rx: number, ry: number, tilt = 0, eye = false) => {
    const h = new THREE.Path();
    if(eye && a.eyes.type==='hollow') {
      for(let j=0;j<9;j++) { const angle=-j/8*Math.PI*2, r=j%3===0?.86:1; const px=x+Math.cos(angle)*rx*r,py=y+Math.sin(angle)*ry*r; j?h.lineTo(px,py):h.moveTo(px,py); }
    } else if(eye && (a.eyes.type==='slit'||a.eyes.type==='glow')) {
      h.moveTo(x-rx,y); h.bezierCurveTo(x-rx*.4,y+ry,x+rx*.5,y+ry,x+rx,y); h.bezierCurveTo(x+rx*.5,y-ry,x-rx*.5,y-ry,x-rx,y);
    } else h.absellipse(x, y, rx, ry, 0, Math.PI * 2, true, tilt);
    contour.holes.push(h);
  };
  const eyeCount = a.eyes.count;
  for (let i = 0; i < eyeCount; i++) {
    const single = eyeCount === 1 || eyeCount % 2 === 1 && i === eyeCount - 1;
    let ex = single ? 0 : (i % 2 ? 1 : -1) * hw * .47;
    let ey = single && eyeCount > 1 ? hh * .57 : eyeCount === 3 ? hh * .02 : eyeCount > 3 ? hh * (.55 - Math.floor(i / 2) * .37) : hh * .23;
    if (a.mutations.includes('stacked_eyes')) { ex = 0; ey = hh * .57 - i * .21; }
    if (a.mutations.includes('crown_of_eyes')) { ex = Math.sin((i - 2) * .42) * hw; ey = Math.cos((i - 2) * .42) * hh * .72; }
    const large = eyeCount === 1 || single && eyeCount === 3;
    const er = Math.min((eyeCount === 1 ? .255 : large ? .195 : eyeCount > 3 ? .083 : eyeCount === 3 ? .115 : .145) * hs, hh * (eyeCount === 1 ? .43 : eyeCount === 3 ? .27 : eyeCount > 3 ? .14 : .3));
    const rx = er * (visage === 'cyclops' ? 1.22 : 1), ry = er * (visage === 'imp' && large ? 1.38 : visage === 'beast' ? .7 : 1.05);
    hole(ex, ey, rx * 1.12, ry * 1.12, 0, true);
    const e = group(head, [ex, ey, faceZ + .025]);
    oval(e, [0, 0, -.015], [rx * 1.12, ry * 1.12, .04], dark);
    if (a.eyes.type !== 'hollow') {
      oval(e, [0, 0, .02], [rx * .8, ry * .88, .024], iris);
      const eye = group(e, [0, 0, .046]);
      oval(eye, [0, 0, 0], [rx * (a.eyes.type === 'slit' ? .13 : .35), ry * .76, .012], pupil);
      oval(eye, [-rx * .28, ry * .43, .018], [.016, .022, .008], light);
      if (a.eyes.type === 'cross') oval(eye, [0, 0, .012], [rx * .54, ry * .13, .012], pupil);
      if(a.eyes.type==='ring') {
        eye.children.forEach(child=>child.visible=false);
        mesh(eye,new THREE.TorusGeometry(rx*.42,.024,6,16),gold,[0,0,.014]);
      }
      if(a.eyes.type==='glow') {
        const glow=material(g.palette.eye); glow.emissive.set(g.palette.eye); glow.emissiveIntensity=.85;
        eye.children.forEach(child=>child.visible=false);
        oval(eye,[0,0,.008],[rx*.56,ry*.49,.017],glow);
      }
      if(a.mutations.includes('mouth_eyes')) {
        eye.children.forEach(child=>child.visible=false);
        oval(eye,[0,0,0],[rx*.8,ry*.35,.018],dark);
        for(let tooth=0;tooth<3;tooth++)curve(eye,[[(tooth-1)*rx*.4,ry*.2,.024],[(tooth-1)*rx*.4,-ry*.14,.025]],.015,bone);
      }
      eyes.push({ group: e, pupil: eye });
    } else eyes.push({ group: e });
  }
  let jaw: THREE.Object3D | undefined, tongue: THREE.Object3D | undefined;
  const mouthY = visage === 'stag' ? -hh * .68 : -hh * (eyeCount > 3 ? .65 : .48);
  const mw = hw * (visage === 'imp' || visage === 'toad' ? .78 : visage === 'wraith' ? .56 : .6);
  const mh = a.mouth === 'flat' ? .027 : eyeCount > 3 ? hh * .18 : visage === 'wraith' ? hh * .22 : visage === 'imp' ? .2 : .16;
  if (a.mouth !== 'none' && visage !== 'stag') {
    hole(0, mouthY, mw, mh, visage === 'imp' ? -.12 : .04);
    jaw = group(head, [0, mouthY, faceZ + .028]);
    oval(jaw, [0, 0, -.015], [mw, mh, .035], dark);
    if (a.mouth === 'beak') curve(jaw, [[0, .13, .06], [0, .015, .47], [0, -.18, .56]], .19, teethMat);
    else if (a.mouth !== 'flat') {
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * mw * .36, length = mh * (i % 2 ? 1.15 : .62);
        curve(jaw, [[x, mh * .78, .06], [x + .012, mh * .78 - length, .07], [x + .018, mh * .65 - length, .075]], i % 2 ? .031 : .023, teethMat);
      }
      for (const side of [-1, 1]) curve(jaw, [[side * mw * .61, -mh * .76, .06], [side * mw * .6, -mh * .25, .08], [side * mw * .56, a.mouth === 'tusks' ? .23 : 0, .08]], .035, teethMat);
    }
    if (a.mouth === 'tongue' || a.mutations.includes('giant_tongue')) {
      tongue = group(jaw, [0, -.06, .07]);
      tongue.scale.setScalar(a.mutations.includes('giant_tongue')?1.5:1);
      curve(tongue, [[0, 0, 0], [.06, -.28, .13], [.17, -.65, .21], [.28, -.73, .16]], .11, flesh, .7);
    }
  }
  if(a.mutations.includes('skeletal_face')) for(const side of [-1,1])hole(side*hw*.74,-hh*.14,hw*.1,hh*.08);
  const depth=hs*({stag:.68,avian:.83,beast:1.02,cyclops:.72,wraith:.48,imp:.67,toad:.56,mask:.7}[visage]);
  const shell = new THREE.ExtrudeGeometry(contour, { depth, bevelEnabled: true, bevelSegments: 3, steps: 8, bevelSize: .045*hs, bevelThickness: .04*hs, curveSegments: 12 });
  const cranialVertices=shell.getAttribute('position');
  for(let i=0;i<cranialVertices.count;i++) {
    const x=cranialVertices.getX(i),y=cranialVertices.getY(i),z=cranialVertices.getZ(i);
    const t=THREE.MathUtils.clamp(z/depth,0,1), lower=THREE.MathUtils.clamp(-y/hh,0,1);
    // Rear sections narrow into a nape; the brow retains a vault, while the
    // mandible and muzzle project forward. No separate spherical backing.
    const taper=.18+.82*Math.sqrt(Math.max(0,1-t*t));
    const muzzle=(visage==='beast'?.32:visage==='avian'?.21:visage==='stag'?.19:0)*hs*lower;
    cranialVertices.setXYZ(i,x*taper,y*taper+t*hh*.13,faceZ-z+muzzle*(1-t));
  }
  if(jaw)jaw.position.z+=(visage==='beast'?.32:visage==='avian'?.21:0)*hs*THREE.MathUtils.clamp(-mouthY/hh,0,1);
  // Reversing the extrusion direction reverses winding.
  const shellIndex=shell.getIndex();
  if(shellIndex)for(let i=0;i<shellIndex.count;i+=3){const b=shellIndex.getX(i+1);shellIndex.setX(i+1,shellIndex.getX(i+2));shellIndex.setX(i+2,b);}
  else for(let i=0;i<cranialVertices.count;i+=3)for(const name of ['position','uv']){const attr=shell.getAttribute(name);for(let j=0;j<attr.itemSize;j++){const b=attr.array[(i+1)*attr.itemSize+j];attr.array[(i+1)*attr.itemSize+j]=attr.array[(i+2)*attr.itemSize+j];attr.array[(i+2)*attr.itemSize+j]=b;}}
  shell.computeVertexNormals();
  const napeOutline=new THREE.Shape(contour.getPoints(24));
  const napeGeometry=new THREE.ShapeGeometry(napeOutline,12);
  const napeVertices=napeGeometry.getAttribute('position');
  for(let i=0;i<napeVertices.count;i++)napeVertices.setXYZ(i,napeVertices.getX(i)*.20,napeVertices.getY(i)*.20+hh*.13,0);
  napeGeometry.computeVertexNormals();
  const nape=mesh(head,napeGeometry,faceMaterial,[0,0,faceZ-depth-.042*hs]);nape.rotation.y=Math.PI;nape.name='closed-nape';

  const faceShell=mesh(head, shell, faceMaterial);faceShell.name=`cranium-${a.head}-${visage}`;
  if(jaw && visage!=='stag') {
    const mandible=oval(jaw,[0,-mh*.92,-.065*hs],[mw*1.08,.085*hs,.17*hs],faceMaterial);mandible.name='attached-mandible';
  }
  for(const side of [-1,1]) {
    if(visage==='beast'||visage==='stag'||visage==='wraith')curve(head,[[side*hw*.88,hh*.07,faceZ-.03],[side*hw*.77,-hh*.23,faceZ+.05],[side*hw*.48,-hh*.49,faceZ+.02]],.07*hs,faceMaterial,.65);
    if(a.skin==='fur')for(let j=0;j<5;j++)curve(head,[[side*hw*.72,hh*(.35-j*.16),-.15*hs],[side*hw*(1.03+j*.025),hh*(.23-j*.17),-.24*hs],[side*hw*.9,hh*(.03-j*.18),-.36*hs]],.09*hs,soft,.02);
  }
  if (visage === 'stag') {
    for (const side of [-1, 1]) {
      curve(head, [[side * .13, -.12, faceZ + .08], [side * .1, -.5, faceZ + .16], [side * .07, -hh * 1.12, faceZ + .2]], .08, bone, .3);
      oval(head, [side * .075, -hh * .52, faceZ + .17], [.033, .11, .02], dark);
    }
  }
  if (visage === 'beast') {
    oval(head, [0, -hh * .16, faceZ+.10*hs], [hw*.47, hh*.14, .16*hs], skin);
    oval(head, [0, -hh * .17, faceZ+.24*hs], [hw*.28, hh*.10, .045*hs], dark);
  }
  if(a.head==='jar') {
    const rim=mesh(head,new THREE.TorusGeometry(hw*.63,.065,7,20),soft,[0,hh*.92,-.04]);rim.rotation.x=Math.PI/2;
    curve(head,[[-hw*.5,hh*.42,faceZ+.08],[-hw*.35,hh*.14,faceZ+.08],[-hw*.48,-hh*.05,faceZ+.08]],.017,dark,1);
  }
  if (a.head === 'flame') for (const side of [-1, 0, 1]) curve(head, [[side * .24, .3, 0], [side * .3, .64, 0], [side * .23 + .13, .94, 0]], .17, skin);
  if (a.mutations.includes('two_faces')) {
    const rear = group(head,[0,0,-.18]); rear.rotation.y = Math.PI; rear.add(faceShell.clone());
    for (const original of [...eyes]) {
      const duplicate = original.group.clone(true); rear.add(duplicate);
      eyes.push({ group: duplicate });
    }
    if (jaw) rear.add(jaw.clone(true));
  }
  if (a.mutations.includes('extra_jaw') && jaw) {
    const extra = jaw.clone(true); extra.position.y -= .23; extra.scale.setScalar(.8); head.add(extra);
  }
  if(a.horns!=='none') {
    const sides=a.horns==='single'?[0]:a.horns==='crown'?[-1,-.5,0,.5,1]:[-1,1];
    for(const side of sides){
      const horn=group(head,[side*hw*.72,hh*(a.horns==='single'?.4:.74),a.horns==='single'?faceZ*.8:-.05]);horn.name=`horn-${a.horns}`;
      const length=.65*p.hornScale*(side===1&&(p.brokenHorn||a.mutations.includes('asymmetric_horns'))?.58:1);
      if(a.horns==='straight'||a.horns==='single')curve(horn,[[0,0,0],[side*.08,length*.5,.05],[side*.12,length,.14]],.075,hornMat,.01);
      else if(a.horns==='oni')curve(horn,[[0,0,0],[side*.09,length*.28,.09],[side*.13,length*.54,.27]],.17,hornMat,.01);
      else if(a.horns==='ram'){
        const pts:Point[]=Array.from({length:12},(_,i)=>{const angle=i/11*Math.PI*1.9,r=.32*(1-i/15);return [side*(.08+Math.sin(angle)*r),Math.cos(angle)*r,-.02+i*.016];});curve(horn,pts,.16,hornMat,.18);
      } else if(a.horns==='crown')curve(horn,[[0,0,0],[side*.12,length*.24,0],[side*.13,length*(.6-Math.abs(side)*.2),.04]],.09,gold,.02);
      else if(a.horns==='antlers'){
        curve(horn,[[0,0,0],[side*.21,length*.5,-.03],[side*.26,length*1.25,0]],.095,hornMat,.08);
        for(let j=0;j<3;j++)curve(horn,[[side*.12,length*(.24+j*.27),0],[side*(.4+j*.04),length*(.34+j*.27),.015],[side*(.45+j*.06),length*(.54+j*.27),.02]],.047,hornMat,.01);
      } else curve(horn,[[0,0,0],[side*.31,length*.37,-.14],[side*.4,length*.81,-.28],[side*.18,length,-.4]],.13,hornMat,.02);
    }
  }
  if (a.ears !== 'none') for (const side of [-1, 1]) {
    const ear = group(head, [side * hw * .84, .13, 0]); ears.push(ear);
    const long = a.ears === 'long' ? .56 : .3;
    if (a.ears === 'round') { oval(ear, [side * .1, .03, 0], [.2, .22, .1]); oval(ear, [side * .1, .03, .08], [.12, .14, .03], cloth); }
    else { curve(ear, [[0, 0, 0], [side * long * .65, .1, 0], [side * long, a.ears === 'fin' ? .02 : .25, -.05]], .16, skin); curve(ear, [[0, 0, .11], [side * long * .55, .1, .09], [side * long * .83, .18, .01]], .065, cloth); }
  }
  for (let i = 0; i < a.armCount; i++) {
    const side=i%2?1:-1, shoulderY=upper?(template.horizontal?.64:.24):bh*(template.shoulderHeight-Math.floor(i/2)*.42);
    const arm=group(upper??body,[side*(upper?bw*.48:radiusAt(shoulderY)-.035),shoulderY,0]); arms.push(arm); arm.name='shoulder-socket';
    const length=(a.arms==='long'||a.arms==='tentacle'?.77:.47)*THREE.MathUtils.clamp(p.armLength,.65,2.1)*template.limbMultiplier;
    const thick=a.arms==='stubby'?.115:.064, reach=.25+(i===0&&p.oddArm?.1:0);
    arm.userData.attached=!a.mutations.includes('detached_hands');
    if(arm.userData.attached) {
      oval(arm,[0,0,0],[thick*1.2,thick*1.3,thick*1.2]);
      curve(arm,[[-side*.04,.025,0],[side*.13,-length*.42,.04],[side*reach,-length,.17]],thick,skin,.72);
      oval(arm,[side*.13,-length*.42,.04],[thick*.85,thick*.9,thick*.85]);
    }
    const hand=group(arm,[side*reach,-length,.17]); hands.push(hand); hand.name='wrist-socket';
    if(a.arms==='tentacle') {
      curve(hand,[[0,.025,0],[side*.15,-.1,.07],[side*.19,.06,.12],[side*.1,.11,.1]],.065,skin,.15);
      for(let j=0;j<4;j++)oval(hand,[side*.06+j*side*.025,-.035,.075],[.021,.027,.016],soft);
    } else if(a.arms==='blade') {
      curve(hand,[[0,.03,0],[side*.12,-.16,.06],[side*.23,-.29,.1]],.11,clawMat,.01);
    } else {
      oval(hand,[0,-.025,0],[.074,.1,.05]);
      const finger=a.arms==='claw'?.27:.19;
      for(let j=0;j<3;j++)curve(hand,[[(j-1)*.047,-.065,0],[(j-1)*.08,-finger*.7,.02],[(j-1)*.095+side*.025,-finger,.08]],.022,a.arms==='claw'?clawMat:skin);
      curve(hand,[[-side*.055,-.015,0],[-side*.13,-.055,.04],[-side*.14,-.12,.065]],.024,skin);
    }
  }
  for (let i=0;i<a.legCount;i++) {
    const side=i%2?1:-1, hipY=-bh*.58, radius=radiusAt(hipY), front=a.legCount>2?1-Math.floor(i/2)*2/(a.legCount/2-1):0;
    const leg=group(body,[side*radius*.55,hipY,front*radius*(bd/bw)*.56]); legs.push(leg); leg.name='hip-socket';
    const length=body.position.y+hipY-.09, thick=a.legs==='thick'?.15:a.legs==='stubby'?.1:.06;
    oval(leg,[0,0,0],[thick*1.3,thick*1.4,thick*1.2]);
    const kneeZ=a.legs==='bird'?-.18:.03;
    curve(leg,[[0,.025,0],[side*.025,-length*.48,kneeZ],[0,-length,.06]],thick,skin,.65);
    oval(leg,[side*.025,-length*.48,kneeZ],[thick*.8,thick*.85,thick*.8]);
    if(a.legs==='hoof') for(const toe of [-1,1])oval(leg,[toe*.048,-length,.12],[.045,.075,.13],dark);
    else {
      oval(leg,[0,-length,.13],[.092,.055,.14]);
      for(let j=0;j<3;j++)curve(leg,[[(j-1)*.049,-length,.18],[(j-1)*.07,-length,.27],[(j-1)*.077,-length-.025,.29]],.023,clawMat);
    }
  }
  let tail: THREE.Object3D | undefined;
  if (a.tail !== 'none' || snake || floating) {
    tail = group(body, [0, -bh * .45, -bd * .7]);
    const length = (snake ? 1.2 : .8)*p.tailLength;
    curve(tail, [[0, 0, 0], [.3, -.25, -.28], [.65, -.2, -.5], [length, .1, -.4], [length * .92, .36, -.3]], snake ? .29 : a.tail === 'thick' ? .19 : .095, skin);
    if (a.tail === 'fish' || a.tail === 'fan') for (let j = 0; j < 5; j++) curve(tail, [[length * .92, .32, -.3], [length + (j - 2) * .09, .5, -.3], [length + (j - 2) * (a.tail==='fish'?.11:.22), a.tail==='fish'?.58:.76, -.3]], .07, soft);
    if (a.tail === 'spike') oval(tail, [length * .92, .36, -.3], [.12, .2, .1], bone);
  }
  if (a.wings !== 'none') for (const side of [-1, 1]) {
    const wing = group(body, [side*bw*.65,bh*.5,-bd*.7]);wings.push(wing);
    wing.name=`wing-${a.wings}`;wing.userData.wingType=a.wings;wing.userData.side=side;
    wing.scale.setScalar(p.wingScale);
    const panel=(parent:THREE.Object3D,points:Point[],mat:THREE.Material)=>{
      const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
      const geo=new THREE.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:false});
      const wingMaterial=mat.clone();wingMaterial.side=THREE.DoubleSide;materials.push(wingMaterial);return mesh(parent,geo,wingMaterial);
    };
    if(a.wings==='stub') {
      oval(wing,[side*.14,.08,0],[.21,.16,.12],skin);
      for(let j=0;j<3;j++)curve(wing,[[side*.13,.08,0],[side*(.28+j*.04),.17-j*.09,0],[side*(.34+j*.035),.09-j*.1,-.02]],.065,soft,.04);
    } else if(a.wings==='insect') {
      for(const lower of [false,true]) {
        const lobe=group(wing,[0,0,-.04]);lobe.name='wing-lobe';lobe.userData.wingJoint=true;
        const length=lower?.66:1.02,spread=lower?-.38:.62;
        panel(lobe,[[0,0,0],[side*.26,spread*.8,0],[side*length,spread+.12,0],[side*(length+.09),spread-.03,0],[side*.64,spread-.23,0]],soft);
        for(let j=0;j<3;j++)curve(lobe,[[0,0,.026],[side*.33,spread*(.6+j*.1),.026],[side*(length-.12*j),spread+.06-.1*j,.026]],.009,hornMat,.5);
      }
    } else {
      const elbow=group(wing,[side*.38,.29,0]);elbow.name='wing-elbow';elbow.userData.wingJoint=true;
      curve(wing,[[0,0,0],[side*.2,.24,.02],[side*.38,.29,0]],.075,skin,.7);
      curve(elbow,[[0,0,0],[side*.38,.16,-.02],[side*.75,.12,-.04]],.046,hornMat,.5);
      if(a.wings==='bat') {
        const membrane=panel(elbow,[[0,0,0],[side*.75,.12,0],[side*.59,-.09,0],[side*.55,-.36,0],[side*.37,-.24,0],[side*.22,-.55,0],[side*.06,-.39,0],[-side*.33,-.32,0]],soft);membrane.name='scalloped-membrane';
        for(const [x,y] of [[.75,.12],[.55,-.36],[.22,-.55],[-.33,-.32]])curve(elbow,[[0,0,.03],[side*x*.52,y*.3,.035],[side*x,y,.035]],.021,hornMat,.25);
        curve(elbow,[[0,0,0],[side*.02,.18,.02],[side*.13,.22,.04]],.035,clawMat,.01);
      } else {
        for(let j=0;j<8;j++) {
          const feather=group(elbow,[side*j*.085,.09-j*.014,.025]);const length=.37+j*.033;
          panel(feather,[[0,.04,0],[side*.075,0,0],[side*.17,-length*.65,0],[side*.13,-length,0],[side*.035,-length*.78,0],[-side*.025,-.12,0]],j%3?soft:hornMat);
          curve(feather,[[0,0,.024],[side*.07,-length*.5,.024],[side*.13,-length*.94,.024]],.008,hornMat,.3);
        }
        for(let j=0;j<5;j++)panel(elbow,[[side*j*.13,.14,.0],[side*(j*.13+.15),.08,0],[side*(j*.13+.13),-.15,0],[side*(j*.13+.03),-.2,0]],skin);
      }
    }
  }
  if(a.back==='shell'||a.body==='shell') {
    const shell=group(body,[0,0,-bd*.63]);shell.name=`back-shell-${v.shellVariant}`;
    oval(shell,[0,0,0],[bw*1.12,bh*1.14,bd*.72],soft);
    if(v.shellVariant==='spiral')curve(shell,Array.from({length:30},(_,i)=>{const t=i/29*Math.PI*4,r=(1-i/34)*bw;return [Math.cos(t)*r,Math.sin(t)*r,-bd*.65] as Point;}),.07,hornMat,.5);
    if(v.shellVariant==='beetle')curve(shell,[[0,bh,0],[0,0,-bd*.73],[0,-bh,0]],.035,dark,1);
    if(v.shellVariant==='segmented')for(let i=0;i<5;i++)oval(shell,[0,bh*.75-i*bh*.36,-bd*.38],[bw*.88,.13,bd*.4],i%2?skin:soft);
  }
  if(a.back==='spikes')for(let i=0;i<7;i++)curve(body,[[0,bh*.85-i*.18,-bd*.72],[0,bh*.94-i*.18,-bd-.15],[0,bh*1.04-i*.18,-bd-.34]],.075,hornMat,.01).name='back-spike';
  if(a.back==='fins') {
    const finShape=new THREE.Shape();finShape.moveTo(0,-bh*.8);finShape.lineTo(-.5,-bh*.6);finShape.lineTo(-.33,-bh*.25);finShape.lineTo(-.66,bh*.1);finShape.lineTo(-.37,bh*.42);finShape.lineTo(-.55,bh*.78);finShape.lineTo(0,bh);
    const fin=mesh(body,new THREE.ExtrudeGeometry(finShape,{depth:.04,bevelEnabled:false}),soft,[0,0,-bd*.7]);fin.rotation.y=Math.PI/2;fin.name='back-sail-fin';
  }
  if(a.back==='mane')for(let i=0;i<22;i++){
    const angle=i/22*Math.PI*2;
    curve(head,[[Math.sin(angle)*hw*.75,Math.cos(angle)*hh*.72,-.1],[Math.sin(angle)*hw*1.12,Math.cos(angle)*hh*.95,-.25],[Math.sin(angle)*hw*1.24,Math.cos(angle)*hh*.9-.2,-.32]],.08,soft,.06).name='back-mane';
  }
  // Sparse silhouette tufts read as fur/feathers even at the render resolution.
  if (['fur', 'feathers', 'bark'].includes(a.skin)) {
    for (let i = 0; i < 54; i++) {
      const angle = i * 2.39996, y = 1 - 2 * (i + .5) / 54, radial = Math.sqrt(1 - y * y);
      const x = Math.cos(angle) * radial * bw, z = Math.sin(angle) * radial * bd;
      const tuft = curve(body, [[x, y * bh, z], [x * 1.12, y * bh - .07, z * 1.12], [x * 1.18, y * bh - .19, z * 1.18]], a.skin === 'feathers' ? .08 : .055, i % 4 ? skin : soft); tuft.name = `skin-${a.skin}-${i}`;
    }
  }
  if (a.skin === 'chitin' || a.skin === 'scales' || a.skin === 'stone') for (let i = 0; i < 21; i++) {
    const angle = i * 2.4, y = (i % 7 - 3) / 4, radial = Math.sqrt(1 - y * y);
    const plate = oval(body, [Math.cos(angle) * bw * radial, y * bh, Math.sin(angle) * bd * radial], [.12, .16, .055], soft); plate.lookAt(plate.position.clone().multiplyScalar(2).add(body.position)); plate.name = `skin-${a.skin}-${i}`;
  }
  // Garments are silhouette-bearing pieces, chosen by anatomy and lineage.
  const ornaments: THREE.Object3D[] = [];
  const fabric = (parent: THREE.Object3D, outline: [number, number][], pos: Point, mat: THREE.Material) => {
    const shape = new THREE.Shape(); outline.forEach(([x,y], i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y)); shape.closePath();
    return mesh(parent, new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: false }), mat, pos);
  };
  const charm = (parent: THREE.Object3D, pos: Point, bell = false) => {
    const pendant = group(parent, pos); ornaments.push(pendant);
    curve(pendant, [[0,0,0],[.015,-.12,0],[0,-.24,0]], .014, cloth, 1);
    if (bell) {
      mesh(pendant, new THREE.CylinderGeometry(.045,.083,.12,8), gold, [0,-.27,0]);
      oval(pendant,[0,-.345,0],[.025,.028,.025],dark);
    } else {
      fabric(pendant,[[-.047,0],[.046,.01],[.055,-.16],[-.042,-.19]],[0,-.22,0],bone);
      curve(pendant,[[0,-.24,.043],[.018,-.29,.043],[-.01,-.32,.043]],.008,cloth,1);
    }
  };
  const garment=v.garment;
  const ringBand=(y:number,thickness=.026)=>{const band=mesh(body,new THREE.TorusGeometry(radiusAt(y)+.065,thickness,6,24),cloth,[0,y,0]);band.rotation.x=Math.PI/2;band.scale.y=bd/bw;return band;};
  if(garment==='belt'||garment==='bands') {ringBand(-bh*.35);if(garment==='bands')ringBand(bh*.45);}
  if(garment==='rope')curve(body,Array.from({length:35},(_,i)=>{const angle=i/34*Math.PI*5,y=bh*(.65-i/34*1.2),r=radiusAt(y)+.05;return [Math.sin(angle)*r,y,Math.cos(angle)*r*bd/bw] as Point;}),.025,gold,1);
  const drapedPanel=(parent:THREE.Object3D,startAngle:number,arc:number,top:number,hem:number,mat:THREE.Material,ragged=false)=>{
    const vertices:number[]=[],uv:number[]=[],indices:number[]=[];const columns=16,rows=5;
    for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
      const u=x/columns,t=y/rows,angle=startAngle+u*arc;
      const bottom=hem+(ragged?Math.sin(x*2.4)*.085:Math.sin(u*Math.PI)*-.08);
      const height=THREE.MathUtils.lerp(top,bottom,t),radius=radiusAt(height)+.08+t*.1+Math.sin(u*Math.PI*8)*.028*t;
      vertices.push(Math.sin(angle)*radius,height,Math.cos(angle)*radius*bd/bw);uv.push(u,t);
      if(x<columns&&y<rows){const k=y*(columns+1)+x;indices.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
    const clothMaterial=mat.clone();clothMaterial.side=THREE.DoubleSide;materials.push(clothMaterial);
    const clothPiece=mesh(parent,geo,clothMaterial);clothPiece.name=`garment-${garment}`;return clothPiece;
  };
  const wardrobe=group(upper??body);wardrobe.name=`wardrobe-${garment}`;
  if(template.horizontal&&!upper){wardrobe.rotation.x=Math.PI/2;wardrobe.scale.set(.95,bd/bh,.85);}
  if(garment==='wrap') {drapedPanel(wardrobe,-.8,Math.PI*1.9,-bh*.18,-bh*.85,cloth);ringBand(-bh*.19,.035);}
  if(garment==='mantle') {
    drapedPanel(wardrobe,.65,Math.PI*1.6,bh*.77,-bh*.6,cloth,true);
    for(const side of [-1,1])oval(wardrobe,[side*bw*.58,bh*.68,0],[bw*.43,.12,bd*.85],soft);
  }
  if(garment==='patchwork')for(let i=0;i<7;i++)drapedPanel(wardrobe,i/7*Math.PI*2,Math.PI*.32,bh*(i%2?.2:.55),-bh*(.6+i%3*.13),i%2?cloth:soft,true);
  if(garment==='sash') {
    const sash=drapedPanel(wardrobe,-.22,.48,bh*.82,-bh*.77,cloth);sash.rotation.z=-.4;
    charm(wardrobe,[bw*.3,-bh*.45,bd+.12]);
  }
  if(garment==='drape') {
    drapedPanel(wardrobe,-Math.PI*.85,Math.PI*.95,bh*.72,-bh*1.02,cloth,true);
    curve(wardrobe,[[-bw*.75,bh*.6,0],[-bw*.5,bh*.82,bd*.6],[0,bh*.55,bd+.08]],.03,gold,1);
  }
  if(garment==='strips')for(let i=0;i<3;i++){const strip=fabric(body,[[-.06,bh*.4],[.07,bh*.4],[.09,-bh*(1+i*.12)],[-.05,-bh*.9]],[(i-1)*bw*.45,0,bd+.07],i%2?cloth:soft);ornaments.push(strip);}
  if(garment==='beads'||garment==='collar')for(let i=0;i<14;i++){
    const angle=i/14*Math.PI*2,y=bh*.65,r=radiusAt(y)+.075;
    if(garment==='beads')oval(body,[Math.sin(angle)*r,y,Math.cos(angle)*r*bd/bw],[.06,.06,.06],i%2?gold:soft);
    else {const plate=fabric(body,[[-.07,.06],[.07,.06],[.09,-.19],[-.09,-.19]],[Math.sin(angle)*r,y,Math.cos(angle)*r*bd/bw],i%2?gold:cloth);plate.rotation.y=angle;}
  }
  if(garment==='charms')for(let i=0;i<3;i++)charm(body,[(i-1)*bw*.5,-bh*.25,bd+.04],i===1);
  for(const item of v.accessories) {
    const parent=item.socket==='head'?head:item.socket==='wrist'&&hands.length?hands[0]:body;
    const pos:Point=parent===head?[hw*.85,hh*.55,-.04]:parent===body?item.socket==='back'?[0,bh*.35,-bd-.12]:item.socket==='neck'?[0,bh*.78,bd*.45]:[bw*.5,-bh*.3,bd*.7]:[0,.04,0];
    const ornament=group(parent,pos);ornament.name=`accessory-${item.source}-${item.kind}`;ornaments.push(ornament);
    if(item.kind==='bell'||item.kind==='talisman'||item.kind==='bone')charm(ornament,[0,0,0],item.kind==='bell');
    else if(item.kind==='leaf'||item.kind==='feather')for(let j=0;j<(item.kind==='leaf'?3:5);j++) {const leaf=oval(ornament,[(j-1)*.055,-j*.06,0],[.045,.15,.025],j%2?cloth:soft);leaf.rotation.z=(j-1)*.25;}
    else if(item.kind==='bead'||item.kind==='chain')for(let j=0;j<5;j++) {
      if(item.kind==='bead')oval(ornament,[Math.sin(j*.7)*.06,-j*.065,0],[.035,.04,.035],gold);
      else mesh(ornament,new THREE.TorusGeometry(.037,.01,5,10),gold,[0,-j*.055,0]);
    } else if(item.kind==='shell') {const shell=oval(ornament,[0,-.14,0],[.13,.15,.04],soft);for(let j=0;j<4;j++)curve(shell,[[0,-.7,1],[(j-1.5)*.4,.7,1]],.045,gold,1);}
    else if(item.kind==='metal'||item.kind==='rune') {const token=fabric(ornament,[[0,.04],[.12,-.08],[0,-.3],[-.12,-.08]],[0,0,0],gold);curve(token,[[-.065,-.07,.045],[0,-.18,.045],[.065,-.07,.045]],.015,cloth,1);}
    else {const ribbon=fabric(ornament,[[-.05,0],[.06,0],[.08,-.4],[0,-.34],[-.04,-.44]],[0,0,0],cloth);ribbon.rotation.z=.17;}
  }
  const marking=a.mutations.includes('glowing_markings')?material(c.emissive):soft;
  if(a.mutations.includes('glowing_markings')){marking.emissive.set(c.emissive);marking.emissiveIntensity=.75;}
  if(v.marking!=='none'||garment==='paint') {
    const pattern=v.marking==='none'?'runes':v.marking;
    if(pattern==='mask'||pattern==='face-stripe') {curve(head,[[0,hh*.78,faceZ+.08],[0,hh*.55,faceZ+.08],[0,hh*.3,faceZ+.08]],pattern==='mask'?.09:.025,marking,1);}
    else if(pattern==='belly')oval(body,[0,-bh*.1,bd*.87],[bw*.47,bh*.56,.035],marking);
    else if(pattern==='limb-bands')arms.forEach(arm=>{const band=mesh(arm,new THREE.TorusGeometry(.08,.02,5,12),marking,[0,-.14,.03]);band.rotation.x=Math.PI/2;});
    else if(pattern==='back-stripe')curve(body,[[0,bh*.7,-bd],[0,0,-bd*1.08],[0,-bh*.6,-bd]],.055,marking,1);
    else for(let i=0;i<7;i++) {
      const x=(i%3-1)*bw*.4,y=(Math.floor(i/3)-1)*bh*.4,z=bd+.025;
      if(pattern==='spots'||pattern==='constellation')oval(body,[x,y,z],[pattern==='spots'?.065:.025,.038,.015],marking);
      else if(pattern==='rings'||pattern==='eyes')mesh(body,new THREE.TorusGeometry(.06,.015,5,12),marking,[x,y,z]);
      else if(pattern==='swirls')curve(body,[[x-.06,y,z],[x+.04,y+.06,z],[x+.07,y-.04,z],[x-.03,y-.08,z]],.018,marking,1);
      else if(pattern==='runes')curve(body,[[x-.04,y+.06,z],[x,y,z],[x+.04,y+.06,z],[x,y,z],[x,y-.07,z]],.018,marking,1);
      else curve(body,[[x-.06,y,z],[x+.06,y+.045,z]],pattern==='gradient'?.045:.019,marking,1);
    }
  }
  let halo: THREE.Object3D | undefined;
  if (a.mutations.includes('halo') || a.horns === 'crown') {
    halo = group(head, [0, hh + .23, 0]); const ring = mesh(halo, new THREE.TorusGeometry(hw * 1.25, .034, 6, 28), gold); ring.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) oval(halo, [side * hw * 1.15, -.13, 0], [.038, .085, .038], gold);
  }
  let aura: THREE.Object3D | undefined;
  if(a.aura) {
    aura=group(creature,[0,body.position.y,0]);
    const mote=material(g.palette.accent);mote.emissive.set(g.palette.accent);mote.emissiveIntensity=.7;
    for(let i=0;i<5;i++) {const angle=i/5*Math.PI*2;oval(aura,[Math.sin(angle)*(bw+.25),Math.cos(angle*2)*bh,Math.cos(angle)*(bd+.25)],[.022,.035,.022],mote);}
  }
  mergeStaticMeshes(root,new Set<THREE.Object3D>(ornaments),geometries);
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3());
  const scale = 3.3 / Math.max(size.y, size.x * 1.05, size.z * 1.05, 1.6);
  creature.position.y = -bounds.min.y * scale; creature.scale.setScalar(scale);
  // Animation owns creature scale; keep normalization on a separate parent.
  creature.scale.setScalar(1); root.scale.setScalar(scale); creature.position.y = -bounds.min.y;
  root.position.x=-(bounds.max.x+bounds.min.x)*.5*scale;
  root.rotation.y = quad ? .55 : .2;
  let pixelCloud:AnimRig['pixelCloud'];
  if(v.summon.type==='pixels') {
    root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
    const surfaces:THREE.Mesh[]=[];creature.traverse(o=>{if(o instanceof THREE.Mesh&&o.visible)surfaces.push(o);});
    const count=160,geo=new THREE.BoxGeometry(.13,.13,.13),mat=material(0xffffff);geometries.push(geo);
    const cloud=new THREE.InstancedMesh(geo,mat,count);cloud.name='summon-pixel-cloud';cloud.frustumCulled=false;root.add(cloud);
    const targets:THREE.Vector3[]=[],origins:THREE.Vector3[]=[];
    for(let i=0;i<count;i++){
      const surface=surfaces[rng.int(0,surfaces.length-1)],positions=surface.geometry.getAttribute('position');
      const target=new THREE.Vector3().fromBufferAttribute(positions,rng.int(0,positions.count-1)).applyMatrix4(surface.matrixWorld).applyMatrix4(inverse);
      targets.push(target);origins.push(target.clone().add(new THREE.Vector3(rng.range(-4,4),rng.range(-3,4),rng.range(-2,2))));
      // Neutral base material avoids multiplying the sampled color twice.
      cloud.setColorAt(i,((surface.material as THREE.MeshStandardMaterial).color??new THREE.Color(c.bodyPrimary)).clone().lerp(new THREE.Color(c.bodyHighlight),.25));
    }
    pixelCloud={mesh:cloud,targets,origins};
  }
  const featureParts:THREE.Object3D[]=[];head.traverse(o=>{if(o.name.startsWith('horn-'))featureParts.push(o);});
  const assembleParts = [body, head, ...arms, ...legs,...wings,...featureParts].map((obj, i) => ({ obj, from: new THREE.Vector3((rng.float() - .5) * 1.5, .4 + rng.float() * .5, -.5), delay: i / Math.max(1,5+arms.length+legs.length+wings.length+featureParts.length), basePos: obj.position.clone(), baseScale: obj.scale.clone() }));
  root.traverse(o => { for (const axis of ['x', 'y', 'z'] as const) { o.userData[`basePos${axis.toUpperCase()}`] = o.position[axis]; o.userData[`baseRot${axis.toUpperCase()}`] = o.rotation[axis]; } });
  const rig: AnimRig = { root, creature, body, head, eyes, jaw, tongue, tail, arms, hands, legs, ears, wings, halo, aura, floating, floatingHead: a.mutations.includes('floating_head'), bodyType: a.body, summon:v.summon, pixelCloud, ornaments, assembleParts, height: size.y * scale };
  return { rig, dispose() { pixelCloud?.mesh.dispose(); geometries.forEach(x => x.dispose()); materials.forEach(x => x.dispose()); texture.dispose(); boneTexture.dispose(); clothTexture.dispose(); } };
}
