# Painted folklore: approved direction B

The user selected **B, painted folklore, with animation** on 2026-10-23 after reviewing three visual directions. The former procedural meshes repeated the same facial construction, weakened the reference silhouettes and used surface detail to compensate for poor anatomy. Technical regression tests did not establish acceptable artwork.

## First working specimen

Implement the Minotaur as an actual painted character in the existing summon interface. Preserve the chosen broad shoulders, massive forearms, bovine face, worn leather, horn grain and selective fur. Use a transparent production illustration, not a crop of the comparison board.

Animate the illustration with a local deformation mesh: planted feet, expanding chest, delayed shoulder movement, small head movement, eye blinks, pointer attention and a restrained tap reaction. This is an animated illustration, not a fully rotatable 3D model. Motion must preserve brushwork and anatomy. Do not animate the entire picture as a floating card.

Use the page's charcoal/plum palette for a smooth atmospheric stage and the existing violet summon ritual. Respect reduced motion, pause offscreen, handle asset failure with retry, and retain transparent capture/card export. Do not add browsing, search, a gallery, a mixer or new product navigation.

## Review and rollout

Inspect the actual mobile and desktop render, including enlarged faces and a sequence of animation frames. Verify image readiness, interaction, reduced motion and sharing. The first specimen is a visual checkpoint, not a claim that all 50 creatures have been converted. Keep existing generation and legacy/shared creatures intact while each authored illustration is added; never represent one painted species as another or hide missing hybrid anatomy behind a generic sprite.

The selected direction does not make the existing 50-species library finished. Further art assets and species-specific motion anchors remain required after this specimen is reviewed.

## First-specimen checkpoint

Implemented the transparent painted Minotaur in the actual summon screen and landing specimen. Pure Minotaur v3 results use the painted renderer; hybrid and other species continue to use their existing renderer. Authored sprite variation and the remaining species are not complete. This prototype does not replace generation or claim that color/shape variants are newly illustrated.

Validated: TypeScript; production build; anchored-hoof/chest/blink/reduced-motion checks; unchanged v1/v2 generation and share links; card exports; responsive browser layouts at 360, 390, 768 and 1440 px; actual changing animation pixels; tap response; stable reduced-motion pixels; share preview; no browser runtime exceptions. Captured the live renderer in `artifacts/painted-folklore/minotaur-motion.webm` and desktop/mobile PNGs. Screenshots and the video are local review artifacts, not replacement artwork.

Review commands: `node tests/painted-motion.mjs`; `node tests/painted-review.mjs` (isolated Chromium CDP on port 9333, app at port 5174, or override `MYTHKIN_REVIEW_URL`).
