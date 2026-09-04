import { useEffect, useRef, useState } from 'react';
import { FORMATS, renderCard, type CardData, type CardFormat, type CardOptions } from '../cards/exportCard';
import { Icon } from './Icon';
import { canNativeShare, copyCanvasToClipboard, downloadCanvas, nativeShare } from '../share/nativeShare';

interface Props { data: CardData; onClose: () => void; toast: (message: string) => void }

export function CardModal({ data, onClose, toast }: Props) {
  const [opts, setOpts] = useState<CardOptions>({ template: 'archive', format: 'square', showLore: true, showTraits: true, showMythology: true, showQR: true });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const cardRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    renderCard(data, opts).then((canvas) => {
      if (!alive) return;
      cardRef.current = canvas; setPreview(canvas.toDataURL('image/png')); setBusy(false);
    }).catch(() => { if (alive) { setBusy(false); toast('Could not render card'); } });
    return () => { alive = false; };
  }, [data, opts, toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const slug = `${data.genotype.identity.generatedName.toLowerCase()}-${data.displayName.toLowerCase().replace(/\s+/g, '-')}`;
  const set = <K extends keyof CardOptions>(key: K, value: CardOptions[K]) => setOpts((current) => ({ ...current, [key]: value }));
  const doDownload = () => { if (cardRef.current) { downloadCanvas(cardRef.current, `${slug}-${opts.format}.png`); toast('Archive card downloaded'); } };
  const doCopy = async () => { if (cardRef.current) toast((await copyCanvasToClipboard(cardRef.current)) ? 'Archive card copied' : 'Clipboard blocked — use download'); };
  const doShare = async () => {
    if (!cardRef.current) return;
    const ok = await nativeShare({ title: `${data.genotype.identity.generatedName} — my name monster`, text: `${data.displayName} hides ${data.genotype.identity.generatedName}, ${data.genotype.identity.title}. Find yours:`, url: data.url, canvas: cardRef.current, filename: `${slug}.png` });
    if (!ok) doDownload();
  };

  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} role='dialog' aria-modal='true' aria-label='Create a share card' aria-busy={busy} onClick={(event) => event.stopPropagation()} className='modal-shell'>
        <div className='modal-grid'>
          <div className='modal-preview'>
            <div className='modal-preview-frame'>
              {preview ? <img src={preview} alt={`Archive card preview for ${data.genotype.identity.generatedName}`} className={busy ? 'is-busy' : ''} /> : <div className='p-10 text-center font-pixel text-[10px] text-neutral-500'>Rendering archive…</div>}
            </div>
          </div>
          <div className='modal-controls'>
            <div className='modal-heading'>
              <div><div className='modal-title'>Build your archive card</div><div className='render-note mt-2'>A collectible record of the creature bound to your name.</div></div>
              <button className='close-button' onClick={onClose} aria-label='Close'><Icon name='close' size={17} /></button>
            </div>
            <fieldset>
              <legend className='control-legend'>Format</legend>
              <div className='segmented-control'>
                {FORMATS.map((format) => <button key={format.id} onClick={() => set('format', format.id as CardFormat)} aria-pressed={opts.format === format.id} className='segment-button'>{format.label}<span className='block mt-1 text-[0.7rem] opacity-50'>{format.w} × {format.h}</span></button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend className='control-legend'>Include</legend>
              <div className='toggle-list'>
                {([['showLore', 'Lore'], ['showTraits', 'Traits'], ['showMythology', 'Lineage'], ['showQR', 'QR code']] as const).map(([key, label]) => <label key={key} className='toggle-row'><input type='checkbox' checked={opts[key]} onChange={(event) => set(key, event.target.checked)} /> {label}</label>)}
              </div>
            </fieldset>
            <div className='modal-actions'>
              <button className='btn btn-primary w-full' disabled={busy} onClick={doDownload}>Download PNG <span className='btn-icon'><Icon name='download' /></span></button>
              <div className='grid grid-cols-2 gap-2'>
                <button className='btn btn-ghost' disabled={busy} onClick={doCopy}><Icon name='image' /> Copy</button>
                {canNativeShare() && <button className='btn btn-ghost' disabled={busy} onClick={doShare}><Icon name='share' /> Share</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
