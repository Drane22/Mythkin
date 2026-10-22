# Complete v3 anatomy audit — 12 September 2026

Analysis of all 50 supplied references, current render boards and runtime geometry. No correction is claimed complete.

[Open the illustrated audit](../artifacts/v3-anatomy-audit/index.html). [Measured geometry](../artifacts/v3-anatomy-audit/measurements.json).

## Shared implementation defects

- Torso, pectorals and abdominal segments are overlapping ellipsoids: body.ts lines 13, 33–34.
- Hip/shoulder attachments start at fixed offsets with uncapped tapered tubes: body.ts lines 21, 42, 48; monster/sculpt.ts tube helper. There is no continuous pelvis or shoulder deformation.
- Head volumes are carved ellipsoids; muzzle/nose/cheeks are additional ovals or tubes: heads.ts.
- Teeth are detached coordinate recipes, not shared gum arches: heads.ts lines 19–44.
- Jaw reactions translate the jaw instead of rotating a posterior hinge: monster/animate.ts lines 225, 270, 296.
- Extra heads and companion masks have fixed offsets, without clearance constraints: body.ts lines 59–61; features.ts lines 127–135; motion/v3.ts lines 162–166.
- V3 only wires a diffuse noise/stripe map: context.ts. Fur, feathers, bark, scales, bone and cloth lack sufficient material-specific geometry and surface treatment.
- Catalog mismatches confirmed from supplied images: Ahuizotl should be upright with arms; Tengu needs arms; Pazuzu reference shows two wings, not four.

## Validation gap

Current tests establish counts, distinct meshes, finite transforms, deterministic recovery and preserved labels. They do not establish reference accuracy, joint continuity, collision clearance, mouth topology or readable textures. 1089/2609 current meshes are SphereGeometry. 28/98 leg pivot centers lie outside core torso ellipsoids; this is a heuristic risk indicator, not a complete gap test.

## Species findings

### 1. Minotaur

- Body: Ball chest, paired sphere pectorals and small sphere abs do not form a continuous tapered muscular torso. Thighs, knees and cloven hooves lack mass transitions.
- Face: Bull muzzle is an oval with a black nose pad; reference has a broad planar muzzle, two separate nostrils, a brow shelf and a seated lower tooth row.
- Surface: Fur is speckle noise. Reference has layered fur boundaries on neck, shoulders, forearms and thighs.
- Required reference treatment: Preserve curved horns, lateral ears, bull silhouette and loincloth; shorten the inflated upper chest and define waist/hips.

### 2. Gorgon

- Body: Oval human torso joins a thick generic coil without rib cage, waist or a convincing abdominal transition. Forearms and palms are padded tubes.
- Face: Human head branch produces a closed lip line; reference has an open fanged mouth, pointed chin and larger expressive eyes.
- Surface: Checker-like skin pattern and floating belly ovals do not form scales and continuous ventral plates.
- Required reference treatment: Snake crown ends in identical round bulbs; each snake needs a tapered head, jaw and tongue. Preserve primary snake body.

### 3. Cyclops

- Body: Generic barrel with separate round pecs/abs misses the reference's sloping shoulders, thick biceps, tapered waist and uneven broad hands.
- Face: Circular cranium and eye ring dominate. Mouth is a row of beads rather than gums, corners, lower jaw and distinct tusks.
- Surface: Uniform noise replaces deliberate skin planes, folds and worn cloth.
- Required reference treatment: Preserve single eye and stone-brooch sash. Build eye socket/lid into brow rather than a target-like ring.

### 4. Harpy

- Body: Egg torso and straight rod legs miss breast keel, feathered hips, bent avian knees and grasping feet.
- Face: Extruded flat beak lacks upper hook, lower beak and throat opening; head is too small under the crest.
- Surface: Wing feathers are smooth overlapping ellipsoids, missing shafts, vane edges and layered coverts.
- Required reference treatment: Preserve wing-arms and two bird legs; establish wing shoulder/elbow/wrist structure and directional white/rust feather layers.

### 5. Centaur

- Body: Oval human torso sits on a spherical horse barrel. Withers, spine, abdomen and four limb girdles do not read as a continuous centaur.
- Face: Human face is narrow and mask-like; beard is a slab of tubes obscuring jaw. Nose lacks bridge and nostril planes.
- Surface: Horse fur and human skin share undirected noise; sash and mane need authored material placement.
- Required reference treatment: Keep two arms plus four horse legs. Transition human pelvis into horse withers and seat hooves on flat soles.

