/** Smooth low-contrast atmosphere, shared by the live portrait and exported cards. */
export function paintStage(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#1b1720'; ctx.fillRect(0, 0, width, height);
  const halo = ctx.createRadialGradient(width * .48, height * .40, 0, width * .48, height * .43, width * .72);
  halo.addColorStop(0, '#49323a'); halo.addColorStop(.6, '#2b212d'); halo.addColorStop(1, '#19161f');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
  const floor = ctx.createRadialGradient(width * .5, height * .90, 0, width * .5, height * .90, width * .37);
  floor.addColorStop(0, '#c2a1ac18'); floor.addColorStop(1, '#c2a1ac00');
  ctx.save(); ctx.translate(0, height * .90); ctx.scale(1, .22); ctx.translate(0, -height * .90);
  ctx.fillStyle = floor; ctx.fillRect(0, 0, width, height * 2); ctx.restore();
  const shadow = ctx.createRadialGradient(width * .51, height * .91, 0, width * .51, height * .91, width * .28);
  shadow.addColorStop(0, '#09060eaa'); shadow.addColorStop(1, '#09060e00');
  ctx.save(); ctx.translate(0, height * .91); ctx.scale(1, .10); ctx.translate(0, -height * .91);
  ctx.fillStyle = shadow; ctx.fillRect(0, 0, width, height * 2); ctx.restore();
}
