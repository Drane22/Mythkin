# UI and individual creature refinement — 22 October 2026

This continues the approved creature-first, eerie-but-charming direction in `bestiary-redesign.md` and the reference species contract in `v3-design-language.md`.

## Direction and scope

Keep the app focused on entering a name, summoning, interacting with the creature and sharing it. The user's explicit constraint is no search, browsable creature catalog, mixer or specimen gallery. The 50 species remain internal generation data.

The homepage has a name field, Summon, Surprise me, recent names and a single example creature. Desktop uses two columns; mobile stacks the form and preview. The result retains its viewport stage with Share, Another and creature information. Short-screen and keyboard handling keep the form reachable.

Removed the searchable bestiary, lineage controls, specimen switcher and promotional copy. Individual monster variation remains part of generation and requires no extra interface.

## Individual construction

`creatures/appearance.ts` owns deterministic appearance decisions independently of the species selection stream. Six coordinated pigment families combine with four body builds, three surface marking families and continuous facial/horn proportions. The renderer consumes the same colors displayed in the genotype. Chest and waist changes are applied while constructing the torso and shoulders, not by detaching limbs from an existing mesh. Facial dimensions retain common frames for gums and teeth. Antler branches share their parent horn deformation.

Direct species/pair lookups retain the reference palette and default construction. Ordinary names and named lineages get individual variation:

```
Minotaur named Amihan
Minotaur with Gorgon named Luna
```

The same normalized input remains deterministic. V1/V2 paths remain frozen. This refresh intentionally changes ordinary-name v3 appearances; existing v3 links render the refreshed appearance. No additional randomness is introduced into the generator or share format.

“Another” reorders the remaining local name bag to prefer a different body form when available. It never discards names, so the existing no-repeat-until-exhausted behavior remains intact.

## Validation and review

The creature variation pass passed the full existing regression suite, the new individual suite, TypeScript and the production build. The new individual suite is included in the standard `npm test` command as well as its standalone script. The interface simplification is validated separately with the existing layout check, TypeScript and production build.

- `tests/v3-individuals.mjs` checks 150 individuals across all 50 species, actual geometry and texture signatures, color consumption, anatomy counts, reaction bounds, deterministic normalization, catalog immutability, named-pair link reconstruction and preference-aware name-bag exhaustion.
- Existing v3 composition checks cover all 2,500 ordered pairs and primary/donor geometry.
- `npm run review:individuals` produces `artifacts/v3-individuals/lineages.png`: five reference species alongside three named individuals each, using the implemented geometry and habitat renderer.
- The contact sheet is a software rendering, not a WebGL browser screenshot. Browser layout, touch behavior and device frame rates require live browser verification; automated source/layout checks do not establish those properties.
