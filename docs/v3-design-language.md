# Mythkin v3 design language

V3 translates the 50 supplied reference creatures into an animated, inspectable 3D bestiary. The source illustrations set the species, anatomy, colors and defining appendages. The anatomy rebuild uses continuous contour surfaces, recessed eye regions, hinged mouths, directional colour/height textures and layered feather/fur geometry suited to the existing pixel viewport. See the [before/reference/after collection](../artifacts/v3-anatomy-rebuild/index.html).

## Anatomy and identity

Select the species before building its anatomy. A primary Minotaur retains a bull head, horns and hooves; a Gorgon retains a serpentine body and snake crown; a Manananggal retains the separate flying torso. Count-based signatures include three Zmey heads, four Rakshasa arms, two Pazuzu wings and nine Huli Jing tails. Ahuizotl is upright and Tengu has separate arms and back wings, following the supplied artwork.

Muscles are relief within the chest/waist surface. Gaunt bodies use rib and clavicle structure; soft forms retain their belly or shaggy coat. Limb pivots sit inside torso, pelvis or scapula surfaces. Tooth roots share the gum and jaw frame. More texture noise is not a substitute for those anatomical landmarks.

The catalog declares each species' primary anchors. Composition keeps those anchors, selects a compatible donor feature, and records its source and origin. Serpent species can contribute a curled tail without replacing the primary's legs. A separate companion crest handles occupied sockets. The primary palette and habitat remain attached to the primary species; the donor piece retains its own palette. This is a visual interpretation of the supplied collection, not a new folklore classification.

## Motion and surroundings

Seven motion profiles determine posture, attention, weight, wings, serpent joints and drifting appendages. Six reactions have distinct poses and settle back to idle. The first animation call captures the completed rig; every later frame restores those original transforms before applying motion. This makes repeated reactions, frame seeking, replay and reduced motion stable.

Eight entrances combine rig assembly with separate SVG and CSS ritual drawings. Glitch uses horizontal displacement, sparse chromatic fragments and a reconstruction scan. Parts assembly fits all delayed pieces inside the entrance duration. Reduced motion skips the entrance and displays the completed anatomy.

Fourteen new settings follow primary origin, with architectural forms, fog, water, distant lights and near-plane particles. The fifteen v2 environments remain in the legacy path. The viewport pauses frame work while offscreen or hidden.

## Module responsibilities

- `creatures/catalog`: the reference-derived species definitions.
- `creatures/composition`: immutable anchors and compatible inherited pieces.
- `creatures/geometry`: actual body, face, appendage, material and rig construction.
- `motion`: animation poses and ritual presentation.
- `environments`: habitat registry, scenery and atmosphere.
- `generator/generateMonster`: explicit v1/v2/v3 dispatch.

Legacy generators remain frozen. No runtime filesystem scanning or external name API is used; the surprise button samples a local given-name pool.

## Review material

The [design preview](../artifacts/v3-design/index.html) includes all 50 species, reference links, hybrid studies, sampled motion and summon stages. The [ritual preview](../artifacts/v3-design/rituals.html) uses the actual React component and CSS. The [reference map](v3-reference-map.md) links each catalog entry to its source image.

Automated checks cover all 2,500 ordered compositions, all 50 primary rigs, actual surface attachment and gum seating, motion recovery, habitats, card layout and frozen legacy genotypes. The extended hybrid suite builds all 2,500 pairings and checks donor meshes, limb counts and sampled skull clearance. The [rebuild notes](v3-anatomy-rebuild.md) distinguish these checks from full collision or artistic-fidelity guarantees. Review images are software rasterizations of actual Three.js meshes. No browser was connected during this pass, so live WebGL, mobile touch and final UI layout still need browser verification.
