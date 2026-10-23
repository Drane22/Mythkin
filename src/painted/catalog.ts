import minotaurUrl from './assets/minotaur.png';
import type { MonsterGenotype } from '../generator/types';
import type { PaintedRig } from './motion';

export interface PaintedCreature {
  id: string;
  url: string;
  width: number;
  height: number;
  rig: PaintedRig;
}

export const PAINTED_MINOTAUR: PaintedCreature = {
  id: 'minotaur', url: minotaurUrl, width: 1122, height: 1402,
  rig: {
    head: [.62, .34], headBottom: .37, chest: [.52, .43],
    shoulders: [[.29, .30], [.77, .33]],
    eyes: [[.581, .210], [.699, .219]], eyeRadius: [.020, .012],
    ground: .92, tail: [.16, .80],
  },
};

/** Never substitute a pure painting for a hybrid whose visible anatomy it lacks. */
export function paintedCreature(genotype: MonsterGenotype): PaintedCreature | undefined {
  return genotype.version === 3 && genotype.v3?.primaryId === 'minotaur' && !genotype.v3.secondaryId
    ? PAINTED_MINOTAUR : undefined;
}
