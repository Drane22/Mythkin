import * as THREE from 'three';
import type { PaintedCreature } from './catalog';
import { deformPoint, skinWeights, type PaintedMotion } from './motion';

export function paintedMesh(art: PaintedCreature, image: HTMLImageElement) {
  // Extra rows/columns around the eyes preserve painted lids during a blink.
  const xs = new Set(Array.from({ length: 81 }, (_, i) => i / 80));
  const ys = new Set(Array.from({ length: 101 }, (_, i) => i / 100));
  for (const eye of art.rig.eyes) for (let i = -6; i <= 6; i++) {
    xs.add(eye[0] + i * .003); ys.add(eye[1] + i * .002);
  }
  const columns = [...xs].sort((a, b) => a - b), rows = [...ys].sort((a, b) => a - b);
  const positions = new Float32Array(columns.length * rows.length * 3);
  const uvs = new Float32Array(columns.length * rows.length * 2);
  const points: { x: number; y: number; weights: ReturnType<typeof skinWeights> }[] = [];
  const indices: number[] = [];
  for (const [row, y] of rows.entries()) for (const [col, x] of columns.entries()) {
    const i = row * columns.length + col;
    points.push({ x, y, weights: skinWeights(x, y, art.rig) });
    uvs[i * 2] = x; uvs[i * 2 + 1] = 1 - y;
    if (row < rows.length - 1 && col < columns.length - 1) {
      const next = i + columns.length;
      indices.push(i, next, i + 1, i + 1, next, next + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3); attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute); geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geometry.setIndex(indices);
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false;
  const out = { x: 0, y: 0 }, scale = .87;
  const update = (motion: PaintedMotion, reveal = 1) => {
    for (const [i, point] of points.entries()) {
      deformPoint(point.x, point.y, point.weights, art.rig, motion, out);
      // Keep a generous margin around hands/horns, preserving the source aspect.
      positions[i * 3] = (out.x - .5) * 2 * scale;
      positions[i * 3 + 1] = (.5 - out.y) * 2.5 * scale - .015;
      positions[i * 3 + 2] = 0;
    }
    attribute.needsUpdate = true;
    material.opacity = reveal;
  };
  return { mesh, update, dispose: () => { geometry.dispose(); material.dispose(); texture.dispose(); } };
}
