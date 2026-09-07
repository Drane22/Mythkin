import { MYTHOLOGIES, UNIVERSAL_TRAITS, type Archetype } from "./mythology";
import { subRng, type Rng } from "./rng";
import type { MonsterGenotype, Mutation, Rarity } from "./types";

type Partial_ = Omit<MonsterGenotype, "identity">;

export const MUTATION_LABELS: Record<Mutation, string> = {
  six_eyes: "SIX EYES", one_giant_eye: "ONE ENORMOUS EYE", stacked_eyes: "STACKED EYES", two_faces: "TWO FACES",
  extra_jaw: "SECOND JAW", giant_tongue: "GIANT TONGUE", skeletal_face: "SKELETAL FACE", floating_head: "FLOATING HEAD",
  detached_hands: "DETACHED HANDS", enormous_horns: "ENORMOUS HORNS", asymmetric_horns: "ASYMMETRIC HORNS", halo: "HALO",
  many_arms: "MANY ARMS", wings_for_arms: "WINGS FOR ARMS", four_legs: "FOUR LEGS", serpent_lower: "SERPENT LOWER BODY",
  no_legs: "NO LEGS", mouth_eyes: "MOUTHS FOR EYES", glowing_markings: "GLOWING MARKINGS", crown_of_eyes: "CROWN OF EYES",
  elongated_limbs: "ELONGATED LIMBS",
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateName(r: Rng, g: Partial_): string {
  const P = MYTHOLOGIES[g.mythology.primary];
  const S = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : P;
  const onset = r.pick(P.onsets).normalize('NFC');
  const bridge = /[aeiouy]$/i.test(onset) ? '' : r.pick(P.nuclei);
  return cap((onset + bridge + r.pick(S.codas)).replace(/(.)\1\1+/g, '$1$1'));

}

const TITLE_SHAPES = [
  (e: string) => `The ${e} One`,
  (e: string, d: string) => `${e} Warden of ${d}`,
  (e: string) => `The ${e}`,
  (_e: string, d: string) => `Terror of ${d}`,
  (e: string, d: string) => `The ${e} Thing from ${d}`,
  (e: string) => `${e} Who Waits`,
  (_e: string, d: string) => `Last of ${d}`,
  (e: string) => `The ${e} Visitor`,
];

export function generateTitle(r: Rng, g: Partial_): string {
  const P = MYTHOLOGIES[g.mythology.primary];

  const anatomyEpithets: string[] = [];
  const a = g.anatomy;
  if (a.eyes.count === 1) anatomyEpithets.push("One-Eyed");
  if (a.eyes.count >= 5) anatomyEpithets.push("Many-Eyed");
  if (a.eyes.type === "hollow") anatomyEpithets.push("Hollow-Eyed");
  if (a.eyes.type === "glow") anatomyEpithets.push("Ember-Eyed");
  if (a.mouth === "grin") anatomyEpithets.push("Grinning");
  if (a.mouth === "maw") anatomyEpithets.push("Wide-Mouthed");
  if (a.mouth === "tongue" || a.mutations.includes("giant_tongue")) anatomyEpithets.push("Long-Tongued");
  if (a.horns === "antlers") anatomyEpithets.push("Antlered");
  if (a.armCount >= 4) anatomyEpithets.push("Many-Handed");
  if (a.wings !== "none") anatomyEpithets.push("Winged");
  if (a.body === "serpent") anatomyEpithets.push("Coiling");
  if (a.body === "floating") anatomyEpithets.push("Drifting");
  if (a.skin === "bone") anatomyEpithets.push("Bone-White");
  if (a.mutations.includes("two_faces")) anatomyEpithets.push("Two-Faced");
  const epithet = anatomyEpithets.length ? r.pick(anatomyEpithets) : r.pick(["Watchful", "Ancient", "Restless", "Silent"]);
  const domain = r.pick(P.domains);
  return r.pick(TITLE_SHAPES)(epithet, domain);
}

export function matchArchetype(g: Partial_): string | undefined {
  const a = g.anatomy;
  const fams = [MYTHOLOGIES[g.mythology.primary], ...(g.mythology.secondary ? [MYTHOLOGIES[g.mythology.secondary]] : [])];
  let best: { name: string; score: number } | undefined;
  for (const fam of fams) {
    for (const arch of fam.archetypes as Archetype[]) {
      let score = 0;
      const m = arch.match;
      if (m.body?.includes(a.body)) score++;
      if (m.head?.includes(a.head)) score++;
      if (m.eyesCount?.includes(a.eyes.count)) score++;
      if (m.eyes?.includes(a.eyes.type)) score++;
      if (m.ears?.includes(a.ears)) score++;
      if (m.mouth?.includes(a.mouth)) score++;
      if (m.horns?.includes(a.horns)) score++;
      if (m.legs?.includes(a.legs)) score++;
      if (m.wings?.includes(a.wings)) score++;
      if (m.tail?.includes(a.tail)) score++;
      if (m.arms?.includes(a.arms)) score++;
      if (m.armCount?.includes(a.armCount)) score++;
      if (m.skin?.includes(a.skin)) score++;
      if (m.back?.includes(a.back)) score++;
      if (score === Object.keys(m).length && score >= arch.need && (!best || score > best.score)) best = { name: arch.name.toUpperCase(), score };
    }
  }
  return best?.name;
}

export function generateClassification(_r: Rng, g: Partial_): string {
  const a = g.anatomy;
  const archetype = matchArchetype(g);
  if (archetype) return archetype.replace(/-/g, ' ');
  const shape = a.body === 'serpent' || a.mutations.includes('serpent_lower') ? 'SERPENT'
    : a.body === 'quadruped' ? 'BEAST' : a.body === 'floating' ? 'SPIRIT'
    : a.body === 'shell' ? 'SHELLBACK' : 'CREATURE';
  const feature = a.wings !== 'none' ? 'WINGED' : a.horns === 'antlers' ? 'ANTLERED'
    : a.eyes.count === 1 ? 'ONE EYED' : a.skin === 'stone' ? 'STONE' : a.skin === 'bone' ? 'SKELETAL'
    : a.skin === 'scales' ? 'SCALED' : a.skin === 'fur' ? 'SHAGGY' : 'NIGHT';
  return `${feature} ${shape}`;
}

export function generateTraits(r: Rng, g: Partial_): string[] {
  const P = MYTHOLOGIES[g.mythology.primary];
  const S = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : P;
  const a = g.anatomy;
  const pool = new Set<string>();
  const count = r.int(2, 4);
  const implied: string[] = [];
  if (a.body === "serpent") implied.push("SERPENT-BLOODED");
  if (a.body === "floating") implied.push("FLOATING");
  if (a.wings !== "none") implied.push("SKY-BORNE");
  if (a.eyes.type === "glow") implied.push("NOCTURNAL");
  if (a.mouth === "fangs" || a.mouth === "maw") implied.push("EVER-HUNGRY");
  if (a.mutations.includes("two_faces")) implied.push("TWO-MINDED");
  if (a.mutations.includes("mouth_eyes")) implied.push("MIMIC");
  if (implied.length && r.chance(0.7)) pool.add(r.pick(implied));
  let guard = 0;
  while (pool.size < count && guard++ < 40) {
    const src = r.weighted({ primary: 4, secondary: g.mythology.secondary ? 1 : 0, universal: 4 });
    pool.add(src === "primary" ? r.pick(P.traits) : src === "secondary" ? r.pick(S.traits) : r.pick(UNIVERSAL_TRAITS));
  }
  return [...pool].filter(trait => {
    if (trait === 'MANY-HEADED') return false;
    if (trait === 'IRON-SKINNED') return a.skin === 'stone';
    if (trait === 'SKY-BORNE') return a.wings !== 'none';
    return true;
  });
}

export function generateLore(r: Rng, g: Partial_): string {
  const a = g.anatomy;
  const P = MYTHOLOGIES[g.mythology.primary];
  const shape = a.body === 'quadruped' ? 'beast' : a.body === 'serpent' || a.mutations.includes('serpent_lower') ? 'coiled serpent'
    : a.body === 'floating' ? 'floating spirit' : a.body === 'shell' ? 'shell-backed creature'
    : a.body === 'tall' ? 'tall creature' : a.body === 'hunched' ? 'hunched creature' : 'stocky creature';
  const features = [a.eyes.count === 1 ? 'one eye' : `${a.eyes.count} eyes`];
  if (a.wings !== 'none') features.push(`${a.wings === 'feather' ? 'feathered' : a.wings === 'bat' ? 'leathery' : a.wings} wings`);
  else if (a.horns !== 'none') features.push(a.horns === 'antlers' ? 'branching antlers' : a.horns === 'single' ? 'a single horn' : a.horns === 'crown' ? 'a crown of horns' : `${a.horns === 'ram' ? 'curled' : a.horns === 'oni' ? 'short pointed' : a.horns} horns`);
  const origin = g.mythology.secondary && a.borrowed.length
    ? ` Its ${a.borrowed.join(', ')} draw on ${MYTHOLOGIES[g.mythology.secondary].label}.` : '';
  return `A ${shape} with ${features.join(' and ')}, inspired by ${P.label}.${origin} It shelters ${r.pick(P.habitats)} and emerges ${r.pick(P.omens)}.`;
}

function tendency(g: Partial_, r: Rng): string {
  const a = g.anatomy;
  const opts: string[] = [];
  if (a.body === "serpent") opts.push("Your name favors serpentine anatomy.");
  if (a.body === "floating") opts.push("Your name refuses to touch the ground.");
  if (a.body === "quadruped") opts.push("Your name walks on all fours.");
  if (a.body === "tall") opts.push("Your name stretches tall and thin.");
  if (a.body === "blob") opts.push("Your name rounds itself into something soft and heavy.");
  if (a.proportions.headScale > 1.5) opts.push("Your name is mostly head.");
  if (a.eyes.count >= 4) opts.push("Your name sees in more directions than it should.");
  if (a.armCount >= 4) opts.push("Your name reaches with too many hands.");
  if (a.wings !== "none") opts.push("Your name wants to leave by air.");
  if (a.horns === "antlers") opts.push("Your name grows a crown of branches.");
  if (!opts.length) opts.push("Your name settles into an ordinary, unsettling shape.");
  return r.pick(opts);
}

export function generateIdentity(master: string, g: Partial_, rarity: Rarity): MonsterGenotype["identity"] {
  return {
    generatedName: generateName(subRng(master, "name"), g),
    title: generateTitle(subRng(master, "title"), g),
    classification: generateClassification(subRng(master, "classification"), g),
    archetype: matchArchetype(g),
    rarity,
    traits: generateTraits(subRng(master, "traits"), g),
    lore: generateLore(subRng(master, "lore"), g),
    tendency: tendency(g, subRng(master, "tendency")),
  };
}
