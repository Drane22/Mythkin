# Mythkin v3

*What monster hides in your name?* Created by **Drane**.

Mythkin turns a name into a deterministic, animated creature and a shareable illustrated card. Version 3 rebuilds creature generation around **50 reference-based species from 14 origin groups**, with explicit anatomy, identifiable silhouettes, compatible secondary influences, and living habitats.

**Latest refinement:** Rounded species-specific faces, modeled fur, separate scale/feather/bark/hide/bone/skin materials, and 640 × 800 antialiased portraits. The summon interface stays focused on names and sharing, without a search or browsable catalog. See the [current WebGL review and validation](docs/surface-refinement.md).

## What changed in v3

- Replaced the four broad visual families used by v2 with a species catalog based on supplied artwork. Each species defines its form, head, characteristic features, palette, habitat, and movement profile. The original reference folder is local development input, not a runtime dependency.
- Split species data, composition, geometry, environments, and motion into separate modules. The public generator now dispatches by version, with the previous generators retained for existing links.
- Preserved primary anatomy when mixing creatures. Secondary features carry their source species and origin, and enter through an available attachment point or a separate companion crest.
- Added seven movement profiles, six interaction reactions, eight summoning styles, and fourteen origin-associated habitats with animated architecture and near/far atmosphere layers.
- Kept randomization restricted to a local pool of given names. Creature generation does not need a remote name-generation API.
- Rebuilt anatomy after the 50-species audit: continuous muscle/waist/pelvis contours, shaped limbs and feet, fixed attachment points, jaw hinges and dental arches, layered feather/fur geometry, folded garments, and separate colour/height textures.
- Corrected Ahuizotl to an upright body, restored Tengu's arms, and changed Pazuzu to the single wing pair shown in its reference. Separated Zmey's skulls and moved companion crests outside the primary geometry.
- Added a bundled [painted material atlas](src/assets/materials/README.md) for fur, scales, bark, bone, skin, feathers, cloth and hide. Surface density follows mesh dimensions; separate bump maps and directional lighting reveal the grain. Removed whole-creature inflation during angry reactions.

The reference images establish the project's visual direction; these designs are **Mythkin interpretations, not historical or religious authority**. Origin groups are catalog labels, not claims that distinct traditions are interchangeable. For example, Baba-Kin is a Baba Yaga-inspired design, and the Cernunnos entry is a stylized interpretation of the supplied reference.

## Creature catalog

| Origin group | v3 species |
| --- | --- |
| Greek | Minotaur, Gorgon, Cyclops, Harpy, Centaur |
| Norse | Draugr, Troll, World-Serpent, Fenrir |
| Egyptian | Sphinx, Ammit, Serpopard |
| Japanese | Oni, Tengu, Kappa, Hitotsume |
| Chinese | Lóng Dragon, Nian, Huli Jing |
| Filipino | Tikbalang, Manananggal, Bakunawa, Sigbin, Bungisngis |
| Celtic | Banshee, Kelpie, Cernunnos, Cú Sìth |
| Slavic | Baba-Kin, Leshy, Zmey, Domovoi |
| Hindu | Naga, Rakshasa, Vetala, Makara |
| Mesopotamian | Lamassu, Pazuzu, Mušḫuššu |
| Persian / Middle Eastern | Div, Roc, Djinn |
| Mesoamerican | Feathered Serpent, Tzitzimitl, Ahuizotl, Cipactli |
| African traditions | Tokoloshe, Grootslang, Impundulu |
| Malay / Indonesian traditions | Pontianak |

**Penanggal, Barong, and Toyol are excluded from the v3 catalog.** Their old v1/v2 generation paths remain available through versioned links.

The source of truth is [`src/creatures/catalog/index.ts`](src/creatures/catalog/index.ts). Reference numbers identify the supplied development artwork.

## Summoning and mixing

Enter a name and summon its creature. Ordinary-name v3 appearances vary in build, face, horns, pigments and surface markings, while the same name remains deterministic. See the [UI and variation notes](docs/ui-and-individuals.md). `npm run review:individuals` generates a local comparison sheet.

Enter a personal name to generate a seeded creature. Enter a recognized species label, such as `Minotaur`, to request that species directly. To choose both influences, use the canonical form:

```text
Minotaur with Gorgon
```

The first species is primary. Its body form, head, characteristic features, palette, and habitat remain the foundation. In this example the bull anatomy, horns, loincloth, and hooves stay identifiable as the Minotaur.

Composition maps features to the back, tail, crown, face, and body. A secondary species contributes one feature whose attachment point is free. Structural features such as additional heads, extra arms, and elongated necks are not transferred onto a conflicting primary anatomy. When no compatible point is available, a separate **companion crest** represents the secondary species. A pairing therefore need not replace a limb or head to acknowledge both creatures.

All catalog species can be primary or secondary. Reversing a pair changes which identity is protected: `Gorgon with Minotaur` keeps the Gorgon's form and features. Each contribution records its species, origin, feature, attachment point, and primary/secondary role in the v3 profile. Pairing a species with itself produces the primary species without a duplicate contribution.

Names are normalized with Unicode NFKC, case folding, punctuation removal, and whitespace collapsing before seeding. A given normalized input and generation version produce the same genotype. Empty input resolves to `nameless`.

## Motion, interaction, and habitats