### 6. Draugr

- Body: Full padded torso and round shoulders contradict emaciated rib cage, scapulae and thin articulated limbs.
- Face: Skull is a generic oval with round cheek lumps and bead teeth; nasal opening, maxilla and mandible are insufficiently differentiated.
- Surface: Bone, corroded helmet and ragged cloth need different patterns and thickness; current pale noise makes them similar.
- Required reference treatment: Preserve iron helmet, hollow eyes and cloak; move sash/fasteners to their actual anatomical attachments.

### 7. Troll

- Body: Upright symmetrical barrel loses the reference's heavy hunch, sloped neck, uneven shoulders and dangling oversized hands.
- Face: Small horizontal smile conflicts with the large irregular open maw, deep nose folds and lopsided lower jaw in the reference.
- Surface: Tiny moss balls and scattered mushrooms do not create broad moss coverage or cracked stone-like skin planes.
- Required reference treatment: Allow intentional reference asymmetry without dislocating joints. Sculpt hunch, elbow masses, moss patches and rock fissures.

### 8. World-Serpent

- Body: Heavy doughnut coil and upright tube replace the reference's long tapered flowing S silhouette.
- Face: Short closed muzzle misses extended upper jaw, open throat, rearward horns and long conical teeth.
- Surface: Belly is a ladder of detached ovals and side fins are repeated triangles; neither follows the body surface.
- Required reference treatment: Preserve long unlimbed serpent anatomy. Ventral plates and dorsal fins must track the actual centerline.

### 9. Fenrir

- Body: Upright dog barrel and straight legs lose lowered predatory shoulders, narrow flank, bent hocks and large clawed paws.
- Face: Small blunt snout, black button nose and closed mouth miss long nasal bridge, snarling cheeks and deep canine jaws.
- Surface: Mane is a ring of spikes; coat lacks directional tufts and layered silhouette breaks.
- Required reference treatment: Preserve wolf form, high sweeping tail and red eyes; put weight through shoulder blades and rear haunches.

### 10. Sphinx

- Body: Ball lion chest and stick legs lack shoulder girdle, tucked abdomen, haunches and broad feline paws.
- Face: Human face needs brow, nose bridge, lips and chin; current small features flatten beneath the nemes.
- Surface: Nemes stripes exist but cloth planes, collar bands and lion fur lack consistent depth and material treatment.
- Required reference treatment: Preserve human head on lion body, nemes and tufted tail; size headdress from skull landmarks.

### 11. Ammit

- Body: Generic canine barrel understates low heavy rear mass and the crocodile/lion/hippopotamus body transition.
- Face: Short sealed snout replaces the reference's enormous open crocodile gape; upper and lower teeth need continuous arches.
- Surface: Mane is a short ring instead of layered chest fur; scales and hindquarter hide need separate treatment.
- Required reference treatment: Preserve crocodile head, lion mane and stocky rear anatomy; broad planted feet must meet the legs.

### 12. Serpopard

- Body: Spherical leopard body and hose neck lack feline shoulder blades, lean abdomen and a natural neck-to-chest transition.
- Face: Pointed oversized ears and short blunt muzzle do not match the snarling leopard head and open jaw.
- Surface: Spots are sparse discs on the wrong local area rather than rosettes distributed over neck, flanks and limbs.
- Required reference treatment: Preserve extremely long neck and four feline legs; keep thin tail, cat paws and cat head proportions.

### 13. Oni

- Body: Round pecs and sphere abs read as attached balloons. Deltoid-to-biceps, oblique-to-waist and thigh-to-knee transitions are missing.
- Face: Tusks, nose and teeth use unrelated offsets; the broad red facial planes and compressed snarling lips need one coherent construction.
- Surface: Skin grain is generic; rope fibers, wrist cuffs and loincloth lack separate physical detail.
- Required reference treatment: Preserve two horns, paired tusks and muscular red biped; build muscles into the silhouette and surface, not separate balls.

### 14. Tengu

- Body: Avian form forces zero arms despite visible arms/hands in the supplied reference. Torso, pants and bird feet are simplified into egg and rods.
- Face: Beak/nose is a flat extruded shape and beard hides the mouth. Reference has a long projecting red nose and layered facial hair.
- Surface: Vest, prayer beads, white pants and rust wings lose their separate material identities.
- Required reference treatment: Correct limb schema before polishing: two arms, two bird legs, two back wings, white mane and proper clothing.

### 15. Kappa

