# V3 anatomy rebuild

This rebuild follows the [50-species anatomy audit](v3-anatomy-audit.md). The previous bodies used overlapping ellipsoids for muscles and fixed tube attachments; their mouths had independently placed teeth and jaws that translated during reactions. The replacement uses anatomical contour surfaces and fixed joint frames. Existing v1/v2 generation paths remain separate.

Open the [implemented before/reference/after review](../artifacts/v3-anatomy-rebuild/index.html). Every species has five additional views: front, three quarter, side, back and startle. The original audit images are retained as a frozen comparison.

## Construction

- `geometry/anatomy.ts`: capped contour meshes, transported surface frames, feather/fur blades and dental arches. End caps close limb and appendage roots. Blade edges have thickness.
- `geometry/proportions.ts`: reference-specific chest, waist, hip, limb, posture and head proportions. Muscular, gaunt and soft forms use different construction values.
- `geometry/body.ts`: connected torso/neck contours; muscle relief within the torso surface; embedded limb pivots; shaped shoulders, elbows, thighs, knees and ankles; separate hoof halves, paws and toes; skeletal ribs/scapulae; continuous serpents and ventral bands.
- `geometry/heads.ts`: contour skulls, recessed eye regions, nasal bridges and nostrils, species muzzle proportions, upper palate, mandible, gums and seated tooth roots. Each lower jaw rotates around its rear attachment. Cervid skulls have a long tapered nasal bone.
- `geometry/surfaces.ts` and `context.ts`: separate colour and height textures from the [retained painted atlas](../src/assets/materials/README.md), covering skin, short/shaggy fur, scales, bark, bone, hide, feathers and woven cloth. Contour dimensions set consistent grain density across body parts. Mipmaps suppress distant shimmer. Material and texture caches are owned and disposed by each rig.
- `geometry/features.ts`: layered wings and manes, shaped snake-crown heads, furred tails, folded garments and moving sleeves; mouth features use the host's jaw landmarks. Conflict crests sit beyond the assembled primary geometry. Donor clothing is restricted to compatible body forms.
- `motion/v3.ts`: restores jaw and limb attachment positions after the shared animator, opens jaws by rotation, and limits secondary-neck excursions. Mirrored arms open away from the chest. Anger no longer enlarges the entire creature; breathing and jumps stay within a smaller range. The fitted portrait reserves space for reactions. Existing six reactions, seven motion profiles and eight summon styles remain active.

The horizontal contour frame is fixed across bends, correcting twisted quadruped torsos and muzzles. Rear legs bend forward at the knee and back at the hock. Forearms taper into the wrist without a second round bulge. Wolf tails have a continuous tapered plume; manes wrap around the skull in three depth rows. Eyes sit closer to their recessed sockets. Large and long ears have cartilage bridges with roots inside the skull. The orbit camera widens the framing at side angles to accommodate long quadruped bodies.

## Habitat depth

`environments/layers.ts` separates distant landforms and tree silhouettes, ground relief, and near foliage. Architecture sits between atmospheric planes; the transparent foreground canvas carries near silhouettes and particles in front of the creature. The birch hut has an explicit clearing around its roof and window; the mangrove hut is offset from its near trunk and roots. V3 directional lighting emphasizes creature surface relief while v1/v2 keep their previous lighting.

The [14-habitat review](../artifacts/v3-habitats/index.html) and [birch/mangrove layer breakdown](../artifacts/v3-habitats/depth-layers.png) show the implemented scenery. Regenerate the latter with `node tests/v3-depth-review.mjs`.

## Reference corrections

Ahuizotl is upright with two arms and two legs. Tengu has two arms and two back wings. Pazuzu has the single wing pair shown in the supplied image. Zmey's three necks have separate head space; its miniature three-head crest also has separated skulls. Cernunnos and Leshy use elongated animal/wood skulls. Bakunawa's moon is inside the mouth assembly. Domovoi uses a shaggy coat over its soft form; Bungisngis retains a belly instead of added pectoral/abdominal spheres. Djinn's smoke is its lower body, without a second horizontal smoke tail.

## Validation and limits

- `npm test`: legacy version signatures, the v3 catalog/composition checks, anatomy checks, motion, habitats, names, cards, sharing and layout suites.
- `node tests/v3-anatomy.mjs`: 158 limb pivots checked inside actual torso/pelvis/scapula/serpent triangle surfaces by ray parity; tooth roots inside gum surfaces; 9,360 fixed attachment samples; palm centres outside the torso; projected skull vertices within the portrait during six reactions; constant creature scale during anger; 138 skull separation samples; all 50 primary rigs and eight completed summon styles.
- `node tests/v3-hybrids.mjs`: all 2,500 pairings are actually built, with donor geometry and primary limb counts checked. Idle and all six reaction poses produce 5,992 conservative skull separation checks. Bounds are compared in the body's frame so rotating the entire creature does not create spurious world-axis overlap.
- `npm run typecheck` and `npm run build`: TypeScript and production bundle validation.
- `node tests/v3-anatomy-review.mjs`: 50 comparisons and 250 additional geometry views. Generate the standard creature sheets with `node tests/v3-creatures.mjs --review` first.

These checks validate specific attachment, construction and sampled-clearance properties. They do not certify every possible mesh contact through every animation instant, or establish exact artistic equivalence to the reference illustrations. The software renderer shows actual geometry and colour maps, but does not reproduce browser bump shading. No browser surface was available for live WebGL or touch verification during this pass.

Names-only randomization remains local. Penanggal, Barong and Toyol remain excluded from v3.
