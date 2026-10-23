import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MonsterCanvasHandle, MonsterCanvasProps } from '../monster/MonsterCanvas';
import type { PaintedCreature } from './catalog';
import { paintedMesh } from './mesh';
import { paintedMotion } from './motion';
import { paintStage } from './stage';
import './painted.css';

const WIDTH = 800, HEIGHT = 1000;
type Props = MonsterCanvasProps & { art: PaintedCreature };

export const PaintedCanvas = forwardRef<MonsterCanvasHandle, Props>(function PaintedCanvas(
  { genotype, art, summonToken, onAssembled, showBackground = true, className }, ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const assembledRef = useRef(onAssembled); assembledRef.current = onAssembled;
  const captureRef = useRef<(() => HTMLCanvasElement | null) | null>(null);
  const interaction = useRef({ target: 0, current: 0, time: 0, reactionAt: -Infinity, ready: false });
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'static'>('loading');
  const [reacting, setReacting] = useState(false);
  const reactionTimer = useRef(0);

  useImperativeHandle(ref, () => ({
    capture: () => captureRef.current?.() ?? null,
    captureBackground: () => {
      const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
      paintStage(canvas.getContext('2d')!, WIDTH, HEIGHT); return canvas;
    },
  }), []);

  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current, bg = backgroundRef.current;
    if (!host || !canvas || !bg) return;
    let disposed = false, frame = 0, scene: THREE.Scene | undefined, renderer: THREE.WebGLRenderer | undefined;
    let puppet: ReturnType<typeof paintedMesh> | undefined;
    let inView = true, complete = false, time = 0, previous = performance.now(), lastRender = -Infinity, reducedWasDrawn = false;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = query.matches;
    const state = interaction.current;
    Object.assign(state, { target: 0, current: 0, time: 0, reactionAt: -Infinity, ready: false });
    setStatus('loading'); setReacting(false); captureRef.current = null;
    bg.width = WIDTH; bg.height = HEIGHT; paintStage(bg.getContext('2d')!, WIDTH, HEIGHT);
    const image = new Image(); image.decoding = 'async';
    const camera = new THREE.OrthographicCamera(-1, 1, 1.25, -1.25, .1, 10); camera.position.z = 2;
    const phase = (parseInt(genotype.seed.slice(0, 6), 16) % 1000) / 173;
    const finish = () => {
      if (complete || disposed) return;
      complete = true; state.ready = true; host.dataset.assembled = 'true'; assembledRef.current?.();
    };
    const onMotion = () => { reduced = query.matches; reducedWasDrawn = false; };
    query.addEventListener('change', onMotion);
    const observer = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? true; }); observer.observe(host);

    const draw = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(draw);
      const dt = Math.min(.05, (now - previous) / 1000); previous = now;
      if (document.hidden || !inView) return;
      if (reduced && reducedWasDrawn && complete) return;
      time += dt; state.time = time;
      // 30 fps is sufficient for restrained painted motion and halves mobile work.
      if (now - lastRender < 1000 / 30 && !reduced) return;
      lastRender = now;
      state.current += (state.target - state.current) * .14;
      const reveal = reduced ? 1 : Math.min(1, Math.max(0, (time - .15) / 1.1));
      const motion = paintedMotion(time, phase, state.current, time - state.reactionAt, reduced);
      puppet!.update(motion, 1 - (1 - reveal) ** 3);
      renderer!.render(scene!, camera);
      if (reduced || time >= 2.6) finish();
      reducedWasDrawn = reduced;
    };

    image.onload = () => {
      if (disposed) return;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(1); renderer.setSize(WIDTH, HEIGHT, false); renderer.setClearColor(0, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        scene = new THREE.Scene(); puppet = paintedMesh(art, image); scene.add(puppet.mesh);
        puppet.update(paintedMotion(0, 0, 0, Infinity, true), reduced ? 1 : 0);
        renderer.render(scene, camera);
        captureRef.current = () => {
          if (!state.ready) return null;
          puppet!.update(paintedMotion(0, 0, 0, Infinity, true)); renderer!.render(scene!, camera);
          const out = document.createElement('canvas'); out.width = WIDTH; out.height = HEIGHT;
          out.getContext('2d')!.drawImage(canvas, 0, 0); return out;
        };
        setStatus('ready'); previous = performance.now(); frame = requestAnimationFrame(draw);
      } catch {
        // The authored painting remains available on devices without WebGL.
        captureRef.current = () => {
          const out = document.createElement('canvas'); out.width = WIDTH; out.height = HEIGHT;
          out.getContext('2d')!.drawImage(image, WIDTH * .065, HEIGHT * .071, WIDTH * .87, HEIGHT * .87); return out;
        };
        setStatus('static'); finish();
      }
    };
    image.onerror = () => { if (!disposed) { setStatus('error'); finish(); } };
    image.src = art.url;
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); query.removeEventListener('change', onMotion);
      window.clearTimeout(reactionTimer.current); image.onload = null; image.onerror = null;
      puppet?.dispose(); renderer?.dispose(); renderer?.forceContextLoss();
      captureRef.current = null; state.ready = false; delete host.dataset.assembled;
    };
  }, [art, genotype.seed, summonToken, retry]);

  const react = () => {
    const state = interaction.current;
    if (!state.ready || status !== 'ready' || state.time - state.reactionAt < .4) return;
    state.reactionAt = state.time; setReacting(true);
    window.clearTimeout(reactionTimer.current); reactionTimer.current = window.setTimeout(() => setReacting(false), 1400);
  };
  return (
    <div ref={hostRef} className={`monster-canvas painted-canvas aspect-square w-full overflow-hidden ${className ?? ''}`}
      data-art={art.id} data-art-status={status} data-reacting={reacting} role="group" aria-label={`${genotype.identity.generatedName}, an animated painted ${genotype.identity.classification}.`}>
      <canvas ref={backgroundRef} className="painted-background" style={{ opacity: showBackground ? 1 : 0 }} aria-hidden="true" />
      <canvas ref={canvasRef} className="painted-character" style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }} aria-hidden="true" />
      {status === 'static' && <img src={art.url} className="painted-static" alt="" />}
      {(status === 'ready' || status === 'static') && <button type="button" className="monster-hit-target"
        onPointerMove={event => { if (event.pointerType !== 'touch') { const rect = event.currentTarget.getBoundingClientRect(); interaction.current.target = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)); } }}
        onPointerLeave={() => { interaction.current.target = 0; }} onBlur={() => { interaction.current.target = 0; }} onClick={react}
        aria-label={`${genotype.identity.generatedName}: tap to react. Enter or Space also reacts.`} />}
      {status === 'error' && <div className="painted-error" role="alert"><p>The artwork couldn’t load.</p><button type="button" className="button button-secondary" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
    </div>
  );
});
