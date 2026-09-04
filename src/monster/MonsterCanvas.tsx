import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import type { MonsterGenotype } from "../generator/types";
import { buildMonster, type AnimRig } from "./buildMonster";
import { applyAnimation } from "./animate";
import { paintBackground } from "./background";

export const RENDER_RES = 168; // internal pixel resolution (square)
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

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const MonsterCanvas = forwardRef<MonsterCanvasHandle, Props>(function MonsterCanvas(
  { genotype, summonToken, onAssembled, showBackground = true, className },
  ref,
) {
  const glRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const [webglError, setWebglError] = useState(false);
  const stateRef = useRef<{
    renderer?: THREE.WebGLRenderer; scene?: THREE.Scene; camera?: THREE.PerspectiveCamera;
    rig?: AnimRig; dispose?: () => void; startTime: number; assembled: boolean; time: number;
  }>({ startTime: 0, assembled: false, time: 0 });
  const onAssembledRef = useRef(onAssembled);
  onAssembledRef.current = onAssembled;

  useImperativeHandle(ref, () => ({
    capture: () => {
      const s = stateRef.current;
      if (!s.renderer || !s.scene || !s.camera || !s.rig) return null;
      // settle the pose: fully assembled, eyes open
      applyAnimation(s.rig, genotypeRef.current.idle, { assemble: 1, time: 0.25, reducedMotion: true });
      s.rig.eyes.forEach((e) => (e.group.scale.y = 1));
      s.renderer.render(s.scene, s.camera);
      const out = document.createElement("canvas");
      out.width = RENDER_RES; out.height = RENDER_RES;
      const ctx = out.getContext("2d")!;
      ctx.drawImage(s.renderer.domElement, 0, 0);
      return out;
    },
    captureBackground: () => {
      const out = document.createElement("canvas");
      out.width = BG_RES; out.height = BG_RES;
      paintBackground(out.getContext("2d")!, BG_RES, BG_RES, genotype);
      return out;
    },
  }), [genotype]);

  // renderer lifecycle
  useEffect(() => {
    const host = glRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.width = RENDER_RES; canvas.height = RENDER_RES;
    canvas.className = "pixelated absolute inset-0 h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: "low-power" });
    } catch {
      setWebglError(true);
      canvas.remove();
      // still reveal the identity text so the experience degrades gracefully
      window.setTimeout(() => onAssembledRef.current?.(), 400);
      return;
    }
    renderer.setPixelRatio(1);
    renderer.setSize(RENDER_RES, RENDER_RES, false);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    camera.position.set(0, 2.1, 10.5);
    camera.lookAt(0, 1.65, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(2.5, 4, 3.5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(-3, 1, -2); scene.add(fill);
    const s = stateRef.current;
    s.renderer = renderer; s.scene = scene; s.camera = camera;

    let raf = 0;
    let last = performance.now();
    const reduced = prefersReducedMotion();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      s.time += dt;
      if (s.rig) {
        const dur = reduced ? 300 : 1500;
        const assemble = s.startTime === 0 ? 1 : Math.min(1, (now - s.startTime) / dur);
        applyAnimation(s.rig, genotypeRef.current.idle, { assemble, time: s.time, reducedMotion: reduced });
        if (assemble >= 1 && !s.assembled) { s.assembled = true; onAssembledRef.current?.(); }
        renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      s.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      s.renderer = undefined; s.rig = undefined;
    };
  }, []);

  const genotypeRef = useRef(genotype);
  genotypeRef.current = genotype;

  // build creature whenever genotype changes; restart summon when token changes
  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;
    if (s.rig) { s.scene.remove(s.rig.root); s.dispose?.(); }
    const { rig, dispose } = buildMonster(genotype);
    s.rig = rig; s.dispose = dispose;
    s.scene.add(rig.root);
    s.startTime = performance.now();
    s.assembled = false;
    // background
    const bg = bgRef.current;
    if (bg) { bg.width = BG_RES; bg.height = BG_RES; paintBackground(bg.getContext("2d")!, BG_RES, BG_RES, genotype); }
  }, [genotype, summonToken]);

  return (
    <div className={`relative aspect-square w-full overflow-hidden ${className ?? ""}`} role="img"
      aria-label={`${genotype.identity.generatedName}, ${genotype.identity.classification.toLowerCase()}: a pixel creature with ${genotype.anatomy.eyes.count} eyes, ${genotype.anatomy.armCount} arms and ${genotype.anatomy.legCount} legs.`}>
      <canvas ref={bgRef} className="pixelated absolute inset-0 h-full w-full" style={{ opacity: showBackground ? 1 : 0 }} aria-hidden />
      <div ref={glRef} className="absolute inset-0" />
      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center font-mono text-xs uppercase tracking-widest text-neutral-300">
          Your browser could not open the summoning circle (WebGL unavailable). The creature still exists — its name, title and lore are below.
        </div>
      )}
    </div>
  );
});
