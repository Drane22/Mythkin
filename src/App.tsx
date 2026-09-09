import { BackgroundSigils } from './components/BackgroundSigils';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { generateMonster } from './generator/generateMonster';
import { MYTHOLOGIES } from './generator/mythology';
import { GENERATION_VERSION } from './generator/types';
import { MonsterCanvas, type MonsterCanvasHandle } from './monster/MonsterCanvas';
import { SummonRitual } from './components/SummonRitual';
import { CardModal } from './components/CardModal';
import { WhyModal } from './components/WhyModal';
import { buildShareUrl, clearShareUrl, parseShareUrl, pushShareUrl } from './share/shareUrl';
import { loadHistory, pushHistory } from './storage/history';
import { RANDOM_INPUTS } from './data/randomNames';
import { type CardData } from './cards/exportCard';
import './viewport.css';

type Phase = 'landing' | 'summoning' | 'result';

export default function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [activeName, setActiveName] = useState('');
  const [generationVersion, setGenerationVersion] = useState(GENERATION_VERSION);
  const [summonToken, setSummonToken] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const canvasRef = useRef<MonsterCanvasHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const summonTimer = useRef<number>(0);
  const revealTimer = useRef<number>(0);
  const previewGenotype = useMemo(() => generateMonster('Moonling'), []);
  const toastTimer = useRef<number>(0);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => {
      // Follow the keyboard's available height, but don't shrink on pinch zoom.
      if (!viewport || viewport.scale === 1) {
        const height = viewport?.height ?? window.innerHeight;
        shellRef.current?.style.setProperty('--viewport-height', `${height}px`);
        if (shellRef.current) shellRef.current.dataset.shortViewport = String(height < 420);
      }
    };
    resize();
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    return () => {
      viewport?.removeEventListener('resize', resize);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const genotype = useMemo(() => activeName ? generateMonster(activeName, generationVersion) : null, [activeName, generationVersion]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2200);
  }, []);

  const summon = useCallback((raw: string, opts?: { shared?: boolean; version?: number }) => {
    const trimmed = raw.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setName(trimmed);
    setInput(trimmed);
    setRevealed(false);
    setGenerationVersion(opts?.version ?? GENERATION_VERSION);
    setPhase('summoning');
    setHistory(pushHistory(trimmed));
    pushShareUrl(trimmed, opts?.version ?? GENERATION_VERSION);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.clearTimeout(summonTimer.current);
    window.clearTimeout(revealTimer.current);
    summonTimer.current = window.setTimeout(() => {
      setActiveName(trimmed);
      setSummonToken((token) => token + 1);
    }, reduced ? 100 : opts?.version === 1 ? 650 : 80);
  }, []);

  useEffect(() => {
    setHistory(loadHistory());
    const shared = parseShareUrl();
    if (shared) {
      summon(shared.name, { shared: true, version: shared.version });
    }
  }, [showToast, summon]);

  const onAssembled = useCallback(() => {
    setPhase('result');
    revealTimer.current = window.setTimeout(() => setRevealed(true), 120);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(summonTimer.current);
    window.clearTimeout(revealTimer.current);
    window.clearTimeout(toastTimer.current);
  }, []);

  const reset = () => {
    window.clearTimeout(summonTimer.current);
    window.clearTimeout(revealTimer.current);
    setPhase('landing');
    setActiveName('');
    setName('');
    setInput('');
    setRevealed(false);
    clearShareUrl();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const randomName = () => summon(RANDOM_INPUTS[Math.floor(Math.random() * RANDOM_INPUTS.length)]);

  const buildCardData = (): CardData | null => {
    if (!genotype) return null;
    const monster = canvasRef.current?.capture();
    const background = canvasRef.current?.captureBackground();
    if (!monster || !background) { showToast('Creature not ready yet'); return null; }
    return { genotype, displayName: name, monster, background, url: buildShareUrl(name, generationVersion) };
  };

  const id = genotype?.identity;
  const myth = genotype ? MYTHOLOGIES[genotype.mythology.primary] : null;
  const myth2 = genotype?.mythology.secondary ? MYTHOLOGIES[genotype.mythology.secondary] : null;
  const accentStyle = genotype ? ({ '--accent': '#b98aff' } as CSSProperties) : undefined;

  return (
    <div ref={shellRef} className="app-shell viewport-shell" data-phase={phase}>
      <BackgroundSigils /><div className="cave-shapes" aria-hidden="true"><i /><i /><i /></div>

      <header className="site-header" inert={!!cardData || whyOpen}>
        {phase === 'landing'
          ? <button onClick={reset} className="brand" aria-label="Mythkin home"><span aria-hidden="true">&#9670;</span> Mythkin</button>
          : <button onClick={reset} className="back-button"><span aria-hidden="true">&#8592;</span> Back</button>}
      </header>

      <main className="site-main" inert={!!cardData || whyOpen}>
        {phase === 'landing' && (
          <section className="home">
            <div className="home-copy">

            <h1>What creature<br />hides in your name?</h1>

            <form className="summon-form" onSubmit={(event) => { event.preventDefault(); summon(input); }}>
              <label htmlFor="name" className="sr-only">Your name or nickname</label>
              <input
                ref={inputRef}
                id="name"
                autoComplete="off"
                spellCheck={false}
                maxLength={64}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="name-input"
                placeholder="Your name or nickname"
              />
              <button type="submit" className="button button-primary" disabled={!input.trim()}>Summon</button>
            </form>

            <button type="button" onClick={randomName} className="text-button">Surprise me</button>

            {history.length > 0 && (
              <div className="history">
                <div className="section-label">Recent summons</div>
                <div className="history-list">
                  {history.slice(0, 3).map((item) => <button key={item} onClick={() => summon(item)}>{item}</button>)}
                </div>
              </div>
            )}
            </div>
            <aside className="hero-specimen" aria-label="An example Mythkin">
              <div className="hero-art"><MonsterCanvas genotype={previewGenotype} summonToken={0} showBackground={true} /></div>
            </aside>
          </section>
        )}

        {phase !== 'landing' && (
          <section className="result-grid" style={accentStyle}>
            <div className="creature-column">
              <div className="creature-frame">
                {genotype
                  ? <MonsterCanvas ref={canvasRef} genotype={genotype} summonToken={summonToken} onAssembled={onAssembled} showBackground={true} />
                  : <div className="aspect-square w-full" />}
                <SummonRitual genotype={genotype} visible={phase === 'summoning'} />
              </div>
              <span className="sr-only" role="status">{phase === 'summoning' ? 'Summoning your creature' : ''}</span>
            </div>

            <article className="monster-card" data-revealed={revealed} aria-live="polite">
              {id && genotype && (
                <>
                  <h2>{id.generatedName}</h2>
                  <div className="monster-title">{id.title}</div>

                  <div className="desktop-details">
                  <div className="card-meta">
                    <span className="rarity-badge">&#10022; {id.rarity}</span>
                    <span>{myth?.short}{myth2 ? ' / ' + myth2.short : ''}</span>
                  </div>

                  <div className="trait-list">
                    {id.traits.slice(0, 2).map((trait) => <span key={trait}>{trait}</span>)}
                  </div>

                  <p className="monster-lore">{id.lore}</p>
                  </div>
                </>
              )}
            </article>
            <div className="stage-actions" aria-label="Creature actions">
              <button className="button button-primary" onClick={randomName} disabled={phase === 'summoning'}>Another</button>
              <button className="button button-secondary" onClick={() => setCardData(buildCardData())} disabled={!revealed}>Share</button>
              <button className="info-button" onClick={() => setWhyOpen(true)} disabled={!revealed} aria-label="Creature information" aria-haspopup="dialog"><span aria-hidden="true">i</span></button>
            </div>
          </section>
        )}
      </main>

      {toast && <div role="status" className="toast">{toast}</div>}
      {cardData && <CardModal data={cardData} onClose={() => setCardData(null)} toast={showToast} />}
      {whyOpen && genotype && <WhyModal genotype={genotype} onClose={() => setWhyOpen(false)} />}
    </div>
  );
}
