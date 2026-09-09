export interface Orbit { yaw: number; pitch: number; }
export function dragOrbit(start: Orbit, dx: number, dy: number, width: number, touch = false): Orbit {
  const scale = Math.PI * 2 / Math.max(200, width);
  return { yaw: start.yaw - dx * scale, pitch: Math.max(-0.3, Math.min(0.45, start.pitch + (touch ? 0 : dy * scale * 0.35))) };
}
export const isRotationDrag = (dx: number, dy: number) => Math.hypot(dx, dy) > 6;
