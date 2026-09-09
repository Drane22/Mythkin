export const PALETTE_FAMILIES = ['toxic','abyssal','infernal','spectral','fungal','celestial','swamp','coral','volcanic','arctic','deep-sea','royal','pastel-cursed','monochrome','verdant','desert','cosmic','bloodless','earth'] as const;
export type PaletteFamily = typeof PALETTE_FAMILIES[number];
export const SUMMON_TYPES = ['sigil','shadow','pixels','portal','ground','glitch','parts','celestial'] as const;
export const ENVIRONMENTS = ['void','moon','sun','gradient','temple','forest','swamp','cave','ocean','stars','ruins','sigil','ember','mist','pattern'] as const;
export const GARMENTS = ['none','belt','sash','wrap','strips','mantle','drape','beads','bands','collar','rope','patchwork','charms','paint'] as const;
export const MARKINGS = ['none','stripes','spots','rings','eyes','runes','face-stripe','mask','limb-bands','belly','back-stripe','constellation','swirls','gradient'] as const;
export const PALETTE_MUTATIONS = ['albino','melanistic','bioluminescent','inverted','golden','void','blood-moon','jade','spectral','corrupted','molten','pearlescent','monochrome','iridescent','necrotic'] as const;
export interface SemanticPalette {
  bodyPrimary:string; bodySecondary:string; bodyShadow:string; bodyHighlight:string;
  eyePrimary:string; eyeSecondary:string; mouthInterior:string; tongue:string; teeth:string;
  hornPrimary:string; hornSecondary:string; claws:string; accessoryPrimary:string; accessorySecondary:string; metal:string;
  emissive:string; backgroundPrimary:string; backgroundSecondary:string; backgroundAccent:string;
}
export interface VisualProfile {
  paletteFamily:PaletteFamily; paletteMutation?:typeof PALETTE_MUTATIONS[number]; colors:SemanticPalette;
  rig:'biped'|'quadruped'|'centauroid'|'serpent'|'floating'|'avian'|'multi-leg'|'top-heavy'|'long-limbed';
  archetypeBias?:string;
  garment:typeof GARMENTS[number]; accessories:{kind:string;source:string;socket:'head'|'neck'|'waist'|'wrist'|'back'}[];
  marking:typeof MARKINGS[number]; shellVariant:'turtle'|'spiral'|'beetle'|'segmented';
  summon:{type:typeof SUMMON_TYPES[number];duration:number;symbol:number;entrance:'rise'|'fall'|'spiral'|'gather';particles:number;flash:'none'|'soft'};
  environment:{type:typeof ENVIRONMENTS[number];motion:'drift'|'ripple'|'pulse'|'none';symbol:number;lighting:number};
}
