import type { CSSProperties } from 'react';
import type { MonsterGenotype } from '../generator/types';
import '../motion/ritual.css';

/** The page's own mark and palette carry through the loading state. */
export function SummonRitual({ genotype, visible }: { genotype: MonsterGenotype | null; visible: boolean }) {
  if (!visible) return null;
  const duration = Math.max(650, genotype?.visual?.summon.duration ?? 1500);
  return <div className="mk-ritual" style={{ '--mk-ritual-duration': `${duration}ms` } as CSSProperties} aria-hidden="true">
    <div className="mk-ritual-halo" />
    <svg className="mk-ritual-drawing" viewBox="0 0 200 250" fill="none" stroke="currentColor" strokeWidth=".8">
      <g className="mk-ritual-orbit">
        <ellipse cx="100" cy="126" rx="66" ry="83" strokeDasharray="3 12" />
      </g>
      <g className="mk-ritual-mark">
        <path d="m100 22 4 7-4 7-4-7Z" />
        <path d="M100 44V55M100 197V208M31 126H40M160 126H169" opacity=".55" />
        <path d="M49 72a69 85 0 0 0 0 108M151 72a69 85 0 0 1 0 108" />
      </g>
    </svg>
    <span className="mk-ritual-label">Summoning…</span>
  </div>;
}
