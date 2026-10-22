import { normalizeInput, seedHex, subRng } from '../generator/rng';
import { generateName, generateTitle } from '../generator/generateIdentity';
import { SUMMON_TYPES } from '../generator/visualTypes';
import type { MonsterGenotype } from '../generator/types';
import { SPECIES } from './catalog/index';
import { composeCreature } from './composition/index';
import { createAppearance } from './appearance';
const speciesKey=(name:string)=>normalizeInput(name).normalize('NFD').replace(/[\u0300-\u036f\s-]/g,'');
const lookup=(name:string)=>SPECIES.find(s=>[s.id,s.label].some(x=>speciesKey(x)===speciesKey(name)));
export function generateMonsterV3(rawInput:string):MonsterGenotype {
 const input=normalizeInput(rawInput)||'nameless',seed=seedHex(input),r=subRng(`v3:${seed}`,'species');
 const named=input.split(' named '),lineage=named[0].split(' with ');
 const isNamed=named.length>1&&!!named.slice(1).join(' named ').trim()&&!!lookup(lineage[0]);
 const parts=(isNamed?named[0]:input).split(' with '),explicit=lookup(parts[0]);
 const p=explicit??r.pick(SPECIES),s=explicit&&parts.length===2?lookup(parts[1]):!explicit&&r.chance(.62)?r.pick(SPECIES.filter(x=>x.id!==p.id)):undefined;
 const v3=composeCreature(p.id,s?.id),features=v3.contributions.map(c=>c.feature);
 const appearance=createAppearance(p,seed,!!explicit&&!isNamed);v3.appearance=appearance;
 const has=(pattern:RegExp)=>features.some(f=>pattern.test(f));
 const quad=p.form==='quadruped'||p.form==='centaur',floating=p.form==='spirit',serpent=p.form==='serpent';
 const arms=p.id==='gorgon'?2:p.id==='long-dragon'?4:serpent||p.form==='avian'||p.form==='quadruped'?0:has(/four-arms/)?4:2;
 const colors={bodyPrimary:p.body,bodySecondary:p.secondary,bodyShadow:p.body,bodyHighlight:p.secondary,eyePrimary:p.accent,eyeSecondary:'#fff4ce',mouthInterior:'#292530',tongue:'#b86174',teeth:'#ecdbb8',hornPrimary:p.secondary,hornSecondary:p.accent,claws:p.secondary,accessoryPrimary:p.accent,accessorySecondary:p.secondary,metal:'#c5a354',emissive:p.accent,backgroundPrimary:'#1b222c',backgroundSecondary:'#34404c',backgroundAccent:p.accent};
 const g:MonsterGenotype={version:3,input,seed,v3,mythology:{primary:p.origin,secondary:s?.origin},
 anatomy:{body:serpent?'serpent':floating?'floating':quad?'quadruped':p.form==='brute'?'barrel':'tall',head:p.head==='cyclops'?'sphere':p.head==='skull'?'skull':p.head==='eagle'||p.head==='tengu'?'beak':p.head==='human'?'tall':'snout',eyes:{type:p.head==='skull'?'hollow':'slit',count:p.head==='cyclops'?1:has(/three-heads/)?6:2},mouth:has(/tongue/)?'tongue':p.head==='eagle'?'beak':'fangs',horns:has(/antler/)?'antlers':has(/horn/)?'curved':'none',ears:'pointed',arms:arms?'claw':'none',armCount:arms,legs:serpent||floating?'none':has(/hooves/)?'hoof':p.form==='avian'?'bird':'long',legCount:serpent||floating?0:quad?4:2,wings:has(/bat-wings|four-wings/)?'bat':has(/wings/)?'feather':'none',tail:serpent?'serpent':has(/tail/)?'thin':'none',back:has(/shell/)?'shell':has(/mane/)?'mane':'none',skin:serpent?'scales':p.head==='skull'?'bone':p.form==='avian'?'feathers':'smooth',markings:has(/spots|paint/),aura:true,mutations:[],borrowed:v3.contributions.filter(c=>c.role==='secondary').map(c=>c.feature),
 proportions:{bodyW:1,bodyH:1,bodyD:1,headScale:1,headTilt:0,eyeScale:1,eyeSpread:1,eyeHeight:1,mouthWidth:1,hornScale:1,hornCurve:1,armLength:1,armThick:1,legLength:1,legThick:1,neckLength:1,tailLength:1,wingScale:1,asym:0,brokenHorn:false,oddArm:false}},
 palette:{body:p.body,secondary:p.secondary,eye:p.accent,pupil:'#171c24',mouth:'#292530',horn:p.secondary,accent:p.accent,background:'#1b222c',backgroundAccent:p.accent},background:'fog',
 idle:{breath:.7,bob:.45,headDrift:.6,blinkRate:.8,eyeWander:.5,tailWag:.75,wingFlap:.65,earTwitch:.65,jaw:.45,sway:.5,speed:r.range(.8,1.1)},
 visual:{paletteFamily:'earth',colors,rig:serpent?'serpent':floating?'floating':p.form==='centaur'?'centauroid':quad?'quadruped':p.form==='avian'?'avian':'biped',archetypeBias:p.label,garment:'none',accessories:[],marking:'none',shellVariant:'turtle',summon:{type:r.pick(SUMMON_TYPES),duration:2600,symbol:r.int(0,5),entrance:'gather',particles:70,flash:'soft'},environment:{type:'mist',motion:'drift',symbol:r.int(0,5),lighting:1}},
 identity:{generatedName:'',title:'',classification:p.label,archetype:p.label,rarity:s?'MYTHIC':'RARE',traits:p.features.slice(0,3).map(x=>x.replace(/-/g,' ')),lore:`A Mythkin interpretation of ${p.label} from the supplied ${p.origin} reference. Its ${p.features.slice(0,2).join(' and ').replace(/-/g,' ')} remain defining features.${s?` A ${s.label} influence contributes ${v3.contributions.filter(c=>c.role==='secondary').map(c=>c.feature.replace(/-/g,' ')).join(', ')}; both lineages remain visible.`:''}`,tendency:p.motion==='beast'?'Paces, listens, and protects its territory.':p.motion==='serpent'?'Coils around distant lights.':p.motion==='spirit'?'Drifts close to anyone who lingers.':'Watches visitors and answers their gestures.'}};
 const proportions=subRng(seed,'proportions-v3');g.anatomy.proportions.bodyW=proportions.range(.94,1.06)*(serpent?appearance.chest:1);g.anatomy.proportions.bodyH=proportions.range(.95,1.05)*(appearance.build==='rangy'?1.10:appearance.build==='compact'?.90:1);g.anatomy.proportions.headScale=proportions.range(.95,1.05);
 Object.assign(g.palette,{body:appearance.body,secondary:appearance.secondary,eye:appearance.accent,accent:appearance.accent,horn:appearance.secondary,backgroundAccent:appearance.accent});
 Object.assign(colors,{bodyPrimary:appearance.body,bodySecondary:appearance.secondary,bodyShadow:appearance.body,bodyHighlight:appearance.secondary,eyePrimary:appearance.accent,hornPrimary:appearance.secondary,hornSecondary:appearance.accent,emissive:appearance.accent,backgroundAccent:appearance.accent});
 const places:Record<string,string>={brute:'the old stone gates',biped:'the paths between worlds',quadruped:'the edge of the ancient forest',centaur:'the moonlit plains',serpent:'the waters beneath the stars',avian:'the highest forgotten towers',spirit:'the quiet spaces between lanterns'};
 const habits=['collects lost wishes and keeps them safe','only follows those who stop to listen','guards a secret it has almost forgotten','answers kindness with fierce loyalty','leaves tiny omens wherever it wanders','pretends to be fearsome, but is easily intrigued'];
 const habit=subRng(seed,'lore-v3').pick(habits);
 g.identity.lore=`At ${places[p.form]}, this ${appearance.aspect==='Original'?'':appearance.aspect.toLowerCase()+' '}${p.label} ${habit}.${s?` A trace of ${s.label} lives in its ${v3.contributions.filter(c=>c.role==='secondary').map(c=>c.feature.replace(/-/g,' ')).join(', ')}.`:''}`;
 g.identity.generatedName=generateName(subRng(seed,'name-v3'),g);g.identity.title=generateTitle(subRng(seed,'title-v3'),g);return g;
}