- Body: Tall straight biped with ball shoulders misses compact crouch, sloping shoulders, shell posture and bent webbed feet.
- Face: Duck-like beak became a rounded snout; head bowl is a floating-looking ring rather than a recess in the crown.
- Surface: Shell seams and ventral plates are superficial and poorly placed; webbing is represented by thin claws rather than membranes.
- Required reference treatment: Preserve water bowl, turtle shell and webbed extremities; derive crown, shell and hand surfaces from anatomy.

### 16. Hitotsume

- Body: Scaled generic humanoid loses hunched narrow torso, short bent legs and exaggerated hands.
- Face: Single eye uses the Cyclops ring unchanged. Mouth, tongue root, lower lip and jaw hinge are not integrated.
- Surface: Skin folds and ragged wrapped cloth are absent beneath a uniform noise texture.
- Required reference treatment: Keep giant eye and tongue while giving this small hunched species a different torso, brow and limb proportions from Cyclops.

### 17. Lóng Dragon

- Body: Vertical compact coil and four dangling humanoid arms contradict a long flying serpent with small grasping limbs.
- Face: Short generic dragon snout misses long nasal bridge, open jaws, cheek mane and swept head shape.
- Surface: White mane behaves like a spiky collar; scales and pale belly must follow the flowing body.
- Required reference treatment: Preserve antlers, whiskers, mane and four small clawed limbs; redesign limb sockets along the serpent rather than a biped shoulder grid.

### 18. Nian

- Body: Plain dog barrel lacks lion-like forequarters, thick forearms, low stance and shaped paws.
- Face: Simplified snout and shut mouth miss broad snarling lion muzzle, nasal folds, cheek volume and open teeth.
- Surface: Cream mane needs layered tufts; gold swirls and bell harness are mostly absent or misplaced.
- Required reference treatment: Preserve red lion form, curved horns, cream mane and decorative markings; horns should not read as plain cone ears.

### 19. Huli Jing

- Body: Straight padded humanoid replaces slender fox torso, digitigrade stance and tapered paws.
- Face: Broad dog-like snout, button nose and slab ears miss pointed fox face, fine jaw and swept red-edged ears.
- Surface: Nine tails look like smooth fingers; require fluffy tapered mass, jagged fur edges and red tips.
- Required reference treatment: Preserve nine distinct tails and facial markings; distribute tail roots from the pelvis with sufficient fan clearance.

### 20. Tikbalang

- Body: Generic thin biped lacks angled spine, visible ribs, long forearms, strong hocks and seated hooves.
- Face: Round horse snout and large black nose pad miss long equine nasal bridge, separated nostrils and narrow long jaw.
- Surface: White mane is a circular ruff instead of a hanging mane; coat and cloth lack directional treatment.
- Required reference treatment: Preserve horse-headed upright form; emphasize gaunt chest, bony knees and long arms, not a horse mask on a mannequin.

### 21. Manananggal

- Body: Oval torso and spherical shoulders miss skeletal chest, clavicles and the severed taper of the reference.
- Face: Flat human lip line conflicts with screaming fanged mouth. Tongue starts independently of palate and jaw.
- Surface: Hair tubes, tiny root strands and flat bat membranes lack torn edges, veins and layered clumps.
- Required reference treatment: Preserve separated flying torso, large red bat wings and hanging tendrils; wings need strong back roots without hiding arms.

### 22. Bakunawa

- Body: Generic doughnut coil loses elongated suspended S curve and narrowing tail.
- Face: Moon floats beside a closed short muzzle; reference's moon is held inside an enormous raised gape.
- Surface: White fins and belly scutes are detached repeated pieces instead of continuous surface-following structures.
- Required reference treatment: The mouth/moon relationship is a defining construction requirement, not an ornament at an arbitrary body offset.

### 23. Sigbin

- Body: Round quadruped rear balloon replaces angular high haunches, descending spine, bent rear limbs and very low hanging head.
- Face: Small upright bat/dog face misses long drooping muzzle and vertical open maw.
- Surface: Smooth inflated back lacks coarse fur silhouette and bony limb landmarks.
- Required reference treatment: Rebuild pose and limb proportions directly from reference; do not obtain this silhouette by adding a sphere to a generic quadruped.

### 24. Bungisngis

- Body: Generic muscular brute incorrectly adds pec/ab lumps to a reference with a broad soft belly, sloping shoulders and compact bent legs.
- Face: Tiny bead grin under the eye misses the broad deep smile with clear tooth spacing and mouth corners.
- Surface: Folds, belly shading and rough loincloth should differ from muscular Oni skin.
- Required reference treatment: Keep cyclopean eye and cheerful broad grin; muscle definition must follow this reference's body type, not be forced onto every creature.

