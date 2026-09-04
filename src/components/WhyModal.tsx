import { useEffect, useRef } from 'react';
import type { MonsterGenotype } from '../generator/types';
import { MYTHOLOGIES } from '../generator/mythology';
import { MUTATION_LABELS } from '../generator/generateIdentity';
import { Icon } from './Icon';

interface Props { genotype: MonsterGenotype; onClose: () => void }

export function WhyModal({ genotype: g, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey); ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const primary = MYTHOLOGIES[g.mythology.primary];
  const secondary = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : undefined;
  const borrowed = g.anatomy.borrowed;
  const rows: [string, string][] = [
    ['Primary influence', primary.label.toUpperCase()],
    ['Secondary influence', secondary ? `${secondary.label.toUpperCase()}${borrowed.length ? ` (${borrowed.join(', ')})` : ''}` : 'NONE — a pure lineage'],
    ['Silhouette', `${g.anatomy.body.toUpperCase()} body · ${g.anatomy.head.toUpperCase()} head`],
    ['Anatomy', `${g.anatomy.eyes.count} ${g.anatomy.eyes.type} eye${g.anatomy.eyes.count === 1 ? '' : 's'} · ${g.anatomy.armCount} arms · ${g.anatomy.legCount} legs${g.anatomy.wings !== 'none' ? ` · ${g.anatomy.wings} wings` : ''}${g.anatomy.tail !== 'none' ? ` · ${g.anatomy.tail} tail` : ''}`],
    ['Mutation', g.anatomy.mutations.length ? g.anatomy.mutations.map((mutation) => MUTATION_LABELS[mutation]).join(', ') : 'NONE'],
    ['Rarity', g.identity.rarity],
    ['Seed', `${g.seed.slice(0, 6)} · generation v${g.version}`],
  ];
  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div ref={ref} tabIndex={-1} role='dialog' aria-modal='true' aria-label='Why this monster' onClick={(event) => event.stopPropagation()} className='modal-shell why-panel'>
        <div className='modal-heading'>
          <div><div className='modal-title'>Decode this specimen</div><div className='render-note mt-2'>The anatomy, lineage, and seed behind this summon.</div></div>
          <button className='close-button' onClick={onClose} aria-label='Close'><Icon name='close' size={17} /></button>
        </div>
        <p className='why-tendency'>{g.identity.tendency}</p>
        <dl className='why-list'>
          {rows.map(([key, value]) => <div key={key} className='why-row'><dt>{key}</dt><dd>{value}</dd></div>)}
        </dl>
        <p className='why-note'>The same name always summons the same creature. Capitalisation and punctuation are ignored; spaces matter. Nothing is uploaded.</p>
      </div>
    </div>
  );
}
