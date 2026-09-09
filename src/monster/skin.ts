import * as THREE from 'three';
import type { SkinType } from '../generator/types';
import { subRng } from '../generator/rng';

export function createSkinTexture(skin: SkinType, seed: string): THREE.DataTexture {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  const rng = subRng(seed, `skin-${skin}`);
  const patches=Array.from({length:81},()=>rng.float());
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let value = 238;
    const noise = rng.range(-12, 12);
    if (skin === 'fur') value = (x + Math.floor(y / 4)) % 4 === 0 ? 177 : 239 + noise;
    else if (skin === 'scales') value = (y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 2) % 4 === 0) ? 169 : 235 + noise;
    else if (skin === 'stone') value = (x + y * 3) % 9 === 0 ? 157 : 220 + noise;
    else if (skin === 'bone') { const gx=x/4,gy=y/4,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy; const n=THREE.MathUtils.lerp(THREE.MathUtils.lerp(patches[iy*9+ix],patches[iy*9+ix+1],fx),THREE.MathUtils.lerp(patches[(iy+1)*9+ix],patches[(iy+1)*9+ix+1],fx),fy); value=Math.round((209+46*n)/6)*6; }
    else if (skin === 'feathers') value = (x + Math.floor(y / 3)) % 5 === 0 ? 174 : 238 + noise;
    else if (skin === 'chitin') value = y % 5 === 0 ? 150 : 212 + (y % 5) * 9;
    else if (skin === 'bark') value = (x + Math.floor(y / 6)) % 5 < 2 ? 165 + noise : 234 + noise;
    else value = ((Math.floor(x / 4) + Math.floor(y / 3) * 3) % 7 === 0 ? 218 : 248) + noise * .3;
    const i = (y * size + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = Math.max(0, Math.min(255, value)); pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createClothTexture(seed: string): THREE.DataTexture {
  const texture=createSkinTexture('smooth',seed), pixels=texture.image.data as Uint8Array;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
    const v=x%4===0||y%4===0?174:(x+y)%2?224:248;
    const i=(y*32+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=v;
  }
  texture.needsUpdate=true;return texture;
}