Movement is assigned by body form: **brute, beast, serpent, avian, spirit, trickster, or guardian**. These profiles drive breathing, posture, head attention, limb motion, wing movement, coils, and hanging details as supported by the rig. Pointer attention and drag rotation let visitors inspect the creature. Taps cycle through **guard, feint, taunt, startle, curious, and delight**, with recovery to the idle pose.

Summoning supports **sigil, shadow, pixels, portal, ground, glitch, parts, and celestial** assembly paths. All share the page's muted violet loading mark; v3 assembly particles are small violet motes. Reduced-motion handling keeps the creature stable and suppresses animated entrances and ambient motion.

Habitats follow the primary origin: labyrinth, barrow/fjord, Nile, cedar shrine, cloud peaks, balete grove, standing stones, birch woodland, banyan ghat, ziggurat, desert bazaar, cenote, baobab landscape, and mangrove. Distant silhouettes, architecture, mist, ground detail and a separate foreground foliage canvas provide depth and motion. `node tests/v3-depth-review.mjs` generates a local scenery layer breakdown.

## Privacy and sharing

The random-name button draws only from the hardcoded given-name pool in [`src/data/randomNames.ts`](src/data/randomNames.ts), using a shuffled bag to avoid repetitions until the pool is exhausted. It does not read files, contacts, or browser history, and does not call a name-generation API. The supplied image folder is a development reference source, not a runtime file-scanning feature.

Generation and card rendering run in the browser. Recent input names are stored in local storage, with up to twelve history entries. Sharing a card or link is an explicit user action.

Share URLs carry the generation version, a seed prefix, and the normalized input:

```text
?v=3&s=<seed-prefix>&n=<base64url-encoded-input>
```

The encoded input is readable by anyone who has the link; Base64 is not encryption. Parsing validates the seed and accepts only versions 1, 2, and 3. New summons default to v3, while v1/v2 links use their retained generators. Versioned links are the way to preserve an earlier generation; recalling a plain name from local history uses the current generator.

## Development

Use **Node.js 24** and npm. The test harness uses Node's module registration hooks to load TypeScript. From the project directory:

```bash
npm ci
npm run dev
```

Vite prints the local development URL. Validation and production commands:

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

Targeted v3 checks can also run independently:

```bash
node tests/versioning.mjs
node tests/v3-motion.mjs
node tests/v3-environments.mjs
node tests/v3-creatures.mjs
node tests/v3-creatures.mjs --review
node tests/v3-review.mjs
node tests/v3-anatomy.mjs
node tests/v3-hybrids.mjs
node tests/v3-anatomy-review.mjs
node tests/v3-depth-review.mjs
```

Versioning tests compare complete pre-v3 genotype signatures, round-trip share links for all three supported versions, and reject invalid versions and seeds. Legacy anatomy, palette, and geometry suites explicitly exercise v2. The v3 motion and environment suites check distinct poses and habitats, deterministic frames, reaction recovery, and reduced-motion behavior. Geometry and animation checks complement visual review in a browser; they do not establish that every rendered frame looks correct.

The app uses React, TypeScript, Three.js, Vite, and Tailwind CSS, with locally bundled Cormorant Garamond, DM Sans, and Space Grotesk fonts. Canvas compositing and QR generation support card export.

Optional reference-review scripts require the original local artwork and audit inventory. Generated historical review files remain local. Current browser screenshots are retained in `artifacts/surface-refinement/`; `tests/browser-review.mjs` checks the real production page with a local isolated Chromium session on port 9333 and the app served on port 5173. It covers responsive controls, modal dismissal, reduced motion and eight WebGL material samples. Headless browser checks do not establish real phone frame rates or touch behavior.

The original anatomy audit is a frozen record of the earlier geometry. Use `v3-anatomy-review.mjs` for the rebuilt geometry. The anatomy suite tests actual triangle-surface attachment and gum seating, while the extended hybrid suite builds all 2,500 pairings and samples seven poses each. These checks cover specific construction properties, not every possible surface contact or exact reference fidelity.

## Structure

```text
src/
  assets/materials/  Retained painted atlas and generation brief
  creatures/
    catalog/          Species, source reference numbers, features and palettes
    composition/      Primary anchors and compatible secondary contributions
    geometry/         Contours, proportions, surfaces, bodies, hinged heads and features
    materials/        Bundled grayscale material tiles
    generateV3.ts     Name/species selection and v3 genotype assembly
    types.ts          Species and contribution contracts
  environments/
    habitats.ts       Habitat definitions and origin mapping
    architecture.ts   Habitat scenery
    layers.ts         Distant scenery, ground relief and near foliage
    atmosphere.ts     Ambient layers and floating details
    primitives.ts     Shared canvas drawing operations
    index.ts          Environment rendering interface
  motion/
    v3.ts             v3 idle profiles, summoning and interaction animation
    ritual.css        Shared page-colored loading mark and motion
  generator/
    generateMonster.ts    Public version dispatcher
    generateMonsterV1.ts  Retained v1 generator
    generateMonsterV2.ts  Retained v2 generator
    rng.ts                Normalization, hashing and seeded randomness
  monster/            Viewport, shared rig contract and legacy rendering
  cards/              Card compositing and export
  data/               Local given-name pool
  share/              URL encoding, clipboard and native sharing
  storage/            Local recent-name history
tests/                Regression, composition, motion and rendering checks
mythkin monsters/     Supplied visual references
artifacts/            Reference audit and generated review material
```

Species and composition modules describe what a creature is. Geometry constructs the rig, motion changes its pose, and environments paint its setting. Keep new species features explicit in the catalog and preserve their source metadata when extending composition.
