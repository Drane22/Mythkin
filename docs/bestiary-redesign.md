# Collectible bestiary redesign

Approved direction: meet and interact with your Mythkin first; collectible cards with full lore; defensive and mischievous creatures that track the mouse while retaining pixel rendering.

The homepage pairs a readable name form with a live specimen. A short guide explains summoning, interaction, and saving. The result page gives the creature more room, separates lore from traits, and prioritizes the collectible card action. Recent summons and existing link/image exports remain available. Layouts stack on small screens, with touch-sized controls and visible labels.

Cards default to portrait, with square and wide alternatives. A rarity-colored frame surrounds creature art, name, title, mythology, two traits, and complete lore. Text wraps and fits within allocated regions, including long names. Fonts are bundled locally for consistent exports. Modal dialogs trap focus, restore the triggering control, lock background scrolling, and show render errors with retry.

Creatures render at 256 x 256 with nearest-neighbor scaling. Restrained eye sizes, reduced eye asymmetry, and small eye highlights improve readability. Cursor tracking is bounded and eased, yields to reactions, resets when leaving the window, and is disabled for reduced motion. Touch interactions briefly direct the gaze toward the tap.

Validation: TypeScript, production build, 1,000 generated combinations, 100 rigs, gaze checks, and 60 native canvas renders covering all card formats and full lore. Card layout QA uses an explicitly labeled art fixture; it does not substitute for visual validation of the WebGL creature. No connected browser is currently available to inspect the full website or live pointer/touch behavior.

## Rotation, sharing, and surface detail

Drag horizontally to rotate through 360 degrees. Mouse dragging also tilts the view within bounds; touch keeps vertical scrolling. Pointer capture retains the drag outside the viewport. Movement over six pixels suppresses the tap reaction. Arrow keys rotate; Home and Reset view restore the camera. Export captures the chosen camera angle.

Both Create card and Share open the card dialog. The generated PNG is prepared as a File before the user presses Share, preserving browser user activation. Sharing uses the device app chooser with the image. Cancel, unsupported sharing, and failures never trigger a download. Copy card and Download PNG remain explicit alternatives.

Card lore is 36px in portrait/square and 30px in wide. The layout measures lore first and reserves its full height; wide exports use 1200 x 900 to provide more reading space. Decorative copy and seed labels have been removed.

All eight skin types have deterministic nearest-neighbor textures: smooth, fur, scales, bone, stone, feathers, chitin, and bark. Fur and feather tufts attach to raycast torso surfaces and cheeks; new skins appear on compatible creatures. The linked drane specimen remains smooth-skinned. Tests cover texture determinism, tuft geometry, rotation limits, text overlap, the drane card, and sharing cancellation/failure.
