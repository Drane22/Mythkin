import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MonsterGenotype } from '../generator/types';
import { buildMonster, type AnimRig } from './buildMonster';
import { applyAnimation } from './animate';
import { initialReaction, pokeReaction, REACTION_DURATION, type ReactionRuntime } from './reaction';
import { pointerGaze, easeGaze } from './gaze';
import { dragOrbit, isRotationDrag } from './orbit';
import { paintBackground } from './background';

export const RENDER_RES = 256;
const BG_RES = 96;

export interface MonsterCanvasHandle {
  /** Captures the creature on a transparent canvas at internal resolution. */
  capture: () => HTMLCanvasElement | null;
  /** Captures the pixel background at low res. */
  captureBackground: () => HTMLCanvasElement | null;
}

interface Props {
  genotype: MonsterGenotype;
  /** bump this to replay the summon assembly */
  summonToken: number;
  onAssembled?: () => void;
  showBackground?: boolean;
  className?: string;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;


export const MonsterCanvas = forwardRef<MonsterCanvasHandle, Props>(function MonsterCanvas(
  { genotype, summonToken, onAssembled, showBackground = true, className },
  ref,
) {
  const glRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const orbitRef = useRef({ yaw: 0, pitch: 0 });
  const dragRef = useRef<{ id: number; x: number; y: number; yaw: number; pitch: number; moved: boolean } | null>(null);
  const gazeRef = useRef({ x: 0, y: 0, target: { x: 0, y: 0 }, until: Infinity });
  const reactionTimer = useRef<number>(0);
  const [webglError, setWebglError] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const stateRef = useRef<{
    renderer?: THREE.WebGLRenderer; scene?: THREE.Scene; camera?: THREE.PerspectiveCamera;
    rig?: AnimRig; dispose?: () => void; startTime: number; assembled: boolean; time: number; reaction: ReactionRuntime;
  }>({ startTime: 0, assembled: false, time: 0, reaction: initialReaction() });
  const onAssembledRef = useRef(onAssembled);
  const genotypeRef = useRef(genotype);
  onAssembledRef.current = onAssembled;
  genotypeRef.current = genotype;

  const triggerReaction = useCallback((direction: number) => {
    const s = stateRef.current;
    if (!s.assembled || !s.rig) return;
    const now = s.time;
    const next = pokeReaction(s.reaction, now, direction);
    if (next === s.reaction) return;
    s.reaction = next;
    setIsReacting(true);
    window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setIsReacting(false), REACTION_DURATION * 1000);
  }, []);

  useImperativeHandle(ref, () => ({
    capture: () => {
      const s = stateRef.current;
      if (!s.renderer || !s.scene || !s.camera || !s.rig) return null;
      applyAnimation(s.rig, genotypeRef.current.idle, { assemble: 1, time: s.time, reducedMotion: true, reaction: { age: 1, intensity: 0, anger: 0, direction: 1 } });
      s.rig.eyes.forEach((e) => (e.group.scale.y = 1));
      s.renderer.render(s.scene, s.camera);
      const out = document.createElement('canvas');
      out.width = RENDER_RES; out.height = 320;
      out.getContext('2d')!.drawImage(s.renderer.domElement, 0, 0);
      return out;
    },
    captureBackground: () => {
      const out = document.createElement('canvas');
      out.width = BG_RES; out.height = BG_RES;
      paintBackground(out.getContext('2d')!, BG_RES, BG_RES, genotype);
      return out;
    },
  }), [genotype]);

  // renderer lifecycle
  useEffect(() => {
    const host = glRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.width = RENDER_RES; canvas.height = 320;
    canvas.className = 'pixelated absolute inset-0 h-full w-full';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    } catch {
      setWebglError(true);
      canvas.remove();
      const fallbackTimer = window.setTimeout(() => onAssembledRef.current?.(), 400);
      return () => window.clearTimeout(fallbackTimer);
    }
    renderer.setPixelRatio(1);
    renderer.setSize(RENDER_RES, 320, false);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, .8, 0.1, 100);
    camera.position.set(0, 2.1, 10.5);
    camera.lookAt(0, 1.65, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(2.5, 4, 3.5); scene.add(key);key.name="portrait-key";
    const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(-3, 1, -2); scene.add(fill);
    const s = stateRef.current;
    s.renderer = renderer; s.scene = scene; s.camera = camera;

    let raf = 0;
    let last = performance.now();
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = prefersReducedMotion();
    const updateMotion = () => { reduced = motionQuery.matches; };
    motionQuery.addEventListener('change', updateMotion);
    let inView = true;
    const observer = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? true; });
    observer.observe(host);
    const gaze = gazeRef.current;
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !inView || reduced || dragRef.current) return;
      gaze.target = pointerGaze(event.clientX, event.clientY, host.getBoundingClientRect());
      gaze.until = Infinity;
    };
    const rest = () => { gaze.target = { x: 0, y: 0 }; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', rest);
    document.documentElement.addEventListener('pointerleave', rest);
    let activeElapsed = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (document.hidden || !inView) return;
      s.time += dt;
      if(bgRef.current && genotypeRef.current.visual && (!reduced || s.time < .1) && Math.floor(s.time*12)!==Math.floor((s.time-dt)*12))paintBackground(bgRef.current.getContext('2d')!,BG_RES,BG_RES,genotypeRef.current,reduced?0:s.time);
      if (s.time > gaze.until || reduced) gaze.target = { x: 0, y: 0 };
      const nextGaze = easeGaze(gaze, gaze.target, dt);
      gaze.x = nextGaze.x; gaze.y = nextGaze.y;
      if (!s.assembled) activeElapsed += dt;
      if (s.rig) {
        const dur = reduced ? 300 : genotypeRef.current.visual?.summon.duration ?? 1500;
        if (s.startTime > 0) { activeElapsed = 0; s.startTime = 0; }
        const assemble = reduced ? 1 : Math.min(1, activeElapsed * 1000 / dur);
        if (s.reaction.lastHit > -Infinity) s.reaction.anger = Math.max(0, s.reaction.anger - dt * 0.11);
        const reaction = s.reaction.lastHit > -Infinity ? {
          age: Math.max(0, s.time - s.reaction.lastHit), intensity: 1,
          anger: s.reaction.anger, direction: s.reaction.direction, kind: s.reaction.kind,
        } : undefined;
        applyAnimation(s.rig, genotypeRef.current.idle, { assemble, time: s.time, reducedMotion: reduced, reaction, gaze });
        if (assemble >= 1 && !s.assembled) { s.assembled = true; onAssembledRef.current?.(); }
        const orbit = orbitRef.current;
        const pitch = orbit.pitch + 0.043;
        camera.position.set(Math.sin(orbit.yaw) * Math.cos(pitch) * 10.5, 1.65 + Math.sin(pitch) * 10.5, Math.cos(orbit.yaw) * Math.cos(pitch) * 10.5);
        camera.lookAt(0, 1.65, 0);
        renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', rest);
      document.documentElement.removeEventListener('pointerleave', rest);
      motionQuery.removeEventListener('change', updateMotion);
      window.clearTimeout(reactionTimer.current);
      s.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      s.renderer = undefined; s.rig = undefined;
    };
  }, []);

  // build creature whenever genotype changes; restart summon when token changes
  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;
    if (s.rig) { s.scene.remove(s.rig.root); s.dispose?.(); }
    const { rig, dispose } = buildMonster(genotype);
    s.rig = rig; s.dispose = dispose;
    s.scene.add(rig.root);
    const key=s.scene.getObjectByName("portrait-key") as THREE.DirectionalLight|undefined;
    if(key)key.intensity=2*(genotype.visual?.environment.lighting??1);
    s.startTime = performance.now();
    s.assembled = false;
    s.reaction = initialReaction();
    orbitRef.current = { yaw: 0, pitch: 0 };
    dragRef.current = null;
    window.clearTimeout(reactionTimer.current);
    setIsReacting(false);
    const bg = bgRef.current;
    if (bg) { bg.width = BG_RES; bg.height = BG_RES; paintBackground(bg.getContext('2d')!, BG_RES, BG_RES, genotype); }
  }, [genotype, summonToken]);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0 || !stateRef.current.assembled) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ...orbitRef.current, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag.moved ||= isRotationDrag(dx, dy);
    if (!drag.moved) return;
    orbitRef.current = dragOrbit(drag, dx, dy, event.currentTarget.getBoundingClientRect().width, event.pointerType === 'touch');
    gazeRef.current.target = { x: 0, y: 0 };
  };
  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved || isRotationDrag(event.clientX - drag.x, event.clientY - drag.y)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    gazeRef.current.target = pointerGaze(event.clientX, event.clientY, rect);
    gazeRef.current.until = stateRef.current.time + 1.8;
    triggerReaction(event.clientX < rect.left + rect.width / 2 ? 1 : -1);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) {
      event.preventDefault();
      const orbit = orbitRef.current;
      if (event.key === 'Home') orbitRef.current = { yaw: 0, pitch: 0 };
      else if (event.key === 'ArrowLeft') orbit.yaw -= 0.2;
      else if (event.key === 'ArrowRight') orbit.yaw += 0.2;
      else orbit.pitch = Math.max(-0.3, Math.min(0.45, orbit.pitch + (event.key === 'ArrowUp' ? 0.1 : -0.1)));
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) triggerReaction(1);
  };
  return (
    <div className={`monster-canvas aspect-square w-full overflow-hidden ${className ?? ''}`} role="group" data-reacting={isReacting}
      aria-label={`${genotype.identity.generatedName}, ${genotype.identity.classification.toLowerCase()}: a pixel creature with ${genotype.anatomy.eyes.count} eyes, ${genotype.anatomy.armCount} arms and ${genotype.anatomy.legCount} legs.`}>
      <canvas ref={bgRef} className="pixelated absolute inset-0 h-full w-full" style={{ opacity: showBackground ? 1 : 0 }} aria-hidden="true" />
      <div ref={glRef} className="absolute inset-0" />
      <button type="button" className="monster-hit-target" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { dragRef.current = null; }} onLostPointerCapture={() => { dragRef.current = null; }} onKeyDown={onKeyDown} aria-label={`${genotype.identity.generatedName}: drag to rotate, tap to react. Keyboard: arrows rotate, Home resets, Enter reacts.`} />
      <button className="reset-view" onClick={() => { orbitRef.current = { yaw: 0, pitch: 0 }; }}>Reset view</button>
      {webglError && <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center font-mono text-xl uppercase tracking-widest text-neutral-300">Your browser could not open the summoning circle. The creature still exists — its name, title and lore are below.</div>}
    </div>
  );
});