### 25. Banshee

- Body: Filled upright mannequin with round shoulder joints misses gaunt spectral chest and ragged dissolving lower body.
- Face: Skull smile remains beneath a shallow added wail oval; reference has a tall deep screaming cavity and elongated jaw.
- Surface: Robe is a flat triangular panel; requires overlapping torn folds and wispy translucent edges.
- Required reference treatment: Preserve skull, hood and open wail; join claws to thin bony hands and sleeve roots.

### 26. Kelpie

- Body: Generic dog chest and short straight legs fail equine withers, long neck, narrow barrel, fetlocks and hooves.
- Face: Stubby muzzle misses elongated horse face and dripping fang-lined jaw.
- Surface: Mane is a spiked collar; water mane/tail need continuous flowing ribbons, broken drips and directional highlights.
- Required reference treatment: Preserve aquatic horse anatomy; choose horse-specific joints rather than common four-leg rods.

### 27. Cernunnos

- Body: Padded human torso conflicts with branchlike arms, narrow wrapped body and hoof legs under leaves.
- Face: Generic human skull smile misses the long deer-like skull, nasal cavity and narrow tapered bone muzzle.
- Surface: Leaf cloak is sparse oval leaves over a panel; antlers resemble evenly spaced rungs rather than branching wood.
- Required reference treatment: Preserve antlered animal skull, foliage and hooves; skull lineage must change, not just add antlers to a human skull.

### 28. Cú Sìth

- Body: Same upright dog barrel as Fenrir misses angular hound shoulders, narrow waist and oversized spectral paws.
- Face: Short dog nose and closed smile lose lean pointed muzzle, hollow/glowing eyes and fangs.
- Surface: Flame mane is a ring of triangles, not ribbons that flow along neck, spine and tail.
- Required reference treatment: Preserve spectral hound identity while separating its build and flame surfaces from Fenrir's heavy fur.

### 29. Baba-Kin

- Body: Straight symmetrical mannequin misses bent back, forward head carriage, thin shoulders and irregular garment silhouette.
- Face: Hook nose is a tube without nasal bridge, cheek hollows or integrated mouth; bead teeth do not seat into a gaunt jaw.
- Surface: Headscarf, patched cloth and mushroom bundle lack layered folds and grounded attachments.
- Required reference treatment: Preserve hag posture, scarf, pack and long red claws; asymmetry should be intentional reference posture.

### 30. Leshy

- Body: Thin humanoid tubes and small branches do not establish a trunk, rooted pelvis, branch elbows or root-like feet.
- Face: Generic skull misses long narrow wooden/animal facial silhouette and deep dark sockets.
- Surface: Vertical stripes are not bark depth; moss, leaves and mushrooms are scattered decoration instead of overlapping growth.
- Required reference treatment: Use branching structure with contiguous trunk-to-limb geometry; preserve antlers and forest growth without human balloon anatomy.

### 31. Zmey

- Body: Three short necks crowd the same upper-body region, rather than rising as clearly separated long necks from one tapered serpent.
- Face: Three identical blunt muzzles lack open dragon jaws and inward-seated tooth rows. Their movement has no clearance constraints.
- Surface: Belly ladders and wing triangles repeat the generic serpent treatment.
- Required reference treatment: Preserve three complete heads with continuous neck roots; test head/head and head/body clearance across full idle and reaction cycles.

### 32. Domovoi

- Body: Compressed muscular brute has balloon pecs and heavy human arms. Reference is a small fur-covered rounded spirit with short limbs.
- Face: Brow is stern and planar while mouth is concealed by a single broad beard slab; reference eyes/nose peek through separate hair clumps.
- Surface: Shaggy hair should dominate silhouette and hide underlying anatomy; tubes do not read as fur locks.
- Required reference treatment: Roundness is appropriate here, but it must come from a layered fur coat, not visible inflated muscle pieces.

### 33. Naga

- Body: Generic thick coil and detached belly plates miss slender cobra neck taper and continuous ventral bands.
- Face: Cobra face shares mammalian dragon muzzle/tooth construction; reference has a small tapered snake face with a narrow mouth and forked tongue.
- Surface: Hood is two smooth paddles; it needs connected neck expansion, radial folds and painted inner bands.
- Required reference treatment: Preserve cobra hood and jewelry; connect hood physically and proportion it to the skull and neck.

