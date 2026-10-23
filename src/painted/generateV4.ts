import { normalizeInput,seedHex,subRng } from '../generator/rng';
import { generateName,generateTitle } from '../generator/generateIdentity';
import { generateMonsterV3 } from '../creatures/generateV3';
import { createAppearance } from '../creatures/appearance';
import { SPECIES } from '../creatures/catalog/index';
import type { MonsterGenotype } from '../generator/types';

const key=(name:string)=>normalizeInput(name).normalize('NFD').replace(/[\u0300-\u036f\s-]/g,'');
const lookup=(name:string)=>SPECIES.find(species=>[species.id,species.label].some(label=>key(label)===key(name)));

/** New painted summons have one authored species. Old mixed-species links retain v3. */
export function generateMonsterV4(rawInput:string):MonsterGenotype {
  const input=normalizeInput(rawInput)||'nameless',seed=seedHex(input),named=input.split(' named ');
  const explicit=lookup(named[0]);
  const species=explicit??subRng(`v4:${seed}`,'species').pick(SPECIES);
  const reference=!!explicit&&named.length===1;
  // Reuse the species' semantic anatomy, never a random v3 hybrid selection.
  const g=generateMonsterV3(species.id),appearance=createAppearance(species,seed,reference);
  g.version=4;g.input=input;g.seed=seed;g.v3!.appearance=appearance;
  Object.assign(g.palette,{body:appearance.body,secondary:appearance.secondary,eye:appearance.accent,accent:appearance.accent,horn:appearance.secondary});
  Object.assign(g.visual!.colors,{bodyPrimary:appearance.body,bodySecondary:appearance.secondary,eyePrimary:appearance.accent,hornPrimary:appearance.secondary,emissive:appearance.accent,accessorySecondary:appearance.secondary});
  g.anatomy.proportions.bodyW=appearance.chest;
  g.anatomy.proportions.bodyH=appearance.build==='rangy'?1.08:appearance.build==='compact'?.94:1;
  g.anatomy.proportions.headScale=appearance.headWidth;
  g.identity.generatedName=generateName(subRng(seed,'name-v4'),g);
  g.identity.title=generateTitle(subRng(seed,'title-v4'),g);
  const habits=['keeps watch where the old roads end','recognizes visitors by the sound of their footsteps','guards something the world has forgotten','answers kindness with a fierce loyalty','wakes when its name is whispered','appears just before the weather turns'];
  g.identity.lore=`This ${appearance.aspect==='Original'?'':appearance.aspect.toLowerCase()+' '}${species.label} ${subRng(seed,'lore-v4').pick(habits)}.`;
  return g;
}
