import { useEffect, useRef } from 'react';
import type { MonsterGenotype } from '../generator/types';
import { MYTHOLOGIES } from '../generator/mythology';
import { MUTATION_LABELS } from '../generator/generateIdentity';
import { Icon } from './Icon';

interface Props {
  genotype: MonsterGenotype;
  onClose: () => void;
}

export function WhyModal({ genotype: g, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const primary = MYTHOLOGIES[g.mythology.primary];
  const secondary = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : undefined;
  const borrowed = g.anatomy.borrowed;
  const rows: [string, string][] = [
    ['Origin', primary.label.toUpperCase()],
    ['Secondary', secondary ? `${secondary.label.toUpperCase()}${borrowed.length ? ` (${borrowed.join(', ')})` : ''}` : 'NONE'],
    ['Shape', `${g.anatomy.body.toUpperCase()} BODY · ${g.anatomy.head.toUpperCase()} HEAD`],
    ['Anatomy', `${g.anatomy.eyes.count} EYES · ${g.anatomy.armCount} ARMS · ${g.anatomy.legCount} LEGS`],
    ['Mutation', g.anatomy.mutations.length ? g.anatomy.mutations.map((mutation) => MUTATION_LABELS[mutation]).join(', ') : 'NONE'],
    ['Rarity', g.identity.rarity],
    ['Seed', `${g.seed.slice(0, 6)} · GENERATION V${g.version}`],
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Why this monster"
        onClick={(event) => event.stopPropagation()}
        className="modal-shell why-panel"
      >
        <div className="modal-heading">
          <div>
            <div className="modal-title">Why this monster?</div>
            <div className="render-note mt-2">The name always produces the same creature.</div>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close"><Icon name="close" size={17} /></button>
        </div>
        <p className="why-tendency">{g.identity.tendency}</p>
        <dl className="why-list">
          {rows.map(([key, value]) => (
            <div key={key} className="why-row">
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="why-note">Capitalisation and punctuation are ignored; spaces matter. Nothing is uploaded.</p>
      </div>
    </div>
  );
}
