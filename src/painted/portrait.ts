export function portraitRect(art: { width: number; height: number }, width: number, height: number) {
  const scale = Math.min(width*.87/art.width,height*.87/art.height);
  const w=art.width*scale,h=art.height*scale;
  return {x:(width-w)/2,y:height*.941-h,w,h};
}
