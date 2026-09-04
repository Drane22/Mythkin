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
  const n = Number(r.weighted({ 2: 6, 3: 4 } as Record<string, number>));
  const V = /[aeiouyāēōūáéíóúàèìòù]/i;
  const chunks: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    const fam = r.chance(0.2) ? S : P;
    chunks.push(r.pick(fam.onsets));
  }
  chunks.push(r.pick(r.chance(0.25) ? S.codas : P.codas));
  let name = chunks[0];
  for (let i = 1; i < chunks.length; i++) {
    const next = chunks[i];
    const endsV = V.test(name.slice(-1));
    const startsV = V.test(next[0]);
    if (endsV && startsV) name = name.slice(0, -1) + next;
    else if (!endsV && !startsV) {
      // insert a short vowel between consonant piles
      const v = r.pick(P.nuclei).slice(0, 1);
      name = name + v + next;
    } else name += next;
  }
  name = name.replace(/(.)\1\1+/g, "$1$1").replace(/[^\p{L}]/gu, "");
  if (name.length > 11) name = name.slice(0, 11);
  if (name.length < 4) name += r.pick(P.codas);
  return cap(name);
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
  const S = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : P;
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
  const epithet = r.chance(0.45) && anatomyEpithets.length ? r.pick(anatomyEpithets) : r.pick(r.chance(0.25) ? S.epithets : P.epithets);
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
      if (score >= arch.need + 1 && (!best || score > best.score)) best = { name: arch.name.toUpperCase(), score };
    }
  }
  return best?.name;
}

export function generateClassification(r: Rng, g: Partial_): string {
  const P = MYTHOLOGIES[g.mythology.primary];
  const S = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : P;
  const a = g.anatomy;
  const anatomyAdj: string[] = [];
  if (a.body === "serpent") anatomyAdj.push("SERPENT-BORN");
  if (a.body === "floating") anatomyAdj.push("DRIFTING");
  if (a.eyes.count >= 4) anatomyAdj.push("MANY-EYED");
  if (a.skin === "bone") anatomyAdj.push("BONE");
  if (a.skin === "stone") anatomyAdj.push("STONE");
  if (a.wings !== "none") anatomyAdj.push("WINGED");
  if (a.eyes.type === "hollow") anatomyAdj.push("HOLLOW");
  const generic = ["NIGHT", "ASHEN", "MOON", "FOREST", "MARSH", "EMBER", "SALT", "DUSK"];
  const adj = r.chance(0.35) && anatomyAdj.length ? r.pick(anatomyAdj) : r.chance(0.6) ? r.pick(P.classAdj) : r.pick(generic);
  const nounPool = r.chance(0.2) ? S.classNoun : P.classNoun;
  const genericNoun = ["WRAITH", "FIEND", "STALKER", "HERALD", "WATCHER", "SPIRIT", "CHIMERA", "DEVOURER"];
  const noun = r.chance(0.55) ? r.pick(nounPool) : r.pick(genericNoun);
  return `${adj} ${noun}`;
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
  return [...pool];
}

const SUBJECTS = ["A {adj} {noun}", "This {adj} {noun}", "A {noun} of {domain}", "The {adj} {noun} of {domain}"];
const ADJ = ["marsh-born", "hollow-eyed", "patient", "half-remembered", "salt-crusted", "moon-fed", "restless", "grinning", "unblinking", "soft-footed", "ancient", "cold", "small and furious", "enormous and shy"];
const NOUNS = ["watcher", "thing", "spirit", "creature", "wanderer", "visitor", "presence", "hunger", "shape", "omen"];
const VERBS = [
  "said to appear {habitat} {omen}",
  "that lingers {habitat}, most often {omen}",
  "known to follow travelers who repeatedly hear their own names whispered {omen}",
  "that is only ever seen {habitat}, and only {omen}",
  "rumored to count the sleeping {habitat} {omen}",
  "that trades in borrowed voices {habitat} {omen}",
  "that leaves {trace} {habitat} {omen}",
];
const TRACES = ["wet footprints leading upward", "a single warm stone", "a smell of rain and iron", "one shoe, always the left", "small teeth arranged in a circle", "handprints on the inside of windows"];

export function generateLore(r: Rng, g: Partial_): string {
  const P = MYTHOLOGIES[g.mythology.primary];
  const S = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : P;
  const a = g.anatomy;
  const adjs = [...ADJ];
  if (a.eyes.count >= 4) adjs.push("many-eyed");
  if (a.eyes.count === 1) adjs.push("one-eyed");
  if (a.body === "serpent") adjs.push("coiling");
  if (a.wings !== "none") adjs.push("wide-winged");
  if (a.armCount >= 4) adjs.push("many-handed");
  const subj = r.pick(SUBJECTS)
    .replace("{adj}", r.pick(adjs))
    .replace("{noun}", r.pick(NOUNS))
    .replace("{domain}", r.pick(P.domains));
  const verb = r.pick(VERBS)
    .replace("{habitat}", r.pick(P.habitats))
    .replace("{omen}", r.pick(r.chance(0.3) ? S.omens : P.omens))
    .replace("{trace}", r.pick(TRACES));
  let s = `${subj} ${verb}.`;
  s = s.replace(/\s+/g, " ").replace(/\bA ([aeiou])/g, "An $1");
  return s.charAt(0).toUpperCase() + s.slice(1);
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
