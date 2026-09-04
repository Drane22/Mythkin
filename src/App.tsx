import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateMonster } from "./generator/generateMonster";
import { MYTHOLOGIES } from "./generator/mythology";
import { GENERATION_VERSION, type Rarity } from "./generator/types";
import { MonsterCanvas, type MonsterCanvasHandle } from "./monster/MonsterCanvas";
import { Sigil } from "./components/Sigil";
import { CardModal } from "./components/CardModal";
import { WhyModal } from "./components/WhyModal";
import { buildShareUrl, clearShareUrl, parseShareUrl, pushShareUrl } from "./share/shareUrl";
import { canNativeShare, copyCanvasToClipboard, copyText, downloadCanvas, nativeShare } from "./share/nativeShare";
import { loadHistory, pushHistory } from "./storage/history";
import { RANDOM_INPUTS } from "./data/randomNames";
import { renderMonsterImage, type CardData } from "./cards/exportCard";

type Phase = "landing" | "summoning" | "result";

const RARITY_STYLE: Record<Rarity, string> = {
  COMMON: "text-neutral-300 border-neutral-600",
  UNCOMMON: "text-[#7fd67f] border-[#3f7a3f]",
  RARE: "text-[#6fa8ff] border-[#31558f]",
  MYTHIC: "text-[#d98cff] border-[#7a3f99]",
  FORBIDDEN: "text-[#ff5c5c] border-[#993030]",
};

