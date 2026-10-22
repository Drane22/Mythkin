# Face, idle, reaction and glitch redesign

The four supplied references guide larger bone skulls, carved sockets, uneven teeth, tongues, crescent ornaments, branching antlers and hanging charms. Existing anatomy diversity remains procedural; these are reference-inspired models, not reproductions of the four illustrations.

## Design and implementation

- Larger cranial proportions, ivory bone material, dark socket/mouth interiors, orbital rims, articulated lids and eyebrows. Stacked/crowned eye mutations have bounded spacing. Crescent cyclopes have two sweeping horns and a central orb; antlers have thicker branching geometry and a bounded length curve. Horn charms swing on separate pivots.
- Breathing, head drift, hand motion and pendulum motion are stronger at 256-pixel rendering. A 6.5-second personality-offset cycle alternates looks, yawns/sniffs and stretches. Existing offscreen/hidden-page pausing remains active.
- Taps cycle through guard, feint, taunt, startle, curiosity and delight. Waiting no longer resets the sequence. Each has a different body/head/arm pose; ordinary inputs can reach all six. Rapid inputs retain a 220ms anticipation guard. Every pose restores its joints; reduced motion keeps static expressions.
- Glitch assembly offsets individual parts and reconstructs 100 colored mesh-sampled fragments. A scanning line and staggered cyan/rose fragments replace whole-creature blinking. It settles completely and skips fragment updates after assembly.
- Surprise me uses a local shuffled pool of 52 given names. No organization names, objects, file access, history input or external service are involved. No repeats until the pool is exhausted, including refill boundaries. The reported organization was a hardcoded entry in the prior random-input list. Existing manually entered names and stored history are not deleted.

## Validation

`npm test` covers names, distinct motion poses, blinking, glitch fragments, reduced motion, 1,000 genotypes, 100 rigs, 60 card renders, nine head turnarounds, environments, sharing, layouts, palette diversity and legacy generator compatibility. `npm run typecheck` and `npm run build` validate the application.

`node tests/face-motion-review.mjs` produces `artifacts/face-motion/index.html`, four actual generated face examples and eight animated strips. These use the software geometry renderer, not live WebGL screenshots. No browser is connected in this session; live lighting, real-device touch and frame rates remain unverified. Version 1 still uses its legacy face builder; the shared animator receives the reaction and idle improvements.
