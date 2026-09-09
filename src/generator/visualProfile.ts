import { subRng } from './rng';
import type { MonsterGenotype, MythologyId } from './types';
import { ENVIRONMENTS, GARMENTS, MARKINGS, PALETTE_FAMILIES, PALETTE_MUTATIONS, SUMMON_TYPES, type PaletteFamily, type SemanticPalette, type VisualProfile } from './visualTypes';

export const COLOR_FAMILIES:Record<PaletteFamily,readonly string[]>={
 toxic:['#8abe1e','#693eab','#eaff62'],abyssal:['#142a59','#23a2c6','#73efda'],infernal:['#b12b4f','#2c1c39','#ff8840'],spectral:['#a1e2d3','#6566b1','#e6efff'],
 fungal:['#8c5192','#d2b44f','#c3d780'],celestial:['#484698','#d4aa49','#83e5de'],swamp:['#315d47','#ae974c','#65c7b8'],coral:['#e87b82','#315d99','#ffd167'],
 volcanic:['#292733','#e55831','#ffb63f'],arctic:['#dbe7ef','#427aaf','#6fe5ff'],'deep-sea':['#172442','#3c9fbc','#b5f774'],royal:['#572b8b','#b32959','#e6c167'],
 'pastel-cursed':['#edb1d1','#7ec7aa','#54427a'],monochrome:['#36343f','#ded8e7','#eb58a9'],verdant:['#278962','#b5cf43','#49ced0'],desert:['#c38145','#397f91','#f0c68a'],
 cosmic:['#292341','#9b42ac','#6d94ff'],bloodless:['#b2b7c4','#686385','#8dbaae'],earth:['#7e7055','#c2b294','#954c58'],
};
export const MYTH_VISUAL:Record<MythologyId,{palettes:PaletteFamily[]; environments:typeof ENVIRONMENTS[number][]; ornaments:string[]; garments:typeof GARMENTS[number][]}>={
 greek:{palettes:['celestial','desert'],environments:['ruins','moon'],ornaments:['chain','metal','cloth'],garments:['drape','belt']},
 norse:{palettes:['arctic','bloodless'],environments:['mist','forest','stars'],ornaments:['rope','bone','rune'],garments:['mantle','bands']},
 egyptian:{palettes:['celestial','desert'],environments:['sun','temple'],ornaments:['bead','metal','shell'],garments:['collar','beads']},
 japanese:{palettes:['infernal','royal'],environments:['moon','mist','pattern'],ornaments:['talisman','ribbon','bell'],garments:['sash','wrap']},
 chinese:{palettes:['verdant','celestial'],environments:['mist','stars','pattern'],ornaments:['ribbon','bead','chain'],garments:['strips','collar']},
 filipino:{palettes:['verdant','swamp','abyssal'],environments:['forest','moon','swamp'],ornaments:['leaf','shell','rope'],garments:['bands','wrap']},
 celtic:{palettes:['verdant','spectral'],environments:['forest','mist','moon'],ornaments:['leaf','rune','bone'],garments:['mantle','rope']},
 slavic:{palettes:['earth','arctic'],environments:['forest','cave','mist'],ornaments:['cloth','bone','talisman'],garments:['patchwork','drape']},
 hindu:{palettes:['royal','celestial'],environments:['temple','stars'],ornaments:['bead','bell','metal'],garments:['beads','sash']},
 mesopotamian:{palettes:['desert','celestial'],environments:['temple','sun','pattern'],ornaments:['chain','metal','feather'],garments:['collar','bands']},
 persian:{palettes:['cosmic','desert'],environments:['stars','ruins'],ornaments:['chain','ribbon','bead'],garments:['drape','sash']},
 mesoamerican:{palettes:['verdant','coral'],environments:['sun','temple','forest'],ornaments:['feather','shell','metal'],garments:['collar','charms']},
 african:{palettes:['desert','infernal'],environments:['cave','sun','swamp'],ornaments:['bead','shell','rope'],garments:['beads','paint']},
 malay:{palettes:['swamp','spectral'],environments:['forest','mist','moon'],ornaments:['leaf','ribbon','bell'],garments:['strips','wrap']},
};
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export const mix=(a:string,b:string,t:number)=>'#'+rgb(a).map((v,i)=>Math.round((v*(1-t)+rgb(b)[i]*t)*255).toString(16).padStart(2,'0')).join('');
export function oklab(hex:string) {
 const [r,g,b]=rgb(hex).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
export function colorDistance(a:string,b:string){const x=oklab(a),y=oklab(b);return Math.hypot(...x.map((v,i)=>v-y[i]));}
function contrast(color:string,against:string,min:number){
 if(colorDistance(color,against)>=min)return color;
 const endpoint=oklab(against)[0]>.55?'#100c20':'#f4f1ff';
 for(let t=.15;t<=1.01;t+=.05){const c=mix(color,endpoint,Math.min(1,t));if(colorDistance(c,against)>=min)return c;}
 return endpoint;
}
export function makeVisualProfile(g:MonsterGenotype):VisualProfile {
 const r=subRng(`v2:${g.seed}`,'visual'),profile=MYTH_VISUAL[g.mythology.primary];
 const paletteFamily=r.weighted(Object.fromEntries(PALETTE_FAMILIES.map(k=>[k,profile.palettes.includes(k)?3:1]))) as PaletteFamily;
 let [primary,secondary,accent]=COLOR_FAMILIES[paletteFamily];
 if(r.chance(.28))[primary,secondary]=[secondary,primary];
 const paletteMutation=r.chance(['MYTHIC','FORBIDDEN'].includes(g.identity.rarity)?.35:.07)?r.pick(PALETTE_MUTATIONS):undefined;
 if(paletteMutation){
  const treatments:Record<typeof PALETTE_MUTATIONS[number],readonly string[]>={albino:['#eee7e8','#cc899e','#e84271'],melanistic:['#191720','#73638a','#ce9fff'],bioluminescent:['#184955','#6de99b','#b8fc61'],inverted:[secondary,primary,accent],golden:['#c7a243','#55408d','#fff0a4'],void:['#141020','#593a96','#d493ff'],'blood-moon':['#a72a49','#342944','#f18579'],jade:['#438f76','#c2d997','#dc7aaa'],spectral:['#bedfee','#8471b7','#e7fcf6'],corrupted:['#645392','#c0c44e','#f195d0'],molten:['#37323b','#e97435','#ffd47b'],pearlescent:['#cfbce8','#81bbb9','#f4c7d0'],monochrome:['#4f4c58','#ded9e3','#f3f0f8'],iridescent:['#7355aa','#4ac6b3','#f294b8'],necrotic:['#7e936e','#6d476f','#bec45f']};
  [primary,secondary,accent]=treatments[paletteMutation];
 }
 secondary=contrast(secondary,primary,.18);accent=contrast(accent,primary,.23);
 const eye=contrast(accent,primary,.28), mouth=contrast('#221221',primary,.3);
 const bg=mix(primary,'#080812',.88);
 const colors:SemanticPalette={bodyPrimary:primary,bodySecondary:secondary,bodyShadow:mix(primary,'#10101e',.45),bodyHighlight:mix(primary,'#faf4ff',.4),eyePrimary:eye,eyeSecondary:contrast(mouth,eye,.35),mouthInterior:mouth,tongue:contrast(mix(accent,'#bb466f',.45),mouth,.2),teeth:contrast(mix(secondary,'#fff8ed',.75),mouth,.35),hornPrimary:secondary,hornSecondary:accent,claws:mix(secondary,'#faf3ff',.45),accessoryPrimary:secondary,accessorySecondary:accent,metal:mix(accent,'#d6d5ec',.28),emissive:eye,backgroundPrimary:bg,backgroundSecondary:mix(bg,secondary,.25),backgroundAccent:mix(bg,accent,.58)};
 const a=g.anatomy;
 const rig:VisualProfile['rig']=a.body==='quadruped'?(a.armCount?'centauroid':'quadruped'):a.body==='serpent'||a.mutations.includes('serpent_lower')?'serpent':a.body==='floating'?'floating':a.legCount>2?'multi-leg':a.legs==='bird'?'avian':a.mutations.includes('elongated_limbs')?'long-limbed':a.proportions.headScale>1.25?'top-heavy':'biped';
 const garment=r.chance(.33)?'none':r.chance(.65)?r.pick(profile.garments):r.pick(GARMENTS);
 const sockets:('head'|'neck'|'waist'|'wrist'|'back')[]=a.armCount?['head','neck','waist','wrist','back']:['head','neck','waist','back'];
 const accessories:VisualProfile['accessories']=Array.from({length:r.int(0,3)},()=>({kind:r.pick(profile.ornaments),source:g.mythology.primary,socket:r.pick(sockets)}));
 if(g.mythology.secondary){const source=g.mythology.secondary;accessories.push({kind:r.pick(MYTH_VISUAL[source].ornaments),source,socket:'head'});if(!a.borrowed.includes('ornament'))a.borrowed.push('ornament');}
 const weights=Object.fromEntries(SUMMON_TYPES.map(k=>[k,1]));weights[a.body==='floating'?'shadow':a.body==='serpent'?'pixels':a.skin==='bone'?'parts':paletteFamily==='celestial'?'celestial':a.skin==='bark'?'ground':'sigil']=4;
 return {paletteFamily,paletteMutation,colors,rig,garment,accessories,marking:a.markings?r.pick(MARKINGS.filter(k=>k!=='none')):'none',shellVariant:r.pick(['turtle','spiral','beetle','segmented']),summon:{type:r.weighted(weights) as VisualProfile['summon']['type'],duration:r.int(1600,2300),symbol:r.int(0,7),entrance:r.pick(['rise','fall','spiral','gather']),particles:r.int(8,16),flash:r.pick(['none','soft'])},environment:{type:r.chance(.6)?r.pick(profile.environments):r.pick(ENVIRONMENTS),motion:r.pick(['drift','ripple','pulse','none']),symbol:r.int(0,7),lighting:r.range(.85,1.15)}};
}
