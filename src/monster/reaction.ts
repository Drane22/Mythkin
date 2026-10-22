export const REACTION_KINDS = ['guard', 'feint', 'taunt', 'startle', 'curious', 'delight'] as const;
export type ReactionKind = typeof REACTION_KINDS[number];
export const REACTION_DURATION = 2.4;

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
  // Keep the repertoire across pauses; resetting made every ordinary tap a guard.
  const hits = previous.hits + 1;
  const kind = REACTION_KINDS[(hits - 1) % REACTION_KINDS.length];
  return {
    age: 0, intensity: 1, anger: ['guard', 'feint', 'taunt'].includes(kind) ? Math.min(1, previous.anger + 0.18) : previous.anger * .25,
    direction, lastHit: now, hits,
    kind,
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
    guard: (!reaction?.kind || reaction.kind === 'guard') ? pulse(age, 0, 1.25) * strength : 0,
    feint: reaction?.kind === 'feint' ? pulse(age, 0.4, 1.05) * strength : 0,
    taunt: reaction?.kind === 'taunt' ? pulse(age, 0.65, 1.65) * strength : 0,
    startle: reaction?.kind === 'startle' ? pulse(age, 0, .85) * strength : 0,
    curious: reaction?.kind === 'curious' ? pulse(age, .08, 2.25) * strength : 0,
    delight: reaction?.kind === 'delight' ? pulse(age, .05, 2.1) * strength : 0,
    settle: pulse(age, 1.8, REACTION_DURATION) * strength,
  };
}
