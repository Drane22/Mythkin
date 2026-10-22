# Creature refinement

Direction approved in conversation: expressive voxel creatures, eerie but charming.

Background marks use violet SVG strokes with independently randomized position, lifetime and delay. Each mark relocates only after fading completely. Summoning uses transparent peripheral rings, leaving the creature visible throughout assembly.

Identity derives classification and physical description from anatomy. Archetype labels require every defining criterion. Facial compatibility, mutation exclusions, proportion limits and thicker neck connections reduce disconnected combinations. Motion adds anatomy-specific gestures with anticipation and recovery, pauses when hidden, and supports reduced motion.

The 53-creature generated contact sheet is concept art, not implemented models. This pass improves the existing procedural renderer; individual archetype sculpts remain a larger art pass. Existing inputs remain deterministic but revised naming and anatomy rules can change their output relative to earlier builds.

Validation: TypeScript, production build, and tests/creatures.mjs across 1,000 generated combinations and 100 animation rigs. Browser visual review requires an available browser connection.

## Defensive and mischievous reactions

The first poke triggers a guard. Further pokes within three seconds alternate between a bluff and a taunt. A 220ms input guard preserves anticipation; irritation is bounded and fades. Each 1.8-second reaction returns to the idle pose. Body types vary the movement: restrained heavy creatures, crouching quadrupeds, leaning serpents, and drifting spirits. Wings flare, ears pin back, and multi-eyed creatures wink during taunts. Reduced motion retains static facial feedback. The surrounding glow uses an interruptible opacity transition.

Tests cover input escalation, bounded irritation, all reaction phases, full joint restoration and static reduced-motion expressions across 100 rigs.
