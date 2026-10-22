import * as THREE from 'three';
import type { Species } from '../types';
import type { SculptContext } from './context';
import { buildHead } from './heads';
import { contour,sections,blade,type Section } from './anatomy';
import { proportions } from './proportions';
import type { Point } from '../../monster/sculpt';

export function buildBody(c:SculptContext,creature:THREE.Group,s:Species){
 const {group,tube,mesh}=c,m=c.palette(s),body=group(creature),p=proportions(s),individual=c.individual(s),quad=s.form==='quadruped'||s.form==='centaur',serpent=s.form==='serpent',spirit=s.form==='spirit';
 if(individual){p.chest*=individual.chest;p.waist*=individual.waist;p.arm*=Math.sqrt(individual.chest);p.depth*=Math.sqrt(individual.chest);}
 body.name='anatomy:body';body.userData.proportions=p;
 const shaped=(parent:THREE.Object3D,rows:Section[],material:THREE.Material=m.skin,name='anatomy:surface',relief?:Parameters<typeof contour>[3])=>{const o=mesh(parent,contour(rows,32,serpent?8:4,relief),material);o.name=name;return o;};
 const root=(parent:THREE.Object3D,pos:Point,name:string)=>{const o=group(parent,pos);o.name=name;o.userData.anatomicalAnchor=pos;return o;};
 let headPosition:Point=[0,2.48,p.hunch],backPosition:Point=[0,1.99,-p.depth*.8],tailPosition:Point=[0,1.22,-p.depth],shoulderY=2.04,shoulderX=p.chest*.80,shoulderZ=0;
 let headParent:THREE.Object3D=body;
 const bird=s.form==='avian'||s.id==='tengu';
 const foot=(leg:THREE.Object3D,pos:Point,size:number,hoof=false)=>{
  const f=group(leg,pos);f.name='anatomy:foot';leg.userData.foot=f;
  if(bird||s.id==='kappa'){
   for(let toe=0;toe<3;toe++)tube(f,[[(toe-1)*.043,0,0],[(toe-1)*.12,-.04,.17],[(toe-1)*.15,-.055,.29]],size*.22,m.light,.18);
   tube(f,[[0,0,0],[.03,-.04,-.13]],size*.2,m.light,.08);
  }else if(hoof){
   for(const side of [-1,1])shaped(f,sections([[-.105,size*.47,.15,side*size*.52,.07],[-.07,size*.47,.17,side*size*.52,.08],[.07,size*.36,.10,side*size*.44,0]]),m.dark,'anatomy:cloven-hoof');
  }else{
   shaped(f,sections([[-.085,size,.17,0,.09],[-.045,size*1.08,.21,0,.08],[.06,size*.77,.15,0,.02],[.115,size*.55,.10]]),m.skin,'anatomy:paw');
   for(let toe=0;toe<3;toe++)tube(f,[[(toe-1)*size*.65,-.02,.18],[(toe-1)*size*.72,-.06,.27]],size*.16,m.ivory,0);
  }
 };
 const torso=(offset:Point=[0,0,0],human=false)=>{
  const target=group(body,offset),width=human?.35:p.chest,waist=human?.235:p.waist,hips=human?.27:p.hips,depth=human?.23:p.depth;
  const rows=sections([[1.02,hips*.62,depth*.6],[1.13,hips,depth*.88],[1.27,hips*.98,depth*.96],[1.45,waist,depth*(p.soft?1.16:.77)],[1.63,width*.76,depth*.95],[1.84,width*.96,depth],[2.00,width,depth*.96,0,p.hunch*.15],[2.13,width*.86,depth*.79,0,p.hunch*.36],[2.24,width*.44,depth*.57,0,p.hunch*.68],[2.42,width*.34,depth*.5,0,p.hunch]]);
  const relief=(x:number,y:number,_z:number,a:number)=>{
   const front=Math.max(0,Math.cos(a))**5,gauss=(v:number,at:number,spread:number)=>Math.exp(-1*((v-at)/spread)**2);
   if(p.muscular||human){
    const pec=.102*gauss(Math.abs(x),width*.48,width*.30)*gauss(y,1.94,.14);
    const abs=.039*gauss(Math.abs(x),waist*.40,.09)*(gauss(y,1.72,.07)+gauss(y,1.56,.06)+gauss(y,1.41,.065));
    const sternum=.032*gauss(x,0,.034)*gauss(y,1.83,.31);
    return front*(pec+abs-sternum);
   }
   return p.gaunt?front*(-.038*gauss(y,1.5,.19)+.014*Math.cos(y*47)*gauss(y,1.92,.21)):0;
  };
  if(s.id!=='tzitzimitl')shaped(target,rows,m.skin,'anatomy:continuous-torso',relief);
  else {tube(target,[[0,1.09,0],[0,1.65,0],[0,2.42,0]],.055,m.ivory,.6);shaped(target,sections([[1.08,.16,.10],[1.19,.23,.12],[1.30,.18,.075]]),m.ivory,'anatomy:pelvis');}
  if(s.id==='tzitzimitl')for(const side of [-1,1])shaped(target,sections([[1.96,.052,.064,side*shoulderX],[2.04,.062,.078,side*shoulderX],[2.13,.045,.050,side*shoulderX]]),m.ivory,'anatomy:scapula');
  if(p.gaunt&&s.id!=='leshy'&&s.id!=='cernunnos')for(const side of [-1,1]){
   tube(target,[[0,2.12,.12],[side*width*.5,2.15,.10],[side*width*.96,2.08,.03]],.024,m.light,.75);
   for(let rib=0;rib<5;rib++){const y=2.02-rib*.087,w=width*(.87-rib*.08);tube(target,[[0,y,.15],[side*w*.55,y-.028,.17],[side*w,y-.07,.08],[side*w*.85,y-.1,-.055]],.017,m.light,.8);}
  }
  if(s.form==='avian')for(const side of [-1,1])for(let row=0;row<4;row++){
   const lock=mesh(target,blade(.20+row*.018,.075,.025),row%2?m.skin:m.light,[side*(width*.76-row*.018),2.12-row*.12,.13]);lock.rotation.z=side*.35;
  }
 };
 if(quad){
  const low=s.id==='cipactli',equine=s.head==='horse'||s.form==='centaur',heavy=s.id==='ammit',lean=['fenrir','cu-sith','serpopard','mushhushshu','kelpie'].includes(s.id);
  const y=low?.80:1.16,w=(heavy?.52:lean?.34:.43)*(individual?.chest??1),d=(low?.30:heavy?.49:.40)*Math.sqrt(individual?.chest??1);
  shaped(body,[{p:[0,y,-.80],w:w*.64,d:d*.77},{p:[0,y+.04,-.58],w,d},{p:[0,y-.06,-.15],w:w*.85,d:d*.76},{p:[0,y+.06,.29],w:w*.95,d},{p:[0,y+.14,.53],w:w*.87,d:d*1.1},{p:[0,y+.20,.72],w:w*.56,d:d*.75}],m.skin,'anatomy:quadruped-torso');
  headPosition=[0,low?1.34:equine?2.17:s.id==='fenrir'?1.51:s.id==='cu-sith'?1.62:s.id==='nian'?1.65:heavy?1.58:1.88,low?1.03:lean?1.01:.91];backPosition=[0,y+d*.78,.0];tailPosition=[0,y+.14,-.77];
  if(s.features.includes('long-neck')){shaped(body,[{p:[0,y+.09,.45],w:.24,d:.25},{p:[.08,1.77,.57],w:.18,d:.18},{p:[-.12,2.23,.59],w:.135,d:.145},{p:[0,2.70,.72],w:.14,d:.15}],m.skin,'anatomy:long-neck');headPosition=[0,2.84,.77];}
  else if(s.form==='centaur'){torso([0,.50,.54],true);headPosition=[0,3.0,.54];shoulderY=2.54;shoulderX=.29;shoulderZ=.54;}
  else{
   if(s.id==='sigbin')headPosition=[0,1.04,1.01];
   shaped(body,[{p:[0,y+.08,.42],w:w*.68,d:d*.85},{p:[0,(y+headPosition[1])*.5,.69],w:equine?.22:.25,d:equine?.29:.23},{p:[0,headPosition[1]-.08,headPosition[2]-.05],w:.19,d:.19}],m.skin,'anatomy:neck');
  }
  for(const z of [.49,-.55])for(const side of [-1,1]){
   const rear=z<0,spread=low?.27:w*.69,leg=root(body,[side*spread,y-.10,z],`anatomy:${rear?'hind':'fore'}-leg`),length=y-.22;
   const kneeZ=rear?.17:-.055,hockZ=rear?-.13:.015,thigh=heavy?.23:rear?.21:.16;
   shaped(leg,[{p:[-side*.055,.13,0],w:thigh*.76,d:thigh},{p:[side*.025,-length*.17,kneeZ*.3],w:thigh,d:thigh*1.15},{p:[side*(low?.23:.03),-length*.45,kneeZ],w:thigh*.59,d:thigh*.66},{p:[side*.06,-length*.69,hockZ],w:thigh*.48,d:thigh*.57},{p:[side*.04,-length,.065],w:thigh*.45,d:thigh*.49}],m.skin,'anatomy:jointed-leg');
   foot(leg,[side*.04,-length,.065],heavy?.22:low?.20:.15,equine||s.features.includes('hooves'));c.joints.legs.push(leg);
  }
 }else if(serpent){
  const coil=s.id==='naga'||s.id==='grootslang'||s.id==='gorgon';
  const rows:Section[]=coil?[
   {p:[.64,.45,-.25],w:.018,d:.018},{p:[.78,.23,.06],w:.16,d:.16},{p:[.05,.20,.32],w:.29,d:.27},{p:[-.58,.39,.09],w:.31,d:.28},{p:[-.22,.78,-.10],w:.28,d:.27},{p:[.33,1.28,0],w:.24,d:.23},{p:[0,1.78,0],w:.21,d:.20}]:[
   {p:[-.60,.15,0],w:.009,d:.009},{p:[.16,.25,-.05],w:.10,d:.10},{p:[.57,.62,-.04],w:.19,d:.19},{p:[-.37,1.03,0],w:.26,d:.25},{p:[-.28,1.49,.03],w:.25,d:.24},{p:[.25,1.91,0],w:.20,d:.20},{p:[0,2.38,0],w:.18,d:.18}];
  const serpentMesh=shaped(body,rows,m.skin,'anatomy:serpent');body.userData.serpentSections=rows;
  // Ventral band is generated from this exact surface, with shallow transverse grooves.
  const base=serpentMesh.geometry,positions=base.getAttribute('position'),normals=base.getAttribute('normal'),uv=base.getAttribute('uv'),ix=base.index!,band:number[]=[],bandUV:number[]=[],bandNormals:number[]=[];
  for(let i=0;i<ix.count;i+=3){const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)];if(!ids.every(k=>Math.cos(uv.getX(k)*Math.PI*2)>.56))continue;for(const k of ids){const t=uv.getY(k);band.push(positions.getX(k)+normals.getX(k)*.009,positions.getY(k)+normals.getY(k)*.009,positions.getZ(k)+normals.getZ(k)*.009);bandUV.push(uv.getX(k),t);bandNormals.push(normals.getX(k),normals.getY(k),normals.getZ(k));}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(band,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(bandUV,2));geo.setAttribute('normal',new THREE.Float32BufferAttribute(bandNormals,3));mesh(body,geo,c.ventral(s)).name='anatomy:continuous-ventral-band';
  if(s.id==='gorgon'){torso([0,.28,0]);headPosition=[0,2.78,0];shoulderY=2.32;}
  else{
   const end=rows[rows.length-1],neck=root(body,end.p,'anatomy:neck-joint');
   shaped(neck,[{p:[0,-.12,0],w:end.w*1.05,d:end.d*1.05},{p:[-.08,.20,0],w:.17,d:.17},{p:[0,.43,.02],w:s.id==='grootslang'?.26:.17,d:.17}],m.skin,'anatomy:upper-neck');
   c.joints.serpentJoints.push(neck);headParent=neck;headPosition=[0,.49,.04];
  }
  backPosition=[0,coil?1.84:2.14,-.17];tailPosition=rows[1].p;
 }else{
  torso();body.scale.y=p.height;
  if(spirit){
   if(!['manananggal','vetala'].includes(s.id))shaped(body,[{p:[0,1.37,0],w:p.waist,d:p.depth*.85},{p:[-.1,.99,0],w:.18,d:.16},{p:[.16,.64,0],w:.12,d:.095},{p:[-.13,.28,.02],w:.028,d:.027}],m.skin,'anatomy:spectral-taper');
  }else for(const side of [-1,1]){
   const leg=root(body,[side*p.hips*.63,1.18,0],'anatomy:hip'),digitigrade=bird||['huli-jing','tikbalang','ahuizotl'].includes(s.id),thigh=p.leg;
   shaped(leg,[{p:[-side*.035,.14,0],w:thigh*.82,d:thigh*.9},{p:[side*.035,-.13,.015],w:thigh,d:thigh*1.04},{p:[side*.065,-.40,.07],w:thigh*.62,d:thigh*.68},{p:[side*.038,-.58,digitigrade?-.13:-.02],w:thigh*.71,d:thigh*.82},{p:[side*.05,-.78,digitigrade?-.14:-.03],w:thigh*.40,d:thigh*.48},{p:[side*.05,-.99,.02],w:thigh*.38,d:thigh*.43}],m.skin,'anatomy:jointed-leg');
   foot(leg,[side*.05,-.99,.03],p.leg*.95,s.features.includes('hooves'));c.joints.legs.push(leg);
  }
 }
 const arms=s.id==='gorgon'?2:s.id==='long-dragon'?4:s.form==='quadruped'||s.form==='avian'||serpent?0:s.features.includes('four-arms')?4:2;
 for(let i=0;i<arms;i++){
  const side=i%2?1:-1,row=Math.floor(i/2),dragon=s.id==='long-dragon',x=dragon?.20:row?p.chest*.64:shoulderX,y=dragon?1.85-row*.66:shoulderY-row*.39;
  let attachment:Point=[side*x,y,shoulderZ+row*.035];
  if(dragon){const rows=body.userData.serpentSections as Section[],t=row?.53:.78,path=new THREE.CatmullRomCurve3(rows.map(r=>new THREE.Vector3(...r.p)),false,'centripetal'),center=path.getPoint(t);attachment=[center.x+side*.12,center.y,center.z];}
  const arm=root(body,attachment,`anatomy:shoulder-${i}`),length=(dragon?.42:s.features.includes('long-arms')?1.08:.76)*(individual?.limbs??1),thick=dragon?.075:p.arm;
  arm.userData.side=side;
  if(dragon){arm.rotation.z=side*.72;arm.rotation.x=-.25;}
  if(row&&!dragon)arm.rotation.z=side*.38;
  shaped(arm,[{p:[-side*.06,.10,0],w:thick*.76,d:thick*.80},{p:[side*.075,-.06,0],w:thick*.91,d:thick*.86},{p:[side*.16,-length*.28,.03],w:thick*.80,d:thick*.90},{p:[side*.20,-length*.50,.015],w:thick*.65,d:thick*.61},{p:[side*.24,-length*.68,.06],w:thick*.65,d:thick*.62},{p:[side*.27,-length,.12],w:thick*.43,d:thick*.38}],m.skin,'anatomy:jointed-arm',(_x,y,_z,a)=>{
   // Biceps and extensor planes run along the limb instead of making round beads
   // around every joint; the elbow narrows gradually into the forearm.
   const anterior=Math.max(0,Math.cos(a))**4,t=-y/length;
   return anterior*thick*(.15*Math.exp(-1*((t-.28)/.20)**2)-.045*Math.exp(-1*((t-.60)/.20)**2));
  });
  const hand=root(arm,[side*.27,-length,.12],'anatomy:wrist');
  shaped(hand,sections([[-.20,thick*.61,thick*.30,0,.025],[-.09,thick*.65,thick*.39],[.035,thick*.42,thick*.34]]),m.skin,'anatomy:palm');
  for(let f=0;f<4;f++){const x=(f-1.5)*thick*.34; tube(hand,[[x,-.16,.015],[x*1.14,-.28-(f===1||f===2?.035:0),.04],[x*1.1,-.31,.10]],thick*.14,m.skin,.50);tube(hand,[[x*1.1,-.31,.10],[x*1.04,-.34,.16]],thick*.12,m.ivory,0);}
  tube(hand,[[side*thick*.53,-.03,.015],[side*thick*.91,-.13,.07],[side*thick*.78,-.20,.12]],thick*.22,m.skin,.40);
  c.joints.arms.push(arm);c.joints.hands.push(hand);
 }
 const head=buildHead(c,headParent,s,headPosition);head.scale.setScalar(p.head);
 const primaryJaw=c.joints.jaw;
 if(s.features.includes('three-heads'))for(const side of [-1,1]){
  const neck=root(body,[side*.13,1.89,-.06],'anatomy:secondary-neck');
  shaped(neck,[{p:[0,-.10,0],w:.19,d:.18},{p:[side*.46,.18,-.02],w:.15,d:.15},{p:[side*.79,.58,-.04],w:.14,d:.14},{p:[side*.92,.87,.01],w:.13,d:.13}],m.skin,'anatomy:secondary-neck-surface');
  const extra=buildHead(c,neck,s,[side*.95,.97,.025]);extra.scale.setScalar(.78);extra.rotation.y=side*.34;c.joints.secondaryHeads.push(neck);
 }
 c.joints.jaw=primaryJaw;
 return {body,head,back:group(body,backPosition),tail:group(body,tailPosition),waist:group(body,[0,quad?1.2:1.15,quad?.55:0])};
}
export type BodySockets=ReturnType<typeof buildBody>;
