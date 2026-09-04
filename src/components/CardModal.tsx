import { useEffect, useRef, useState } from 'react';
import { FORMATS, renderCard, type CardData, type CardFormat, type CardOptions } from '../cards/exportCard';
import { Icon } from './Icon';
import { canNativeShare, copyCanvasToClipboard, downloadCanvas, nativeShare } from '../share/nativeShare';

interface Props {
  data: CardData;
  onClose: () => void;
  toast: (message: string) => void;
}

export function CardModal({ data, onClose, toast }: Props) {
  const [options, setOptions] = useState<CardOptions>({ template: 'clean', format: 'square' });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const cardRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    renderCard(data, options)
      .then((canvas) => {
        if (!alive) return;
        cardRef.current = canvas;
        setPreview(canvas.toDataURL('image/png'));
        setBusy(false);
      })
      .catch(() => {
        if (!alive) return;
        setBusy(false);
        toast('Could not render card');
      });
    return () => { alive = false; };
  }, [data, options, toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const slug = `${data.genotype.identity.generatedName.toLowerCase()}-${data.displayName.toLowerCase().replace(/\s+/g, '-')}`;
  const download = () => {
    if (!cardRef.current) return;
    downloadCanvas(cardRef.current, `${slug}-${options.format}.png`);
    toast('Card downloaded');
  };
  const copy = async () => {
    if (!cardRef.current) return;
    toast((await copyCanvasToClipboard(cardRef.current)) ? 'Card copied' : 'Clipboard blocked — use download');
  };
  const share = async () => {
    if (!cardRef.current) return;
    const ok = await nativeShare({
      title: `${data.genotype.identity.generatedName} — my name monster`,
      text: `${data.displayName} hides ${data.genotype.identity.generatedName}, ${data.genotype.identity.title}. Find yours:`,
      url: data.url,
      canvas: cardRef.current,
      filename: `${slug}.png`,
    });
    if (!ok) download();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Create a share card"
        aria-busy={busy}
        onClick={(event) => event.stopPropagation()}
        className="modal-shell"
      >
        <div className="modal-grid">
          <div className="modal-preview">
            <div className="modal-preview-frame">
              {preview
                ? <img src={preview} alt={`Card preview for ${data.genotype.identity.generatedName}`} className={busy ? 'is-busy' : ''} />
                : <div className="font-pixel text-[9px] uppercase tracking-[0.2em] text-neutral-500">Rendering…</div>}
            </div>
          </div>

          <div className="modal-controls">
            <div className="modal-heading">
              <div>
                <div className="modal-title">Create your card</div>
                <div className="render-note mt-2">A clean portrait of the creature hidden in your name.</div>
              </div>
              <button className="close-button" onClick={onClose} aria-label="Close"><Icon name="close" size={17} /></button>
            </div>

            <fieldset>
              <legend className="control-legend">Format</legend>
              <div className="segmented-control">
                {FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setOptions((current) => ({ ...current, format: format.id as CardFormat }))}
                    aria-pressed={options.format === format.id}
                    className="segment-button"
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="modal-actions">
              <button className="button button-primary w-full" disabled={busy} onClick={download}>Download PNG</button>
              <div className={canNativeShare() ? 'grid grid-cols-2 gap-2' : 'grid'}>
                <button className="button button-secondary" disabled={busy} onClick={copy}>Copy</button>
                {canNativeShare() && <button className="button button-secondary" disabled={busy} onClick={share}>Share</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
