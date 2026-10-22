import * as THREE from 'three';
import type { Species } from '../types';
import type { SculptContext } from './context';
import { contour,sections,dentalArch } from './anatomy';
import type { Point } from '../../monster/sculpt';

/** One skull, paired facial landmarks, a posterior jaw hinge and two gum arches. */
export function buildHead(c:SculptContext,parent:THREE.Object3D,s:Species,position:Point=[0,0,0],mini=false){
 const {group,mesh,tube,oval}=c,m=c.palette(s),h=group(parent,position);h.name=`head:${s.id}`;h.userData.sourceId=s.id;
 const individual=c.individual(s);
 const deer=s.id==='cernunnos'||s.id==='leshy',skull=s.head==='skull'||s.id==='pazuzu'||deer;
 const bird=s.head==='eagle',tengu=s.head==='tengu',human=s.head==='human'||tengu;
 const cyclops=s.head==='cyclops',horse=s.head==='horse',bull=s.head==='bull',fox=s.head==='fox';
 const reptile=['dragon','crocodile','cobra','turtle'].includes(s.head),croc=s.head==='crocodile',cobra=s.head==='cobra';
 const animal=['bull','horse','wolf','fox','cat','bat','elephant'].includes(s.head)&&s.id!=='pazuzu';
 const w=(cyclops?.38:s.head==='troll'?.43:s.head==='elephant'?.40:bull?.36:horse?.29:fox?.255:skull?.28:reptile?.33:.285)*(individual?.headWidth??1);
 const height=horse?.46:deer?.43:human?.39:.36;
 const eyeY=cyclops?.13:.09,eyeX=cyclops?[0]:[-w*.58,w*.58];
 const eyeW=(cyclops?.172:skull?.080:human?.065:.083)*(individual?.eyeScale??1),eyeH=(cyclops?.17:skull?.10:.055)*(individual?.eyeScale??1);
 const eyeZ=.216;
 const canine=s.head==='wolf'||fox, feline=s.head==='cat';
 const skullRows=sections([[-.25,w*.12,.055],[-.19,w*(human?.46:.55),.13],[-.09,w*(canine?.72:.86),.205],[.045,w*(feline?1.04:.96),.25],[.16,w,.255],[height*.75,w*(bull?.91:.84),.22],[height,w*.42,.13],[height+.04,.004,.004]]);
 mesh(h,contour(skullRows,40,5,(x,y,_z,a)=>Math.max(0,Math.cos(a))**6*eyeX.reduce((sum,ex)=>sum-.073*Math.exp(-1*((x-ex)/(eyeW*1.22))**2-((y-eyeY)/(eyeH*1.45))**2),0),1),m.skin).name='anatomy:skull';
 eyeX.forEach(x=>{
  // Dark recessed socket, seated eye and a lid joined to the brow plane.
  oval(h,[x,eyeY,eyeZ-.045],[eyeW*1.30,eyeH*1.32,.033],m.dark);
  const eye=group(h,[x,eyeY,eyeZ]);
  oval(eye,[0,0,0],[eyeW*(skull?.47:.89),eyeH*(skull?.48:.85),.014],cyclops?m.ivory:skull?m.dark:m.eye);
  const pupil=oval(eye,[0,0,.014],[cyclops?.060:.014,cyclops?.080:.032,.009],m.dark);
  const brow=group(h,[x,eyeY+eyeH*.98,eyeZ-.005]);
  const lid=tube(brow,[[-eyeW*1.22,.025,-.01],[0,cyclops?.048:.012,.041],[eyeW*1.24,.027,-.015]],skull?.025:.033,m.skin,.75);
  if(!cyclops)brow.rotation.z=(x<0?-1:1)*((human?.04:.20)+(individual?.brow??0));
  tube(h,[[x-eyeW*1.07,eyeY-eyeH*.73,eyeZ-.002],[x,eyeY-eyeH*1.01,eyeZ+.002],[x+eyeW*1.06,eyeY-eyeH*.70,eyeZ-.002]],.014,m.light,.7);
  if(!mini)c.joints.eyes.push({group:eye,pupil,brow});
  lid.name='anatomy:brow-ridge';
 });
 const closed=bull||['sphinx','centaur','lamassu','djinn','tengu'].includes(s.id);
 const mouthWide=s.id==='bungisngis'?.30:s.head==='troll'?.25:cyclops?.23:skull?.145:human?.115:bird?.105:bull?.255:croc?.25:horse?.175:canine?.145:feline?.16:reptile?.205:.19;
 const length=(croc?.58:horse?.45:deer?.26:reptile?.43:bull?.29:canine?.38:feline?.21:animal?.30:bird?.35:.115)*(individual?.muzzle??1);
 const zRoot=animal||reptile||bird?.19:.215,topY=horse?-.22:deer?-.24:-.13;
 const gap=closed?.025:s.id==='bakunawa'?.65:croc?.27:s.features.includes('wail')||['manananggal','pontianak','pazuzu','vetala','tzitzimitl'].includes(s.id)?.45:reptile&&!cobra?.25:bird?.22:human?.14:canine?.16:bull?.10:.20;
 const nasal=(width:number,z:number,y:number,material=m.skin)=>{
  mesh(h,contour(sections([[y-.065,width*.25,.018,0,z],[y-.015,width,.071,0,z],[y+.06,width*.64,.056,0,z-.015],[y+.14,width*.10,.012,0,z-.095]]),24,4),m.skin).name='anatomy:nose-bridge';
  if(material===m.dark||bull||horse)mesh(h,contour(sections([[y-.05,width*.2,.006,0,z+.063],[y-.020,width*.86,.030,0,z+.07],[y+.025,width*.72,.023,0,z+.059],[y+.045,width*.20,.005,0,z+.052]]),24,4),m.dark).name='anatomy:nose-pad';
  for(const side of [-1,1]){const nostril=mesh(h,contour(sections([[y-.052,.018,.007,side*width*.52,z+.064],[y-.006,.025,.009,side*width*.52,z+.075],[y+.015,.015,.008,side*width*.52,z+.069]]),10,2),m.dark);nostril.rotation.z=side*.17;nostril.name='anatomy:nostril';}
 };
 if(deer){
  mesh(h,contour(sections([[-.58,.026,.023,0,.28],[-.38,.067,.075,0,.25],[-.15,.145,.11,0,.20],[.02,.20,.105,0,.18]]),18,3,undefined,.65),m.light).name='anatomy:cervid-nasal-bone';
  for(const side of [-1,1])tube(h,[[side*.041,-.20,.321],[side*.025,-.48,.314]],.015,m.dark,.20);
 }else if(animal||reptile){
  const upper=mesh(h,contour([{p:[0,topY+.095,.115],w:mouthWide*.80,d:.115},{p:[0,topY+.115,zRoot+length*.30],w:mouthWide*(canine?1.12:.96),d:horse?.155:.115},{p:[0,topY+.085,zRoot+length*.72],w:mouthWide,d:bull?.125:.085},{p:[0,topY+.07,zRoot+length*.97],w:mouthWide*.79,d:.070},{p:[0,topY+.07,zRoot+length+.035],w:mouthWide*.38,d:.035},{p:[0,topY+.07,zRoot+length+.045],w:.004,d:.004}],32,5,undefined,1),bull||feline?m.light:m.skin);upper.name='anatomy:upper-muzzle';
  if(!deer)nasal(bull?mouthWide*.73:horse?mouthWide*.65:reptile?mouthWide*.42:mouthWide*.55,zRoot+length-.005,topY+.108,animal&&!bull&&!horse?m.dark:m.skin);
  if(deer){for(const side of [-1,1])tube(h,[[side*.075,-.16,.24],[side*.052,-.38,.39]],.028,m.dark,.45);}
 }else if(bird){
  mesh(h,contour([{p:[0,-.055,.18],w:.14,d:.10},{p:[0,-.06,.35],w:.12,d:.11},{p:[0,-.13,.50],w:.066,d:.11},{p:[0,-.26,.53],w:.002,d:.003}],28,5),m.accent).name='anatomy:hooked-upper-bill';
 }else if(skull){
  for(const side of [-1,1])tube(h,[[side*w*.8,.02,.22],[side*w*.78,-.10,.26],[side*.12,-.18,.28]],.034,m.light,.7);
  c.panel(h,[[-.047,.01],[.044,.01],[.022,.09],[0,.12],[-.023,.07]],[0,-.11,.254],m.dark,.012);
 }else if(tengu){
  mesh(h,contour([{p:[0,.015,.24],w:.075,d:.095},{p:[0,-.01,.51],w:.07,d:.064},{p:[0,-.08,.72],w:.048,d:.045}],18,3,undefined,.6),m.skin).name='anatomy:tengu-nose';
 }else if(!cyclops)nasal(human?.060:s.head==='troll'?.12:.09,.278,-.015);
 // Mouth interior has a back wall and upper palate. The lower half belongs to the jaw.
 mesh(h,contour([{p:[0,topY-.018,zRoot-.02],w:mouthWide*.79,d:.077},{p:[0,topY-.005,zRoot+length*.53],w:mouthWide*.93,d:.025},{p:[0,topY-.003,zRoot+length*.94],w:mouthWide*.76,d:.012}],24,3),m.dark).name='anatomy:palate';
 if(deer)h.children[h.children.length-1].visible=false;
 const jaw=group(h,[0,topY-(closed?.040:.080),zRoot-.06]);jaw.name='anatomy:jaw-hinge';jaw.userData.hinge=true;jaw.userData.restOpen=gap;jaw.rotation.x=gap;
 mesh(jaw,contour([{p:[0,-.025,-.04],w:mouthWide*.50,d:.052},{p:[0,-.040,length*.24],w:mouthWide*.86,d:.061},{p:[0,-.035,length*.72+.06],w:mouthWide*.96,d:.047},{p:[0,-.025,length+.06],w:mouthWide*.76,d:.035},{p:[0,-.025,length+.095],w:mouthWide*.28,d:.018},{p:[0,-.025,length+.102],w:.003,d:.003}],32,4),bird?m.accent:m.skin).name='anatomy:mandible';
 mesh(jaw,contour([{p:[0,.004,.025],w:mouthWide*.55,d:.013},{p:[0,.004,length*.60+.035],w:mouthWide*.87,d:.020},{p:[0,.002,length+.043],w:mouthWide*.68,d:.012}],20,3),m.dark).name='anatomy:mouth-floor';
 const upperArch=dentalArch(mouthWide*.88,length*.95,zRoot,topY-.015),lowerArch=dentalArch(mouthWide*.84,length*.92,.06,.01);
 tube(h,upperArch,bird?.010:.018,bird?m.accent:c.mat('#633334'),1).name='anatomy:upper-gum';
 tube(jaw,lowerArch,bird?.010:.018,bird?m.accent:c.mat('#633334'),1).name='anatomy:lower-gum';
 if(!closed&&!bird&&!cobra&&s.head!=='turtle'&&!deer){
  const count=human?7:croc?13:9;
  for(const upper of [true,false])for(let i=0;i<count;i++){
   const a=-Math.PI/2+(i+.50)/count*Math.PI,width=mouthWide*(upper?.88:.84),len=length*(upper?.95:.92),rootZ=upper?zRoot:.06;
   const pos:Point=[Math.sin(a)*width,upper?topY-.015:.01,rootZ+Math.cos(a)*len],direction=upper?-1:1;
   const fang=!human&&(upper?(i===1||i===count-2):(i===0||i===count-1)),height=(fang?.102:human?.038:.047)*(upper?1:.70)*(croc?1.3:1),radius=Math.min(.023,mouthWide/count*1.10);
   const tooth=mesh(upper?h:jaw,contour([{p:pos,w:radius,d:radius*.82},{p:[pos[0],pos[1]+direction*height*.38,pos[2]+.004],w:radius*.84,d:radius*.72},{p:[pos[0]*.985,pos[1]+direction*height,pos[2]+.012],w:fang||croc?.001:radius*.46,d:.005}],8,2,undefined,.55),m.ivory);
   tooth.name=`anatomy:${upper?'upper':'lower'}-tooth`;tooth.userData.gumRoot=pos;tooth.userData.dentalSide=upper?'upper':'lower';
  }
 }
 if(closed)tube(h,[[-mouthWide*.8,topY-.025,zRoot+length*.65],[0,topY-.036,zRoot+length],[mouthWide*.8,topY-.025,zRoot+length*.65]],.012,m.dark,.9);
 if(['wolf','fox','cat','horse','bull','bat'].includes(s.head)&&s.id!=='pazuzu')for(const side of [-1,1]){
  const ear=group(h,[side*w*.81,.23,-.045]);
  const length=bull?.27:fox?.43:.35,width=bull?.115:.095;
  const e=mesh(ear,contour(sections([[-.055,width*.45,.045],[.035,width,.047],[length*.45,width*.85,.035],[length*.86,width*.32,.014],[length,.002,.002]]),20,4,(_x,y,_z,a)=>-Math.max(0,Math.cos(a))*.022*Math.sin(Math.max(0,y)/length*Math.PI)),m.skin);e.rotation.z=-side*(bull?1.12:.39);e.name='anatomy:cupped-ear';
  const inner=mesh(e,contour(sections([[.025,width*.59,.005,0,.026],[length*.35,width*.58,.006,0,.024],[length*.76,width*.17,.003,0,.014]]),16,3),m.pink);inner.name='anatomy:inner-ear';
  c.joints.ears.push(ear);
 }
 if(s.features.includes('tusks'))for(const side of [-1,1])tube(jaw,[[side*mouthWide*.84,.012,length*.73],[side*mouthWide*1.05,.14,length*.76],[side*mouthWide*.96,.27,length*.75]],.049,m.ivory,0);
 if(s.features.includes('tongue')||s.id==='bakunawa'||s.id==='ahuizotl'){
  const tongue=group(jaw,[0,.018,length*.42]);tube(tongue,[[0,0,0],[0,.018,length*.42],[.025,-.12,length*.74],[.06,-.29,length*.91]],s.id==='manananggal'?.061:.036,m.pink,.25);if(!mini)c.joints.tongue=tongue;
 }
 if(s.id==='bakunawa')oval(h,[0,topY-.31,zRoot+length*.68],[.15,.15,.15],m.eye).name='anatomy:swallowed-moon';
 if(deer)jaw.visible=false;
 h.userData.jaw=jaw;h.userData.skullWidth=w;h.userData.mouth={width:mouthWide,length,zRoot,topY};
 if(!mini){c.joints.jaw=jaw;c.joints.jaws.push(jaw);}
 return h;
}
