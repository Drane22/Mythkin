export interface Gaze { x: number; y: number; }
export function pointerGaze(x: number, y: number, rect: { left: number; top: number; width: number; height: number }): Gaze {
  const clamp = (n: number) => Math.max(-1, Math.min(1, n));
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  return { x: clamp((x - rect.left - rect.width / 2) / (rect.width * .65)), y: clamp((rect.top + rect.height / 2 - y) / (rect.height * .65)) };
}
export function easeGaze(current: Gaze, target: Gaze, dt: number): Gaze {
  const blend = 1 - Math.exp(-9 * Math.max(0, dt));
  return { x: current.x + (target.x - current.x) * blend, y: current.y + (target.y - current.y) * blend };
}
