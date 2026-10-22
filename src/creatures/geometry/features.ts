import * as THREE from 'three';
import type { Contribution,Species } from '../types';
import type { SculptContext } from './context';
import type { BodySockets } from './body';
import { buildHead } from './heads';
import type { Point } from '../../monster/sculpt';
import { blade,contour,sections,dentalArch } from './anatomy';

/** Appendages mount onto anatomical pivots; inherited pieces retain their donor palette. */
export function buildFeature(c:SculptContext,b:BodySockets,s:Species,contribution:Contribution){
 const {group,oval,tube,panel}=c,m=c.palette(s),f=contribution.feature;
 const head=b.head,back=b.back,waist=b.waist;
 const parent=contribution.socket==='crown'||contribution.socket==='face'?head:contribution.socket==='back'?back:contribution.socket==='tail'?b.tail:waist;
 const part=group(parent);part.name=`${contribution.role}:${s.id}:${f}`;part.userData={...contribution};
 // These primary features are integrated into the mouth/body builder.
 if(contribution.role==='primary'&&['tusks','tongue','grin','wail','belly-scutes','ribs'].includes(f))return part;
 if(contribution.role==='primary'&&f==='smoke-tail'&&s.id==='djinn')return part;
 if(contribution.role==='primary'&&f==='moon'&&s.id==='bakunawa')return part;
 const lock=(parent:THREE.Object3D,p:Point,length:number,width:number,material:THREE.Material,angle=0)=>{
  const hair=/mane|hair|beard/.test(f)||(material.userData.surfaceKind==='fur'&&!/wings/.test(f));
  const geometry=hair?contour([{p:[0,.025,0],w:width*.40,d:width*.34},{p:[0,-length*.15,.008],w:width*.68,d:width*.40},{p:[width*.15,-length*.55,.024],w:width*.43,d:width*.27},{p:[width*.18,-length,.045],w:.001,d:.001}],12,4):blade(length,width,.035);
  const o=c.mesh(parent,geometry,material,p);o.name=hair?'surface:hair-lock':'surface:flight-feather';o.rotation.z=angle;return o;
 };
 const horn=(side:number,branch=false)=>{
  const points:Point[]=f==='bull-horns'?[[side*.26,.2,0],[side*.58,.25,-.03],[side*.72,.53,.02],[side*.65,.71,.04]]:f==='straight-horns'?[[side*.2,.25,0],[side*.24,.82,.02]]:[[side*.23,.24,0],[side*.36,.58,-.06],[side*.29,.85,.03]];
  const individual=c.individual(s);
  const origin=points[0];
  const vary=(path:Point[])=>path.map(([x,y,z]):Point=>[origin[0]+(x-origin[0])*(individual?.hornSweep??1),origin[1]+(y-origin[1])*(individual?.hornLength??1),z]);
  const varied=vary(points);
  tube(part,varied,.095,branch?c.mat('#88785b'):m.ivory,0);
  if(branch)for(let i=0;i<3;i++)tube(part,vary([[side*(.28+i*.015),.42+i*.13,0],[side*(.51+i*.04),.52+i*.14,.02],[side*(.54+i*.05),.66+i*.14,.04]]),.052,m.accent,0);
 };
 if(/horns|antlers/.test(f)){horn(-1,/antlers/.test(f));horn(1,/antlers/.test(f));}
 else if(f==='horn-crown'||f==='gold-crown'||f==='star-crown'){
  if(s.id==='lamassu'){oval(part,[0,.42,0],[.31,.25,.27],m.accent);for(let i=0;i<3;i++)tube(part,[[-.28,.29+i*.11,0],[0,.29+i*.11,.27],[.28,.29+i*.11,0]],.025,m.light,1);}
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const p:Point=[Math.sin(a)*.3,.25,Math.cos(a)*.26];tube(part,[p,[p[0]*1.3,.48+(i%2)*.15,p[2]*1.3]],.065,f==='star-crown'?m.eye:m.accent,0);}
  tube(part,[[-.31,.28,0],[0,.3,.29],[.31,.28,0],[0,.3,-.29],[-.31,.28,0]],.065,m.accent,1);
 }
 else if(/wings/.test(f)){
  const bat=f==='bat-wings'||f==='four-wings',count=f==='four-wings'?4:2;
  for(let i=0;i<count;i++){
   const side=i%2?1:-1,row=Math.floor(i/2),wing=group(part,[side*.22,-row*.40,0]);c.joints.wings.push(wing);
   if(row){wing.rotation.z=-side*.3;wing.scale.setScalar(.83);}
   const individual=c.individual(s);if(individual){wing.scale.x*=individual.chest;wing.scale.y*=individual.limbs;}
   if(bat){
    panel(wing,[[0,0],[side*.32,.44],[side*.93,.6],[side*1.15,.12],[side*.86,.16],[side*.72,-.13],[side*.43,-.02],[side*.25,-.34]],[0,0,-.02],m.accent,.035);
    for(const end of [[.93,.6],[1.15,.12],[.72,-.13],[.25,-.34]])tube(wing,[[0,0,.025],[side*.32,.44,.035],[side*end[0],end[1],.03]],.028,m.light,.3);
   }else{
    tube(wing,[[0,0,0],[side*.51,.44,0],[side*1.20,.49,0]],.13,f==='gold-wings'?m.accent:m.skin,.6);
    for(let row=0;row<3;row++)for(let feather=0;feather<10;feather++){
     const t=feather/9,x=.13+t*1.05,y=.12+Math.sin(t*Math.PI*.85)*.37-row*.09;
     const length=(1.12-t*.14)*(1-row*.22),material=f==='gold-wings'?m.accent:feather>7?m.light:m.skin;
     const quill=lock(wing,[side*x,y,.03+row*.025],length,.083-row*.008,material,-side*(.18+t*.30));
     tube(quill,[[0,-.035,.028],[0,-length*.83,.05]],.007,m.light,.12);
    }
    if(f==='lightning-wings')tube(wing,[[side*.2,.2,.08],[side*.6,.17,.08],[side*.46,-.01,.08],[side*.91,.06,.08]],.035,m.eye,.7);
   }
  }
 }
 else if(f==='snake-crown'){
  for(let i=0;i<7;i++){
   const a=(i-3)*.40,x=Math.sin(a)*.63,y=.40+Math.cos(a)*.34,snake=group(part,[Math.sin(a)*.20,.24,-.035]);
   tube(snake,[[0,0,0],[x*.50,.24,-.07],[x,y-.17,.025],[x*.91,y-.16,.20]],.052,m.skin,.75);
   const sh=group(snake,[x*.91,y-.16,.20]);
   c.mesh(sh,contour([{p:[0,0,-.045],w:.056,d:.048},{p:[0,-.009,.061],w:.067,d:.040},{p:[0,-.026,.14],w:.043,d:.027}],12,2),m.skin);
   tube(sh,[[-.049,-.027,.075],[0,-.036,.142],[.049,-.027,.075]],.009,m.dark,1);
   for(const side of [-1,1])oval(sh,[side*.046,.014,.080],[.015,.012,.016],m.eye);
   tube(sh,[[0,-.041,.12],[0,-.073,.22]],.011,m.pink,.4);c.joints.dangling.push(snake);
  }
 }
 else if(f==='nine-tails'){
  for(let i=0;i<9;i++){
   const a=(i-4)*.32,tail=group(part,[0,0,-.14]),points:Point[]=[[0,0,0],[Math.sin(a)*.62,.21,-.22],[Math.sin(a)*1.08,.75+Math.cos(a)*.22,-.30],[Math.sin(a)*1.20,1.40+Math.cos(a)*.18,-.25]];
   c.mesh(tail,contour(points.map((p,k)=>({p,w:[.07,.18,.25,.008][k],d:[.07,.15,.19,.005][k]})),18,5),m.light);
   for(let row=0;row<5;row++)for(const side of [-1,1]){const t=(row+1)/6,x=Math.sin(a)*1.17*t,y=t*(1.30+Math.cos(a)*.18);lock(tail,[x+side*.11,y,-.13],.25,.11,row>2?m.accent:m.light,side*.42-a*.20);}
   tail.rotation.y=.045*(i-4);c.joints.dangling.push(tail);
  }
 }
 else if(/tail/.test(f)){
  const tail=group(part);tail.scale.x=1.45;c.joints.tail=tail;
  if(f==='wolf-tail'){
   const rows=[{p:[0,0,0] as Point,w:.095,d:.11},{p:[.35,.04,-.16] as Point,w:.17,d:.15},{p:[.66,.30,-.20] as Point,w:.19,d:.16},{p:[.80,.63,-.12] as Point,w:.12,d:.10},{p:[.76,.82,-.06] as Point,w:.006,d:.006}];
   c.mesh(tail,contour(rows,20,4),m.skin);
   for(let row=0;row<5;row++)for(const side of [-1,1]){const t=row/5,fur=lock(tail,[.28+t*.52+side*.09,.10+t*.60,-.045],.20,.07,row%3?m.skin:m.light,-side*.45);fur.rotation.y=side*.4;}
   return part;
  }
  const watery=/water|flame|smoke/.test(f),thick=/scaled|fish|smoke|serpent/.test(f);
  tube(tail,[[0,0,0],[.46,-.12,-.16],[.85,.12,-.15],[.91,.57,.0]],thick?.2:.075,watery?m.eye:m.skin,f==='hand-tail'?.7:.1);
  if(f==='serpent-tail')tube(tail,[[.91,.57,0],[.69,.77,0],[.51,.61,.04]],.065,m.light,.1);
  if(f==='hand-tail'){oval(tail,[.91,.6,0],[.15,.17,.07],m.skin);for(let i=0;i<4;i++)tube(tail,[[.80+i*.065,.68,0],[.80+i*.07,.87,.03]],.033,m.light,.4);}
  else if(f==='fish-tail')for(const side of [-1,1])panel(tail,[[0,0],[side*.34,.2],[side*.31,-.16]],[.91,.57,0],m.accent);
  else if(/lion|flame|water/.test(f)){
   c.mesh(tail,contour(sections([[.31,.025,.024,.89],[.44,.13,.09,.93],[.63,.12,.085,.93],[.79,.005,.005,.87]]),18,4),watery?m.eye:m.skin);
   for(let i=0;i<5;i++)lock(tail,[.84+i*.038,.66,-.01],.24,.041,watery?m.eye:m.skin,(i-2)*.17);
  }
  else if(f==='tail-feathers')for(let i=0;i<5;i++){const feather=oval(tail,[(i-2)*.09,.42,-.12],[.075,.35,.05],i%2?m.skin:m.light);feather.rotation.z=(i-2)*.15;}
 }
 else if(f==='water-bowl'){
  const rim=c.mesh(part,new THREE.TorusGeometry(.27,.065,6,20),m.light,[0,.34,0]);rim.rotation.x=Math.PI/2;oval(part,[0,.34,0],[.24,.025,.24],m.eye);
 }
 else if(f==='shell'){oval(part,[0,-.19,-.14],[.52,.63,.26],m.accent);for(let i=0;i<5;i++)tube(part,[[Math.sin(i*1.25)*.38,-.2+Math.cos(i*1.25)*.46,-.26],[0,-.2,-.4]],.027,m.light,.8);}
 else if(f==='cobra-hood'){
  // The hood grows from the neck behind the skull; continuous folded membrane.
  part.position.set(0,-.13,-.13);
  c.mesh(part,contour(sections([[-.58,.16,.07],[-.35,.34,.075],[-.04,.57,.075],[.24,.51,.06],[.35,.24,.04]]),32,3,(x,y,_z,a)=>Math.max(0,Math.cos(a))*.016*Math.sin(x*38+y*9)),m.light);
  for(const side of [-1,1])for(let i=0;i<5;i++)tube(part,[[side*.12,-.54,.045],[side*(.19+i*.062),-.13,.08],[side*(.18+i*.07),.22,.065]],.008,m.accent,.6);
 }
 else if(f==='trunk'){tube(part,[[0,-.12,.39],[0,-.48,.57],[-.12,-.77,.48],[.03,-.9,.5],[.2,-.78,.59]],.13,m.skin,.4);}
 else if(f==='tusks'){const jaw=head.userData.jaw as THREE.Object3D,mouth=head.userData.mouth;if(jaw&&mouth){jaw.add(part);part.position.set(0,0,0);for(const side of [-1,1])tube(part,[[side*mouth.width*.86,.01,mouth.length*.74],[side*mouth.width*1.12,.14,mouth.length*.81],[side*mouth.width,.31,mouth.length*.84]],.05,m.ivory,0);}}
 else if(f==='large-ears'||f==='long-ears'){
  for(const side of [-1,1]){const attachment:Point=[side*(head.userData.skullWidth??.285)*.78,.10,-.045],ear=group(part,attachment),large=f==='large-ears';
   ear.name='anatomy:ear-root';ear.userData.anatomicalAnchor=attachment;
   tube(ear,[[-side*.07,.01,.02],[side*.015,-.015,.025],[side*.12,-.06,.005]],.065,m.skin,.75);
   c.mesh(ear,contour(sections([[-.32,.05,.018,side*.12],[-.19,large?.22:.055,.035,side*.21],[.10,large?.26:.08,.034,side*.22],[large?.36:.30,.025,.01,side*(large?.20:.34)]]),16,3,(x,y,_z,a)=>Math.cos(a)*.012*Math.sin(y*30+x*15)),m.skin);
   c.joints.ears.push(ear);
  }
 }
 else if(f==='tongue'||f==='grin'||f==='wail'){
  const jaw=head.userData.jaw as THREE.Object3D,mouth=head.userData.mouth;
  if(jaw&&mouth){jaw.add(part);part.position.set(0,0,0);
   if(f==='tongue'){tube(part,[[0,.02,mouth.length*.4],[0,.015,mouth.length],[.05,-.29,mouth.length*1.24]],.039,m.pink,.2);c.joints.tongue=part;}
   else{tube(part,dentalArch(mouth.width*.85,mouth.length*.93,.06,.01),.025,m.pink,1);jaw.rotation.x=Math.max(jaw.rotation.x,f==='wail'?.5:.3);jaw.userData.restOpen=jaw.rotation.x;}
  }
 }
 else if(/beard/.test(f)){
  if(s.id==='domovoi'){c.mesh(part,contour(sections([[.23,.29,.22],[.36,.32,.23],[.43,.17,.14]]),24,3),m.light);for(const side of [-1,1])for(let i=0;i<6;i++)lock(part,[side*(.17+i*.033),.32-i*.02,.20-i*.04],.5+(i%3)*.07,.07,m.light,-side*.28);}
  for(let row=0;row<2;row++)for(let i=0;i<9;i++){
   const x=(i-4)*.047;lock(part,[x,-.32-row*.1,.30+row*.012],f==='shaggy-beard'?.68:.30+(.15-Math.abs(x))*.8,.047,s.id==='lamassu'||s.id==='djinn'||s.id==='centaur'?c.mat('#59412e'):m.light,-x*.6);
  }
 }
 else if(f==='whiskers'){for(const side of [-1,1])for(let i=0;i<3;i++)tube(part,[[side*.19,-.10,.42],[side*.43,-.12+i*.05,.47],[side*.57,-.03+i*.08,.42]],.018,m.ivory,0);}
 else if(/mane|hair|crest/.test(f)&&f!=='companion-crest'){
  const dark=f==='black-hair'||f==='sparse-hair',white=/white/.test(f),flame=/flame|lightning/.test(f),around=/mane/.test(f);
  const material=dark?m.dark:flame?m.eye:white||around?m.light:m.accent;
  if(around){head.add(part);part.position.set(0,-.025,-.11);}
  if(around&&!flame){
   for(let row=0;row<3;row++)for(let i=0;i<18;i++){
    const a=i/18*Math.PI*2+(row%2)*.12,x=Math.sin(a)*(.28+row*.023),y=Math.cos(a)*(.32+row*.025);
    const fur=lock(part,[x,y,-.16+row*.15],.20+(i%3)*.035,.073,row===2&&i%3===0?material:m.skin,Math.PI-a);
    fur.rotation.x=Math.cos(a)*(.40-row*.18);fur.rotation.y=Math.sin(a)*(.50-row*.19);
   }
   return part;
  }
  if(dark){
   c.mesh(part,contour(sections([[.24,.32,.28],[.38,.32,.25],[.47,.14,.10]]),24,3),material);
   for(const side of [-1,1])for(let i=0;i<(f==='sparse-hair'?3:7);i++)lock(part,[side*(.23+i*.027),.39-i*.013,.18-i*.049],.98+(i%3)*.12,.077,material,-side*.10);
   for(let i=0;i<9;i++){const hair=lock(part,[(i-4)*.069,.32,-.285],1.04+(i%3)*.07,.073,material);hair.rotation.y=Math.PI;}
   return part;
  }
  const count=f==='sparse-hair'?5:around?18:13;
  for(let row=0;row<(around?2:1);row++)for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2;
   if(around){const x=Math.sin(a)*(.27+row*.055),y=Math.cos(a)*(.31+row*.04);lock(part,[x,y,-.005-row*.02],.24+(i%3)*.04,.10,material,Math.PI-a);}
   else if(dark){const x=Math.sin(a)*.32;lock(part,[x,.29+Math.cos(a)*.08,-.06+Math.cos(a)*.16],.87+(i%3)*.085,.075,material,-Math.sign(x)*.20);}
   else {const feather=lock(part,[(i-(count-1)/2)*.043,.27,-.07],.27+(i%4)*.075,.063,material,Math.PI+(i-(count-1)/2)*.16);feather.rotation.x=-.40;}
  }
 }
 else if(/spines|fins|fringe/.test(f)){
  for(let i=0;i<9;i++)for(const side of [-1,1]){
   const y=.18-i*.16;panel(part,[[0,0],[side*(.28+(i%3)*.04),.14],[side*.13,-.14]],[side*.22,y,-.05],/pink|red|feather/.test(f)?m.accent:m.light,.045);
  }
 }
 else if(f==='moon'||f==='flame'){
  const orb=group(part,[f==='moon'?.52:0,f==='moon'?1.17:1.66,.08]);oval(orb,[0,0,0],[.17,.19,.16],m.eye);if(f==='flame')tube(orb,[[-.12,0,0],[0,.3,0],[.13,.38,0]],.10,m.accent,0);c.joints.ornaments.push(orb);
 }
 else if(f==='nemes'){
  for(const side of [-1,1]){panel(part,[[side*.24,.28],[side*.43,.22],[side*.48,-.52],[side*.24,-.42]],[0,0,-.02],m.accent,.10);for(let i=0;i<6;i++)tube(part,[[side*.28,.17-i*.11,.105],[side*.41,.17-i*.11,.105]],.022,m.ivory,1);}
  oval(part,[0,.32,0],[.33,.10,.30],m.accent);
 }
 else if(/helmet|turban|headscarf|hood|topknot/.test(f)){
  if(f==='topknot'){oval(part,[0,.37,0],[.11,.16,.10],m.dark);}
  else{oval(part,[0,.2,-.065],[.4,.3,.32],f==='iron-helmet'?c.mat('#687982'):m.accent);if(f==='headscarf'||f==='hood')for(const side of [-1,1])tube(part,[[side*.28,.24,-.08],[side*.38,-.2,-.05],[side*.32,-.6,.04]],.105,m.accent,.75);if(f==='turban')oval(part,[0,.27,.255],[.085,.10,.045],m.eye);}
 }
 else if(/cloak|robe|coat|vest/.test(f)){
  const white=f==='white-robe',leaf=f==='leaf-cloak',vest=f==='vest',constellation=f==='constellation-cloak';
  b.body.add(part);part.position.set(0,0,0);
  const material=c.cloth(s,white?s.secondary:leaf?s.accent:constellation?'#242733':vest?'#34322c':'#4d554e');
  const cloth=contour(sections([[vest?.98:.21,vest?.34:.48,.27,0,-.045],[.65,.41,.26,0,-.045],[1.18,.30,.24,0,-.035],[1.55,.30,.235],[1.93,.37,.24],[2.13,.30,.19],[2.22,.16,.12]]),40,4,(_x,y,_z,a)=>.027*Math.sin(a*11+y*2)*Math.cos(a),.95);
  if(!white){const uv=cloth.getAttribute('uv'),indices=cloth.index!,visible:number[]=[];for(let i=0;i<indices.count;i+=3){const ids=[indices.getX(i),indices.getX(i+1),indices.getX(i+2)];if(ids.some(k=>Math.cos(uv.getX(k)*Math.PI*2)<.30))visible.push(...ids);}cloth.setIndex(visible);cloth.computeVertexNormals();}
  const double=material.clone();double.side=THREE.DoubleSide;c.materials.push(double);c.mesh(part,cloth,double).name='anatomy:folded-garment';
  if(white)for(const arm of c.joints.arms){const sleeve=group(arm);c.mesh(sleeve,contour([{p:[0,.08,0],w:.17,d:.17},{p:[Math.sign(arm.position.x)*.16,-.32,.025],w:.17,d:.14},{p:[Math.sign(arm.position.x)*.26,-.65,.09],w:.21,d:.14}],20,4,(_x,y,_z,a)=>.012*Math.sin(a*8+y*4)),double);}
  if(leaf)for(const side of [-1,1])for(let row=0;row<7;row++)for(let i=0;i<3;i++)lock(part,[side*(.13+i*.095),2.13-row*.19,.18-i*.02],.32,.092,row%2?m.accent:m.skin,side*.20);
  if(constellation)for(const side of [-1,1])for(let i=0;i<7;i++){const x=side*(.27+i%2*.12),y=.40+i*.23;tube(part,[[x-.035,y,.17],[x+.035,y,.17]],.009,m.eye,1);tube(part,[[x,y-.05,.17],[x,y+.05,.17]],.009,m.eye,1);}
 }
 else if(f==='moss'||f==='mushrooms'||f==='mushroom-pack'){
  for(let i=0;i<7;i++){const x=(i%4-1.5)*.21,y=.75+Math.floor(i/4)*.19,z=(b.body.userData.proportions?.depth??.25)+.015;
   if(f==='moss'){for(let tuft=0;tuft<5;tuft++)lock(part,[x+(tuft-2)*.039,y+(tuft%2)*.055,z],.20,.075,m.accent,(tuft-2)*.14);}
   else{tube(part,[[x,y,z],[x,y+.16,z]],.032,m.light,1);oval(part,[x,y+.17,z],[.11,.042,.095],i%2?m.accent:m.skin);}
  }
 }
 else if(f==='hanging-roots'){
  for(let i=0;i<6;i++){const root=group(part,[(i-2.5)*.065,0,0]);tube(root,[[0,0,0],[Math.sin(i)*.08,-.3,0],[Math.cos(i)*.10,-.63+(i%3)*.11,.08]],.045,m.accent,.08);c.joints.dangling.push(root);}
 }
 else if(f==='ribs'){for(let i=0;i<5;i++)for(const side of [-1,1])tube(part,[[0,.93-i*.14,.25],[side*.28,.86-i*.14,.29],[side*.3,.76-i*.14,.18]],.035,m.ivory,.8);}
 else if(f==='wood-limbs'){
  for(const limb of [...c.joints.arms,...c.joints.legs])for(const side of [-1,1]){
   tube(limb,[[side*.055,-.08,.11],[side*.073,-.4,.10],[side*.05,-.77,.10]],.018,m.dark,.7);
   tube(limb,[[side*.08,-.37,0],[side*.21,-.29,0],[side*.27,-.19,0]],.035,m.skin,0);
  }
 }
 else if(f==='belly-scutes'){for(let i=0;i<7;i++){const y=.78-i*.09;c.mesh(part,contour(sections([[y-.028,.22,.025,0,.25],[y,.24,.026,0,.25],[y+.028,.22,.023,0,.25]]),16,2),m.light);}}
 else if(f==='spots'||f==='face-paint'){for(let i=0;i<12;i++){const x=(i%4-1.5)*.14,y=f==='face-paint'?.16-Math.floor(i/4)*.12:.78-Math.floor(i/4)*.19;oval(part,[x,y,f==='face-paint'?.29:.29],[.035,.025,.018],m.accent);}}
 else if(f==='spear') {tube(part,[[.71,-.98,.06],[.71,1.56,.06]],.031,m.accent,1);panel(part,[[0,0],[-.095,-.22],[.095,-.22]],[.71,1.77,.06],m.ivory);}
 else if(f==='companion-crest'){
  b.body.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3().setFromObject(b.body),inverse=b.body.matrixWorld.clone().invert(),edge=new THREE.Vector3(bounds.max.x,bounds.max.y*.58,0).applyMatrix4(inverse);
  b.body.add(part);part.position.set(0,0,0);
  const crest=group(part,[edge.x+.52,1.74,.07]);const miniature=buildHead(c,crest,s,[0,0,0],true);miniature.scale.setScalar(.48);
  c.mesh(crest,contour(sections([[-.27,.13,.035],[-.14,.22,.045],[.16,.21,.045],[.27,.08,.025]]),14,2),m.accent,[0,-.015,-.13]);
  tube(part,[[edge.x*.68,1.99,-.05],[edge.x+.20,1.88,-.06],[edge.x+.52,1.77,-.065]],.018,m.accent,1);c.joints.ornaments.push(crest);
  // Donor emblem repeats one signature so a shared head form is still identifiable.
  const marker=s.features.find(x=>/horn|antler|crown|crest|bowl|hair|helmet|turban|ears/.test(x));
  if(marker)buildFeature(c,{...b,head:miniature},s,{...contribution,feature:marker,socket:'crown'});
  else if(s.features.includes('three-heads'))for(const side of [-1,1]){const other=buildHead(c,crest,s,[side*.31,.045,0],true);other.scale.setScalar(.26);}
  else if(s.features.includes('spots'))for(let i=0;i<5;i++)oval(crest,[(i-2)*.07,.2,.14],[.026,.024,.02],m.dark);
 }
 else if(f==='stone-brooch'||f==='charms'||f==='bells'||f==='beads'||f==='collar'||f==='bracelets'){
  const count=f==='stone-brooch'?1:7;for(let i=0;i<count;i++){const a=(i/(count-1||1)-.5)*2.3;oval(part,[Math.sin(a)*.36,.6-Math.cos(a)*.12,.23+Math.cos(a)*.1],[.065,.075,.055],m.accent);}
 }
 else if(f==='sash'||f==='wrap'||f==='loincloth'||f==='rope-belt'){
  const p=b.body.userData.proportions,hips=p.hips,depth=p.depth*.94;
  const colors:Record<string,string>={minotaur:'#594030',cyclops:'#4a3529',oni:'#443e32',bungisngis:'#79633c',rakshasa:'#d1b071',div:'#4c3545',tokoloshe:'#654338'},cloth=c.cloth(s,colors[s.id]??'#635347');
  if(f==='sash')c.mesh(part,contour([{p:[-p.chest*.70,.92,p.depth*.80],w:.083,d:.014},{p:[-.08,.59,p.depth+.025],w:.085,d:.014},{p:[hips*.75,.15,depth*.90],w:.085,d:.014}],12,4),cloth);
  else{
   c.mesh(part,contour(sections([[-.035,hips+.014,depth+.018],[.040,hips+.012,depth+.015]]),28,2),f==='rope-belt'?m.accent:cloth);
   if(f!=='rope-belt')c.mesh(part,contour(sections([[-.56,hips*.50,.021,0,depth+.02],[-.39,hips*.71,.029,0,depth+.027],[.017,hips*.78,.024,0,depth+.025]]),24,3,(x,_y,_z,a)=>Math.max(0,Math.cos(a))*.013*Math.cos(x*48)),cloth);
  }
 }
 else if(f==='talons'||f==='webbed-hands'||f==='hooves'){
  const limbs=f==='webbed-hands'?c.joints.hands:c.joints.legs;
  for(const limb of limbs){
   const mount=f==='webbed-hands'?limb:limb.userData.foot??limb;const foot=group(mount,[0,f==='webbed-hands'?-.11:0,.02]);foot.userData={...contribution};
   if(f==='hooves')tube(foot,[[0,-.025,.09],[0,-.025,.22]],.017,m.dark,1);
   else for(let i=0;i<3;i++)tube(foot,[[(i-1)*.06,0,0],[(i-1)*.13,-.035,.19],[(i-1)*.14,-.055,.26]],.032,m.ivory,.1);
  }
 }
 // Limb counts, long necks and haunches are structural features built by body.ts.
 return part;
}
