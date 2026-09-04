# ▣ MYTHKIN

> *What monster hides in your name?*  
> **Created by Drane**

Every name conceals exactly one creature: chunky, pixelated, alive, and yours forever. **Mythkin** is a deterministic procedural generator that translates any name or string into a unique mythological beast with bespoke anatomy, stats, mythology, and 3D pixel animation.

[![Creator](https://img.shields.io/badge/Created%20by-Drane-8b5cf6?style=flat-square)](#-author)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-black?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-green?style=flat-square)](#-privacy-first)

---

## ⚡ Highlights

- **100% Deterministic:** The same name always summons the exact same creature, identity, traits, and colors across any device, forever.
- **14 Ancient Mythologies:** Lore, titles, and anatomy influenced by Greek, Norse, Egyptian, Japanese (Yōkai), Celtic, Aztec, Hindu, Mesopotamian, Chinese, Slavic, Filipino, Persian, African, and Malay traditions.
- **3D Pixel-Voxel Engine:** Powered by Three.js, rendering modular pixelated voxel creatures with real-time idle animations (breathing, blinking, hovering, tail sways) and dramatic summon sequences.
- **Card Generator & Export:** Composites high-resolution pixel art trading cards with monster statistics, mythology seals, rarity emblems, and embedded QR codes.
- **Zero Server Footprint / 100% Client-Side:** Names never leave your browser. All generation, rendering, and card assembly happen locally on your GPU and CPU.

---

## 🧬 How It Works (The Pipeline)

```
[ Input Name ]
      │
      ▼
[ Unicode NFKC Normalization ]
      │
      ▼
[ xmur3 String Hash ] ──► Seed Hex (Stable 64-bit ID)
      │
      ▼
[ sfc32 128-bit PRNG ]
      │
      ├──► Identity & Lore (Mythology, Titles, Rarity, Traits)
      ├──► Color Palettes (Body, Eyes, Horns, Background)
      └──► Monster Genotype (Body, Head, Limbs, Mutations)
      │
      ▼
[ Three.js Pixel-Voxel Rig ] ──► Canvas Render (168×168 Res)
      │
      ▼
[ Procedural Bestiary Card ] ──► PNG Export / Clipboard / Mobile Share
```

1. **Normalization & Seeding:** Names are normalized via Unicode NFKC (stripping symbols while preserving international character accents). The normalized string is passed into the `xmur3` hash function to initialize an `sfc32` pseudo-random number generator (PRNG).
2. **Genotype Synthesis:** The PRNG deterministically rolls for:
   - Primary and secondary mythology affinities
   - Body archetypes (tall, blob, barrel, serpent, quadruped, floating, hunched, shell)
   - Feature anatomy: heads, horns, eyes, mouths, wings, appendages, ears, tails, and back fins/spikes
   - Mutations & Rarity (Common, Uncommon, Rare, Mythic, Forbidden)
3. **Procedural 3D Construction:** The genotype drives a modular Three.js scene that constructs the creature's voxel geometry, attaches bone pivots, configures lighting, and runs real-time animation rigs.
4. **Pixelization & Shading:** Rendered offscreen at fixed pixel resolution (168×168) with nearest-neighbor scaling for authentic retro fidelity.

---

## 🏛️ Supported Mythologies

| Mythology | Signature Influence |
| :--- | :--- |
| **Greek** | Chimeras, Gorgons, Hydras, Harpies, Minotaurs |
| **Norse** | Jötnar, Lindworms, Fenrir-kin, Draugr, Valkyrie crests |
| **Japanese** | Yōkai, Oni horns, Kitsune tails, Tengu masks, Ayakashi |
| **Egyptian** | Anubian jackals, Scarabs, Serpopards, Solar discs, Sphinxes |
| **Celtic** | Fomorians, Púca horns, Kelpie manes, Sídhe wisps |
| **Mesoamerican**| Feathered serpents (Quetzalcoatl), Nagual beasts, Ahuizotl |
| **Hindu** | Asuras, Nagas, Garuda feathers, Multi-limbed celestial avatars |
| **Mesopotamian**| Lamassu wings, Tiamat brood, Anzû talons, Pazuzu heads |
| **Chinese** | Pixiu, Qilin horns, Lung dragons, Taotie maws |
| **Slavic** | Likho eyes, Zmey heads, Leshy foliage, Kikimora claws |
| **Filipino** | Tikbalang hooves, Bakunawa scales, Manananggal wings |
| **Persian** | Simurgh plumes, Manticore spines, Div horns |
| **African** | Grootslang coils, Impundulu feathers, Popobawa silhouettes |
| **Malay** | Toyol eyes, Garuda crests, Penasahan coils |

---

## 💎 Rarity & Mutations

Each summon rolls for an overall rarity tier that dictates visual aura, color palette exclusivity, and structural anomalies:

- **COMMON** (Standard spawn)
- **UNCOMMON** (Refined palettes and secondary mythology influences)
- **RARE** (Unusual silhouettes and exotic back ornaments)
- **MYTHIC** (Intense auras, celestial palettes, and divine titles)
- **FORBIDDEN** (Rare aberrant genetic mutations)

### Genetic Mutations:
- `six_eyes` / `one_giant_eye` / `crown_of_eyes`
- `floating_head` / `two_faces` / `skeletal_face`
- `enormous_horns` / `asymmetric_horns`
- `wings_for_arms` / `many_arms` / `detached_hands`
- `halo` / `glowing_markings` / `extra_jaw`

---

## 🔒 Privacy-First

- **No Remote Telemetry or Tracking:** Your names, inputs, and history are never logged to an external database or server.
- **Local Storage Only:** Recent summons are stored purely inside your browser's local storage for your convenience.
- **Sharable URLs:** Monster configurations are encoded directly into clean URL parameters (`?name=...`), meaning links work entirely standalone on client devices.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5.9](https://www.typescriptlang.org/)
- **3D & Animation:** [Three.js](https://threejs.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool:** [Vite 7](https://vitejs.dev/)
- **Typography:** [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) & [VT323](https://fonts.google.com/specimen/VT323)
- **Utilities:** `qrcode` (for share cards), `clsx`, `tailwind-merge`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/) or `pnpm` / `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/mythkin.git
   cd mythkin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Building for Production

Compile the optimized production bundle:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## 📁 Directory Structure

```
src/
├── cards/               # Canvas compositing for printable/sharable trading cards
│   └── exportCard.ts    # Card layout, QR code rendering, and high-res export
├── components/          # Reusable UI widgets, buttons, toasts, and icons
├── data/                # Static lookup tables and presets
├── generator/           # Deterministic procedural generation logic
│   ├── generateIdentity.ts # Mythology mapping, titles, descriptions & stats
│   ├── generateMonster.ts  # Phenotype / anatomical trait generation
│   ├── mythology.ts        # Lore databases for all 14 ancient mythologies
│   ├── rng.ts              # xmur3 hashing & sfc32 128-bit PRNG
│   └── types.ts            # Genotype, mutation, mythology, & rarity types
├── monster/             # Three.js 3D voxel engine & animation
│   ├── MonsterCanvas.tsx   # React Three.js viewport & canvas capture hooks
│   ├── animate.ts          # Skeletal animation cycles (idle, breathe, blink)
│   ├── background.ts       # Procedural background canvas painter
│   └── buildMonster.ts     # 3D modular voxel geometry & rig builder
├── share/               # Web Share API, clipboard, and URL helpers
├── storage/             # LocalStorage persistence for recent summons
├── App.tsx              # Main application flow, summoning views, and hero input
├── index.css            # Retro pixel CSS utilities and scanline filters
└── main.tsx             # Application bootstrap
```

---

## 👤 Author

Created by **Drane**.

---

## 📜 License

Distributed under the [MIT License](LICENSE). Feel free to inspect, fork, and build your own procedural mythologies!
