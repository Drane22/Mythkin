import type { MythologyId } from '../generator/types';
export type Form = 'brute'|'biped'|'quadruped'|'centaur'|'serpent'|'avian'|'spirit';
export type MotionProfile = 'brute'|'beast'|'serpent'|'avian'|'spirit'|'trickster'|'guardian';
export interface Species {
  id:string; label:string; origin:MythologyId; reference:number; form:Form; head:string;
  features:string[]; body:string; secondary:string; accent:string; habitat:string; motion:MotionProfile;
}
export interface Contribution { sourceId:string; origin:MythologyId; feature:string; socket:string; role:'primary'|'secondary' }
export interface Appearance {
  aspect: string;
  build: 'reference'|'stocky'|'rangy'|'regal'|'compact';
  marking: 'none'|'bands'|'freckles'|'marbled';
  body: string; secondary: string; accent: string;
  chest: number; waist: number; limbs: number; headWidth: number;
  eyeScale: number; brow: number; muzzle: number; hornLength: number; hornSweep: number;
  patternSeed: number;
}
export interface V3Profile { primaryId:string; secondaryId?:string; habitat:string; anchors:string[]; contributions:Contribution[]; appearance?:Appearance }
