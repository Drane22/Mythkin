export type Point = readonly [number, number];

export interface PaintedRig {
  head: Point;
  headBottom: number;
  chest: Point;
  shoulders: readonly [Point, Point];
  eyes: readonly [Point, Point];
  eyeRadius: Point;
  ground: number;
  tail: Point;
}

export interface PaintedMotion {
  breath: number;
  headAngle: number;
  attention: number;
  arm: number;
  tail: number;
  blink: number;
  recoil: number;
}

const smooth = (from: number, to: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};
const bell = (x: number, y: number, center: Point, rx: number, ry: number) =>
  Math.exp(-(((x - center[0]) / rx) ** 2) - ((y - center[1]) / ry) ** 2);

/** Art-space weights are authored for this painting, not guessed from species labels. */
export function skinWeights(x: number, y: number, rig: PaintedRig) {
  const grounded = 1 - smooth(rig.ground - .13, rig.ground, y);
  const head = (1 - smooth(rig.headBottom - .09, rig.headBottom, y)) * smooth(.18, .40, x);
  return {
    grounded, head,
    chest: bell(x, y, rig.chest, .25, .15) * grounded * (1 - head),
    leftArm: bell(x, y, [.17, .52], .20, .28) * grounded * (1 - head),
    rightArm: bell(x, y, [.86, .55], .17, .28) * grounded * (1 - head),
    tail: bell(x, y, rig.tail, .13, .14),
    eyes: rig.eyes.map(eye => bell(x, y, eye, rig.eyeRadius[0], rig.eyeRadius[1])),
  };
}

export type SkinWeights = ReturnType<typeof skinWeights>;

export function paintedMotion(time: number, seedPhase: number, attention: number, reactionAge = Infinity, reduced = false): PaintedMotion {
  if (reduced) return { breath: 0, headAngle: 0, attention: 0, arm: 0, tail: 0, blink: 0, recoil: 0 };
  const t = time + seedPhase;
  const breath = Math.sin(t * Math.PI * 2 / 4.8);
  // Brief close/open; avoid the slow mechanical blinking of the previous rig.
  const cycle = (t + 1.9) % 5.7;
  const blink = cycle < .20 ? Math.sin(cycle / .20 * Math.PI) ** 2 : 0;
  const reaction = reactionAge < 1.4 ? Math.sin(Math.min(1, reactionAge / .18) * Math.PI / 2) * Math.exp(-reactionAge * 3.4) : 0;
  return {
    breath, attention,
    headAngle: Math.sin(t * .67) * .012 + attention * .024 - reaction * .045,
    arm: Math.sin(t * Math.PI * 2 / 4.8 - .5) * .009,
    tail: Math.sin(t * 1.3 - .7) * .014,
    blink: Math.max(blink, reactionAge > .04 && reactionAge < .17 ? .7 : 0),
    recoil: reaction,
  };
}

/** Deform the artwork locally. Hooves stay fixed; the image is never bobbed as a card. */
export function deformPoint(x: number, y: number, weights: SkinWeights, rig: PaintedRig, motion: PaintedMotion, out: { x: number; y: number }) {
  let dx = (x - rig.chest[0]) * motion.breath * .026 * weights.chest;
  let dy = -motion.breath * .004 * weights.chest;
  const angle = motion.headAngle, hx = x - rig.head[0], hy = y - rig.head[1];
  dx += ((Math.cos(angle) - 1) * hx - Math.sin(angle) * hy + motion.attention * .003) * weights.head;
  dy += (Math.sin(angle) * hx + (Math.cos(angle) - 1) * hy - motion.breath * .004) * weights.head;
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1, weight = i ? weights.rightArm : weights.leftArm;
    dx += (y - rig.shoulders[i][1]) * motion.arm * side * weight;
    dy += -(x - rig.shoulders[i][0]) * motion.arm * side * weight;
    dy -= (y - rig.eyes[i][1]) * motion.blink * .94 * weights.eyes[i];
  }
  dx += motion.tail * weights.tail * weights.grounded;
  dy += motion.recoil * .008 * weights.grounded;
  dx += motion.attention * .006 * weights.grounded;
  out.x = x + dx;
  out.y = y + dy;
  return out;
}
