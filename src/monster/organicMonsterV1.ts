import * as THREE from 'three';
import type { MonsterGenotype } from '../generator/types';
import type { AnimRig, EyeRig } from './buildMonster';
import { createSkinTexture, createClothTexture } from './skinV1';
import { subRng } from '../generator/rng';

type Point = [number, number, number];

/** Curved anatomy remains actual geometry: pixel edges come from the renderer. */
export function buildOrganicMonster(g: MonsterGenotype): { rig: AnimRig; dispose: () => void } {
  const a = g.anatomy, p = a.proportions;
  const rng = subRng(`v${g.version}:${g.seed}`, 'organic-art');
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];
  const texture = createSkinTexture(a.skin, g.seed);
  const boneTexture = createSkinTexture('bone', g.seed);
  const clothTexture = createClothTexture(g.seed);
  const pigment = (hex: string) => { const c = new THREE.Color(hex); const h = { h: 0, s: 0, l: 0 }; c.getHSL(h); return c.setHSL(h.h, Math.min(h.s, .38), Math.max(.34, Math.min(h.l, .68))); };
  const material = (color: THREE.ColorRepresentation, map = false) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: .92, map: map ? texture : null }); materials.push(m); return m;
  };
  const earth: Record<typeof a.skin, [string, string]> = {
    smooth: ['#b9b298', '#d3c8af'], fur: ['#777856', '#aaa17b'], scales: ['#677f76', '#a9aa88'],
    bone: ['#d5c7ad', '#a99a7f'], stone: ['#8e8880', '#b6ad98'], feathers: ['#786a65', '#b29b7c'],
    chitin: ['#796156', '#a5896c'], bark: ['#777052', '#a49670'],
  };
  const skin = material(new THREE.Color(earth[a.skin][0]).lerp(pigment(g.palette.body),.16), true);
  const soft = material(earth[a.skin][1], true), bone = material('#d8c9ad'); bone.map = boneTexture;
  const flesh=material('#a45759');
  const dark = material('#301f20'), cloth = material('#873f40'), gold = material('#c69b48'); cloth.map = clothTexture; gold.map = boneTexture;
  const iris = material(new THREE.Color(g.palette.eye).lerp(new THREE.Color('#532529'),.25)), pupil = material('#171719'), light = material('#f0dfbd');
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
  const [bw, bh, bd] = dims[a.body].map((n, i) => n * Math.max(.85, Math.min(1.15, [p.bodyW, p.bodyH, p.bodyD][i]))) as Point;
  const legLength = (a.legs === 'long' || a.legs === 'bird' ? .65 : .38) * (a.mutations.includes('elongated_limbs') ? 1.4 : 1);
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

  if (snake) curve(body, [[0, -.2, 0], [-.17, -.55, .04], [-.32, -.72, .2], [.2, -.76, .33], [.57, -.72, .08]], .26, skin, .45);
  if (a.body === 'hunched') oval(body, [0, bh * .28, -bd * .42], [bw * .9, bh * .83, bd * .86]);
  if (quad || a.body === 'barrel') oval(body, [0, -.12, bd * .55], [bw * .65, bh * .64, bd * .24], soft);
  const hs = Math.max(.85, Math.min(p.headScale, 1.35));
  const woodland = a.horns === 'antlers' || a.skin === 'bark';
  const visage = woodland ? 'stag' : a.head === 'beak' ? 'avian' : quad || a.head === 'snout' ? 'beast' : a.eyes.count === 1 ? 'cyclops' : a.head === 'tall' || a.eyes.type === 'hollow' ? 'wraith' : a.mouth === 'tongue' || a.horns === 'oni' ? 'imp' : a.head === 'wide' ? 'toad' : 'mask';
  const hw = ({ stag: .62, avian: .42, beast: .44, cyclops: .59, wraith: .39, imp: .7, toad: .78, mask: .57 }[visage]) * hs;
  const hh = ({ stag: .77, avian: .54, beast: .47, cyclops: .65, wraith: .88, imp: .56, toad: .43, mask: .7 }[visage]) * hs;
  head.position.set(0, body.position.y + bh * .64 + hh * .7, quad ? .83 : .04);
  if (a.mutations.includes('floating_head')) head.position.y += .22;
  head.rotation.z = p.headTilt * .6;
  const skull = ['stag', 'wraith', 'cyclops', 'mask', 'imp'].includes(visage) || a.mutations.includes('skeletal_face');
  const faceMaterial = skull ? bone : skin;
  // The face is a sculpted shell with real socket openings, not eyes pasted onto a ball.
  oval(head, [0, hh * .17, -.08], [hw * .86, hh * .72, .32 * hs], faceMaterial);
  const contour = new THREE.Shape();
  if (visage === 'stag') {
    contour.moveTo(0, hh); contour.bezierCurveTo(-hw * .65, hh, -hw * .8, hh * .5, -hw, -.05);
    contour.lineTo(-hw * .48, -hh * .34); contour.lineTo(-hw * .23, -hh); contour.lineTo(0, -hh * .79); contour.lineTo(hw * .23, -hh); contour.lineTo(hw * .48, -hh * .34); contour.lineTo(hw, -.05); contour.bezierCurveTo(hw * .8, hh * .5, hw * .65, hh, 0, hh);
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
    if (a.mouth === 'beak') curve(jaw, [[0, .13, .06], [0, .015, .47], [0, -.18, .56]], .19, bone);
    else if (a.mouth !== 'flat') {
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * mw * .36, length = mh * (i % 2 ? 1.15 : .62);
        curve(jaw, [[x, mh * .78, .06], [x + .012, mh * .78 - length, .07], [x + .018, mh * .65 - length, .075]], i % 2 ? .031 : .023, bone);
      }
      for (const side of [-1, 1]) curve(jaw, [[side * mw * .61, -mh * .76, .06], [side * mw * .6, -mh * .25, .08], [side * mw * .56, a.mouth === 'tusks' ? .23 : 0, .08]], .035, bone);
    }
    if (a.mouth === 'tongue' || a.mutations.includes('giant_tongue')) {
      tongue = group(jaw, [0, -.06, .07]);
      curve(tongue, [[0, 0, 0], [.06, -.28, .13], [.17, -.65, .21], [.28, -.73, .16]], .11, flesh, .7);
    }
  }
  const shell = new THREE.ExtrudeGeometry(contour, { depth: .035, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .035, bevelThickness: .035, curveSegments: 14 });
  mesh(head, shell, faceMaterial, [0, 0, faceZ]);
  if (visage === 'stag') {
    for (const side of [-1, 1]) {
      curve(head, [[side * .13, -.12, faceZ + .08], [side * .1, -.5, faceZ + .16], [side * .07, -hh * 1.12, faceZ + .2]], .08, bone, .3);
      oval(head, [side * .075, -hh * .52, faceZ + .17], [.033, .11, .02], dark);
    }
  }
  if (visage === 'beast') {
    oval(head, [0, -hh * .3, .5], [.25, .14, .33], skin);
    oval(head, [0, -hh * .19, .77], [.15, .07, .065], dark);
  }
  if(a.head==='jar') {
    const rim=mesh(head,new THREE.TorusGeometry(hw*.63,.065,7,20),soft,[0,hh*.92,-.04]);rim.rotation.x=Math.PI/2;
    curve(head,[[-hw*.5,hh*.42,faceZ+.08],[-hw*.35,hh*.14,faceZ+.08],[-hw*.48,-hh*.05,faceZ+.08]],.017,dark,1);
  }
  if (a.head === 'flame') for (const side of [-1, 0, 1]) curve(head, [[side * .24, .3, 0], [side * .3, .64, 0], [side * .23 + .13, .94, 0]], .17, skin);
  if (a.mutations.includes('two_faces')) {
    const rear = group(head); rear.rotation.y = Math.PI;
    for (const original of [...eyes]) {
      const duplicate = original.group.clone(true); rear.add(duplicate);
      eyes.push({ group: duplicate });
    }
    if (jaw) rear.add(jaw.clone(true));
  }
  if (a.mutations.includes('extra_jaw') && jaw) {
    const extra = jaw.clone(true); extra.position.y -= .23; extra.scale.setScalar(.8); head.add(extra);
  }
  if (a.horns !== 'none') for (const side of a.horns === 'single' ? [0] : [-1, 1]) {
    const horn = group(head, [side * hw * .68, hh * .68, -.04]);
    const length = (a.horns === 'antlers' ? 1 : .65) * Math.max(.7, Math.min(p.hornScale, 1.5)) * (a.mutations.includes('enormous_horns') ? 1.3 : 1) * (side === 1 && (p.brokenHorn || a.mutations.includes('asymmetric_horns')) ? .58 : 1);
    if (a.horns === 'ram') curve(horn, [[0, 0, 0], [side * .3, .22, -.04], [side * .42, -.03, .06], [side * .23, -.2, .19], [side * .1, -.08, .22]], .14, bone);
    else {
      curve(horn, [[0, 0, 0], [side * .23, length * .4, -.06], [side * .29, length * .76, 0], [side * .13, length, .05]], .13, a.horns === 'crown' ? gold : a.horns === 'oni' ? cloth : bone);
      if (a.horns === 'antlers') for (let j = 0; j < 2; j++) curve(horn, [[side * .17, length * (.3 + j * .25), -.02], [side * .61, length * (.35 + j * .25), 0], [side * .7, length * (.54 + j * .25), .02]], .067, bone);
    }
  }
  if (a.ears !== 'none') for (const side of [-1, 1]) {
    const ear = group(head, [side * hw * .84, .13, 0]); ears.push(ear);
    const long = a.ears === 'long' ? .56 : .3;
    if (a.ears === 'round') { oval(ear, [side * .1, .03, 0], [.2, .22, .1]); oval(ear, [side * .1, .03, .08], [.12, .14, .03], cloth); }
    else { curve(ear, [[0, 0, 0], [side * long * .65, .1, 0], [side * long, a.ears === 'fin' ? .02 : .25, -.05]], .16, skin); curve(ear, [[0, 0, .11], [side * long * .55, .1, .09], [side * long * .83, .18, .01]], .065, cloth); }
  }
  for (let i = 0; i < a.armCount; i++) {
    const side=i%2?1:-1, shoulderY=bh*(.48-Math.floor(i/2)*.42);
    const arm=group(body,[side*(radiusAt(shoulderY)-.035),shoulderY,0]); arms.push(arm); arm.name='shoulder-socket';
    const length=(a.arms==='long'||a.arms==='tentacle'?.77:.47)*THREE.MathUtils.clamp(p.armLength,.75,1.8);
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
      curve(hand,[[0,.03,0],[side*.12,-.16,.06],[side*.23,-.29,.1]],.11,bone,.01);
    } else {
      oval(hand,[0,-.025,0],[.074,.1,.05]);
      const finger=a.arms==='claw'?.27:.19;
      for(let j=0;j<3;j++)curve(hand,[[(j-1)*.047,-.065,0],[(j-1)*.08,-finger*.7,.02],[(j-1)*.095+side*.025,-finger,.08]],.022,a.arms==='claw'?bone:skin);
      curve(hand,[[-side*.055,-.015,0],[-side*.13,-.055,.04],[-side*.14,-.12,.065]],.024,skin);
    }
  }
  for (let i=0;i<a.legCount;i++) {
    const side=i%2?1:-1, hipY=-bh*.58, radius=radiusAt(hipY), front=a.legCount>2?(i<2?1:-1):0;
    const leg=group(body,[side*radius*.55,hipY,front*radius*(bd/bw)*.56]); legs.push(leg); leg.name='hip-socket';
    const length=body.position.y+hipY-.09, thick=a.legs==='thick'?.15:a.legs==='stubby'?.1:.06;
    oval(leg,[0,0,0],[thick*1.3,thick*1.4,thick*1.2]);
    const kneeZ=a.legs==='bird'?-.18:.03;
    curve(leg,[[0,.025,0],[side*.025,-length*.48,kneeZ],[0,-length,.06]],thick,skin,.65);
    oval(leg,[side*.025,-length*.48,kneeZ],[thick*.8,thick*.85,thick*.8]);
    if(a.legs==='hoof') for(const toe of [-1,1])oval(leg,[toe*.048,-length,.12],[.045,.075,.13],dark);
    else {
      oval(leg,[0,-length,.13],[.092,.055,.14]);
      for(let j=0;j<3;j++)curve(leg,[[(j-1)*.049,-length,.18],[(j-1)*.07,-length,.27],[(j-1)*.077,-length-.025,.29]],.023,bone);
    }
  }
  let tail: THREE.Object3D | undefined;
  if (a.tail !== 'none' || snake || floating) {
    tail = group(body, [0, -bh * .45, -bd * .7]);
    const length = snake ? 1.2 : .8;
    curve(tail, [[0, 0, 0], [.3, -.25, -.28], [.65, -.2, -.5], [length, .1, -.4], [length * .92, .36, -.3]], snake ? .29 : a.tail === 'thick' ? .19 : .095, skin);
    if (a.tail === 'fish' || a.tail === 'fan') for (let j = 0; j < 5; j++) curve(tail, [[length * .92, .32, -.3], [length + (j - 2) * .09, .5, -.3], [length + (j - 2) * .16, .66, -.3]], .07, soft);
    if (a.tail === 'spike') oval(tail, [length * .92, .36, -.3], [.12, .2, .1], bone);
  }
  if (a.wings !== 'none') for (const side of [-1, 1]) {
    const wing = group(body, [side * bw * .65, bh * .5, -bd * .65]); wings.push(wing);
    if (a.wings === 'bat') {
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(side * .2, .55, side * .55, .72); shape.lineTo(side * .94, .17);
      shape.quadraticCurveTo(side * .66, .3, side * .68, -.14); shape.quadraticCurveTo(side * .42, .02, side * .33, -.32); shape.lineTo(0, 0);
      const membrane = mesh(wing, new THREE.ExtrudeGeometry(shape, { depth: .028, bevelEnabled: false }), cloth);
      membrane.position.z = -.04;
      for (const end of [[.94, .17], [.68, -.14], [.33, -.32]]) curve(wing, [[0, 0, 0], [side * .55, .69, 0], [side * end[0], end[1], 0]], .026, bone);
    } else for (let j = 0; j < (a.wings === 'insect' ? 2 : 5); j++) {
      const feather = oval(wing, [side * (.28 + j * .1), .28 - j * .13, -.03], [a.wings === 'insect' ? .18 : .095, .48 - j * .035, .045], a.wings === 'feather' ? bone : soft); feather.rotation.z = -side * (.6 + j * .14);
    }
    curve(wing, [[0, 0, 0], [side * .4, .57, -.03], [side * .8, .42, -.03]], .05, bone);
  }
  if (a.back === 'shell' || a.body === 'shell') oval(body, [0, 0, -bd * .62], [bw * 1.07, bh * 1.02, bd * .64], soft);
  if (a.back === 'spikes' || a.back === 'fins') for (let i = 0; i < 6; i++) curve(body, [[0, bh * .75 - i * .2, -bd * .75], [0, bh * .85 - i * .2, -bd - .15], [0, bh * .95 - i * .2, -bd - .24]], .09, bone);
  // Sparse silhouette tufts read as fur/feathers even at the render resolution.
  if (['fur', 'feathers', 'bark'].includes(a.skin) || a.back === 'mane') {
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
  if (woodland) {
    const mantle = mesh(body, new THREE.LatheGeometry([new THREE.Vector2(bw*.32,bh*.93),new THREE.Vector2(bw*.91,bh*.42),new THREE.Vector2(bw*1.13,-bh*.27),new THREE.Vector2(bw*.91,-bh*.96)].reverse(),24), material('#626543',true));
    mantle.scale.z = .84;
    const vertices=mantle.geometry.attributes.position;
    for(let i=0;i<vertices.count;i++) if(vertices.getY(i)<-bh*.8) vertices.setY(i,vertices.getY(i)-(i%3)*.06);
    mantle.geometry.computeVertexNormals();
    for(let i=0;i<28;i++) {
      const angle=i*2.4, y=.55-(i%7)*.2;
      const leaf=oval(body,[Math.cos(angle)*bw*(.8+(1-y)*.1),y*bh,Math.sin(angle)*bw*.85],[.13,.24,.06],i%3?skin:soft);
      leaf.rotation.z=Math.sin(angle)*.24; leaf.name=`skin-cloak-${i}`;
    }
    const scarf = fabric(body,[[-.12,.63],[.14,.66],[.17,-.8],[.07,-.74],[-.035,-.88],[-.12,-.8]],[.16,0,bw*.91],cloth); scarf.rotation.z=-.09; ornaments.push(scarf);
    for(let i=0;i<5;i++) { const y=.42-i*.2; curve(scarf,[[-.065,y,.046],[.07,y-.08,.046],[-.065,y-.16,.046]],.012,bone,1); }
    if(a.horns!=='none') for(const side of [-1,1]) charm(head,[side*hw*1.08,hh*1.05,0],true);
    if(arms.length) {
      const staff=group(hands[hands.length-1]);
      curve(staff,[[.08,-1,0],[.13,-.3,0],[.1,.5,0],[.3,.8,0],[.42,.68,0]],.035,soft,1);
      charm(staff,[.37,.63,0]);
      const ember=material('#8dcfc3'); ember.emissive.set('#4b988e'); ember.emissiveIntensity=.5;
      curve(staff,[[.35,.12,0],[.29,.22,0],[.39,.4,0]],.09,ember,.1);
    }
  } else if (visage === 'cyclops' || a.horns === 'crown' || a.mutations.includes('halo')) {
    const teal=material('#365951');
    for(let i=0;i<11;i++) {
      const angle=i/11*Math.PI*2, x=Math.sin(angle)*bw*.69,z=Math.cos(angle)*bd*.94;
      const tile=fabric(body,[[-.09,.08],[.09,.08],[.07,-.17],[-.07,-.17]],[x,bh*.7,z],gold); tile.rotation.y=angle;
      fabric(tile,[[-.062,.04],[.062,.04],[.05,-.12],[-.05,-.12]],[0,0,.038],teal);
    }
    const stole=fabric(body,[[-.13,.42],[.13,.42],[.12,-.53],[-.12,-.53]],[0,0,bd*1.06],gold);
    fabric(stole,[[-.09,.39],[.09,.39],[.08,-.48],[-.08,-.48]],[0,0,.04],teal);
    for(let i=0;i<3;i++) curve(stole,[[-.1,.16-i*.22,.08],[.1,.16-i*.22,.08]],.012,gold,1);
    for(const side of [-1,1]) charm(head,[side*hw*.83,-.03,.02],true);
  } else if (!quad && a.body !== 'serpent') {
    const robe = ['japanese','slavic','filipino','malay'].includes(g.mythology.primary);
    const garmentColor=material(robe?'#564568':'#793e49');garmentColor.map=clothTexture;
    const hem=robe?-bh*.9:-bh*.88, top=robe?bh*.48:-bh*.29;
    const garment=mesh(body,new THREE.LatheGeometry([
      new THREE.Vector2(radiusAt(hem)+.12,hem),
      new THREE.Vector2(radiusAt(-bh*.5)+.07,-bh*.5),
      new THREE.Vector2(radiusAt(top)+.045,top)
    ],24),garmentColor);garment.scale.z=bd/bw;
    const positions=garment.geometry.attributes.position;
    for(let j=0;j<positions.count;j++)if(positions.getY(j)<hem+.01)positions.setY(j,hem-(j%3)*.035);
    garment.geometry.computeVertexNormals();
    const belt=mesh(body,new THREE.TorusGeometry(radiusAt(top)+.055,.027,6,24),gold,[0,top,0]);belt.rotation.x=Math.PI/2;belt.scale.y=bd/bw;
    const panel=fabric(body,[[-.13,.1],[.13,.1],[.1,-.45],[0,-.55],[-.12,-.45]],[0,top,bd*1.07],cloth);ornaments.push(panel);
    for(let j=0;j<3;j++)curve(panel,[[-.07,-j*.13,.046],[.07,-j*.13-.08,.046],[-.07,-j*.13-.1,.046]],.009,bone,1);
    charm(body,[-radiusAt(top)*.62,top,bd*.91]);
    if(visage==='imp') charm(body,[radiusAt(top)*.65,top,bd*.91]);
    if(visage==='wraith') { const veil=fabric(body,[[-.12,bh*.6],[.11,bh*.6],[.15,-bh*1.1],[.04,-bh*.93],[-.1,-bh*1.22]],[.15,0,bd*1.08],cloth); ornaments.push(veil); }
  } else {
    const band=mesh(body,new THREE.TorusGeometry(bw*.8,.035,6,24),gold,[0,bh*.25,0]);band.rotation.x=Math.PI/2;band.scale.y=bd/bw;
    charm(body,[bw*.5,bh*.1,bd*.87]);
  }
  hands.forEach((hand,i)=>{
    const cuff=mesh(hand,new THREE.TorusGeometry(.069,.017,6,12),i%2?gold:cloth,[0,.025,0]);cuff.rotation.x=Math.PI/2;
  });

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
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3());
  const scale = 3.3 / Math.max(size.y, size.x * 1.05, size.z * 1.05, 1.6);
  creature.position.y = -bounds.min.y * scale; creature.scale.setScalar(scale);
  // Animation owns creature scale; keep normalization on a separate parent.
  creature.scale.setScalar(1); root.scale.setScalar(scale); creature.position.y = -bounds.min.y;
  if (woodland) {
    curve(head, [[0,hh*.76,faceZ+.079],[0,hh*.48,faceZ+.079],[0,hh*.27,faceZ+.079]],.018,cloth,1);
    for(const side of [-1,1]) curve(head,[[0,hh*.46,faceZ+.079],[side*.11,hh*.54,faceZ+.079],[side*.13,hh*.64,faceZ+.079]],.017,cloth,1);
  } else if (a.markings && eyeCount !== 1) for (let i = 0; i < 3; i++) oval(head, [(i - 1) * .08, hh * .82, faceZ+.078], [.012, .04, .012], cloth);
  root.rotation.y = quad ? .55 : .2;
  const assembleParts = [body, head].map((obj, i) => ({ obj, from: new THREE.Vector3((rng.float() - .5) * 1.5, .4 + rng.float() * .5, -.5), delay: i * .06, basePos: obj.position.clone(), baseScale: obj.scale.clone() }));
  root.traverse(o => { for (const axis of ['x', 'y', 'z'] as const) { o.userData[`basePos${axis.toUpperCase()}`] = o.position[axis]; o.userData[`baseRot${axis.toUpperCase()}`] = o.rotation[axis]; } });
  const rig: AnimRig = { root, creature, body, head, eyes, jaw, tongue, tail, arms, hands, legs, ears, wings, halo, aura, floating, floatingHead: a.mutations.includes('floating_head'), bodyType: a.body, ornaments, assembleParts, height: size.y * scale };
  return { rig, dispose() { geometries.forEach(x => x.dispose()); materials.forEach(x => x.dispose()); texture.dispose(); boneTexture.dispose(); clothTexture.dispose(); } };
}
