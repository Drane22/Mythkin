/** Fixed 128 × 160 art grid. No gradients, filters or per-pixel radius-squared loops. */
export function habitatBrush(ctx: CanvasRenderingContext2D) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
  };
  const poly = (points: readonly (readonly [number, number])[], color: string) => {
    ctx.fillStyle = color; ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
    ctx.closePath(); ctx.fill();
  };
  const line = (x: number, y: number, endX: number, endY: number, color: string, width = 1) => {
    if (x === endX) { rect(x, Math.min(y,endY), width, Math.abs(endY-y)+width, color); return; }
    if (y === endY) { rect(Math.min(x,endX), y, Math.abs(endX-x)+width, width, color); return; }
    const length = Math.max(1, Math.ceil(Math.max(Math.abs(endX - x), Math.abs(endY - y))));
    for (let i = 0; i <= length; i++) rect(x + (endX - x) * i / length, y + (endY - y) * i / length, width, width, color);
  };
  const disc = (x: number, y: number, radius: number, color: string) => {
    for (let row = -Math.ceil(radius); row <= radius; row++) {
      const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - row * row)));
      if (Math.abs(row) <= radius) rect(x - half, y + row, half * 2 + 1, 1, color);
    }
  };
  return { rect, poly, line, disc };
}
export type HabitatBrush = ReturnType<typeof habitatBrush>;
