export const GENERATION_VERSION = 2;

export type MythologyId =
  | "greek"
  | "norse"
  | "egyptian"
  | "japanese"
  | "chinese"
  | "filipino"
  | "celtic"
  | "slavic"
  | "hindu"
  | "mesopotamian"
  | "persian"
  | "mesoamerican"
  | "african"
  | "malay";

export type BodyType =
  | "blob"
  | "tall"
  | "barrel"
  | "serpent"
  | "quadruped"
  | "floating"
  | "hunched"
  | "shell";

export type HeadType =
  | "cube"
  | "sphere"
  | "skull"
  | "snout"
  | "beak"
  | "wide"
  | "tall"
  | "flame"
  | "jar";

export type EyeType = "round" | "slit" | "hollow" | "glow" | "cross" | "ring";
export type MouthType = "grin" | "fangs" | "beak" | "tusks" | "maw" | "none" | "tongue" | "flat";
export type HornType = "none" | "curved" | "straight" | "antlers" | "oni" | "single" | "ram" | "crown";
export type EarType = "none" | "pointed" | "round" | "long" | "fin";
export type ArmType = "stubby" | "long" | "claw" | "tentacle" | "none" | "blade";
export type LegType = "stubby" | "long" | "hoof" | "bird" | "none" | "thick";
export type WingType = "none" | "bat" | "feather" | "stub" | "insect";
export type TailType = "none" | "thin" | "thick" | "serpent" | "fish" | "fan" | "spike";
export type BackType = "none" | "spikes" | "fins" | "shell" | "mane";
export type SkinType = "smooth" | "fur" | "scales" | "bone" | "stone" | "feathers" | "chitin" | "bark";
export type BackgroundType =
  | "void"
  | "solid"
  | "gradient"
  | "moon"
  | "portal"
  | "sigil"
  | "stars"
  | "glyph"
  | "sun"
  | "fog";

export type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "MYTHIC" | "FORBIDDEN";

export type Mutation =
  | "six_eyes"
  | "one_giant_eye"
  | "stacked_eyes"
  | "two_faces"
  | "extra_jaw"
  | "giant_tongue"
  | "skeletal_face"
  | "floating_head"
  | "detached_hands"
  | "enormous_horns"
  | "asymmetric_horns"
  | "halo"
  | "many_arms"
  | "wings_for_arms"
  | "four_legs"
  | "serpent_lower"
  | "no_legs"
  | "mouth_eyes"
  | "glowing_markings"
  | "crown_of_eyes"
  | "elongated_limbs";

export interface Palette {
  body: string;
  secondary: string;
  eye: string;
  pupil: string;
  mouth: string;
  horn: string;
  accent: string;
  background: string;
  backgroundAccent: string;
}

export interface Proportions {
  bodyW: number;
  bodyH: number;
  bodyD: number;
  headScale: number;
  headTilt: number;
  eyeScale: number;
  eyeSpread: number;
  eyeHeight: number;
  mouthWidth: number;
  hornScale: number;
  hornCurve: number;
  armLength: number;
  armThick: number;
  legLength: number;
  legThick: number;
  neckLength: number;
  tailLength: number;
  wingScale: number;
  asym: number; // -1..1 asymmetry bias
  brokenHorn: boolean;
  oddArm: boolean;
}

export interface IdlePersonality {
  breath: number;
  bob: number;
  headDrift: number;
  blinkRate: number;
  eyeWander: number;
  tailWag: number;
  wingFlap: number;
  earTwitch: number;
  jaw: number;
  sway: number;
  speed: number;
}

export interface MonsterGenotype {
  visual?: import("./visualTypes").VisualProfile;
  version: number;
  seed: string;
  input: string; // normalized input
  mythology: { primary: MythologyId; secondary?: MythologyId };
  anatomy: {
    body: BodyType;
    head: HeadType;
    eyes: { type: EyeType; count: number };
    mouth: MouthType;
    horns: HornType;
    ears: EarType;
    arms: ArmType;
    armCount: number;
    legs: LegType;
    legCount: number;
    wings: WingType;
    tail: TailType;
    back: BackType;
    skin: SkinType;
    markings: boolean;
    aura: boolean;
    mutations: Mutation[];
    proportions: Proportions;
    borrowed: string[]; // which parts came from the secondary mythology
  };
  palette: Palette;
  background: BackgroundType;
  idle: IdlePersonality;
  identity: {
    generatedName: string;
    title: string;
    classification: string;
    archetype?: string;
    rarity: Rarity;
    traits: string[];
    lore: string;
    tendency: string;
  };
}