### 34. Rakshasa

- Body: Inflated pecs/abs and four tubular arms; extra shoulder roots are farther out than the torso and can look detached.
- Face: Generic Oni mouth does not align tusks, teeth, lips and jaw; face needs a broad muzzle and large open cavity.
- Surface: Gold wrist bands are placed as body beads; cloth and skin relief lack specific material construction.
- Required reference treatment: Preserve four arms with two embedded shoulder levels and independent elbow bends; validate both pairs through reactions.

### 35. Vetala

- Body: Narrow but still filled oval torso misses pronounced rib cage, clavicles, sunken abdomen and skeletal taper.
- Face: Rounded cheek attachments and bead teeth replace broken skeletal jaw, deep nasal aperture and asymmetrical damaged skull detail.
- Surface: Bone/sallow skin and loose strips need distinct thin surfaces; uniform grain obscures anatomical landmarks.
- Required reference treatment: Preserve gaunt floating lower taper and long hooked claws; do not bulk it up with human muscle primitives.

### 36. Makara

- Body: Generic vertical coil and unattached fish-tail fin miss serpentine shoulder flow and tapered aquatic tail.
- Face: Sealed crocodile muzzle lacks the reference's huge open mouth, arched upper snout, large tusks and lower gum line.
- Surface: Pink fins need scalloped membrane profiles and spine roots instead of repeated flat triangles.
- Required reference treatment: Preserve tusked aquatic reptile face; build snout, tusks and teeth from shared jaw landmarks.

### 37. Lamassu

- Body: Bulbous animal trunk and short straight legs lack bull shoulder/hip masses and clear hoof weight bearing.
- Face: Tiny human face is swallowed by a beard slab and short cap; nose, lips and tiered beard need distinct planes.
- Surface: Wings are inflated feather ovals, crown is a rounded cap, and beard lacks ordered curls/bands.
- Required reference treatment: Preserve human head, crowned beard, bull body and one feathered wing pair; relate all proportions to the supplied reference.

### 38. Pazuzu

- Body: Smooth full torso and rounded joints contradict exposed ribs, narrow waist, bent limbs and bony claws.
- Face: Bat/dog button snout is wrong for the reference's skull-like front face, paired nostrils and large open maw.
- Surface: Wing membranes need creases along supporting fingers; bone-like skin needs anatomical shading rather than speckle.
- Required reference treatment: Confirmed from full reference: one pair of wings, not the catalog's two pairs. Correct the wing count before further geometry work.

### 39. Mušḫuššu

- Body: Spherical cat-like trunk and rigid long-neck hose miss a lean scaled quadruped with long angled legs and a smooth serpentine neck transition.
- Face: Generic short dragon head lacks elongated reptilian jaw, open mouth and horn-to-brow placement.
- Surface: Red mane/spines are disconnected plates; pale scales and ventral surface need direction along neck and belly.
- Required reference treatment: Preserve long-neck dragon silhouette, paired straight horns and birdlike feet; avoid feline ear silhouettes.

### 40. Div

- Body: Round pecs and abdomen are indistinguishable from Oni; reference has a heavy muscular upper body with clear shoulder-to-arm and waist transitions.
- Face: Small bead mouth misses broad irregular fanged gape, thick lips, nasal mass and deeper eye sockets.
- Surface: Purple skin folds, dark loincloth and gold bands need separate roughness and authored color boundaries.
- Required reference treatment: Preserve curved horns and floating flame; make mass distribution specific instead of recoloring another brute.

### 41. Roc

- Body: Egg torso and long unjointed legs do not show broad avian breast, feathered thighs or strong grasping talons.
- Face: Flat beak is not a hooked raptor bill; head/neck transition lacks swept feather layers and a proper lower bill.
- Surface: Long wing feathers are smooth padded ovals with no vane geometry or layered edge lengths.
- Required reference treatment: Preserve broad powerful wings and white head/neck; tail is a feather fan, not a long thin mammalian tail.

### 42. Djinn

- Body: Ball torso and disconnected smoke appendage lose tapered waist-to-smoke transition and expressive bent arms.
- Face: Tiny lip line, generic nose and curtain-like beard miss pronounced brows, cheek planes, pointed ears and shaped beard.
- Surface: Turban needs wrapped folds; smoke needs a continuous ribboning taper, not a solid pale hook plus extra tail.
- Required reference treatment: Preserve one smoke lower body and gold jewelry; jewelry belongs on neck and wrists rather than repeated torso beads.

