import { MYTHOLOGIES, MYTHOLOGY_IDS, type MythologyFamily } from "./mythology";
import { Rng, normalizeInput, seedHex, subRng } from "./rng";
import {
  GENERATION_VERSION,
  type BackgroundType, type IdlePersonality, type MonsterGenotype, type Mutation,
  type MythologyId, type Palette, type Proportions, type Rarity,
} from "./types";
import { generateIdentity } from "./generateIdentity";

const cache = new Map<string, MonsterGenotype>();

export function generateMonster(rawInput: string): MonsterGenotype {
  const input = normalizeInput(rawInput) || "nameless";
  const key = `${GENERATION_VERSION}:${input}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const seed = seedHex(input);
  const master = `v${GENERATION_VERSION}:${seed}`;

  // ---- mythology lineage
  const mythRng = subRng(master, "mythology");
  const primary = mythRng.pick(MYTHOLOGY_IDS);
  let secondary: MythologyId | undefined;
  if (mythRng.chance(0.62)) {
    const others = MYTHOLOGY_IDS.filter((m) => m !== primary);
    secondary = mythRng.pick(others);
  }
  const influence = secondary ? mythRng.range(0.1, 0.25) : 0;
  const P = MYTHOLOGIES[primary];
  const S = secondary ? MYTHOLOGIES[secondary] : P;

  const borrowed: string[] = [];
  const pickPart = <K extends keyof MythologyFamily>(domain: string, key: K) => {
    const r = subRng(master, domain);
    const fromSecondary = secondary && r.chance(influence);
    const fam = fromSecondary ? S : P;
    if (fromSecondary) borrowed.push(domain);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return r.weighted(fam[key] as any) as string;
  };

  // ---- rarity
  const rarity = rollRarity(subRng(master, "rarity"));

  // ---- base anatomy
  const body = pickPart("body", "body") as MonsterGenotype["anatomy"]["body"];
  const head = pickPart("head", "head") as MonsterGenotype["anatomy"]["head"];
  const eyeType = pickPart("eyes", "eyes") as MonsterGenotype["anatomy"]["eyes"]["type"];
  let mouth = pickPart("mouth", "mouth") as MonsterGenotype["anatomy"]["mouth"];
  const horns = pickPart("horns", "horns") as MonsterGenotype["anatomy"]["horns"];
  const ears = pickPart("ears", "ears") as MonsterGenotype["anatomy"]["ears"];
  let arms = pickPart("arms", "arms") as MonsterGenotype["anatomy"]["arms"];
  let legs = pickPart("legs", "legs") as MonsterGenotype["anatomy"]["legs"];
  let wings = pickPart("wings", "wings") as MonsterGenotype["anatomy"]["wings"];
  let tail = pickPart("tail", "tail") as MonsterGenotype["anatomy"]["tail"];
  const back = pickPart("back", "back") as MonsterGenotype["anatomy"]["back"];
  const skin = pickPart("skin", "skin") as MonsterGenotype["anatomy"]["skin"];

  const countRng = subRng(master, "counts");
  let eyeCount = countRng.weighted({ 1: 12, 2: 58, 3: 24, 4: 6 } as Record<string, number>) as unknown as number;
  eyeCount = Number(eyeCount);
  let armCount = arms === "none" ? 0 : countRng.weighted({ 2: 84, 4: 13, 6: 3 } as Record<string, number>) as unknown as number;
  armCount = Number(armCount);
  let legCount = 0;
  if (body === "quadruped") legCount = 4;
  else if (body === "serpent" || body === "floating") legCount = 0;
  else legCount = legs === "none" ? 0 : 2;
  if (body === "serpent" || body === "floating") legs = "none";
  if (legCount === 0) legs = "none";
  if (body === "quadruped" && legs === "none") legs = "thick";
  if (body === "serpent" && tail === "none") tail = "serpent";

  // Keep locomotion and facial features compatible.
  if (body === "quadruped") { arms = "none"; armCount = 0; }
  if (head === "beak") mouth = "beak";
  else if (mouth === "beak") mouth = "flat";

  // ---- mutations (rarity-gated)
  const mutRng = subRng(master, "mutation");
  const mutationBudget: Record<Rarity, number> = { COMMON: 0, UNCOMMON: 1, RARE: 1, MYTHIC: 2, FORBIDDEN: 3 };
  let budget = mutationBudget[rarity];
  if (rarity === "COMMON" && mutRng.chance(0.18)) budget = 1;
  if (rarity === "RARE" && mutRng.chance(0.5)) budget = 2;
  const mild: Mutation[] = ["asymmetric_horns", "glowing_markings", "elongated_limbs", "stacked_eyes", "extra_jaw", "giant_tongue", "four_legs", "halo"];
  const wild: Mutation[] = ["six_eyes", "one_giant_eye", "two_faces", "skeletal_face", "floating_head", "detached_hands", "enormous_horns", "many_arms", "wings_for_arms", "serpent_lower", "no_legs", "mouth_eyes", "crown_of_eyes"];
  const pool = mutRng.shuffle(rarity === "COMMON" || rarity === "UNCOMMON" ? mild : [...mild, ...wild, ...wild]);
  const mutations: Mutation[] = [];
  for (const m of pool) {
    if (mutations.length >= budget) break;
    if (mutations.includes(m)) continue;
    // compatibility rules
    if (m === "four_legs" && (body === "serpent" || body === "floating" || body === "quadruped")) continue;
    if (m === "serpent_lower" && (body === "serpent" || body === "quadruped")) continue;
    if (m === "no_legs" && legCount === 0) continue;
    if (m === "wings_for_arms" && armCount === 0) continue;
    if (m === "many_arms" && armCount === 0) continue;
    if (m === "asymmetric_horns" && horns === "none") continue;
    if (m === "enormous_horns" && horns === "none") continue;
    if (m === "halo" && mutations.includes("crown_of_eyes")) continue;
    if ((m === "one_giant_eye" || m === "six_eyes" || m === "crown_of_eyes" || m === "stacked_eyes" || m === "mouth_eyes") &&
      mutations.some((x) => ["one_giant_eye", "six_eyes", "crown_of_eyes", "stacked_eyes", "mouth_eyes"].includes(x))) continue;
    if (["four_legs", "serpent_lower", "no_legs"].includes(m) && mutations.some(x => ["four_legs", "serpent_lower", "no_legs"].includes(x))) continue;
    if (m === "serpent_lower" && body === "floating") continue;
    if (m === "detached_hands" && (armCount === 0 || mutations.includes("wings_for_arms"))) continue;
    if (m === "wings_for_arms" && mutations.some(x => ["detached_hands", "many_arms"].includes(x))) continue;
    if (m === "many_arms" && mutations.includes("wings_for_arms")) continue;
    mutations.push(m);
  }
  // apply structural mutations
  if (mutations.includes("six_eyes")) eyeCount = 6;
  if (mutations.includes("one_giant_eye")) eyeCount = 1;
  if (mutations.includes("stacked_eyes")) eyeCount = Math.max(eyeCount, 3);
  if (mutations.includes("crown_of_eyes")) eyeCount = 5;
  if (mutations.includes("many_arms")) armCount = armCount >= 4 ? 6 : 4;
  if (mutations.includes("wings_for_arms")) { wings = wings === "none" ? "bat" : wings; arms = "none"; armCount = 0; }
  if (mutations.includes("four_legs")) { legCount = 4; if (legs === "none") legs = "stubby"; }
  if (mutations.includes("serpent_lower") || mutations.includes("no_legs")) { legCount = 0; legs = "none"; if (mutations.includes("serpent_lower")) tail = "serpent"; }
  if (mutations.includes("floating_head") && body === "serpent") mutations.splice(mutations.indexOf("floating_head"), 1);

  // ---- proportions
  const pr = subRng(master, "proportions");
  const proportions: Proportions = {
    bodyW: pr.range(0.75, 1.35),
    bodyH: pr.range(0.75, 1.4),
    bodyD: pr.range(0.8, 1.2),
    headScale: pr.weighted({ small: 20, normal: 45, big: 25, huge: 10 }) === "huge" ? pr.range(1.7, 2.1)
      : pr.chance(0.35) ? pr.range(1.25, 1.65) : pr.chance(0.3) ? pr.range(0.6, 0.85) : pr.range(0.9, 1.2),
    headTilt: pr.range(-0.18, 0.18),
    eyeScale: pr.range(0.7, 1.5),
    eyeSpread: pr.range(0.6, 1.3),
    eyeHeight: pr.range(-0.15, 0.25),
    mouthWidth: pr.range(0.6, 1.5),
    hornScale: pr.range(0.7, 1.4) * (mutations.includes("enormous_horns") ? 2.2 : 1),
    hornCurve: pr.range(-0.6, 0.6),
    armLength: pr.range(0.7, 1.4) * (mutations.includes("elongated_limbs") ? 1.9 : 1),
    armThick: pr.range(0.7, 1.4),
    legLength: pr.range(0.7, 1.4) * (mutations.includes("elongated_limbs") ? 1.8 : 1),
    legThick: pr.range(0.7, 1.4),
    neckLength: pr.range(0, 0.5),
    tailLength: pr.range(0.7, 1.5),
    wingScale: pr.range(0.8, 1.4),
    asym: pr.range(-1, 1),
    brokenHorn: horns !== "none" && pr.chance(0.18),
    oddArm: armCount > 0 && pr.chance(0.15),
  };

  proportions.headScale = Math.min(proportions.headScale, body === "quadruped" ? 1.2 : 1.5);
  proportions.neckLength = Math.max(0.14, Math.min(proportions.neckLength, 0.32));
  proportions.armThick = proportions.bodyW * 0.9;
  proportions.legThick = (body === "barrel" || body === "quadruped" ? 1.1 : 0.85) * proportions.bodyW;
  const absent = new Set<string>();
  if (!armCount) absent.add("arms");
  if (!legCount) absent.add("legs");
  if (wings === "none") absent.add("wings");
  if (tail === "none") absent.add("tail");
  for (let i = borrowed.length - 1; i >= 0; i--) if (absent.has(borrowed[i])) borrowed.splice(i, 1);

  // ---- palette
  const palette = generatePalette(subRng(master, "palette"), P, S, !!secondary, mutations, rarity);
  const background = subRng(master, "background").weighted<BackgroundType>({
    void: 22, solid: 10, gradient: 14, moon: 12, portal: 8, sigil: 8, stars: 10, glyph: 6, sun: 6, fog: 4,
  });

  // ---- idle personality
  const ir = subRng(master, "idle");
  const style = ir.weighted({ breather: 3, floater: 2, twitcher: 2, swayer: 2, watcher: 2 });
  const idle: IdlePersonality = {
    breath: style === "breather" ? ir.range(0.6, 1) : ir.range(0.15, 0.45),
    bob: style === "floater" || body === "floating" ? ir.range(0.7, 1) : ir.range(0, 0.3),
    headDrift: style === "watcher" ? ir.range(0.6, 1) : ir.range(0.1, 0.4),
    blinkRate: ir.range(0.5, 1.4),
    eyeWander: style === "watcher" ? ir.range(0.7, 1) : ir.range(0, 0.4),
    tailWag: ir.range(0.2, 1),
    wingFlap: ir.range(0.2, 1),
    earTwitch: style === "twitcher" ? ir.range(0.7, 1) : ir.range(0, 0.4),
    jaw: mouth === "maw" || mouth === "tongue" ? ir.range(0.3, 1) : ir.range(0, 0.3),
    sway: style === "swayer" ? ir.range(0.6, 1) : ir.range(0.05, 0.3),
    speed: ir.range(0.75, 1.3),
  };

  const partial: Omit<MonsterGenotype, "identity"> = {
    version: GENERATION_VERSION,
    seed,
    input,
    mythology: { primary, secondary },
    anatomy: {
      body, head, eyes: { type: eyeType, count: eyeCount }, mouth, horns, ears, arms, armCount, legs, legCount,
      wings, tail, back, skin,
      markings: subRng(master, "markings").chance(0.45) || mutations.includes("glowing_markings"),
      aura: rarity === "MYTHIC" || rarity === "FORBIDDEN" || subRng(master, "aura").chance(0.08),
      mutations, proportions, borrowed,
    },
    palette, background, idle,
  };
  const identity = generateIdentity(master, partial, rarity);
  const genotype: MonsterGenotype = { ...partial, identity };
  cache.set(key, genotype);
  return genotype;
}

function rollRarity(r: Rng): Rarity {
  return r.weighted<Rarity>({ COMMON: 50, UNCOMMON: 28, RARE: 14, MYTHIC: 6, FORBIDDEN: 2 });
}

// ---------- palette
export function hsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function generatePalette(r: Rng, P: MythologyFamily, S: MythologyFamily, hasSecondary: boolean, mutations: Mutation[], rarity: Rarity): Palette {
  const baseHue = r.pick(P.hues) + r.range(-18, 18);
  const scheme = r.weighted({ analogous: 4, complement: 3, triad: 2, mono: 2 });
  const sat = r.range(45, 85);
  const light = r.range(38, 62);
  let secHue = baseHue + 30;
  if (scheme === "complement") secHue = baseHue + 180 + r.range(-15, 15);
  else if (scheme === "triad") secHue = baseHue + 120;
  else if (scheme === "mono") secHue = baseHue + r.range(-10, 10);
  else secHue = baseHue + (r.chance(0.5) ? 35 : -35);
  if (hasSecondary && r.chance(0.5)) secHue = r.pick(S.hues);

  const eyeHue = r.weighted({ warm: 5, cool: 3, comp: 4 }) === "comp" ? baseHue + 180 : r.weighted({ warm: 5, cool: 3 }) === "warm" ? r.range(35, 60) : r.range(160, 200);
  const eye = mutations.includes("glowing_markings") || rarity === "FORBIDDEN" ? hsl(eyeHue, 100, 62) : hsl(eyeHue, 90, r.range(55, 72));
  const dark = r.chance(0.25);
  const bgHue = r.chance(0.6) ? baseHue + 180 : secHue;
  return {
    body: hsl(baseHue, sat, light),
    secondary: hsl(secHue, sat * 0.9, scheme === "mono" ? light * 0.7 : light * r.range(0.8, 1.1)),
    eye,
    pupil: r.chance(0.8) ? "#0a0a0f" : hsl(eyeHue + 180, 80, 20),
    mouth: hsl(baseHue + (r.chance(0.5) ? 180 : -40), 60, 22),
    horn: r.chance(0.5) ? hsl(baseHue + 20, 25, r.range(20, 35)) : hsl(45, 30, r.range(70, 88)),
    accent: hsl(secHue + 60, 85, 60),
    background: dark ? "#07060a" : hsl(bgHue, r.range(30, 60), r.range(6, 14)),
    backgroundAccent: hsl(bgHue + r.range(-20, 20), 60, r.range(30, 55)),
  };
}
