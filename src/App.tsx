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
import { copyCanvasToClipboard, copyText, downloadCanvas } from './share/nativeShare';
import { loadHistory, pushHistory } from './storage/history';
import { RANDOM_INPUTS } from './data/randomNames';
import { renderMonsterImage, type CardData } from './cards/exportCard';

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
  const [fromShare, setFromShare] = useState(false);
  const canvasRef = useRef<MonsterCanvasHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const summonTimer = useRef<number>(0);
  const revealTimer = useRef<number>(0);
  const previewGenotype = useMemo(() => generateMonster('Moonling'), []);
  const toastTimer = useRef<number>(0);

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
    setFromShare(!!opts?.shared);
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
    setFromShare(false);
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

  const shareUrl = name ? buildShareUrl(name, generationVersion) : '';
  const slug = genotype ? genotype.identity.generatedName.toLowerCase() + '-' + name.toLowerCase().replace(/\s+/g, '-') : 'monster';
  const actionCopyLink = async () => showToast((await copyText(shareUrl)) ? 'Link copied' : 'Could not copy link');
  const actionCopyImage = async () => {
    const data = buildCardData();
    if (!data) return;
    showToast((await copyCanvasToClipboard(renderMonsterImage(data))) ? 'Image copied' : 'Clipboard blocked - try download');
  };
  const actionDownload = () => {
    const data = buildCardData();
    if (!data) return;
    downloadCanvas(renderMonsterImage(data), slug + '.png');
    showToast('Image downloaded');
  };

  const id = genotype?.identity;
  const myth = genotype ? MYTHOLOGIES[genotype.mythology.primary] : null;
  const myth2 = genotype?.mythology.secondary ? MYTHOLOGIES[genotype.mythology.secondary] : null;
  const accentStyle = genotype ? ({ '--accent': '#b98aff' } as CSSProperties) : undefined;

  return (
    <div className="app-shell">
      <BackgroundSigils /><div className="cave-shapes" aria-hidden="true"><i /><i /><i /></div>

      <header className="site-header">
        <button onClick={reset} className="brand" aria-label="Mythkin home"><span aria-hidden="true">&#9670;</span> Mythkin</button>
        <nav aria-label="Main navigation"><button className="text-button" onClick={reset}>Summon a Mythkin</button><a href="#how-it-works">How it works</a></nav>
      </header>

      <main className="site-main">
        {phase === 'landing' && (
          <section className="home">
            <div className="home-copy">

            <h1>What creature<br />hides in your name?</h1>
            <p className="home-intro">Enter a name. Meet the creature it becomes.</p>

            <form className="summon-form" onSubmit={(event) => { event.preventDefault(); summon(input); }}>
              <label htmlFor="name" className="input-label">What should we call you?</label>
              <input
                ref={inputRef}
                id="name"
                autoFocus
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

            <button type="button" onClick={randomName} className="text-button">Surprise me with a name</button>

            <p className="privacy-note">No account needed. Your name stays on your device.</p>
            {history.length > 0 && (
              <div className="history">
                <div className="section-label">Recent summons</div>
                <div className="history-list">
                  {history.map((item) => <button key={item} onClick={() => summon(item)}>{item}</button>)}
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
              <div className="creature-caption">
                <span>{phase === 'summoning' ? (fromShare ? 'Summoning the shared creature...' : 'Summoning...') : 'Drag to rotate. Tap to react.'}</span>
              </div>
            </div>

            <article className="monster-card" data-revealed={revealed} aria-live="polite">
              {id && genotype && (
                <>
                  <div className="bound-name">Hidden in {name}</div>
                  <h2>{id.generatedName}</h2>
                  <div className="monster-title">{id.title}</div>

                  <div className="card-meta">
                    <span className="rarity-badge">&#10022; {id.rarity}</span>
                    <span>{myth?.short}{myth2 ? ' / ' + myth2.short : ''}</span>
                  </div>

                  <div className="trait-list">
                    {id.traits.slice(0, 2).map((trait) => <span key={trait}>{trait}</span>)}
                  </div>

                  <div className="lore-heading">Lore</div><p className="monster-lore">{id.lore}</p>

                  <div className="primary-actions">
                    <button className="button button-primary" onClick={() => setCardData(buildCardData())}>Create collectible card <span aria-hidden="true">&#8599;</span></button>
                    <button className="button button-secondary" onClick={() => setCardData(buildCardData())}>Share</button>
                  </div>

                  <div className="utility-actions" aria-label="More actions">
                    <button onClick={actionCopyLink}>Copy link</button>
                    <button onClick={actionCopyImage}>Copy image</button>
                    <button onClick={actionDownload}>Save creature PNG</button>
                    <button onClick={() => setWhyOpen(true)}>Why this monster?</button>
                  </div>

                  <button onClick={reset} className="new-summon">Summon another name</button>
                </>
              )}
            </article>
          </section>
        )}
      </main>
      <section id="how-it-works" className="quiet-about">
        <h2>One name. One creature.</h2>
        <p>Each name creates its own anatomy, mythology, and story. Drag to look around, tap to interact, or share its card.</p>
      </section>
      <footer className="site-footer">
        <span>Generated on your device.</span>
        <span>Made by Drane</span>
      </footer>

      {toast && <div role="status" className="toast">{toast}</div>}
      {cardData && <CardModal data={cardData} onClose={() => setCardData(null)} toast={showToast} />}
      {whyOpen && genotype && <WhyModal genotype={genotype} onClose={() => setWhyOpen(false)} />}
    </div>
  );
}
