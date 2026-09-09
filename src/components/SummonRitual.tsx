import type { CSSProperties } from 'react';
import type { MonsterGenotype } from '../generator/types';
import { subRng } from '../generator/rng';
import { Sigil } from './Sigil';
export function SummonRitual({genotype,visible}:{genotype:MonsterGenotype|null;visible:boolean}){
 if(!genotype?.visual)return <Sigil color="#bb8aff" visible={visible}/>;
 if(!visible)return null;
 const s=genotype.visual.summon,r=subRng(genotype.seed,'ritual-drawing');
 const style={'--ritual-color':genotype.visual.colors.emissive,'--ritual-duration':`${s.duration}ms`} as CSSProperties;
 return <div className={`ritual ritual-${s.type} ritual-entry-${s.entrance} ritual-flash-${s.flash}`} style={style} aria-hidden="true">
  <svg className="ritual-symbol" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth=".7">
   <circle cx="50" cy="50" r="43"/><circle cx="50" cy="50" r="36" strokeDasharray={s.symbol%2?'3 7':'18 4'}/>
   {Array.from({length:4+s.symbol},(_,i)=>{const a=i/(4+s.symbol)*Math.PI*2;return <path key={i} d={`M${50+Math.sin(a)*29} ${50+Math.cos(a)*29}L${50+Math.sin(a)*39} ${50+Math.cos(a)*39}`}/>;})}
  </svg>
  <div className="ritual-beam"/><div className="ritual-shadow"/>
  {Array.from({length:s.particles},(_,i)=><i key={i} className="ritual-pixel" style={{'--px':`${r.range(-230,230)}px`,'--py':`${r.range(-260,260)}px`,'--lag':`${i*18}ms`} as CSSProperties}/>)}
 </div>;
}
