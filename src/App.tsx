import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { generateMonster } from './generator/generateMonster';
import { MYTHOLOGIES } from './generator/mythology';
import { GENERATION_VERSION } from './generator/types';
import { MonsterCanvas, type MonsterCanvasHandle } from './monster/MonsterCanvas';
import { BackgroundSigils } from './components/BackgroundSigils';
import { Sigil } from './components/Sigil';
import { CardModal } from './components/CardModal';
import { WhyModal } from './components/WhyModal';
import { buildShareUrl, clearShareUrl, parseShareUrl, pushShareUrl } from './share/shareUrl';
import { canNativeShare, copyCanvasToClipboard, copyText, downloadCanvas, nativeShare } from './share/nativeShare';
import { loadHistory, pushHistory } from './storage/history';
import { RANDOM_INPUTS } from './data/randomNames';
import { renderMonsterImage, type CardData } from './cards/exportCard';

type Phase = 'landing' | 'summoning' | 'result';

export default function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [activeName, setActiveName] = useState('');
  const [summonToken, setSummonToken] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [fromShare, setFromShare] = useState(false);
  const canvasRef = useRef<MonsterCanvasHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number>(0);

  const genotype = useMemo(() => activeName ? generateMonster(activeName) : null, [activeName]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2200);
  }, []);

  const summon = useCallback((raw: string, opts?: { shared?: boolean }) => {
    const trimmed = raw.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setName(trimmed);
    setInput(trimmed);
    setRevealed(false);
    setPhase('summoning');
    setFromShare(!!opts?.shared);
    setHistory(pushHistory(trimmed));
    pushShareUrl(trimmed);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      setActiveName(trimmed);
      setSummonToken((token) => token + 1);
    }, reduced ? 100 : 650);
  }, []);

  useEffect(() => {
    setHistory(loadHistory());
    const shared = parseShareUrl();
    if (shared) {
      if (shared.version !== GENERATION_VERSION) showToast('This link is from generation v' + shared.version + '; showing v' + GENERATION_VERSION + '.');
      summon(shared.name, { shared: true });
    }
  }, [showToast, summon]);

  const onAssembled = useCallback(() => {
    setPhase('result');
    window.setTimeout(() => setRevealed(true), 120);
  }, []);

  const reset = () => {
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
    return { genotype, displayName: name, monster, background, url: buildShareUrl(name) };
  };

  const shareUrl = name ? buildShareUrl(name) : '';
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
  const actionShare = async () => {
    const data = buildCardData();
    if (!data || !genotype) return;
    const ok = await nativeShare({
      title: genotype.identity.generatedName + ' - the monster in "' + name + '"',
      text: '"' + name + '" hides ' + genotype.identity.generatedName + ', ' + genotype.identity.title + '. What hides in yours?',
      url: shareUrl,
      canvas: renderMonsterImage(data),
      filename: slug + '.png',
    });
    if (!ok) actionCopyLink();
  };

  const id = genotype?.identity;
  const myth = genotype ? MYTHOLOGIES[genotype.mythology.primary] : null;
  const myth2 = genotype?.mythology.secondary ? MYTHOLOGIES[genotype.mythology.secondary] : null;
  const accentStyle = genotype ? ({ '--accent': genotype.palette.accent } as CSSProperties) : undefined;

  return (
    <div className="app-shell">
      <BackgroundSigils />

      <header className="site-header">
        <button onClick={reset} className="brand" aria-label="Mythkin home"><span aria-hidden="true">&#9670;</span> Mythkin</button>
        <span className="version">gen v{GENERATION_VERSION}</span>
      </header>

      <main className="site-main">
        {phase === 'landing' && (
          <section className="home">
            <div className="home-glyph" aria-hidden="true">&#9671;</div>
            <h1>What monster<br />hides in your name?</h1>
            <p>Enter a name. Summon the creature bound to it.</p>

            <form className="summon-form" onSubmit={(event) => { event.preventDefault(); summon(input); }}>
              <label htmlFor="name" className="sr-only">Enter your name</label>
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
                placeholder="ENTER YOUR NAME"
              />
              <button type="submit" className="button button-primary">Summon</button>
            </form>

            <button type="button" onClick={randomName} className="text-button">Try a random name</button>

            {history.length > 0 && (
              <div className="history">
                <div className="section-label">Recent summons</div>
                <div className="history-list">
                  {history.map((item) => <button key={item} onClick={() => summon(item)}>{item}</button>)}
                </div>
              </div>
            )}
          </section>
        )}

        {phase !== 'landing' && (
          <section className="result-grid" style={accentStyle}>
            <div className="creature-column">
              <div className="creature-frame scanlines">
                {genotype
                  ? <MonsterCanvas ref={canvasRef} genotype={genotype} summonToken={summonToken} onAssembled={onAssembled} />
                  : <div className="aspect-square w-full" />}
                <Sigil color={genotype?.palette.accent ?? '#ffe14d'} visible={phase === 'summoning'} label={fromShare ? 'A creature was sent to you' : 'Summoning'} />
              </div>
              <div className="creature-caption">
                <span>{genotype?.background.replace('_', ' ')}</span>
                <span>Tap the creature</span>
              </div>
            </div>

            <article className="monster-card" data-revealed={revealed} aria-live="polite">
              {id && genotype && (
                <>
                  <div className="bound-name">Hidden in {name}</div>
                  <h2>{id.generatedName}</h2>
                  <div className="monster-title">{id.title}</div>

                  <div className="card-meta">
                    <span>{id.rarity}</span>
                    <span>{myth?.short}{myth2 ? ' / ' + myth2.short : ''}</span>
                  </div>

                  <div className="trait-list">
                    {id.traits.slice(0, 2).map((trait) => <span key={trait}>{trait}</span>)}
                  </div>

                  <p className="monster-lore">{id.lore}</p>

                  <div className="primary-actions">
                    <button className="button button-primary" onClick={() => setCardData(buildCardData())}>Create card</button>
                    <button className="button button-secondary" onClick={actionShare}>{canNativeShare() ? 'Share' : 'Share link'}</button>
                  </div>

                  <div className="utility-actions" aria-label="More actions">
                    <button onClick={actionCopyLink}>Copy link</button>
                    <button onClick={actionCopyImage}>Copy image</button>
                    <button onClick={actionDownload}>Download</button>
                    <button onClick={() => setWhyOpen(true)}>Why this monster?</button>
                  </div>

                  <button onClick={reset} className="new-summon">Summon another name</button>
                </>
              )}
            </article>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>Generated locally. One name, one monster, forever.</span>
        <span>Made by Drane</span>
      </footer>

      {toast && <div role="status" className="toast">{toast}</div>}
      {cardData && <CardModal data={cardData} onClose={() => setCardData(null)} toast={showToast} />}
      {whyOpen && genotype && <WhyModal genotype={genotype} onClose={() => setWhyOpen(false)} />}
    </div>
  );
}
