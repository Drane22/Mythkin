# Painted folklore: approved direction B

The user selected **B, painted folklore, with animation** on 2026-10-23 after reviewing three visual directions. The former procedural meshes repeated the same facial construction, weakened the reference silhouettes and used surface detail to compensate for poor anatomy. Technical regression tests did not establish acceptable artwork.

## First working specimen

Implement the Minotaur as an actual painted character in the existing summon interface. Preserve the chosen broad shoulders, massive forearms, bovine face, worn leather, horn grain and selective fur. Use a transparent production illustration, not a crop of the comparison board.

Animate the illustration with a local deformation mesh: planted feet, expanding chest, delayed shoulder movement, small head movement, eye blinks, pointer attention and a restrained tap reaction. This is an animated illustration, not a fully rotatable 3D model. Motion must preserve brushwork and anatomy. Do not animate the entire picture as a floating card.

Use the page's charcoal/plum palette for a smooth atmospheric stage and the existing violet summon ritual. Respect reduced motion, pause offscreen, handle asset failure with retry, and retain transparent capture/card export. Do not add browsing, search, a gallery, a mixer or new product navigation.

## Review and rollout

Inspect the actual mobile and desktop render, including enlarged faces and a sequence of animation frames. Verify image readiness, interaction, reduced motion and sharing. The first specimen is a visual checkpoint, not a claim that all 50 creatures have been converted. Keep existing generation and legacy/shared creatures intact while each authored illustration is added; never represent one painted species as another or hide missing hybrid anatomy behind a generic sprite.

The selected direction does not make the existing 50-species library finished. Further art assets and species-specific motion anchors remain required after this specimen is reviewed.

## Generation decision

The user chose **one species with individual variations** for new summons. Version 4 implements that decision with deterministic species selection, authored species paintings, restrained natural pigment/marking changes and local proportion variation. Different names within one species share the underlying painting; they are not falsely described as separately painted illustrations. Existing version 1–3 shared genotypes remain readable.

Version 4 can be explicitly loaded for development review. The default remains version 3 until the complete 50-species painted roster has been authored and checked. Pure covered version 3 species also use the prototype painted renderer during development. Final version routing must be reviewed before enabling the new default.

## Six-species checkpoint

Implemented Minotaur, Bakunawa, Leshy, Fenrir, Harpy and Draugr. Each has a transparent production painting, authored head/eye/appendage anchors and a suitable motion profile. Materials include fur, scales, fin membrane, bark, moss, feathers, bone, iron, leather and cloth. Named version 4 variants preserve pale horns/bone and avoid garish whole-image tinting. Forty-four paintings and their rigs remain unfinished; this is not a completed release.

Validated against the production preview: all six painted species and three named variants load and animate without runtime/shader errors; only selected artwork is fetched; responsive layouts at 360, 390, 768 and 1440 px; tap response; stable reduced-motion pixels; share preview and card export. TypeScript and the production build pass. Generation checks cover deterministic single-species results, reachability of all 50 species, preserved v1/v2 hashes and supported share versions. Motion checks cover planted feet, local breathing/blinking, bounds and reduced motion. Actual captures are in `artifacts/painted-folklore/roster-live.png`, `minotaur-motion.webm` and desktop/mobile PNGs.

Production paintings are external hashed PNG files beside `dist/index.html`; scripts, styles and fonts remain inlined. **Deploy the entire `dist/` directory**, including the PNGs. Inlining every painting into HTML would make every visit download the entire roster. Production review caught and corrected relative image URL resolution after script inlining.

Next: author and visually inspect Gorgon, Cyclops, Centaur, Troll, World-Serpent and Sphinx, then continue the remaining roster. Before release: require complete asset coverage, review all real renders/motion, choose final legacy routing, enable version 4, update project documentation, run the complete verification, and push to the already-authorized `Drane22/Mythkin` `main`.

Review commands: `npm run test:painted`; `node tests/painted-roster-review.mjs`; `node tests/painted-review.mjs` (isolated Chromium CDP on port 9333, app at port 5174, or override `MYTHKIN_REVIEW_URL` for the production preview).
