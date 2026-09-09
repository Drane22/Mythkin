import { useEffect, useRef, useState } from 'react';
import { FORMATS, renderCard, type CardData, type CardFormat, type CardOptions } from '../cards/exportCard';
import { useModalFocus } from '../hooks/useModalFocus';
import { Icon } from './Icon';
import { canvasToBlob, copyCanvasToClipboard, downloadCanvas, shareCardFile } from '../share/nativeShare';

interface Props {
  data: CardData;
  onClose: () => void;
  toast: (message: string) => void;
}

export function CardModal({ data, onClose, toast }: Props) {
  const [options, setOptions] = useState<CardOptions>({ template: 'clean', format: 'portrait' });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [preview, setPreview] = useState('');
  const [shareNote, setShareNote] = useState('');
  const fileRef = useRef<File | null>(null);
  const cardRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    setError(false);
    cardRef.current = null;
    fileRef.current = null;
    setShareNote('');
    renderCard(data, options)
      .then(async (canvas) => {
        const blob = await canvasToBlob(canvas);
        if (!alive) return;
        cardRef.current = canvas;
        fileRef.current = new File([blob], `${data.genotype.identity.generatedName}-${options.format}.png`, { type: 'image/png' });
        setPreview(canvas.toDataURL('image/png'));
        setBusy(false);
      })
      .catch(() => {
        if (!alive) return;
        setBusy(false);
        setError(true);
        setPreview('');
      });
    return () => { alive = false; };
  }, [data, options, retry]);

  useModalFocus(dialogRef, onClose);

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
    if (!fileRef.current) return;
    const result = await shareCardFile(fileRef.current, data.genotype.identity.generatedName);
    if (result === 'unsupported') setShareNote('This browser cannot share images directly. Copy the card, then paste it into your social app.');
    else if (result === 'failed') setShareNote('Sharing did not finish. Try again, or copy the card into your social app.');
    else setShareNote('');
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
                <div className="modal-title">Share your Mythkin</div>
                <div className="render-note mt-2">Choose a format, then share the card to an app.</div>
              </div>
              <button className="close-button" onClick={onClose} aria-label="Close"><Icon name="close" size={17} /></button>
            </div>

            <fieldset>
              <legend className="control-legend">Format</legend>
              <div className="segmented-control">
                {FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => { setBusy(true); cardRef.current = null; setOptions((current) => ({ ...current, format: format.id as CardFormat })); }}
                    aria-pressed={options.format === format.id}
                    className="segment-button"
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {error && <div className="card-error" role="alert">The card could not be rendered. <button className="text-button" onClick={() => setRetry(n => n + 1)}>Try again</button></div>}
            {shareNote && <p className="render-note mt-4" role="status">{shareNote}</p>}
            <div className="modal-actions">
              <button className="button button-primary w-full" disabled={busy || error} onClick={share}>Share card to an app</button>
              <div className="grid grid-cols-2 gap-2">
                <button className="button button-secondary" disabled={busy || error} onClick={copy}>Copy card</button>
                <button className="button button-secondary" disabled={busy || error} onClick={download}>Download PNG</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
