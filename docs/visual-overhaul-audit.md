# Generation 2 audit and implementation contract

Version 1 generator, renderer and surface textures are frozen before this pass. New share links use v2; v1 links must reproduce v1.

Found: renderer replaces body/secondary/eye/mouth/horn/accessory slots; skin owns hue; most dimensions ignored or clamped; quadruped strips arms; independent head/torso template used for all bodies; secondary tags do not guarantee a visible borrowed part; renderer chooses clothing; fins reuse spikes; several horns reuse curves; backgrounds hidden in App and replaced on cards; summon always has the same 1500ms assembly.

V2: genotype owns semantic colors, rig, source archetype bias, clothing/ornaments/markings, summon and environment. Preserve the 14 families and all 53 recognizers. Test reachable generation witnesses, palette distance, deterministic reconstruction, rig attachment, distinct geometry, counts and export preservation. Review deterministic batch thumbnails with frequency tables. Keep development inspector out of production. Browser verification and mobile performance require an available browser; report actual evidence, not inferred frame rates.

## Implemented and checked

Generation 2 keeps 14 mythology pools and all 53 archetype recognizers. Actual deterministic names reach every archetype in the diversity test. Genotypes now contain 19 semantic palette families, 15 palette mutations, 8 summon profiles, 15 environments, optional garments, independent markings and secondary-source ornaments. Legacy v1 links deliberately retain their original generator and renderer. Create a new creature from the home page to review v2.

Heads no longer use a shallow face plate backed by a sphere. A continuous tapered cranial extrusion forms the temples and nape, with separate contours for vessels, flames, angular jaws, muzzles and broad cheeks. The solid nape closure has no eye or mouth cutouts. All nine head types pass rear-facing ray-cast closure checks and have front/side/rear review images in artifacts/head-turnaround.png. Intentional two-face mutations remain distinct from accidental openings.

Validation: TypeScript and production build; 1,000 anatomy combinations; 100 animated rigs; 60 canvas card layouts; sharing cancellation/failure paths; 4,000 palette checks; all 53 archetype witnesses. The development-only batch inspector is available with ?debug in Vite development mode. Static review sheets in artifacts/batch-review contain 1,000 actual generated meshes and textures rendered in software. These are not live-browser screenshots.

Limitations: no browser is connected to the automation session, so live WebGL appearance and measured mobile frame rates remain unverified. Geometry budgets are recorded in artifacts/geometry-budget.json; they are not FPS measurements. The head turnaround is implementation evidence, not a claim that the generated artwork matches the reference illustrations exactly.

## Corrective presentation pass

Replaced oval fan wings with separate bat membranes, layered feather blades, veined insect lobes and short wing buds. Feather/bat elbows and insect lobes have independent motion. Mantles, wraps, shoulder drapes, sashes and patchwork now use curved open panels; back ornaments use rear sockets and neck ornaments use a centered neck position.

Summoning no longer applies assembly scaling to every style. Portal, ground, shadow and celestial styles use entrance motion; shadow eyes open early; glitch visibility is stepped; parts include horns and wings. Pixel materialization uses 160 colored instanced cubes targeting points sampled from the actual generated mesh. Entrance, flash and environment lighting fields now affect rendering.

Backgrounds remain dark. Added layered structural details, atmospheric bands and motes; all 15 background families have tested time-varying output when motion is selected. Dark body readability now also uses the highlight slot rather than forcing a gray background. Live WebGL silhouette readability still needs visual verification.

New evidence: artifacts/wing-garment-review.png uses one controlled anatomy fixture to compare feature silhouettes; artifacts/background-review.png compares all environments; artifacts/motion-review/index.html animates software-rendered summon geometry (without browser-only ritual overlays). Tests assert temporal background differences and distinct summon poses, not just enum counts. No measured mobile FPS or live browser verification is claimed.