### 43. Feathered Serpent

- Body: Heavy bottom coil and short upright neck replace the reference's long freely suspended S curve.
- Face: Stubby generic dragon muzzle omits extended nasal bridge, open jaw and tongue.
- Surface: Crest/fringe are spikes rather than broad red/teal feathers; pale ventral band should remain continuous around curves.
- Required reference treatment: Preserve feathered silhouette and headpiece; body centerline must support long feathered tail and mane without a doughnut base.

### 44. Tzitzimitl

- Body: Rib tubes are a ladder over a simplified stick, with ball pelvis/shoulders. Reference requires clavicles, curved ribs, sternum, pelvis and jointed long bones.
- Face: Generic skull smile misses long open jaw and dark star-like eye sockets; teeth have no maxillary/mandibular arches.
- Surface: Constellation cloak is a flat panel with dots, and crown lacks long distinct star rays and suspended ornaments.
- Required reference treatment: Preserve a skeletal body, not a thin human mannequin. Fingers, toes and ribs require separate bone topology.

### 45. Ahuizotl

- Body: Confirmed reference is upright with two arms and two feet; current catalog forces a four-legged dog body.
- Face: Wolf muzzle and shut mouth miss otter-like cheek/muzzle proportions, paired nostrils, open mouth and long tongue.
- Surface: Reference has shaggy blue-gray fur and a cream belly, not a uniformly gray noisy dog.
- Required reference treatment: Correct upright anatomy first; keep articulated hand at the tail tip and actual grasping forepaws.

### 46. Cipactli

- Body: Generic high dog chest and thin rods lose low reptile body, broad belly, splayed elbows/knees and clawed planted feet.
- Face: Crocodile muzzle is nearly closed, although the large tooth-filled gape defines the reference; jaw must have real thickness and aligned teeth.
- Surface: Dorsal osteoderms and scaled hide need varied embedded plates, not repeated triangular fins and checker texture.
- Required reference treatment: Preserve low crocodilian silhouette and thick raised tail; differentiate it from Ammit and Makara in body and muzzle proportions.

### 47. Tokoloshe

- Body: Padded symmetrical mannequin misses squat hunched torso, forward shoulders, bent elbows and spread clawed feet.
- Face: Large rounded ear discs, bead grin and tube nose miss pointed ears, angular cheekbones and narrow goblin muzzle.
- Surface: Hair tuft, rough skin, loincloth and claws need intentional boundaries and tapered edges.
- Required reference treatment: Keep goblin proportions and large pointed ears; do not use elephant-like ear ovals.

### 48. Grootslang

- Body: Repeated donut coil lacks a long tapering neck and smoothly integrated elephant upper mass.
- Face: Elephant head uses a button-like facial structure; trunk, tusks and cheek pads need common roots and a broader skull with folded ears.
- Surface: Gray wrinkled hide and gold diamond markings are replaced by checker scales; tusks should be smooth ivory with planted sockets.
- Required reference treatment: Preserve elephant head on serpent body; trunk must descend from the nasal structure, not an independently placed tube.

### 49. Impundulu

- Body: Same small egg and rods as Harpy/Roc fails the upright angular storm-bird breast, raised wings and sharp bird joints.
- Face: Flat beak lacks deep open throat, hooked upper bill and crest-to-skull transition.
- Surface: Lightning appears as thin added tubes over padded feather ovals; reference uses jagged bright markings following layered feather directions.
- Required reference treatment: Preserve blue/white lightning bird silhouette; wings and crest require feather-specific geometry rather than scaled Harpy parts.

### 50. Pontianak

- Body: Round shoulders and torso remain under a broad sheet-like robe; reference is very thin with long separated skeletal hands.
- Face: Flat small lip line does not match the elongated dark open mouth, hollow red eyes and narrow pallid face.
- Surface: Hair tubes and an extruded robe panel lack overlapping black locks, deep fabric folds and torn hems.
- Required reference treatment: Preserve long black hair, thin floating white gown and clawed hands; visible garment needs volume and sleeve-to-arm continuity.

## Before geometry changes resume

Use this audit to correct anatomy definitions first. Rebuild connected torso/pelvis/neck contours, embedded limb roots, jaw hinges and dental arches; then surface geometry and textures. Verify head clearance, attachment, paired symmetry and tooth placement through rest, all six reactions and all eight summons. Render front/side/back and reference comparisons across all 50. Preserve the prior v1/v2 paths.
