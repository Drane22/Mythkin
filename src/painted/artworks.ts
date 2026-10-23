import type { PaintedRig } from './motion';

export interface PaintedArtwork {
  id: string;
  width: number;
  height: number;
  rig: PaintedRig;
}

export const PAINTED_MINOTAUR: PaintedArtwork = {
  id: 'minotaur', width: 1122, height: 1402,
  rig: {
    head: [.62, .34], headBottom: .37, chest: [.52, .43],
    shoulders: [[.29, .30], [.77, .33]],
    eyes: [[.581, .210], [.699, .219]], eyeRadius: [.020, .012],
    ground: .92, tail: [.16, .80],
  },
};

export const PAINTED_ARTWORKS: Readonly<Record<string, PaintedArtwork>> = {
  minotaur: PAINTED_MINOTAUR,
  bakunawa: {
    id:'bakunawa',width:1122,height:1402,
    rig:{
      profile:'serpent',head:[.65,.25],headBottom:.34,headArea:{center:[.75,.16],radius:[.28,.18]},
      chest:[.58,.43],shoulders:[[.4,.25],[.65,.5]],eyes:[[.714,.115]],eyeRadius:[.023,.012],
      ground:1.20,tail:[.40,.86],breathScale:.25,
      regions:[
        {center:[.30,.19],radius:[.24,.25],pivot:[.61,.18],amount:.022},
        {center:[.86,.45],radius:[.18,.20],pivot:[.70,.41],amount:-.025},
        {center:[.24,.58],radius:[.24,.18],pivot:[.40,.53],amount:.019},
        {center:[.55,.88],radius:[.38,.15],pivot:[.59,.74],amount:-.020},
      ],
    },
  },
  leshy:{
    id:'leshy',width:1122,height:1402,
    rig:{
      profile:'guardian',head:[.57,.30],headBottom:.33,headArea:{center:[.55,.16],radius:[.38,.19]},
      chest:[.5,.43],shoulders:[[.36,.31],[.67,.33]],eyes:[],eyeRadius:[.01,.01],
      ground:.94,tail:[.5,.68],breathScale:.12,
      regions:[
        {center:[.21,.64],radius:[.18,.30],pivot:[.36,.31],amount:.012},
        {center:[.80,.64],radius:[.19,.30],pivot:[.67,.33],amount:-.015},
        {center:[.49,.42],radius:[.24,.21],pivot:[.54,.29],amount:.008},
      ],
    },
  },
  fenrir:{
    id:'fenrir',width:1122,height:1402,
    rig:{
      profile:'beast',head:[.73,.61],headBottom:.70,headArea:{center:[.78,.50],radius:[.24,.22]},
      chest:[.49,.55],shoulders:[[.46,.56],[.83,.57]],eyes:[[.731,.496],[.834,.507]],eyeRadius:[.019,.015],
      ground:.96,tail:[.19,.20],breathScale:1.1,
      anchors:[{center:[.13,.77],radius:[.15,.10]},{center:[.50,.90],radius:[.21,.10]},{center:[.88,.83],radius:[.13,.10]}],
      regions:[
        {center:[.21,.21],radius:[.24,.30],pivot:[.37,.43],amount:.037},
        {center:[.51,.72],radius:[.22,.23],pivot:[.49,.56],amount:.008},
        {center:[.86,.68],radius:[.14,.25],pivot:[.83,.57],amount:-.011},
      ],
    },
  },
  harpy:{
    id:'harpy',width:1122,height:1402,
    rig:{
      profile:'avian',head:[.59,.27],headBottom:.33,headArea:{center:[.54,.15],radius:[.26,.21]},
      chest:[.56,.42],shoulders:[[.40,.34],[.69,.34]],eyes:[[.595,.192]],eyeRadius:[.022,.013],
      ground:.96,tail:[.45,.70],breathScale:.8,
      anchors:[{center:[.31,.92],radius:[.17,.10]},{center:[.77,.87],radius:[.17,.10]}],
      regions:[
        {center:[.23,.52],radius:[.22,.32],pivot:[.40,.34],amount:.030},
        {center:[.85,.54],radius:[.19,.30],pivot:[.69,.34],amount:-.034},
        {center:[.43,.69],radius:[.18,.20],pivot:[.52,.52],amount:.012},
      ],
    },
  },
  draugr:{
    id:'draugr',width:1122,height:1402,
    rig:{
      profile:'guardian',head:[.57,.23],headBottom:.27,headArea:{center:[.56,.13],radius:[.18,.15]},
      chest:[.53,.34],shoulders:[[.32,.20],[.70,.24]],eyes:[],eyeRadius:[.01,.01],
      ground:.95,tail:[.52,.61],breathScale:.12,
      anchors:[{center:[.35,.94],radius:[.14,.10]},{center:[.72,.90],radius:[.15,.09]}],
      regions:[
        {center:[.18,.54],radius:[.18,.28],pivot:[.32,.20],amount:.012},
        {center:[.83,.59],radius:[.15,.29],pivot:[.70,.24],amount:-.011},
        {center:[.73,.33],radius:[.17,.18],pivot:[.66,.22],amount:.016},
        {center:[.51,.56],radius:[.21,.22],pivot:[.52,.41],amount:-.015},
      ],
    },
  },
};

