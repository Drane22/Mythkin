import { generateMonster as generateV1 } from './generateMonsterV1';
import { generateMonster as generateV2 } from './generateMonsterV2';
import { generateMonsterV3 } from '../creatures/generateV3';
import { GENERATION_VERSION, type MonsterGenotype } from './types';

export { hsl } from './generateMonsterV2';

/** Versioned links retain the generator that originally created their creature. */
export function generateMonster(rawInput: string, version: number = GENERATION_VERSION): MonsterGenotype {
  switch (version) {
    case 1: return generateV1(rawInput);
    case 2: return generateV2(rawInput);
    case 3: return generateMonsterV3(rawInput);
    default: throw new Error('Unsupported generation version');
  }
}
