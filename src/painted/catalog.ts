import type { MonsterGenotype } from '../generator/types';
import { PAINTED_ARTWORKS, type PaintedArtwork } from './artworks';

export interface PaintedCreature extends PaintedArtwork { url: string }

// Vite imports URLs, not decoded image contents. Only the selected image is fetched.
const urls=import.meta.glob('./assets/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const PAINTED_CREATURES: Readonly<Record<string,PaintedCreature>> = Object.fromEntries(
  Object.values(PAINTED_ARTWORKS).map(art=>[art.id,{...art,url:urls[`./assets/${art.id}.png`]}]),
);

export function paintedCreature(genotype: MonsterGenotype): PaintedCreature | undefined {
  return (genotype.version===3||genotype.version===4)&&genotype.v3&&!genotype.v3.secondaryId
    ? PAINTED_CREATURES[genotype.v3.primaryId] : undefined;
}
