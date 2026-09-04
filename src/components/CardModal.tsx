import { useEffect, useRef, useState } from "react";
import { FORMATS, TEMPLATES, renderCard, type CardData, type CardFormat, type CardOptions, type CardTemplate } from "../cards/exportCard";
import { canNativeShare, copyCanvasToClipboard, downloadCanvas, nativeShare } from "../share/nativeShare";

interface Props { data: CardData; onClose: () => void; toast: (m: string) => void }

export function CardModal({ data, onClose, toast }: Props) {
  const [opts, setOpts] = useState<CardOptions>({ template: "bestiary", format: "square", showLore: true, showTraits: true, showMythology: true, showQR: true });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const cardRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    renderCard(data, opts).then((c) => {
      if (!alive) return;
      cardRef.current = c; setPreview(c.toDataURL("image/png")); setBusy(false);
    }).catch(() => { if (alive) { setBusy(false); toast("Could not render card"); } });
    return () => { alive = false; };
  }, [data, opts, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const slug = `${data.genotype.identity.generatedName.toLowerCase()}-${data.displayName.toLowerCase().replace(/\s+/g, "-")}`;
  const set = <K extends keyof CardOptions>(k: K, v: CardOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  const doDownload = () => { if (cardRef.current) { downloadCanvas(cardRef.current, `${slug}-${opts.template}-${opts.format}.png`); toast("Card downloaded"); } };
  const doCopy = async () => { if (cardRef.current) toast((await copyCanvasToClipboard(cardRef.current)) ? "Card copied to clipboard" : "Clipboard blocked — use download"); };
  const doShare = async () => {
    if (!cardRef.current) return;
    const ok = await nativeShare({ title: `${data.genotype.identity.generatedName} — my name monster`, text: `${data.displayName} hides ${data.genotype.identity.generatedName}, ${data.genotype.identity.title}. Find yours:`, url: data.url, canvas: cardRef.current, filename: `${slug}.png` });
    if (!ok) doDownload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Share card creator" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden border-2 border-neutral-700 bg-[#0b0a10] sm:flex-row">
        {/* preview */}
        <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-[#050408] p-4">
          {preview ? (
            <img src={preview} alt="Share card preview" className={`max-h-[60vh] max-w-full border border-neutral-800 object-contain sm:max-h-[86vh] ${busy ? "opacity-50" : ""}`} />
          ) : <div className="font-pixel text-[10px] text-neutral-500">RENDERING…</div>}
        </div>
        {/* controls */}
        <div className="flex w-full flex-col gap-4 overflow-y-auto p-4 sm:w-80">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-xs uppercase tracking-widest text-white">Share Card</h2>
            <button className="btn-tiny" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <fieldset>
            <legend className="font-pixel mb-2 text-[9px] uppercase tracking-widest text-neutral-500">Template</legend>
            <div className="grid grid-cols-2 gap-1">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => set("template", t.id as CardTemplate)} aria-pressed={opts.template === t.id}
                  className={`font-mono border px-2 py-2 text-left text-lg uppercase tracking-wider ${opts.template === t.id ? "border-white bg-white text-black" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}>{t.label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-pixel mb-2 text-[9px] uppercase tracking-widest text-neutral-500">Format</legend>
            <div className="grid grid-cols-3 gap-1">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => set("format", f.id as CardFormat)} aria-pressed={opts.format === f.id}
                  className={`font-mono border px-2 py-2 text-lg uppercase ${opts.format === f.id ? "border-white bg-white text-black" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}>{f.label}<div className="text-xs opacity-60">{f.w}×{f.h}</div></button>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid grid-cols-2 gap-x-3 gap-y-2">
            <legend className="font-pixel mb-2 text-[9px] uppercase tracking-widest text-neutral-500">Show</legend>
            {([["showLore", "Lore"], ["showTraits", "Traits"], ["showMythology", "Mythology"], ["showQR", "QR code"]] as const).map(([k, label]) => (
              <label key={k} className="font-mono flex cursor-pointer items-center gap-2 text-xl uppercase tracking-wider text-neutral-200">
                <input type="checkbox" className="h-5 w-5 accent-[#ffe14d]" checked={opts[k]} onChange={(e) => set(k, e.target.checked)} /> {label}
              </label>
            ))}
          </fieldset>
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <button className="btn btn-primary" disabled={busy} onClick={doDownload}>Download PNG</button>
            <button className="btn btn-ghost" disabled={busy} onClick={doCopy}>Copy image</button>
            {canNativeShare() && <button className="btn btn-ghost" disabled={busy} onClick={doShare}>Share…</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
