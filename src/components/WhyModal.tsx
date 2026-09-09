import { useRef } from 'react';
import type { MonsterGenotype } from '../generator/types';
import { MYTHOLOGIES } from '../generator/mythology';
import { MUTATION_LABELS } from '../generator/generateIdentity';
import { useModalFocus } from '../hooks/useModalFocus';
import { Icon } from './Icon';

interface Props {
  genotype: MonsterGenotype;
  onClose: () => void;
}

export function WhyModal({ genotype: g, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useModalFocus(ref, onClose);

  const primary = MYTHOLOGIES[g.mythology.primary];
  const secondary = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : undefined;
  const borrowed = g.anatomy.borrowed;
  const rows: [string, string][] = [
    ['Origin', primary.label.toUpperCase()],
    ['Secondary', secondary ? `${secondary.label.toUpperCase()}${borrowed.length ? ` (${borrowed.join(', ')})` : ''}` : 'NONE'],
    ['Shape', `${g.anatomy.body.toUpperCase()} BODY · ${g.anatomy.head.toUpperCase()} HEAD`],
    ['Anatomy', `${g.anatomy.eyes.count} EYES · ${g.anatomy.armCount} ARMS · ${g.anatomy.legCount} LEGS`],
    ['Mutation', g.anatomy.mutations.length ? g.anatomy.mutations.map((mutation) => MUTATION_LABELS[mutation]).join(', ') : 'NONE'],
    ['Skin', g.anatomy.skin.toUpperCase()],
    ['Rarity', g.identity.rarity],
    ['Seed', `${g.seed.slice(0, 6)} · GENERATION V${g.version}`],
  ];

  return (
    <div className="modal-backdrop info-backdrop" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="creature-info-title"
        onClick={(event) => event.stopPropagation()}
        className="modal-shell why-panel info-panel"
      >
        <div className="modal-heading">
          <div>
            <h2 id="creature-info-title" className="modal-title">{g.identity.generatedName}</h2>
            <p className="render-note">{g.identity.title}</p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close"><Icon name="close" size={17} /></button>
        </div>
        <div className="info-content">
        <p className="info-lore">{g.identity.lore}</p>
        <div className="trait-list">{g.identity.traits.map(trait => <span key={trait}>{trait}</span>)}</div>
        <p className="why-tendency">{g.identity.tendency}</p>
        <details className="info-anatomy"><summary>Origin &amp; anatomy</summary>
        <dl className="why-list">
          {rows.map(([key, value]) => (
            <div key={key} className="why-row">
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        </details>
        <p className="why-note">Capitalisation and punctuation are ignored; spaces matter. Nothing is uploaded.</p>
        </div>
      </div>
    </div>
  );
}