export default function App() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [input, setInput] = useState("");
  const [name, setName] = useState<string>(""); // committed display name
  const [activeName, setActiveName] = useState<string>(""); // name currently built in the canvas (delayed for sigil)
  const [summonToken, setSummonToken] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [fromShare, setFromShare] = useState(false);
  const canvasRef = useRef<MonsterCanvasHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number>(0);

  const genotype = useMemo(() => (activeName ? generateMonster(activeName) : null), [activeName]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  const summon = useCallback((raw: string, opts?: { shared?: boolean }) => {
    const trimmed = raw.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setName(trimmed);
    setInput(trimmed);
    setRevealed(false);
    setPhase("summoning");
    setFromShare(!!opts?.shared);
    setHistory(pushHistory(trimmed));
    pushShareUrl(trimmed);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => { setActiveName(trimmed); setSummonToken((t) => t + 1); }, reduced ? 100 : 650);
  }, []);

  // boot: history + shared link
  useEffect(() => {
    setHistory(loadHistory());
    const shared = parseShareUrl();
    if (shared) {
      if (shared.version !== GENERATION_VERSION) showToast(`This link is from generation v${shared.version}; showing v${GENERATION_VERSION}.`);
      summon(shared.name, { shared: true });
    }
  }, [summon, showToast]);

  const onAssembled = useCallback(() => { setPhase("result"); window.setTimeout(() => setRevealed(true), 120); }, []);

  const reset = () => {
    setPhase("landing"); setActiveName(""); setName(""); setInput(""); setRevealed(false); setFromShare(false);
    clearShareUrl();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const randomName = () => {
    // random *input*; the monster is still fully deterministic for that input
    const pick = RANDOM_INPUTS[Math.floor(Math.random() * RANDOM_INPUTS.length)];
    summon(pick);
  };

  const buildCardData = (): CardData | null => {
    if (!genotype) return null;
    const monster = canvasRef.current?.capture();
    const background = canvasRef.current?.captureBackground();
    if (!monster || !background) { showToast("Creature not ready yet"); return null; }
    return { genotype, displayName: name, monster, background, url: buildShareUrl(name) };
  };

  const shareUrl = name ? buildShareUrl(name) : "";
  const slug = genotype ? `${genotype.identity.generatedName.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, "-")}` : "monster";

  const actionCopyLink = async () => showToast((await copyText(shareUrl)) ? "Link copied" : "Could not copy link");
  const actionCopyImage = async () => { const d = buildCardData(); if (!d) return; showToast((await copyCanvasToClipboard(renderMonsterImage(d))) ? "Image copied" : "Clipboard blocked — try download"); };
  const actionDownload = () => { const d = buildCardData(); if (!d) return; downloadCanvas(renderMonsterImage(d), `${slug}.png`); showToast("Image downloaded"); };
  const actionShare = async () => {
    const d = buildCardData(); if (!d) return;
    const ok = await nativeShare({ title: `${genotype!.identity.generatedName} — the monster in "${name}"`, text: `"${name}" hides ${genotype!.identity.generatedName}, ${genotype!.identity.title} (${genotype!.identity.rarity}). What's in your name?`, url: shareUrl, canvas: renderMonsterImage(d), filename: `${slug}.png` });
    if (!ok) actionCopyLink();
  };

  const id = genotype?.identity;
  const myth = genotype ? MYTHOLOGIES[genotype.mythology.primary] : null;
  const myth2 = genotype?.mythology.secondary ? MYTHOLOGIES[genotype.mythology.secondary] : null;

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* header */}
      <header className="flex items-center justify-between px-5 py-4">
        <button onClick={reset} className="font-pixel text-[10px] uppercase tracking-[0.3em] text-neutral-400 hover:text-white" aria-label="Mythkin home">▣ Mythkin</button>
        <span className="font-mono text-base uppercase tracking-widest text-neutral-600">gen v{GENERATION_VERSION}</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
        {phase === "landing" && (
          <section className="anim-rise flex w-full max-w-xl flex-col items-center gap-8 text-center">
            <h1 className="font-pixel text-lg leading-[1.9] text-white sm:text-2xl sm:leading-[1.8]">
              What monster<br />hides in your name?
            </h1>
            <form className="flex w-full flex-col items-center gap-4" onSubmit={(e) => { e.preventDefault(); summon(input); }}>
              <label htmlFor="name" className="sr-only">Enter your name</label>
              <input ref={inputRef} id="name" autoFocus autoComplete="off" spellCheck={false} maxLength={64} value={input} onChange={(e) => setInput(e.target.value)}
                className="input-pixel" placeholder="ENTER YOUR NAME" />
              <button type="submit" className="btn btn-primary w-full sm:w-64">Summon</button>
              <button type="button" onClick={randomName} className="font-mono text-xl uppercase tracking-[0.25em] text-neutral-400 underline-offset-4 hover:text-white hover:underline">Random name</button>
            </form>
            {history.length > 0 && (
              <div className="w-full">
                <div className="font-pixel mb-3 text-[9px] uppercase tracking-[0.3em] text-neutral-600">Recent summons</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {history.map((h) => <button key={h} className="btn-tiny" onClick={() => summon(h)}>{h}</button>)}
                </div>
              </div>
            )}
          </section>
        )}

        {phase !== "landing" && (
          <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
            {/* creature */}
            <div className="relative mx-auto w-full max-w-[min(92vw,680px)] lg:max-w-none">
              <div className="scanlines relative border-2 border-neutral-800 bg-[#07060a]">
                {genotype ? (
                  <MonsterCanvas ref={canvasRef} genotype={genotype} summonToken={summonToken} onAssembled={onAssembled} />
                ) : (
                  <div className="aspect-square w-full" />
                )}
                <Sigil color={genotype?.palette.accent ?? "#ffe14d"} visible={phase === "summoning"} label={fromShare ? "Someone sent you a monster" : "Summoning"} />
              </div>
              <div className="font-mono mt-2 flex justify-between text-base uppercase tracking-widest text-neutral-600">
                <span>{genotype?.background.replace("_", " ")}</span>
                <span>{genotype ? `seed ${genotype.seed.slice(0, 6)}` : ""}</span>
              </div>
            </div>

            {/* identity */}
            <div className={`flex flex-col items-center gap-5 text-center transition-opacity duration-700 lg:items-start lg:text-left ${revealed ? "opacity-100" : "opacity-0"}`} aria-live="polite">
              {id && genotype && (
                <>
                  <div>
                    <div className="font-pixel text-[11px] uppercase tracking-[0.3em] text-neutral-400">{name}</div>
                    <h2 className="font-pixel mt-3 text-2xl uppercase leading-snug text-white sm:text-3xl">{id.generatedName}</h2>
                    <div className="font-mono mt-2 text-2xl text-[#ffe14d]">{id.title}</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <span className={`font-pixel border px-3 py-2 text-[10px] tracking-widest ${RARITY_STYLE[id.rarity]}`}>{id.rarity}</span>
                    <span className="font-pixel border border-neutral-800 px-3 py-2 text-[10px] tracking-widest text-neutral-300">{id.classification}</span>
                    {id.archetype && <span className="font-pixel border border-neutral-800 px-3 py-2 text-[10px] tracking-widest text-neutral-500">ARCHETYPE: {id.archetype}</span>}
                  </div>
                  <div className="font-mono text-xl uppercase tracking-[0.2em] text-neutral-300">{id.traits.join(" • ")}</div>
                  <div className="font-mono text-lg uppercase tracking-[0.2em] text-neutral-500">{myth?.short}{myth2 ? ` / ${myth2.short}` : ""}</div>
                  <p className="font-mono max-w-md text-2xl leading-tight text-neutral-200">{id.lore}</p>

                  <div className="mt-2 grid w-full max-w-md grid-cols-2 gap-2">
                    <button className="btn btn-primary col-span-2" onClick={() => setCardData(buildCardData())}>Create share card</button>
                    <button className="btn btn-ghost" onClick={actionShare}>{canNativeShare() ? "Share" : "Share link"}</button>
                    <button className="btn btn-ghost" onClick={actionCopyLink}>Copy link</button>
                    <button className="btn btn-ghost" onClick={actionCopyImage}>Copy image</button>
                    <button className="btn btn-ghost" onClick={actionDownload}>Download</button>
                    <button className="btn btn-ghost col-span-2" onClick={reset}>Try another name</button>
                  </div>
                  <button onClick={() => setWhyOpen(true)} className="font-mono text-lg uppercase tracking-[0.25em] text-neutral-500 underline-offset-4 hover:text-white hover:underline">Why this monster?</button>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="font-mono px-5 py-4 text-center text-base uppercase tracking-widest text-neutral-600">
        Names are generated locally and aren't uploaded. One name, one monster, forever.
      </footer>

      {toast && <div role="status" className="font-pixel fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 border-2 border-white bg-black px-4 py-3 text-[10px] uppercase tracking-widest text-white">{toast}</div>}
      {cardData && <CardModal data={cardData} onClose={() => setCardData(null)} toast={showToast} />}
      {whyOpen && genotype && <WhyModal genotype={genotype} onClose={() => setWhyOpen(false)} />}
    </div>
  );
}
