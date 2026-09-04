// Deterministic hashing + PRNG. Never touch Math.random in the generator.

export function normalizeInput(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    // strip punctuation / symbols but keep letters, numbers, marks and spaces
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// xmur3 string hash -> 32-bit seed generator
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// sfc32 PRNG
export function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Master seed hex derived from the normalized input. Stable forever. */
export function seedHex(normalized: string): string {
  const h = xmur3(normalized);
  const a = h().toString(16).padStart(8, "0");
  const b = h().toString(16).padStart(8, "0");
  return (a + b).toUpperCase();
}

export class Rng {
  private next: () => number;
  constructor(seedString: string) {
    const h = xmur3(seedString);
    this.next = sfc32(h(), h(), h(), h());
    // warm up
    for (let i = 0; i < 12; i++) this.next();
  }
  float(): number {
    return this.next();
  }
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  weighted<T extends string>(weights: Partial<Record<T, number>>): T {
    const entries = Object.entries(weights) as [T, number][];
    const total = entries.reduce((s, [, w]) => s + (w ?? 0), 0);
    let r = this.next() * total;
    for (const [k, w] of entries) {
      r -= w ?? 0;
      if (r <= 0) return k;
    }
    return entries[entries.length - 1][0];
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}

/** Sub-seeded RNG: each domain gets an independent stream. */
export function subRng(masterSeed: string, domain: string): Rng {
  return new Rng(`${masterSeed}:${domain}`);
}
