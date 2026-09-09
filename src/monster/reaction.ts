export type ReactionKind = 'guard' | 'feint' | 'taunt';
export const REACTION_DURATION = 1.8;

export interface ReactionState {
  age: number;
  intensity: number;
  anger: number;
  direction: number;
  kind?: ReactionKind;
}

export interface ReactionRuntime extends ReactionState {
  lastHit: number;
  hits: number;
}

export const initialReaction = (): ReactionRuntime => ({
  age: 0, intensity: 0, anger: 0, direction: 1, lastHit: -Infinity, hits: 0, kind: 'guard',
});

export function pokeReaction(previous: ReactionRuntime, now: number, direction: number): ReactionRuntime {
  // Let the anticipation finish before another poke can restart the gesture.
  if (now - previous.lastHit < 0.22) return previous;
  const hits = now - previous.lastHit < 3 ? previous.hits + 1 : 1;
  return {
    age: 0, intensity: 1, anger: Math.min(1, previous.anger + 0.24),
    direction, lastHit: now, hits,
    kind: hits === 1 ? 'guard' : hits % 2 === 0 ? 'feint' : 'taunt',
  };
}

function pulse(age: number, start: number, end: number) {
  if (age <= start || age >= end) return 0;
  return Math.sin((age - start) / (end - start) * Math.PI) ** 2;
}

export function reactionPose(reaction?: ReactionState) {
  const age = reaction?.age ?? REACTION_DURATION;
  const strength = Math.max(0, Math.min(1, reaction?.intensity ?? 0));
  return {
    guard: pulse(age, 0, 0.85) * strength,
    feint: reaction?.kind === 'feint' ? pulse(age, 0.4, 1.05) * strength : 0,
    taunt: reaction?.kind === 'taunt' ? pulse(age, 0.65, 1.65) * strength : 0,
    settle: pulse(age, 1.15, REACTION_DURATION) * strength,
  };
}
