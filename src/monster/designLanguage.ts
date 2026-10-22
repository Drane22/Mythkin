import type { MonsterGenotype } from '../generator/types';

export const DESIGN_FAMILIES = ['trickster','solar','warden','oracle'] as const;
export type DesignFamily = typeof DESIGN_FAMILIES[number];
export function designFamily(g:MonsterGenotype):DesignFamily {
  const a=g.anatomy;
  if(a.horns==='antlers'||a.skin==='bark'||g.mythology.primary==='celtic')return 'warden';
  if(a.eyes.count>=3||a.mutations.includes('halo'))return 'oracle';
  if(a.horns==='crown'||g.mythology.primary==='egyptian'||a.eyes.count===1&&a.mouth!=='tongue')return 'solar';
  return 'trickster';
}
export const DESIGN_COLORS={
  bone:'#d9cdb1',boneLight:'#eee2c8',boneShadow:'#8c8065',socket:'#2b141b',
  vermilion:'#a14e48',tongue:'#a14b53',tongueLight:'#bf6968',
  gold:'#c59a43',goldLight:'#e9be64',moss:'#626b3e',mossLight:'#7f8750',
  teal:'#3d6460',spirit:'#88d5cb',ochreEye:'#dbac4f',redEye:'#b84a33',pupil:'#171015',
} as const;

/** Four controlled specimens for checking the reference language in the real builder. */
export function referenceSpecimen(g:MonsterGenotype,family:DesignFamily) {
  const copy=structuredClone(g),a=copy.anatomy;
  Object.assign(a,{body:family==='trickster'?'tall':'barrel',head:family==='warden'?'skull':family==='solar'?'snout':'sphere',
    horns:family==='warden'?'antlers':family==='trickster'?'oni':'crown',ears:family==='warden'?'none':'pointed',
    arms:'long',armCount:2,legs:'long',legCount:2,wings:'none',tail:family==='solar'?'thin':family==='oracle'?'serpent':'none',back:'none',skin:'bone',
    mouth:family==='warden'?'none':family==='solar'?'fangs':'tongue',markings:false,aura:family==='oracle',
    eyes:{count:family==='warden'?2:family==='oracle'?3:1,type:family==='warden'?'hollow':'slit'},mutations:family==='oracle'?['halo']:[]});
  Object.assign(a.proportions,{bodyW:1,bodyH:1,bodyD:1,headScale:1,headTilt:0,hornScale:1,armLength:1,legLength:1,brokenHorn:false,oddArm:false});
  Object.assign(copy.visual!,{rig:'biped',garment:family==='warden'?'mantle':family==='solar'?'collar':family==='trickster'?'wrap':'belt',accessories:[],marking:'none'});
  copy.mythology.primary=family==='warden'?'celtic':family==='solar'?'egyptian':family==='oracle'?'hindu':'japanese';
  copy.visual!.summon.type='sigil';
  Object.assign(copy.visual!.environment,{type:family==='warden'?'forest':family==='solar'?'temple':family==='oracle'?'stars':'ember',motion:'drift'});
  return copy;
}
