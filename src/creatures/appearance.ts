import { subRng } from '../generator/rng';
import type { Appearance, Species } from './types';

const aspects = [
  { label: 'Ember', body: '#b45b42', secondary: '#efd1a0', accent: '#ffbd76' },
  { label: 'Moonlit', body: '#7e91b2', secondary: '#d2e5e3', accent: '#a5e7e5' },
  { label: 'Mossborn', body: '#637953', secondary: '#c2c18c', accent: '#dce79a' },
  { label: 'Orchid', body: '#8a6288', secondary: '#d9b8c9', accent: '#f0b4cf' },
  { label: 'Ochre', body: '#b58b50', secondary: '#eed8a5', accent: '#f1da8c' },
  { label: 'Ashen', body: '#657581', secondary: '#bec7c6', accent: '#b6caff' },
] as const;

function mix(a: string, b: string, amount: number) {
  const channel = (color: string, offset: number) => parseInt(color.slice(offset, offset + 2), 16);
  return '#' + [1, 3, 5].map(offset => Math.round(channel(a, offset) * (1 - amount) + channel(b, offset) * amount).toString(16).padStart(2, '0')).join('');
}

/** Individual variation stays inside a species' anatomy. Reference lookups retain their palette. */
export function createAppearance(species: Species, seed: string, reference = false): Appearance {
  const rng = subRng(seed, 'individual-v3');
  const aspect = rng.pick(aspects);
  const build = reference ? 'reference' : rng.pick(['stocky', 'rangy', 'regal', 'compact'] as const);
  const shape = {
    reference: [1, 1, 1, 1], stocky: [1.17, 1.14, .91, 1.10],
    rangy: [.90, .89, 1.13, .91], regal: [1.09, .92, 1.04, 1.02], compact: [1.02, 1.08, .90, 1.14],
  }[build];
  return {
    aspect: reference ? 'Original' : aspect.label, build,
    marking: reference ? 'none' : rng.pick(['bands', 'freckles', 'marbled'] as const),
    body: reference ? species.body : mix(species.body, aspect.body, .64),
    secondary: reference ? species.secondary : mix(species.secondary, aspect.secondary, .68),
    accent: reference ? species.accent : aspect.accent,
    chest: shape[0], waist: shape[1], limbs: shape[2], headWidth: shape[3],
    eyeScale: reference ? 1 : rng.range(.78, 1.20), brow: reference ? 0 : rng.range(-.16, .20),
    muzzle: reference ? 1 : rng.range(.86, 1.16),
    hornLength: reference ? 1 : rng.range(.76, 1.34), hornSweep: reference ? 1 : rng.range(.80, 1.30),
    patternSeed: rng.int(0, 10000),
  };
}

export function individualSpecies(species: Species, appearance?: Appearance): Species {
  return appearance ? { ...species, body: appearance.body, secondary: appearance.secondary, accent: appearance.accent } : species;
}
