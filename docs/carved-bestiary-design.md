# The carved bestiary — geometry and habitat rewrite

This replaces the previous face-shell builder. The visual anchors are the four user-supplied references: a red-horned talisman imp, a crescent cyclops, an antler-skull moss keeper and a three-eyed oracle. Art direction uses warm bone, dark burgundy cavities, muted vermilion, moss, antique gold, teal and pale spirit light.

## Geometry

`organicMonster.ts` is rebuilt around solid cranial fields with subtractive socket/mouth volumes, articulated skeletal limbs, uneven teeth, long curved tongues, branching horns, suspended talismans, collars, layered mantles and waist ornaments. `sculpt.ts` constructs the complete stepped surface and cavity walls; `designLanguage.ts` chooses a coherent family from anatomy and lineage. Eye counts, limb counts, floating/serpent/quad configurations and additional wings/skins remain driven by generated anatomy. Names and identities remain deterministic; legacy version 1 uses its own builder.

The four review specimens deliberately set anatomy to the reference families and use the same production builder. The twelve ordinary-name variants have no overrides. They distinguish the visual targets from normal generator output.

## Motion and habitats

Existing six reactions remain, alongside family-specific tongue, staff, head, hand and halo gestures. Fifteen background selections now form layered habitats with horizons, canopy, shrine architecture, broken orbital arcs, meteors, water, cave crystals, fog and foreground rocks. Seeded particles include fireflies, embers, leaves, dust and spirit lights. The separate transparent foreground canvas moves around the silhouette and paints at 18 Hz; the background updates at 12 Hz. Hidden/offscreen views pause. Reduced motion freezes atmosphere and creature movement.

The background canvas is now 128 by 160, maintaining the portrait aspect of the 256 by 320 creature canvas.

## Review and validation

- `artifacts/design-language/board.png`: final four-family design board and material palette.
- `artifacts/design-language/index.html`: living habitat/idle strips, six reactions, glitch assembly and twelve ordinary-name variants. Includes pause and reduced-motion handling.
- `tests/design-language-review.mjs`: reproducible render pipeline for these artifacts.
- `tests/sculpt-habitats.mjs`: ray-cast proof of subtractive cavities, reference family anatomy, foreground motion and habitat determinism/distinctness.

Passed the application test suite, additional sculpt/habitat tests, TypeScript and production build. The suite covers 1,000 genotypes, 100 animated rigs, joint recovery, reduced motion, cards, sharing, heads, habitats and generator compatibility. Artifacts use the software renderer; live WebGL lighting and measured device frame rates have not been verified because no browser is connected.
