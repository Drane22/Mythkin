import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateMonster } from './generator/generateMonster';
import { MYTHOLOGIES } from './generator/mythology';
import { GENERATION_VERSION } from './generator/types';
import { MonsterCanvas, type MonsterCanvasHandle } from './monster/MonsterCanvas';
import { Sigil } from './components/Sigil';
import { Icon } from './components/Icon';
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
    window.setTimeout(() => { setActiveName(trimmed); setSummonToken((token) => token + 1); }, reduced ? 100 : 650);
  }, []);

  useEffect(() => {
    setHistory(loadHistory());
    const shared = parseShareUrl();
    if (shared) {
      if (shared.version !== GENERATION_VERSION) showToast(`This link is from generation v${shared.version}; showing v${GENERATION_VERSION}.`);
      summon(shared.name, { shared: true });
    }
  }, [showToast, summon]);

  const onAssembled = useCallback(() => { setPhase('result'); window.setTimeout(() => setRevealed(true), 120); }, []);

  const reset = () => {
    setPhase('landing'); setActiveName(''); setName(''); setInput(''); setRevealed(false); setFromShare(false);
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
  const slug = genotype ? `${genotype.identity.generatedName.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}` : 'monster';
  const actionCopyLink = async () => showToast((await copyText(shareUrl)) ? 'Link copied' : 'Could not copy link');
  const actionCopyImage = async () => { const data = buildCardData(); if (!data) return; showToast((await copyCanvasToClipboard(renderMonsterImage(data))) ? 'Image copied' : 'Clipboard blocked — try download'); };
  const actionDownload = () => { const data = buildCardData(); if (!data) return; downloadCanvas(renderMonsterImage(data), `${slug}.png`); showToast('Image downloaded'); };
  const actionShare = async () => {
    const data = buildCardData(); if (!data || !genotype) return;
    const ok = await nativeShare({ title: `${genotype.identity.generatedName} — the monster in '${name}'`, text: `'${name}' hides ${genotype.identity.generatedName}, ${genotype.identity.title} (${genotype.identity.rarity}). What's in your name?`, url: shareUrl, canvas: renderMonsterImage(data), filename: `${slug}.png` });
    if (!ok) actionCopyLink();
  };

  const id = genotype?.identity;
  const myth = genotype ? MYTHOLOGIES[genotype.mythology.primary] : null;
  const myth2 = genotype?.mythology.secondary ? MYTHOLOGIES[genotype.mythology.secondary] : null;

  return (
    <div className='archive-shell flex min-h-screen flex-col'>
      <header className='archive-header flex items-center justify-between'>
        <button onClick={reset} className='brand-mark' aria-label='Mythkin home'>Mythkin</button>
        <div className='flex items-center gap-3'>
          <span className='archive-label hidden px-3 py-2 sm:inline-flex'>Local bestiary</span>
          <span className='version-chip'>gen v{GENERATION_VERSION}</span>
        </div>
      </header>

      <main className='archive-main flex-1'>
        {phase === 'landing' && (
          <section className='landing-stage text-center'>
            <span className='eyebrow'>Private mythology archive / entry 001</span>
            <h1 className='landing-title'>Every name has a creature.<br />Give yours a shape.</h1>
            <p className='landing-copy'>One name. One deterministic mythological specimen. Rendered locally and kept yours forever.</p>
            <div className='summon-shell'>
              <div className='summon-core'>
                <div className='input-label'><label htmlFor='name'>Specimen name</label><span>{input.length}/64</span></div>
                <div className='input-frame'>
                  <input ref={inputRef} id='name' autoFocus autoComplete='off' spellCheck={false} maxLength={64} value={input} onChange={(event) => setInput(event.target.value)} className='input-pixel' placeholder='Type a name' />
                </div>
                <div className='mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row'>
                  <button type='button' onClick={() => summon(input)} className='btn btn-primary w-full sm:w-auto'>Summon <span className='btn-icon'><Icon name='arrow-up-right' /></span></button>
                  <button type='button' onClick={randomName} className='text-action inline-flex items-center gap-2'><Icon name='spark' size={16} /> Random name</button>
                </div>
              </div>
            </div>
            {history.length > 0 && (
              <div className='history-wrap'>
                <div className='history-title'>Recent summons</div>
                <div className='history-list'>{history.map((item) => <button key={item} className='history-chip' onClick={() => summon(item)}>{item}</button>)}</div>
              </div>
            )}
          </section>
        )}

        {phase !== 'landing' && (
          <section className='result-layout'>
            <div className='stage-wrap'>
              <div className='stage-shell'>
                <div className='stage-core scanlines'>
                  {genotype ? <MonsterCanvas ref={canvasRef} genotype={genotype} summonToken={summonToken} onAssembled={onAssembled} /> : <div className='aspect-square w-full' />}
                  <Sigil color={genotype?.palette.accent ?? '#e29a59'} visible={phase === 'summoning'} label={fromShare ? 'Someone sent you a monster' : 'Summoning'} />
                </div>
              </div>
              <div className='stage-caption'><span>{genotype?.background.replace('_', ' ')}</span><span>{genotype ? `seed ${genotype.seed.slice(0, 6)}` : ''}</span></div>
            </div>

            <div className='dossier-shell result-dossier' data-revealed={revealed} aria-live='polite'>
              {id && genotype && (
                <div className='dossier-core'>
                  <span className='archive-label inline-flex px-3 py-2'>Specimen dossier</span>
                  <div className='dossier-name'>Bound to '{name}'</div>
                  <h2 className='dossier-title'>{id.generatedName}</h2>
                  <div className='dossier-epithet'>{id.title}</div>
                  <div className='tag-row'>
                    <span className='archive-tag' style={{ color: genotype.palette.accent }}>{id.rarity}</span>
                    <span className='archive-tag'>{id.classification}</span>
                    {id.archetype && <span className='archive-tag'>Near {id.archetype}</span>}
                  </div>
                  <div className='dossier-traits'><span className='text-[#6f6b66]'>Traits / </span>{id.traits.join(' · ')}</div>
                  <div className='dossier-lineage'><span style={{ color: genotype.palette.accent }}>Lineage / </span>{myth?.short}{myth2 ? ` · ${myth2.short}` : ''}</div>
                  <p className='dossier-lore'>{id.lore}</p>
                  <div className='dossier-divider' />
                  <div className='dossier-actions'>
                    <button className='btn btn-primary' onClick={() => setCardData(buildCardData())}>Build archive card <span className='btn-icon'><Icon name='arrow-up-right' /></span></button>
                    <button className='btn btn-ghost' onClick={actionShare}><Icon name='share' /> {canNativeShare() ? 'Share' : 'Share link'}</button>
                    <button className='btn btn-ghost' onClick={actionCopyLink}><Icon name='link' /> Copy link</button>
                  </div>
                  <div className='utility-row'>
                    <button className='utility-button' onClick={actionCopyImage}><Icon name='image' size={16} /> Copy image</button>
                    <button className='utility-button' onClick={actionDownload}><Icon name='download' size={16} /> Download</button>
                  </div>
                  <div className='flex flex-wrap items-center justify-between gap-4'>
                    <button onClick={() => setWhyOpen(true)} className='why-link'><Icon name='shield' size={15} /> Decode specimen</button>
                    <button onClick={reset} className='why-link'><Icon name='refresh' size={15} /> New summon</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className='archive-footer'>Names are generated locally and are never uploaded. One name, one monster, forever.</footer>
      {toast && <div role='status' className='toast'>{toast}</div>}
      {cardData && <CardModal data={cardData} onClose={() => setCardData(null)} toast={showToast} />}
      {whyOpen && genotype && <WhyModal genotype={genotype} onClose={() => setWhyOpen(false)} />}
    </div>
  );
}
