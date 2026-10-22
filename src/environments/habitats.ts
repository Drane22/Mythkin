import type { MythologyId, MonsterGenotype } from '../generator/types';
import type { VisualProfile } from '../generator/visualTypes';

type Particle = 'moth' | 'snow' | 'sand' | 'petal' | 'cloud' | 'firefly' | 'leaf' | 'water' | 'ash';
export interface Habitat {
  origin: MythologyId;
  label: string;
  /** Visual setting, not a claim that every creature of this origin lives here. */
  context: string;
  base: VisualProfile['environment']['type'];
  particles: Particle;
}

/** Regional settings remain attached to the primary lineage when parts are borrowed. */
export const HABITATS = {
  labyrinth: { origin: 'greek', label: 'Bronze labyrinth', context: 'Broken meander walls, an olive-framed court and braziers', base: 'ruins', particles: 'ash' },
  'barrow-fjord': { origin: 'norse', label: 'Barrow fjord', context: 'A burial mound above cold water and a distant aurora', base: 'moon', particles: 'snow' },
  nile: { origin: 'egyptian', label: 'Nile dusk', context: 'Lotus pools, sandstone pylons and a papyrus bank', base: 'temple', particles: 'sand' },
  'cedar-shrine': { origin: 'japanese', label: 'Cedar shrine', context: 'A vermilion gate among cedar trunks and hanging lanterns', base: 'forest', particles: 'petal' },
  'cloud-peaks': { origin: 'chinese', label: 'Cloud peaks', context: 'Limestone mountains, a suspended pavilion and moving clouds', base: 'mist', particles: 'cloud' },
  balete: { origin: 'filipino', label: 'Balete hollow', context: 'Aerial roots, humid blue mist and clustered fireflies', base: 'swamp', particles: 'firefly' },
  'standing-stones': { origin: 'celtic', label: 'Stone circle', context: 'Standing stones around a mossy ring on a moonlit moor', base: 'moon', particles: 'moth' },
  birch: { origin: 'slavic', label: 'Birch threshold', context: 'White birch bark, a distant timber hut and drifting leaves', base: 'forest', particles: 'leaf' },
  'banyan-ghat': { origin: 'hindu', label: 'Banyan river steps', context: 'Banyan roots above river steps and floating lamp bowls', base: 'temple', particles: 'water' },
  ziggurat: { origin: 'mesopotamian', label: 'Ziggurat terraces', context: 'Stepped brick terraces and blue glazed gate piers', base: 'ruins', particles: 'sand' },
  'desert-bazaar': { origin: 'persian', label: 'Desert courtyard', context: 'Pointed archways, suspended lamps and windblown awnings', base: 'sun', particles: 'sand' },
  cenote: { origin: 'mesoamerican', label: 'Cenote sanctuary', context: 'A limestone sinkhole, water curtains and distant stepped masonry', base: 'cave', particles: 'water' },
  baobab: { origin: 'african', label: 'Baobab dusk', context: 'A broad baobab silhouette, dry grass and distant storm light', base: 'gradient', particles: 'moth' },
  mangrove: { origin: 'malay', label: 'Mangrove lanterns', context: 'Stilt roots, tidal reflections and sheltered hanging lamps', base: 'swamp', particles: 'firefly' },
} as const satisfies Record<string, Habitat>;

export type HabitatId = keyof typeof HABITATS;
export const ORIGIN_HABITATS = Object.fromEntries(Object.entries(HABITATS).map(([key, habitat]) => [habitat.origin, key])) as Record<MythologyId, HabitatId>;

export function habitatFor(g: MonsterGenotype): HabitatId | undefined {
  const key = (g as MonsterGenotype & { v3?: { habitat?: string } }).v3?.habitat;
  return key && Object.prototype.hasOwnProperty.call(HABITATS, key) ? key as HabitatId : undefined;
}

/** Night, architecture shadow, midtone, foliage/stone, luminous accent. */
export const ORIGIN_PALETTES: Record<MythologyId, readonly [string, string, string, string, string]> = {
  greek: ['#131b24', '#28313a', '#526369', '#8b9174', '#d9b775'],
  norse: ['#101b27', '#253746', '#456473', '#699294', '#a3d8d2'],
  egyptian: ['#1e1c2b', '#383143', '#766149', '#ac875b', '#eed08b'],
  japanese: ['#142023', '#253934', '#475b50', '#a26b57', '#e2b98b'],
  chinese: ['#192333', '#304252', '#537782', '#8fa69c', '#d4d1a6'],
  filipino: ['#111d27', '#243939', '#42645a', '#739179', '#b7d6a0'],
  celtic: ['#172027', '#293b3e', '#516969', '#879878', '#cbdbb1'],
  slavic: ['#19232c', '#303f45', '#596b64', '#a3aaa0', '#d2c79b'],
  hindu: ['#201d2c', '#44343f', '#75625d', '#b39974', '#efc77d'],
  mesopotamian: ['#1b202d', '#333b49', '#4f7880', '#a38d70', '#d6c498'],
  persian: ['#24202d', '#493744', '#7e5860', '#b49073', '#e5c28c'],
  mesoamerican: ['#11232a', '#224548', '#42726f', '#84a393', '#bce1b8'],
  african: ['#211e2c', '#45333e', '#785450', '#ab8167', '#e7bd8b'],
  malay: ['#14222b', '#2b4246', '#52716b', '#91a082', '#d3d9a0'],
};
