import type { HabitatId } from './habitats';
import type { HabitatBrush } from './primitives';

/** Each setting has its own silhouette, depth planes and small mechanical motion. */
export function drawArchitecture(b: HabitatBrush, id: HabitatId, p: readonly string[], t: number) {
  const { rect, line, poly, disc } = b;
  const [night, shadow, mid, stone, light] = p;
  const flame = (x: number, y: number, phase: number) => {
    rect(x - 3, y, 7, 2, stone); rect(x - 1, y + 2, 3, 9, shadow);
    poly([[x - 2, y], [x - 3, y - 4], [x + Math.sin(t * 2 + phase), y - 8], [x + 2, y - 3]], light);
    rect(x, y - 3, 1, 3, '#fff0c8');
  };
  const water = (y: number) => {
    rect(0, y, 128, 160 - y, shadow);
    for (let row = 0; row < 9; row++) {
      const x = 64 + Math.sin(t * .45 + row * 1.9) * 11;
      rect(x - 9 - row * 2, y + 3 + row * 3, 18 + row * 4, 1, row % 3 ? mid : stone);
    }
  };
  const tree = (x: number, y: number, width: number, height: number, color: string) => {
    poly([[x-width,y],[x+width,y],[x+width*.6,y-height*.6],[x+width*1.7,y-height],[x+width*.7,y-height],[x-width*.4,y-height*.65]],color);
    line(x,y-height*.55,x-12,y-height*.8,color,2);line(x+2,y-height*.75,x+14,y-height*.95,color,2);
  };
  const arch = (x: number, y: number, width: number, height: number) => {
    rect(x, y, width, height, stone);
    poly([[x+3,y+height],[x+3,y+12],[x+width*.5,y+3],[x+width-3,y+12],[x+width-3,y+height]],shadow);
    line(x+4,y+12,x+width*.5,y+5,light); line(x+width*.5,y+5,x+width-4,y+12,mid);
  };
  switch (id) {
    case 'labyrinth': {
      disc(89, 27, 11, mid); disc(94, 24, 11, night);
      for (const side of [-1, 1]) {
        const x = side < 0 ? 4 : 99;
        rect(x, 47, 25, 85, shadow); rect(x, 45, 26, 4, stone);
        for (let row = 0; row < 7; row++) {
          rect(x, 53 + row * 10, 25, 1, mid);
          rect(x + (row % 2 ? 6 : 17), 54 + row * 10, 1, 9, mid);
        }
        // Meander-shaped wall recesses, distinct from generic temple columns.
        line(x+4,65,x+20,65,stone);line(x+20,65,x+20,79,stone);line(x+20,79,x+10,79,stone);line(x+10,79,x+10,71,stone);
        flame(x+12,114,side);
        tree(side<0?0:126,139,3,72,mid);
      }
      for (let i=0;i<4;i++) { const inset=i*9; rect(inset,145-i*4,128-inset*2,3,mid); rect(inset+2,146-i*4,124-inset*2,1,stone); }
      line(15,156,51,136,stone);line(110,156,79,136,stone);
      break;
    }
    case 'barrow-fjord': {
      for (let i=0;i<4;i++) poly([[i*37-12,89],[i*37+10,34+i%2*12],[i*37+39,89]], i%2?mid:shadow);
      for (let i=0;i<3;i++) {
        const y=16+i*6;
        poly([[-10,y],[25,y+Math.sin(t*.18+i)*7],[70,y-5],[138,y+6],[138,y+8],[70,y-2],[25,y+3+Math.sin(t*.18+i)*7],[-10,y+3]],mid);
      }
      water(105);
      poly([[-5,147],[4,118],[20,97],[45,101],[62,127],[94,133],[131,147]],shadow);
      poly([[6,125],[12,110],[27,102],[43,110],[49,124]],mid);
      rect(22,111,12,21,night);rect(19,108,18,4,stone);
      for (const x of [11,105,115]) { poly([[x-3,145],[x-2,119],[x+2,115],[x+5,144]],mid); line(x,124,x,135,stone); }
      break;
    }
    case 'nile': {
      disc(91,28,13,stone);disc(91,28,9,mid);
      poly([[29,89],[54,52],[78,89]],shadow);
      for (const side of [-1,1]) {
        const x=side<0?4:100;
        poly([[x,116],[x+3,46],[x+19,46],[x+24,116]],mid);rect(x+2,43,18,5,stone);
        for(let y=57;y<105;y+=12) {line(x+8,y,x+14,y,stone);line(x+11,y-3,x+11,y+4,stone);}
      }
      water(126);
      for (let i=0;i<8;i++) {
        const x=i<4?3+i*4:109+(i-4)*5,y=147-i%3*3,tip=x+Math.sin(t*.4+i)*2;
        line(x,y,tip,y-23,mid);line(tip,y-23,tip-4,y-26,stone);line(tip,y-23,tip+4,y-26,stone);
      }
      for(const x of [18,103]) {const y=136+Math.sin(t*.6+x);poly([[x-5,y],[x,y-3],[x+5,y],[x,y+2]],stone);rect(x-2,y-2,4,1,light);}
      break;
    }
    case 'cedar-shrine': {
      for(const x of [2,18,108,125]) {tree(x,143,3,136,shadow);for(let j=0;j<4;j++)poly([[x-17,21+j*19],[x,4+j*19],[x+18,21+j*19]],mid);}
      rect(25,47,5,83,stone);rect(98,47,5,83,stone);
      rect(19,44,90,5,stone);rect(27,57,75,3,stone);
      poly([[14,35],[30,39],[96,39],[114,35],[110,43],[18,43]],shadow);rect(22,43,84,2,light);
      const ropeY=66;
      for(let x=31;x<100;x++) rect(x,ropeY+Math.sin((x-31)/69*Math.PI)*5,1,1,stone);
      for(const x of [37,88]) {const dx=Math.sin(t*.48+x)*1.4;line(x,59,x+dx,83,stone);rect(x-3+dx,83,7,9,stone);rect(x-2+dx,85,5,5,light);rect(x-4+dx,82,9,2,shadow);}
      for(let i=0;i<6;i++)rect(36-i*5,131+i*4,56+i*10,2,i%2?shadow:mid);
      break;
    }
    case 'cloud-peaks': {
      for(let i=0;i<6;i++) {
        const x=i*29-9,y=31+i%3*14;
        poly([[x-13,132],[x-8,y+17],[x-3,y+15],[x,y],[x+7,y+3],[x+12,y+36],[x+18,132]],i%2?mid:shadow);
        line(x,y+5,x-5,y+54,stone);
      }
      for(let j=0;j<3;j++) {const drift=Math.sin(t*.18+j)*12;poly([[-20+drift,76+j*20],[25+drift,71+j*20],[65+drift,78+j*20],[140+drift,70+j*20],[140+drift,84+j*20],[-20+drift,84+j*20]],shadow);}
      rect(87,55,3,22,stone);rect(110,55,3,22,stone);rect(84,77,32,3,stone);
      poly([[79,53],[92,48],[100,40],[105,47],[121,53],[115,56],[83,56]],stone);rect(90,58,1,16,light);
      poly([[83,80],[112,80],[102,94],[91,91]],mid);
      for(let i=0;i<3;i++) {const y=122+i*9;poly([[0,y],[20,y-4],[34,y],[28,y+4],[2,y+4]],mid);}
      break;
    }
    case 'balete': {
      for(const side of [-1,1]) {
        const x=side<0?8:119;tree(x,148,7,131,mid);
        for(let j=0;j<5;j++) {const xx=x+side*j*3;line(xx,14,xx+Math.sin(t*.18+j)*2,68+j*13,stone);}
        for(let j=0;j<4;j++)line(x,110+j*3,x-side*(8+j*5),147,mid,2);
        for(let j=0;j<3;j++){line(x+side*2,55+j*22,x-side*4,71+j*22,shadow);line(x-side*4,71+j*22,x+side*2,79+j*22,shadow);}
        // Curled aerial roots and leaf clusters break the flat trunk silhouettes.
        for(let j=0;j<3;j++){const xx=x-side*(8+j*5),end=43+j*12;line(xx,14,xx+2,end,mid);line(xx+2,end,xx-1,end+5,mid);poly([[xx-2,end-9],[xx+3,end-12],[xx+5,end-9],[xx,end-7]],stone);}
      }
      for(let i=0;i<10;i++){disc(i*15-2,8+i%3*4,16,shadow);poly([[i*15-6,20],[i*15,29+i%2*4],[i*15+5,20]],shadow);}
      poly([[0,151],[14,130],[29,133],[35,143],[96,142],[116,129],[129,137],[129,161],[0,161]],shadow);
      for(const x of [17,108]) {disc(x,136,5,stone);rect(x-5,136,11,4,shadow);rect(x-1,140,2,5,mid);}
      for(let i=0;i<5;i++) {const x=7+i*28,y=41+i%3*11;rect(x+Math.sin(t*.35+i)*2,y,1,13+i*4,mid);}
      break;
    }
    case 'standing-stones': {
      disc(94,25,11,stone);disc(98,22,11,night);
      poly([[0,108],[23,99],[55,108],[79,95],[103,100],[128,92],[128,160],[0,160]],shadow);
      for(const [x,y,height,width] of [[12,137,56,9],[30,111,30,7],[99,112,34,7],[114,138,60,9]]) {
        poly([[x-width/2,y],[x-width/2-2,y-height+5],[x+1,y-height],[x+width/2,y-height+3],[x+width/2+2,y]],mid);
        line(x-width/2+1,y-height+6,x-width/2+2,y-3,stone);
      }
      rect(7,79,22,5,mid);rect(100,76,21,5,mid);
      for(let i=0;i<28;i++){const a=i/28*Math.PI*2;rect(64+Math.cos(a)*46,143+Math.sin(a)*9,3,2,i%3?mid:stone);}
      for(let i=0;i<12;i++){const x=i*12;line(x,156,x+Math.sin(t*.35+i)*2,148-i%3*2,mid);}
      break;
    }
    case 'birch': {
      // Hut is in a clearing, behind the near trees. No trunk crosses its roof/window.
      poly([[77,120],[85,116],[116,115],[122,119],[109,123],[83,124]],shadow);
      poly([[85,118],[90,118],[93,127],[105,145],[99,145],[87,128]],mid);
      rect(83,94,28,23,mid);poly([[111,94],[120,88],[120,109],[111,117]],shadow);
      poly([[77,94],[96,76],[120,87],[113,96]],shadow);
      poly([[78,92],[96,77],[114,92]],mid);line(79,92,96,78,stone);line(96,78,114,92,stone);
      for(let roof=0;roof<4;roof++)line(84+roof*3,91-roof*3,108-roof*3,91-roof*3,shadow);
      for(let y=98;y<117;y+=4){line(84,y,110,y,shadow);line(84,y+1,109,y+1,stone);}
      rect(94,99,7,9,shadow);rect(95,100,5,6,light);line(97,100,97,106,mid);line(95,103,100,103,mid);
      rect(85,106,6,11,shadow);rect(89,110,1,1,stone);rect(81,117,32,2,shadow);
      for(const x of [2,17,32,125]) {
        const height=121+(x%3)*5;tree(x,143,2,height,stone);
        for(let j=0;j<11;j++)rect(x-2+(j%2),24+j*10,3,1,shadow);
        for(let j=0;j<3;j++)line(x,41+j*23,x+(x<64?12:-8),29+j*23,mid);
      }
      for(let i=0;i<4;i++) {const x=6+i*36;disc(x,10+i%2*7,17,shadow);}
      for(let i=0;i<9;i++) {const x=i*17;poly([[x,145],[x+4,142],[x+7,146],[x+2,147]],i%2?stone:mid);}
      break;
    }
    case 'banyan-ghat': {
      tree(8,136,7,129,mid);line(8,35,74,7,mid,5);
      for(let i=0;i<7;i++){const x=13+i*7;line(x,18-i,x+Math.sin(t*.19+i),46+i%3*14,stone);}
      arch(102,45,22,65);rect(99,42,28,3,mid);
      poly([[98,42],[106,32],[112,29],[120,34],[128,42]],stone);
      water(135);
      for(let i=0;i<5;i++) {rect(0,119+i*4,121-i*8,3,mid);rect(0,119+i*4,121-i*8,1,stone);}
      for(let i=0;i<4;i++){const x=23+i*28+Math.sin(t*.2+i)*4,y=142+i%2*9;poly([[x-3,y],[x+4,y],[x+2,y+2],[x-1,y+2]],stone);rect(x,y-3+Math.sin(t*1.8+i)*.5,1,3,light);rect(x-1,y+4,3,1,mid);}
      break;
    }
    case 'ziggurat': {
      for(let level=0;level<5;level++) {
        const inset=level*9,top=107-level*13;
        rect(18+inset,top,93-inset*2,14,mid);rect(18+inset,top,93-inset*2,2,stone);
        for(let i=0;i<9-level*2;i++)rect(20+inset+i*10,top+7,7,1,shadow);
      }
      rect(57,43,15,12,stone);rect(62,45,5,10,shadow);
      for(const x of [1,108]) {rect(x,58,19,77,mid);rect(x-2,56,23,4,stone);for(let i=0;i<7;i++){rect(x+3,65+i*9,13,1,stone);rect(x+7,67+i*9,4,3,shadow);}}
      for(let j=0;j<7;j++){rect(43-j*3,117+j*4,44+j*6,2,mid);rect(43-j*3,117+j*4,44+j*6,1,stone);}
      flame(12,130,1);flame(118,130,4);
      break;
    }
    case 'desert-bazaar': {
      disc(80,24,13,mid);disc(85,21,13,night);
      rect(0,65,128,72,shadow);
      arch(4,70,27,64);arch(100,70,24,64);arch(48,43,31,49);
      for(const side of [-1,1]) {
        const x=side<0?0:98,flutter=Math.sin(t*.55+side)*2;
        poly([[x,60],[x+29,60],[x+33,78+flutter],[x-2,75]],mid);
        for(let i=0;i<4;i++)line(x+i*8,61,x+i*9,76+flutter,stone,2);
      }
      for(let i=0;i<3;i++) {const x=32+i*32,dx=Math.sin(t*.5+i)*1.5;line(x,13+i%2*8,x+dx,41+i%2*9,mid);poly([[x+dx,39+i%2*9],[x+dx+3,44+i%2*9],[x+dx,51+i%2*9],[x+dx-3,44+i%2*9]],light);}
      for(let i=0;i<5;i++)line(0,137+i*5,128,137+i*5,mid);
      break;
    }
    case 'cenote': {
      for(let j=0;j<3;j++)poly([[0,0],[128,0],[128,15+j*6],[100-j*4,18+j*7],[90-j*2,37+j*8],[37+j*2,32+j*8],[20+j*4,18+j*7],[0,15+j*6]],j%2?mid:shadow);
      for(const x of [9,119]) {poly([[x-14,0],[x+10,0],[x+4,130],[x-9,140]],mid);for(let i=0;i<6;i++)rect(x-6,21+i*17,8,2,stone);}
      for(let j=0;j<3;j++)rect(83+j*6,102-j*8,35-j*12,8,stone);
      water(126);
      for(const x of [24,103]) {rect(x,36,2,103,mid);for(let i=0;i<9;i++)rect(x,(45+i*13+t*9)%98+34,1,5,stone);}
      for(let i=0;i<8;i++){const x=3+i*17;line(x,8,x+Math.sin(t*.21+i)*2,24+i%4*6,mid);}
      for(const x of [23,103]) {line(x-5,139,x+5,139,stone);line(x-8,142,x+8,142,mid);}
      break;
    }
    case 'baobab': {
      disc(91,35,14,stone);
      poly([[0,112],[27,99],[58,110],[91,102],[128,113],[128,160],[0,160]],shadow);
      poly([[0,143],[8,127],[11,70],[6,49],[15,47],[23,73],[27,129],[35,145]],mid);
      for(const [x,y] of [[-8,26],[15,20],[32,31],[44,23]]) {line(16,65,x,y+5,mid,5);disc(x,y,16,shadow);}
      tree(109,121,2,42,shadow);disc(110,76,12,shadow);
      // Very gentle heat haze across the open savanna, not a flashing storm.
      for(let i=0;i<3;i++){const shift=Math.sin(t*.2+i)*5;rect(62+shift,97+i*4,48,1,mid);}
      for(let i=0;i<21;i++){const x=i*7,y=154-i%3*3;line(x,y,x+Math.sin(t*.42+i)*2,y-8-i%4,mid);line(x,y,x-2,y-5,stone);}
      break;
    }
    case 'mangrove': {
      water(105);
      for(const side of [-1,1]) {
        const x=side<0?8:119;tree(x,122,4,113,mid);
        for(let i=0;i<5;i++) {const end=x-side*(5+i*5);line(x,88+i*4,end,121+i%2*12,mid,2);line(end,121+i%2*12,end+side*4,145,mid,2);}
        for(let j=0;j<3;j++)disc(x+side*j*8,9+j*4,17,shadow);
      }
      rect(82,87,26,3,stone);rect(85,89,2,32,mid);rect(104,89,2,29,mid);
      line(82,122,91,122,stone);line(101,120,111,120,mid);line(84,125,93,125,mid);
      poly([[79,66],[96,54],[113,66],[108,69],[82,69]],mid);line(81,66,96,55,stone);rect(83,69,25,17,shadow);for(let y=72;y<85;y+=4)line(84,y,107,y,mid);rect(91,71,7,8,stone);rect(93,73,3,4,light);
      for(const x of [18,111]) {const dx=Math.sin(t*.4+x);line(x,29,x+dx,49,stone);rect(x-2+dx,49,5,6,light);rect(x-3+dx,48,7,1,shadow);}
      for(let i=0;i<5;i++){const x=12+i*24+Math.sin(t*.25+i)*3,y=137+i%3*6;poly([[x,y],[x+5,y-2],[x+8,y],[x+3,y+2]],mid);}
      break;
    }
  }
}
