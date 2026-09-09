import * as THREE from "three";
import type { MonsterGenotype } from "../generator/types";

export interface EyeRig { group: THREE.Group; pupil?: THREE.Object3D; brow?: THREE.Object3D; }
export interface AnimRig {
  root: THREE.Group;
  creature: THREE.Group; // sways / bobs
  body: THREE.Group;
  head: THREE.Group;
  eyes: EyeRig[];
  snarl?: THREE.Group;
  jaw?: THREE.Object3D;
  tongue?: THREE.Object3D;
  tail?: THREE.Object3D;
  wings: THREE.Object3D[];
  ears: THREE.Object3D[];
  arms: THREE.Object3D[];
  hands: THREE.Object3D[];
  legs: THREE.Object3D[];
  bodyType: MonsterGenotype["anatomy"]["body"];
  aura?: THREE.Object3D;
  halo?: THREE.Object3D;
  floatingHead: boolean;
  floating: boolean;
  /** parts that fly in during the summon */
  assembleParts: { obj: THREE.Object3D; from: THREE.Vector3; delay: number; basePos: THREE.Vector3; baseScale: THREE.Vector3 }[];
  summon?: import("../generator/visualTypes").VisualProfile["summon"];
  ornaments?: THREE.Object3D[];
  pixelCloud?: {mesh:THREE.InstancedMesh; targets:THREE.Vector3[]; origins:THREE.Vector3[]};
  height: number;
}

import { buildOrganicMonster } from './organicMonster';
import { buildOrganicMonster as buildV1 } from './organicMonsterV1';
export function buildMonster(g: MonsterGenotype) { return g.version === 1 ? buildV1(g) : buildOrganicMonster(g); }
