import type { Species } from '../types';
/** Reference-directed construction values in model units. No seeded body-type swaps. */
export function proportions(s:Species){
 const brute=s.form==='brute';
 const gaunt=['draugr','vetala','pazuzu','tzitzimitl','manananggal','banshee','pontianak','tikbalang','baba-kin','leshy','cernunnos'].includes(s.id);
 const soft=s.id==='bungisngis'||s.id==='domovoi';
 const specific:Record<string,Partial<{chest:number;waist:number;hips:number;depth:number;arm:number;leg:number;hunch:number;height:number;head:number}>>={
  minotaur:{chest:.54,waist:.30,hips:.34,arm:.21},oni:{chest:.58,waist:.32,hips:.34,arm:.23},
  cyclops:{chest:.57,waist:.38,hips:.36,arm:.25},rakshasa:{chest:.57,waist:.38,hips:.34,arm:.19},
  div:{chest:.59,waist:.40,hips:.35,arm:.23},troll:{chest:.65,waist:.47,hips:.38,hunch:.18,arm:.27},
  bungisngis:{chest:.52,waist:.55,hips:.39,depth:.39,arm:.20,height:.92},domovoi:{chest:.37,waist:.43,hips:.29,height:.65,arm:.16,head:1.1},
  'huli-jing':{chest:.27,waist:.17,hips:.25,arm:.09,leg:.12},ahuizotl:{chest:.38,waist:.33,hips:.38,height:.88,arm:.16,leg:.20},
  hitotsume:{chest:.28,waist:.19,hips:.21,hunch:.09,height:.78,head:1.14},kappa:{chest:.34,waist:.29,hips:.27,hunch:.12,height:.81},
  tokoloshe:{chest:.30,waist:.23,hips:.23,hunch:.13,height:.77},tengu:{chest:.31,waist:.23,hips:.29,arm:.115},
  tikbalang:{chest:.30,waist:.16,hips:.19,arm:.105,leg:.12,height:1.12,hunch:.10},
  'baba-kin':{chest:.24,waist:.21,hips:.21,hunch:.23,height:.93},leshy:{chest:.23,waist:.16,hips:.21,height:1.08},
  gorgon:{chest:.29,waist:.19,hips:.26,depth:.20,arm:.10},djinn:{chest:.40,waist:.20,hips:.18,arm:.16},
  harpy:{chest:.34,waist:.24,hips:.28,depth:.25},roc:{chest:.40,waist:.29,hips:.30,depth:.30},impundulu:{chest:.32,waist:.22,hips:.25,depth:.23},
 };
 return {chest:brute?.54:gaunt?.265:.33,waist:brute?.34:gaunt?.15:.23,hips:brute?.33:gaunt?.21:.27,depth:brute?.29:gaunt?.15:.22,arm:brute?.21:gaunt?.083:.12,leg:brute?.22:gaunt?.095:.15,hunch:0,height:1,head:brute?1.18:1.08,...specific[s.id],gaunt,soft,muscular:brute&&!soft&&s.id!=='troll'};
}
