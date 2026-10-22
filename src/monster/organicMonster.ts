import * as THREE from 'three';
import type { MonsterGenotype } from '../generator/types';
import type { AnimRig, EyeRig } from './buildMonster';
import { subRng } from '../generator/rng';
import { createSkinTexture, createClothTexture } from './skin';
import { carvedVolume, ellipsoid, makeSculptor, type Point, type Field } from './sculpt';
import { designFamily, DESIGN_COLORS as C } from './designLanguage';
import { mergeStaticMeshes } from './mergeStaticMeshes';

/** The new bestiary is built from carved volumes, articulated bones and layered dress. */
export function buildOrganicMonster(g:MonsterGenotype):{rig:AnimRig;dispose:()=>void} {
  const a=g.anatomy,p=a.proportions,v=g.visual!,family=designFamily(g),r=subRng(g.seed,'carved-bestiary');
  const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[];
  const boneTexture=createSkinTexture('bone',g.seed),clothTexture=createClothTexture(g.seed),skinTexture=createSkinTexture(a.skin,g.seed);
  const {group,mesh,oval,tube,panel}=makeSculptor(geometries);
  const material=(color:THREE.ColorRepresentation,map?:THREE.Texture)=>{const m=new THREE.MeshStandardMaterial({color,map:map??null,roughness:1});materials.push(m);return m;};
  const bone=material(C.bone,boneTexture),light=material(C.boneLight),cavity=material(C.socket),teeth=material(C.boneLight);
  const red=material(C.vermilion,clothTexture),flesh=material(C.tongue),fleshLight=material(C.tongueLight);
  const gold=material(C.gold),goldLight=material(C.goldLight),moss=material(C.moss,clothTexture),mossLight=material(C.mossLight,clothTexture),teal=material(C.teal,clothTexture);
  const bodyMat=material(new THREE.Color(C.bone).lerp(new THREE.Color(v.colors.bodyPrimary),a.skin==='bone'?.035:.14),skinTexture);
  const eyeMat=material(family==='oracle'?C.redEye:C.ochreEye),pupilMat=material(C.pupil),spiritMat=material(C.spirit);
  eyeMat.userData.summonEye=true;spiritMat.emissive.set(C.spirit);spiritMat.emissiveIntensity=.5;
  const root=new THREE.Group(),creature=group(root),body=group(creature),head=group(creature);
  root.userData.designFamily=family;
  const eyes:EyeRig[]=[],arms:THREE.Object3D[]=[],hands:THREE.Object3D[]=[],legs:THREE.Object3D[]=[],ears:THREE.Object3D[]=[],wings:THREE.Object3D[]=[],ornaments:THREE.Object3D[]=[];
  const quad=a.body==='quadruped',snake=a.body==='serpent',floating=a.legs==='none'||a.body==='floating';
  const bw=(family==='trickster'?.35:family==='warden'?.61:.49)*THREE.MathUtils.clamp(p.bodyW,.85,1.2);
  const bh=(family==='trickster'?.59:.66)*THREE.MathUtils.clamp(p.bodyH,.9,1.15),bd=quad?.66:.32;
  const legLength=(family==='trickster'?.43:.52)*THREE.MathUtils.clamp(p.legLength,.85,1.2);
  body.position.y=floating?.85:legLength+bh*.86;
  const torsoProfile:Point=quad?[bw,bh*.68,bd]:[bw,bh,.34];
  const torso=oval(body,[0,0,0],torsoProfile,bodyMat);torso.name='sculpted-pear-torso';
  oval(body,[0,bh*.43,.015],[bw*.7,bh*.58,.28],bodyMat);
  if(snake){torso.scale.set(bw*.7,bh,.31);tube(body,[[0,-bh*.4,0],[-.38,-bh*.72,0],[-.59,-bh*.84,.29],[.16,-bh*.94,.43],[.66,-bh*.85,.1],[.45,-bh*.75,-.27]],.25,bodyMat,.13);}
  if(a.body==='hunched')oval(body,[0,bh*.22,-.18],[bw*.9,bh*.85,.42],bodyMat);
  const headScale=THREE.MathUtils.clamp(p.headScale,.87,1.14)*(quad?.84:1);
  const hw=(family==='trickster'?.69:family==='solar'?.62:family==='warden'?.61:.66)*headScale;
  const hh=(family==='trickster'?.76:family==='solar'?.7:family==='warden'?.63:.77)*headScale;
  head.position.set(0,body.position.y+bh+.22+hh*.64,quad?.64:.03);
  head.rotation.z=p.headTilt*.22;
  // Neck joins the torso and underside of the head; no floating sticker face.
  tube(body,[[0,bh*.5,0],[0,bh+.18,0],[0,bh+.4,quad?.35:.02]],.17,bodyMat,.88);
  const solid:Field=(x,y,z)=>{
    let d=ellipsoid(x,y,z,[0,.08,-.065],[hw,hh,.46*headScale]);
    if(family==='warden'){
      d=Math.min(d,ellipsoid(x,y,z,[0,-hh*.64,.06],[hw*.35,hh*.62,.31]));
      for(const side of [-1,1])d=Math.min(d,ellipsoid(x,y,z,[side*hw*.61,-hh*.09,0],[hw*.43,hh*.31,.32]));
    }else{
      d=Math.min(d,ellipsoid(x,y,z,[0,-hh*.57,-.02],[hw*.73,hh*.38,.32]));
      if(family==='solar')d=Math.min(d,ellipsoid(x,y,z,[hw*.28,-hh*.25,.16],[hw*.65,hh*.35,.34]));
    }
    return d;
  };
  const cuts:Field[]=[];
  const eyeCount=a.eyes.count;
  const sockets:{x:number;y:number;rx:number;ry:number}[]=[];
  for(let i=0;i<eyeCount;i++){
    const central=eyeCount===1||eyeCount===3&&i===2;
    let x=central?0:(i%2?1:-1)*hw*.49;
    let y=eyeCount===1?hh*.28:eyeCount===3?(central?hh*.53:hh*.04):eyeCount>3?hh*(.57-Math.floor(i/2)*.33):hh*.15;
    let rx=eyeCount===1?hw*.49:eyeCount===3?(central?hw*.28:hw*.18):eyeCount>3?hw*.12:hw*.24;
    let ry=eyeCount===1?hh*(family==='trickster'?.35:.41):eyeCount===3?(central?hh*.26:hh*.15):eyeCount>3?hh*.11:hh*.25;
    if(a.mutations.includes('stacked_eyes')&&eyeCount>1){x=0;y=hh*(.64-i*.63/Math.max(1,eyeCount-1));rx=hw*.13;ry=hh*.22/eyeCount;}
    if(a.mutations.includes('crown_of_eyes')&&eyeCount>1){const angle=(i/(eyeCount-1)-.5)*1.9;x=Math.sin(angle)*hw*.78;y=Math.cos(angle)*hh*.55;rx=hw*.42/eyeCount;ry=rx;}
    sockets.push({x,y,rx,ry});
    cuts.push((xx,yy,zz)=>ellipsoid(xx,yy,zz,[x,y,.45*headScale],[rx*1.18,ry*1.16,.36*headScale]));
  }
  const mouthY=family==='oracle'?-hh*.44:family==='solar'?-hh*.48:-hh*.39;
  const mouthW=family==='oracle'?hw*.39:family==='solar'?hw*.49:hw*.76;
  const mouthH=family==='oracle'?hh*.32:family==='solar'?hh*.2:hh*.24;
  const hasMouth=family!=='warden'&&a.mouth!=='none';
  if(hasMouth)cuts.push((x,y,z)=>ellipsoid(x,y+(family==='trickster'?x*.17:0),z,[.025,mouthY,.43],[mouthW,mouthH,.37]));
  if(family==='warden')for(const side of [-1,1])cuts.push((x,y,z)=>ellipsoid(x,y,z,[side*.075,-hh*.7,.36],[.042,.2,.2]));
  const [outer,inner]=carvedVolume(solid,cuts,[hw*1.13,hh*1.38,.58*headScale],.037*headScale);
  const cranium=mesh(head,outer,bone);cranium.name=`cranium-${a.head}-${family}`;cranium.userData.carved=true;
  mesh(head,inner,cavity).name='recessed-socket-walls';
  oval(head,[0,.05,-.43*headScale],[hw*.22,hh*.25,.035],bone).name='closed-nape';
  sockets.forEach(({x,y,rx,ry})=>{
    const e=group(head,[x,y,.18*headScale]);e.name='carved-eye';
    oval(e,[0,0,-.025],[rx*.91,ry*.97,.075],cavity);
    const lid=oval(e,[0,0,.13],[rx,ry,.035],bone);lid.name='eyelid';lid.visible=false;
    const brow=group(head,[x,y+ry*1.15,.33*headScale]);
    tube(brow,[[-rx,0,0],[0,ry*.12,.03],[rx*.94,-ry*.07,0]],.034*headScale,bone,.72);
    if(a.eyes.type==='hollow'||family==='warden'){eyes.push({group:e,lid,brow});return;}
    oval(e,[0,0,.055],[rx*.77,ry*.86,.07],eyeMat);
    const pupil=group(e,[0,0,.13]);
    oval(pupil,[0,0,0],[rx*(a.eyes.type==='round'?.32:.14),ry*.72,.023],pupilMat);
    oval(pupil,[-rx*.28,ry*.4,.024],[.018,.032,.01],light);
    eyes.push({group:e,pupil,lid,brow});
  });
  let jaw:THREE.Object3D|undefined,tongue:THREE.Object3D|undefined;
  if(hasMouth){
    jaw=group(head,[.025,mouthY,.26]);
    oval(jaw,[0,-mouthH*.92,-.06],[mouthW*.97,.074,.15],bone).name='attached-mandible';
    // Teeth alternate length and lean, leaving deliberate breathing room.
    const count=family==='oracle'?3:family==='solar'?5:7;
    for(let i=0;i<count;i++){
      const x=(i/(count-1)-.5)*mouthW*1.6,len=mouthH*(i%2?1.12:.6)*r.range(.9,1.1);
      const y=mouthY+mouthH*.72-(family==='trickster'?x*.17:0);
      tube(head,[[x,y,.35],[x+.01,y-len*.8,.38],[x+.008,y-len,.38]],i%2?.044:.035,teeth,.6);
    }
    for(const side of [-1,1])tube(jaw,[[side*mouthW*.7,-mouthH*.73,.1],[side*mouthW*.65,-mouthH*.1,.13]],.035,teeth,.3);
    if(a.mouth==='tongue'||a.mutations.includes('giant_tongue')||family==='oracle'){
      tongue=group(jaw,[family==='trickster'?mouthW*.22:0,-mouthH*.45,.14]);
      const long=family==='oracle'?1.05:.89;
      tube(tongue,[[0,0,0],[.05,-long*.28,.14],[.18,-long*.8,.2],[family==='oracle'?.13:.3,-long,.14]],family==='oracle'?.145:.12,flesh,.8);
      tube(tongue,[[.0,-.08,.115],[.06,-long*.3,.24],[.17,-long*.75,.31]],.018,fleshLight,.5);
    }
  }
  if(family==='warden'){
    for(const side of [-1,1])tube(head,[[side*.13,-hh*.36,.31],[side*.1,-hh*.91,.38],[side*.075,-hh*1.22,.31]],.072,bone,.17);
    tube(head,[[0,hh*.8,.27],[0,hh*.45,.4],[0,hh*.08,.42]],.019,red,1);
    for(const side of [-1,1])tube(head,[[side*.17,hh*.5,.36],[side*.12,hh*.3,.43],[0,hh*.2,.44]],.018,red,1);
  }
  const charm=(parent:THREE.Object3D,at:Point,bell=false)=>{
    const o=group(parent,at);ornaments.push(o);
    tube(o,[[0,0,0],[.025,-.16,0],[0,-.27,0]],.012,gold,1);
    if(bell){mesh(o,new THREE.CylinderGeometry(.045,.095,.13,8),gold,[0,-.31,0]);oval(o,[0,-.4,0],[.027,.033,.027],cavity);}
    else {panel(o,[[-.065,0],[.065,0],[.065,-.23],[-.06,-.22]],[0,-.23,.015],bone);tube(o,[[0,-.26,.06],[.025,-.32,.06],[-.018,-.37,.06],[0,-.42,.06]],.014,red,1);}
    return o;
  };
  const hornParts:THREE.Object3D[]=[];
  const hornScale=THREE.MathUtils.clamp(p.hornScale,.85,1.35);
  if(a.horns!=='none'){
    if(family==='solar'){
      for(const side of [-1,1]){
        const o=group(head,[side*hw*.37,hh*.82,-.04]);hornParts.push(o);o.name='horn-crescent';
        tube(o,[[0,0,0],[side*.3,.24,0],[side*.33,.54,0],[side*.17,.85,0]],.14,gold,.035);
      }
      oval(head,[0,hh+ .45,-.04],[.19,.22,.15],goldLight);
    }else for(const side of a.horns==='single'?[0]:[-1,1]){
      const o=group(head,[side*hw*.63,hh*.78,-.07]);hornParts.push(o);o.name=`horn-${a.horns}`;
      const length=(family==='warden'?.86:.67)*hornScale*(side===1&&p.brokenHorn?.7:1);
      if(family==='warden'){
        tube(o,[[0,0,0],[side*.2,length*.18,0],[side*.28,length*.6,-.05],[side*.15,length,0],[side*.31,length*1.2,0]],.115,bone,.1);
        for(let j=0;j<3;j++)tube(o,[[side*.15,length*(.16+j*.25),0],[side*(.39+j*.05),length*(.19+j*.25),0],[side*(.51+j*.04),length*(.4+j*.25),.025]],.075,bone,.04);
        charm(o,[side*.48,length*.22,.03],true);
      }else if(a.horns==='ram'){
        tube(o,Array.from({length:14},(_,i)=>{const angle=i/13*5.6,rr=.32*(1-i/18);return [side*Math.sin(angle)*rr,Math.cos(angle)*rr,-i*.01] as Point;}),.16,red,.2);
      }else if(family==='oracle'){
        tube(o,[[0,0,0],[side*.07,.22,.0],[0,.4,0]],.1,gold,.02);
      }else{
        tube(o,[[0,0,0],[side*.22,length*.3,0],[side*.31,length*.7,-.025],[side*.24,length,0]],.16,red,.035);
        tube(o,[[side*.1,length*.23,0],[side*.4,length*.4,0],[side*.5,length*.36,.02]],.1,red,.03);
        charm(o,[side*.43,length*.35,.03]);
      }
    }
  }
  if(a.ears!=='none')for(const side of [-1,1]){
    const e=group(head,[side*hw*.88,-hh*.04,-.015]);ears.push(e);
    panel(e,[[0,.12],[side*.4,.17],[side*.27,.02],[side*.3,-.13],[0,-.17]],[0,0,0],family==='trickster'?red:bone,.07);
    if(family==='solar')charm(e,[side*.24,.03,.02],true);
  }
  // Limbs have shoulder, wrist and hip pivots and curled three-finger hands.
  for(let i=0;i<a.armCount;i++){
    const side=i%2?1:-1,arm=group(body,[side*bw*.74,bh*(.47-Math.floor(i/2)*.43),quad?.26:0]);arms.push(arm);arm.name='shoulder-socket';
    const reach=family==='warden'?.43:family==='oracle'?.55:.47;
    const length=(family==='trickster'?.7:family==='oracle'?.32:.52)*THREE.MathUtils.clamp(p.armLength,.9,1.2);
    tube(arm,[[0,0,0],[side*reach*.43,-length*.44,.02],[side*reach,-length,.07]],a.arms==='stubby'?.075:.04,bodyMat,.8);
    const hand=group(arm,[side*reach,-length,.07]);hands.push(hand);
    oval(hand,[0,-.025,0],[.08,.07,.055],bone);
    for(let j=0;j<3;j++) {
      const fingers:Point[]=family==='oracle'?[[side*(j-1)*.04,0,0],[side*((j-1)*.08+.04),.08+j*.018,.02],[side*((j-1)*.07+.09),.14+j*.014,.025]]:[[side*(j-1)*.05,-.04,0],[side*((j-1)*.08+.04),-.16-j*.035,.02],[side*((j-1)*.07+.09),-.23-j*.025,.025]];
      tube(hand,fingers,.023,bone,.24);
    }
    if(family==='oracle'){const band=mesh(hand,new THREE.TorusGeometry(.071,.025,6,12),gold,[0,.025,0]);band.rotation.x=Math.PI/2;}
  }
  for(let i=0;i<a.legCount;i++){
    const side=i%2?1:-1,z=quad?(i<2?.43:-.43):Math.floor(i/2)*-.19;
    const leg=group(body,[side*bw*.5,-bh*.73,z]);legs.push(leg);
    tube(leg,[[0,0,0],[-side*.035,-legLength*.55,.015],[side*.015,-legLength,.025]],a.legs==='thick'?.085:.043,bodyMat,.75);
    for(let j=0;j<3;j++)tube(leg,[[side*.015,-legLength,.025],[(j-1)*.06,-legLength-.025,.12],[(j-1)*.075,-legLength-.025,.2]],.032,bone,.6);
  }
  let tail:THREE.Object3D|undefined;
  if(a.tail!=='none'){
    tail=group(body,[bw*.65,-bh*.45,-.19]);
    const tailMat=family==='oracle'?teal:bone;
    tube(tail,[[0,0,0],[.36,-.09,-.07],[.65,.13,0],[.77,.43,.03],[.94,.3,.1],[.86,.08,.15]],a.tail==='thick'?.13:.062,tailMat,.2);
    if(family==='solar')panel(tail,[[0,0],[-.08,.12],[-.03,.3],[.04,.39],[.11,.18],[.08,.02]],[.82,.37,.035],gold,.08);
  }
  // Garments wrap the volume with separate overlapping edges, never texture stickers.
  const garment=v.garment;
  const wardrobe=group(body);wardrobe.name=`wardrobe-${garment}`;
  const skirt=(mat:THREE.Material,top:number,bottom:number,radius:number,panels=12)=>{
    for(let i=0;i<panels;i++){
      const angle=i/panels*Math.PI*2,o=group(wardrobe,[Math.sin(angle)*radius,top,Math.cos(angle)*radius*.64]);
      o.rotation.y=angle;
      panel(o,[[-.13,0],[.13,0],[.16,-(top-bottom)*.66],[.06,-(top-bottom)-r.range(0,.07)],[-.13,-(top-bottom)*.9]],[0,0,0],i%3?mat:(mat===moss?mossLight:mat));
      o.name=`garment-${garment}`;ornaments.push(o);
    }
  };
  if(family==='warden'||garment==='mantle'||garment==='patchwork'||garment==='drape'){
    for(let tier=0;tier<4;tier++)skirt(tier%2?moss:mossLight,bh*(.8-tier*.36),bh*(.1-tier*.4),bw*(.75+tier*.095),14);
    const stole=group(body,[0,bh*.64,bd+.15]);ornaments.push(stole);
    panel(stole,[[-.34,.06],[.09,-.16],[.22,-1.14],[.04,-1.26],[-.08,-1.13],[-.16,-.22]], [0,0,0],red);
    for(let i=0;i<3;i++){const y=-.34-i*.26;tube(stole,[[-.04,y,.045],[.08,y-.1,.045],[-.04,y-.2,.045]],.014,bone,1);tube(stole,[[.08,y,.045],[-.04,y-.1,.045],[.08,y-.2,.045]],.014,bone,1);}
  }else if(garment==='wrap'||garment==='strips'||garment==='sash'){
    skirt(red,-bh*.1,-bh*.86,bw*.82,garment==='strips'?5:9);
    tube(body,Array.from({length:25},(_,i)=>{const angle=i/24*Math.PI*2;return [Math.sin(angle)*bw*.95,-bh*.08,Math.cos(angle)*bd*1.03] as Point;}),.028,gold,1);
    for(const x of [-.22,.2])charm(body,[x,-bh*.1,bd+.07]);
  }
  if(family==='solar'||garment==='collar'||garment==='beads'){
    for(let i=0;i<15;i++){
      const angle=i/15*Math.PI*2,plate=group(body,[Math.sin(angle)*bw*.72,bh*.73,Math.cos(angle)*.28]);plate.rotation.y=angle;
      panel(plate,[[-.1,.025],[.1,.025],[.13,-.22],[-.12,-.22]],[0,0,0],gold);
      panel(plate,[[-.07,-.015],[.07,-.015],[.09,-.18],[-.08,-.18]],[0,0,.04],teal);
    }
    panel(body,[[-.115,0],[.115,0],[.1,-.54],[-.1,-.54]],[0,bh*.5,bd+.08],gold);
    for(let i=0;i<3;i++)panel(body,[[-.078,0],[.078,0],[.078,-.125],[-.078,-.125]],[0,bh*.47-i*.17,bd+.12],teal);
  }
  if(family==='oracle'||['belt','bands','rope','charms'].includes(garment)){
    for(let i=0;i<24;i++){const angle=i/24*Math.PI*2;oval(body,[Math.sin(angle)*bw*.94,-bh*.36,Math.cos(angle)*bd*1.05],[.075,.075,.05],gold);}
    const pendant=group(body,[0,-bh*.36,bd+.06]);ornaments.push(pendant);
    panel(pendant,[[-.13,0],[.13,0],[.13,-.34],[-.13,-.34]],[0,0,0],red);
    tube(pendant,[[0,-.04,.045],[0,-.28,.045]],.015,gold,1);tube(pendant,[[-.07,-.06,.045],[-.06,-.17,.045],[.06,-.17,.045],[.07,-.06,.045]],.014,gold,1);
  }
  // The keeper's crooked staff carries a suspended, independently moving spirit.
  if(family==='warden'&&hands.length){
    const staff=group(hands[hands.length-1],[.05,-.04,.01]);
    tube(staff,[[0,-.62,0],[.03,.25,0],[.14,.76,0],[.22,1.01,0],[.42,1.08,0],[.49,.94,0],[.37,.81,0]],.048,material('#695044'),.78);
    const wisp=group(staff,[.37,.78,.01]);ornaments.push(wisp);
    tube(wisp,[[0,0,0],[.015,-.14,0]],.011,red,1);oval(wisp,[0,-.27,0],[.09,.13,.06],spiritMat);tube(wisp,[[0,-.19,0],[.04,-.12,0],[.01,-.05,0]],.05,spiritMat,.01);
  }
  for(const item of v.accessories){
    const parent=item.socket==='head'?head:item.socket==='wrist'&&hands.length?hands[0]:body;
    const at:Point=parent===head?[hw*.88,hh*.1,.0]:parent===body?item.socket==='back'?[0,.2,-.4]:[bw*.7,-.1,.27]:[0,.02,0];
    const o=charm(parent,at,item.kind==='bell'||item.kind==='metal');o.name=`accessory-${item.source}-${item.kind}`;
  }
  if(['fur','feathers','bark'].includes(a.skin))for(let i=0;i<28;i++){
    const angle=i*2.4,y=(i%7-3)*bh*.2,radial=Math.sqrt(1-(y/bh)**2),x=Math.sin(angle)*bw*radial,z=Math.cos(angle)*bd*radial;
    tube(body,[[x,y,z],[x*1.1,y-.08,z*1.1],[x*1.12,y-.18,z*1.1]],.05,i%3?bodyMat:bone,.04).name=`skin-${a.skin}-${i}`;
  }
  if(a.back==='shell'||a.body==='shell')oval(body,[0,.0,-.28],[bw*1.08,bh*1.07,.37],moss).name=`shell-${v.shellVariant}`;
  if(a.back==='spikes')for(let i=0;i<6;i++)tube(body,[[0,bh*.65-i*.2,-.24],[0,bh*.77-i*.2,-.48]],.08,red,.03);
  // Wings are thin articulated membranes or overlapping feather blades.
  if(a.wings!=='none')for(const side of [-1,1]){
    const wing=group(body,[side*bw*.63,bh*.57,-.15]);wings.push(wing);wing.userData.side=side;wing.userData.wingType=a.wings;
    const joint=group(wing);joint.userData.wingJoint=true;
    const span=(a.wings==='stub'?.35:.85)*THREE.MathUtils.clamp(p.wingScale,.8,1.2);
    tube(joint,[[0,0,0],[side*span*.43,.34,0],[side*span,.44,-.04]],.045,bone,.4);
    if(a.wings==='feather')for(let j=0;j<8;j++)panel(joint,[[0,0],[side*.15,-.05],[side*.2,-.46+j*.023],[side*.06,-.36]],[side*span*j/9,.25+j*.02,0],j%2?bone:light);
    else panel(joint,[[0,0],[side*span*.44,.34],[side*span,.44],[side*span*.85,-.18],[side*span*.48,-.04],[side*.17,-.3]], [0,0,-.015],a.wings==='insect'?teal:red,.023);
  }
  let halo:THREE.Object3D|undefined,aura:THREE.Object3D|undefined;
  if(family==='oracle'||a.mutations.includes('halo')){
    halo=group(head,[0,hh*.94,0]);const ring=mesh(halo,new THREE.TorusGeometry(hw*1.42,.036,6,40),gold);ring.rotation.x=Math.PI/2;
    for(let i=0;i<6;i++){const angle=i/6*Math.PI*2;charm(halo,[Math.sin(angle)*hw*1.39,0,Math.cos(angle)*hw*1.39],true);}
    panel(head,[[-.19,0],[.19,0],[.13,.23],[.06,.3],[0,.56],[-.08,.27]],[0,hh*.87,.01],gold,.12);
    oval(head,[0,hh+ .13,.17],[.043,.07,.025],red);
  }
  if(a.aura){aura=group(creature,[0,body.position.y,0]);for(let i=0;i<5;i++){const angle=i/5*Math.PI*2;oval(aura,[Math.sin(angle)*(bw+.23),Math.cos(angle*2)*bh,Math.cos(angle)*(bd+.22)],[.022,.035,.025],spiritMat);}}
  mergeStaticMeshes(root,new Set<THREE.Object3D>([...ornaments,...eyes.flatMap(e=>[e.lid,e.brow].filter((o):o is THREE.Object3D=>!!o))]),geometries);
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),scale=3.35/Math.max(size.y,size.x*1.05,size.z*1.05,1.6);
  root.scale.setScalar(scale);creature.position.y=-bounds.min.y;root.position.x=-(bounds.max.x+bounds.min.x)*.5*scale;root.rotation.y=quad?.45:.12;
  let pixelCloud:AnimRig['pixelCloud'],glitchCloud:AnimRig['glitchCloud'];
  if(v.summon.type==='pixels'||v.summon.type==='glitch'){
    root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),surfaces:THREE.Mesh[]=[];
    creature.traverse(o=>{if(o instanceof THREE.Mesh&&o.visible&&o.geometry.getAttribute('position').count)surfaces.push(o);});
    const glitch=v.summon.type==='glitch',count=glitch?100:160,geo=new THREE.BoxGeometry(glitch?.18:.1,glitch?.035:.1,.08);geometries.push(geo);
    const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:glitch,opacity:glitch?.65:1,depthWrite:!glitch});materials.push(mat);
    const cloud=new THREE.InstancedMesh(geo,mat,count);cloud.name=glitch?'summon-glitch-cloud':'summon-pixel-cloud';cloud.frustumCulled=false;root.add(cloud);
    const targets:THREE.Vector3[]=[],origins:THREE.Vector3[]=[];
    for(let i=0;i<count;i++){const surface=surfaces[r.int(0,surfaces.length-1)],positions=surface.geometry.getAttribute('position');const target=new THREE.Vector3().fromBufferAttribute(positions,r.int(0,positions.count-1)).applyMatrix4(surface.matrixWorld).applyMatrix4(inverse);targets.push(target);origins.push(target.clone().add(new THREE.Vector3(r.range(-3,3),r.range(-2,3),r.range(-1,1))));cloud.setColorAt(i,glitch?new THREE.Color(i%2?C.spirit:C.vermilion):(surface.material as THREE.MeshStandardMaterial).color);}
    if(glitch)glitchCloud={mesh:cloud,targets};else pixelCloud={mesh:cloud,targets,origins};
  }
  const parts=[body,head,...arms,...legs,...wings,...hornParts];
  const assembleParts=parts.map((obj,i)=>({obj,from:new THREE.Vector3(r.range(-1,1),r.range(.2,.9),-.5),delay:i/(parts.length+1),basePos:obj.position.clone(),baseScale:obj.scale.clone()}));
  root.traverse(o=>{for(const axis of ['x','y','z'] as const){o.userData[`basePos${axis.toUpperCase()}`]=o.position[axis];o.userData[`baseRot${axis.toUpperCase()}`]=o.rotation[axis];}});
  const rig:AnimRig={root,creature,body,head,eyes,jaw,tongue,tail,wings,ears,arms,hands,legs,halo,aura,ornaments,bodyType:a.body,floatingHead:a.mutations.includes('floating_head'),floating,assembleParts,summon:v.summon,pixelCloud,glitchCloud,height:size.y*scale};
  return {rig,dispose(){pixelCloud?.mesh.dispose();glitchCloud?.mesh.dispose();geometries.forEach(o=>o.dispose());materials.forEach(o=>o.dispose());boneTexture.dispose();clothTexture.dispose();skinTexture.dispose();}};
}
