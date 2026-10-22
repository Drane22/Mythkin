import { SPECIES_BY_ID } from '../catalog/index';
import type { V3Profile, Contribution } from '../types';
const structural=new Set(['long-neck','high-haunches','four-arms','three-heads','long-arms','wood-limbs','hooves','talons','dragon-claws','webbed-hands','grin','wail']);
export function featureSocket(f:string):string {
 if(f==='nemes')return 'crown';
 if(/wings|shell|cloak|coat|robe|pack|mane|spines|fins|fringe/.test(f))return 'back';
 if(/tail/.test(f))return 'tail';
 if(/horn|crown|crest|antler|hair|helmet|turban|headscarf|topknot|bowl|ears|hood/.test(f))return 'crown';
 if(/tusk|tongue|beard|whisker|trunk|wail|grin|paint/.test(f))return 'face';
 return 'body';
}
/** Immutable primary anchors; secondary traits occupy free sockets only. */
export function composeCreature(primaryId:string,secondaryId?:string):V3Profile {
 const p=SPECIES_BY_ID[primaryId],s=secondaryId?SPECIES_BY_ID[secondaryId]:undefined;
 if(!p||(secondaryId&&!s))throw new Error('Unknown v3 creature');
 const contributions:Contribution[]=p.features.map(feature=>({sourceId:p.id,origin:p.origin,feature,socket:featureSocket(feature),role:'primary'}));
 if(s&&s.id!==p.id){
  const occupied=new Set(contributions.map(c=>c.socket));
  if(p.form==='serpent')occupied.add('tail');
  const offers=s.form==='serpent'&&!s.features.some(f=>/tail/.test(f))?[...s.features,'serpent-tail']:s.features;
  const candidates=offers.filter(f=>!structural.has(f)&&!occupied.has(featureSocket(f))&&(!/robe|coat|cloak|vest/.test(f)||['brute','biped','spirit','centaur'].includes(p.form)));
  const selected=candidates.find(f=>!['body','face'].includes(featureSocket(f)))??candidates[0];
  // A separately mounted companion crest preserves both complete anatomies when sockets conflict.
  contributions.push({sourceId:s.id,origin:s.origin,feature:selected??'companion-crest',socket:selected?featureSocket(selected):'relic',role:'secondary'});
 }
 return {primaryId:p.id,secondaryId:s?.id===p.id?undefined:s?.id,habitat:p.habitat,anchors:[p.form,p.head,...p.features],contributions};
}
