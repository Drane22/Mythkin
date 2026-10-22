# Mythkin v3 painted materials

Source: [mythkin-material-atlas-v3.png](mythkin-material-atlas-v3.png), generated with the built-in image generation tool and retained here unmodified. No image API is called by the app.

The 1,254 × 1,254 image contains nine equal tiles, in row order:

| Row | Left | Centre | Right |
| --- | --- | --- | --- |
| 1 | Short directional fur | Long shaggy fur | Overlapping scales |
| 2 | Branching bark | Worn porous ivory/bone | Skin pores and creases |
| 3 | Layered feathers | Rough woven linen | Wrinkled hide |

Generation brief: a production grayscale 3 × 3 material atlas, with equal square tiles, no labels, borders or gaps. Hand-painted material structure for a low-resolution creature viewport: short and shaggy fur, irregular overlapping scales, branching bark, worn ivory, porous skin with creases, feathers, coarse linen and wrinkled hide. Neutral diffuse illumination and pale gray values suitable for tinting and bump maps; exclude random noise, checker patterns and inflated shapes.

`node tests/pack-material-atlas.mjs` extracts nine 128 × 128 grayscale tiles into `src/creatures/materials/painted.ts`. The runtime combines the bundled tiles with material-specific grain into 256 × 256 colour, bump and roughness textures. Fur is fine and directional; scales overlap; bark fissures run lengthwise; feathers have barbs; cloth has a weave. Serpent undersides use separate transverse scutes. Contour circumference and centreline length set the texture density, so a long leg does not stretch the same tile as a short nose. Mipmaps and anisotropic filtering control distant shimmer.

The reference species palette supplies the colour. Material texture adds surface detail; body contours, fur locks, feather vanes, garment folds and anatomical landmarks supply the actual shape. The software review shows colour maps; browser WebGL additionally supplies bump shading.
