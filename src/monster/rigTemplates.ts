import type { MonsterGenotype } from '../generator/types';
export function rigTemplate(g:MonsterGenotype) {
 const kind=g.visual!.rig;
 return {
  kind,
  horizontal:kind==='quadruped'||kind==='centauroid',
  upperTorso:kind==='centauroid'||kind==='serpent'&&g.anatomy.armCount>0,
  coiled:kind==='serpent',
  suspended:kind==='floating',
  headMultiplier:kind==='top-heavy'?1.2:kind==='quadruped'?.78:1,
  limbMultiplier:kind==='long-limbed'?1.2:1,
  shoulderHeight:kind==='avian'?.72:kind==='multi-leg'?.3:.48,
 };
}
