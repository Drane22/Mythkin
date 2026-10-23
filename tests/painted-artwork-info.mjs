import {readdirSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
for(const file of readdirSync('src/painted/assets').filter(f=>f.endsWith('.png'))){
 const img=await loadImage(`src/painted/assets/${file}`),canvas=createCanvas(img.width,img.height),ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
 const pixels=ctx.getImageData(0,0,img.width,img.height).data;let alpha=0;
 for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)alpha++;
 console.log(JSON.stringify({id:file.replace('.png',''),width:img.width,height:img.height,transparent:Math.round(alpha/(img.width*img.height)*100)}));
}
