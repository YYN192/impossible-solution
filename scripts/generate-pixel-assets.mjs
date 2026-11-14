import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve('src/assets/pixel');
const palette = {
  ink:'#080B12', space:'#101A2B', steelDark:'#252C38', steel:'#687586', silver:'#B8C4D0', white:'#E8F0F7',
  blue:'#4C9CE5', cyan:'#83D9F4', orange:'#D86E3B', rust:'#A84730', yellow:'#E6BD5D', teal:'#4BB8B0', green:'#65BF83',
};
const rgb = (hex) => [1,3,5].map((i) => Number.parseInt(hex.slice(i,i+2),16));
function image(w,h,background=null) {
  const px = new Uint8Array(w*h*4);
  if (background) for (let i=0;i<w*h;i++) px.set([...rgb(background),255],i*4);
  return {w,h,px};
}
function put(im,x,y,c) {
  x=Math.floor(x); y=Math.floor(y);
  if (x<0||y<0||x>=im.w||y>=im.h) return;
  const i=(y*im.w+x)*4;
  if (!c) { im.px[i+3]=0; return; }
  im.px.set([...rgb(c),255],i);
}
function rect(im,x,y,w,h,c) { for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) put(im,xx,yy,c); }
function line(im,x1,y1,x2,y2,c) {
  let dx=Math.abs(x2-x1), sx=x1<x2?1:-1, dy=-Math.abs(y2-y1), sy=y1<y2?1:-1, err=dx+dy;
  while(true){put(im,x1,y1,c);if(x1===x2&&y1===y2)break;const e=2*err;if(e>=dy){err+=dy;x1+=sx;}if(e<=dx){err+=dx;y1+=sy;}}
}
function outline(im,x,y,w,h,c){line(im,x,y,x+w-1,y,c);line(im,x,y,x,y+h-1,c);line(im,x+w-1,y,x+w-1,y+h-1,c);line(im,x,y+h-1,x+w-1,y+h-1,c);}
function ellipse(im,cx,cy,rx,ry,c){for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if(x*x/(rx*rx)+y*y/(ry*ry)<=1)put(im,cx+x,cy+y,c);}
function save(im,rel) {
  const dest=path.join(root,rel); fs.mkdirSync(path.dirname(dest),{recursive:true});
  const crcTable=new Uint32Array(256); for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}
  const crc=(buf)=>{let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
  const chunk=(name,data)=>{const type=Buffer.from(name);const body=Buffer.concat([type,data]);const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const sum=Buffer.alloc(4);sum.writeUInt32BE(crc(body));return Buffer.concat([len,body,sum]);};
  const raw=Buffer.alloc((im.w*4+1)*im.h);for(let y=0;y<im.h;y++)raw.set(im.px.subarray(y*im.w*4,(y+1)*im.w*4),y*(im.w*4+1)+1);
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(im.w,0);ihdr.writeUInt32BE(im.h,4);ihdr[8]=8;ihdr[9]=6;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
  fs.writeFileSync(dest,png); manifest.push({name:path.basename(rel,'.png'),path:`src/assets/pixel/${rel}`,category:rel.split('/')[0],width:im.w,height:im.h,frameCount:null,frameArrangement:null,usage:'Reusable original pixel art asset',status:'complete'});
}
const manifest=[];

// An original compact 32px astronaut, redrawn per direction and pose.
function astronaut(dir='front',pose='idle',suit=palette.white,accent=palette.blue,frame=0) {
  const im=image(32,32);
  // backpack silhouette changes sides with facing.
  if(dir==='back') { rect(im,10,10,12,11,palette.steelDark);rect(im,12,11,8,8,palette.blue);rect(im,13,12,6,6,palette.steel); }
  else if(dir==='left') {rect(im,8,12,5,10,palette.steelDark);rect(im,9,13,3,7,palette.blue);}
  else if(dir==='right') {rect(im,19,12,5,10,palette.steelDark);rect(im,20,13,3,7,palette.blue);}
  else {rect(im,10,12,12,9,palette.steelDark);rect(im,12,13,8,6,palette.blue);rect(im,13,14,6,4,palette.steel);}
  // arms
  const swing=pose==='walk'?[1,0,-1,0][frame%4]:0;
  const armShift=pose==='walk'?[2,0,-2,0][frame%4]:0;
  rect(im,7,15+armShift,5,8-Math.max(armShift,0),suit);rect(im,20,15-armShift,5,8-Math.max(-armShift,0),suit);
  put(im,7,22+armShift,palette.steelDark);put(im,24,22-armShift,palette.steelDark);
  // torso
  rect(im,11,15,10,10,suit);rect(im,12,16,8,7,palette.silver);rect(im,14,17,4,3,accent);
  rect(im,12,22,8,2,palette.steel);put(im,14,20,palette.cyan);
  // legs, alternate feet for walking
  rect(im,11+swing,24,4,4,suit);rect(im,17-swing,24,4,4,suit);
  if(pose==='walk'){rect(im,10+swing,27-Math.max(swing,0),5,3,palette.steelDark);rect(im,18-swing,27-Math.max(-swing,0),5,3,palette.steelDark);}
  else {rect(im,10,27,5,3,palette.steelDark);rect(im,17,27,5,3,palette.steelDark);}
  if(dir==='back') {rect(im,12,25,8,2,palette.steelDark);put(im,13,16,palette.cyan);put(im,18,16,palette.cyan);}
  // helmet and directional visor
  ellipse(im,16,10,7,7,suit); outline(im,9,3,14,14,palette.steelDark);rect(im,11,12,10,2,palette.steel);
  if(dir==='front') {rect(im,11,7,10,6,palette.space);rect(im,12,8,8,4,accent);rect(im,12,8,4,1,palette.cyan);put(im,18,11,palette.white);}
  else if(dir==='back'){rect(im,12,7,8,5,palette.steel);rect(im,13,8,6,3,palette.blue);}
  else if(dir==='left'){rect(im,10,7,7,6,palette.space);rect(im,11,8,5,4,accent);put(im,12,8,palette.cyan);}
  else {rect(im,15,7,7,6,palette.space);rect(im,16,8,5,4,accent);put(im,19,8,palette.cyan);}
  return im;
}
const playerDir=['front','back','left','right'];
for(const dir of playerDir){save(astronaut(dir,'idle'),`characters/player/astronaut-idle-${dir}.png`);for(let f=0;f<4;f++)save(astronaut(dir,'walk',palette.white,palette.blue,f),`characters/player/astronaut-walk-${dir}-${f+1}.png`);}
save(astronaut('front','idle',palette.white,palette.cyan),'characters/player/astronaut-interacting.png');
const celebrate=astronaut('front');rect(celebrate,4,9,4,6,palette.white);rect(celebrate,24,9,4,6,palette.white);put(celebrate,5,8,palette.cyan);put(celebrate,26,7,palette.yellow);save(celebrate,'characters/player/astronaut-celebrating.png');
const explain=astronaut('right');rect(explain,23,14,6,3,palette.silver);put(explain,29,14,palette.cyan);save(explain,'characters/player/astronaut-pointing.png');

// Distinct, small portrait/idle roster for the first future dialogue pass.
const roles=[
  ['mission-commander',palette.blue,palette.steelDark],['scientist',palette.white,palette.blue],['engineer',palette.orange,palette.steelDark],['robotics-specialist',palette.teal,palette.space],['geologist',palette.yellow,palette.rust],['medic',palette.white,palette.green],['explorer-astronaut',palette.silver,palette.cyan],
];
for(const [name,suit,accent] of roles){for(const dir of ['front','back','left','right'])save(astronaut(dir,'idle',suit,accent),`characters/npcs/${name}-idle-${dir}.png`);const portrait=image(48,48);ellipse(portrait,24,22,21,21,palette.steelDark);ellipse(portrait,24,22,19,19,suit);ellipse(portrait,24,22,15,15,palette.steel);rect(portrait,11,18,26,14,palette.space);rect(portrait,13,20,22,9,accent);rect(portrait,13,20,10,2,palette.cyan);put(portrait,33,27,palette.white);save(portrait,`characters/npcs/${name}-portrait.png`);}
for(const name of ['maintenance-robot','assistant-drone','mission-control-hologram']){const im=image(32,32);if(name==='maintenance-robot'){rect(im,7,9,18,16,palette.silver);outline(im,7,9,18,16,palette.steelDark);rect(im,10,14,12,6,palette.space);put(im,13,16,palette.cyan);put(im,19,16,palette.cyan);rect(im,12,23,8,2,palette.steel);rect(im,9,25,4,3,palette.steelDark);rect(im,19,25,4,3,palette.steelDark);}else if(name==='assistant-drone'){ellipse(im,16,16,10,7,palette.steel);ellipse(im,16,15,8,5,palette.silver);rect(im,12,14,8,4,palette.space);rect(im,14,15,4,2,palette.cyan);rect(im,5,12,4,2,palette.blue);rect(im,23,12,4,2,palette.blue);put(im,15,24,palette.cyan);}else{rect(im,9,5,14,7,palette.cyan);rect(im,7,13,18,13,palette.cyan);rect(im,10,15,12,8,palette.blue);rect(im,12,7,8,3,palette.space);rect(im,9,27,5,2,palette.cyan);rect(im,18,27,5,2,palette.cyan);}save(im,`characters/robots/${name}.png`);const p=image(48,48);rect(p,3,3,42,42,palette.space);outline(p,3,3,42,42,palette.cyan);rect(p,10,12,28,20,name==='mission-control-hologram'?palette.cyan:palette.silver);rect(p,14,17,20,8,palette.blue);put(p,18,20,palette.white);put(p,30,20,palette.white);save(p,`characters/robots/${name}-portrait.png`);}

// Seamless repeating 16x16 interior floors and modular metal wall pieces.
const floors=[['metal',palette.steelDark,palette.steel],['reinforced',palette.space,palette.steelDark],['panel',palette.steelDark,palette.steel],['blue-strip',palette.steelDark,palette.blue],['warning',palette.steelDark,palette.orange]];
for(const [n,b,a] of floors){const im=image(16,16,b);if(n==='metal'){for(const p of [[2,3],[9,10],[5,13]])put(im,p[0],p[1],palette.steel);}if(n==='panel'){outline(im,1,1,14,14,a);line(im,8,2,8,13,a);line(im,2,8,13,8,a);}if(n==='reinforced'){line(im,2,2,13,2,a);line(im,2,13,13,13,a);put(im,3,5,palette.steel);put(im,12,10,palette.steel);}if(n==='blue-strip'){rect(im,0,6,16,4,palette.blue);rect(im,0,7,16,2,palette.cyan);for(let x=1;x<16;x+=4)put(im,x,8,palette.white);}if(n==='warning'){for(let x=-8;x<24;x+=8)for(let k=0;k<4;k++)line(im,x+k,15,x+k+7,0,palette.orange);}save(im,`environment/floors/mars-floor-${n}.png`);}
const walls=['straight','top-edge','bottom-edge','left-edge','right-edge','inner-corner','outer-corner','junction','beam'];
for(const n of walls){const im=image(16,16,palette.space);const panel=palette.steelDark,edge=palette.steel,hi=palette.silver;if(n==='straight'||n==='top-edge'||n==='bottom-edge'){rect(im,0,0,16,7,panel);rect(im,0,6,16,2,edge);rect(im,2,1,12,1,hi);if(n==='bottom-edge')rect(im,0,8,16,8,palette.space);if(n==='top-edge')rect(im,0,0,16,4,palette.space);}else if(n==='left-edge'||n==='right-edge'){rect(im,0,0,7,16,panel);rect(im,6,0,2,16,edge);rect(im,1,2,1,12,hi);if(n==='right-edge')rect(im,8,0,8,16,palette.space);}else if(n==='beam'){rect(im,5,0,6,16,panel);rect(im,7,0,2,16,edge);rect(im,6,2,1,12,hi);}else{rect(im,0,0,16,7,panel);rect(im,0,6,16,2,edge);rect(im,0,0,7,16,panel);rect(im,6,0,2,16,edge);rect(im,2,1,4,1,hi);if(n==='junction'){rect(im,9,0,2,16,edge);rect(im,0,9,16,2,edge);}}save(im,`environment/walls/mars-wall-${n}.png`);}
for(const [n,open] of [['standard-closed',false],['standard-open',true],['airlock-closed',false],['airlock-open',true]]){const im=image(32,32,palette.space);rect(im,3,2,26,29,palette.steelDark);outline(im,3,2,26,29,palette.silver);rect(im,6,4,20,25,palette.steel);if(open){rect(im,6,4,8,25,palette.steelDark);rect(im,10,6,2,21,palette.blue);rect(im,17,4,9,25,palette.space);}else{rect(im,8,6,16,21,palette.steelDark);outline(im,8,6,16,21,palette.silver);rect(im,10,8,12,17,palette.space);rect(im,12,10,8,13,palette.blue);put(im,20,18,palette.yellow);if(n.startsWith('airlock')){rect(im,5,3,22,3,palette.orange);rect(im,8,2,16,1,palette.yellow);}}save(im,`environment/doors/mars-door-${n}.png`);}
for(const [n,sky] of [['stars',palette.space],['surface',palette.rust],['mountains',palette.rust]]){const im=image(48,32,palette.steelDark);rect(im,2,2,44,28,sky);outline(im,1,1,46,30,palette.silver);outline(im,4,4,40,24,palette.steel);if(n==='stars'){for(const [x,y] of [[8,9],[17,7],[34,10],[40,19],[12,22],[27,15]])put(im,x,y,palette.white);}else{rect(im,4,22,40,5,palette.rust);if(n==='mountains'){for(let x=5;x<42;x++){const peak=Math.max(0,8-Math.abs(x-16));for(let y=22-peak;y<23;y++)put(im,x,y,palette.orange);}for(let x=25;x<43;x++){const peak=Math.max(0,6-Math.abs(x-33));for(let y=22-peak;y<23;y++)put(im,x,y,palette.yellow);}}else{rect(im,4,20,40,7,palette.orange);rect(im,4,23,40,4,palette.rust);}}save(im,`environment/windows/mars-window-${n}.png`);}
for(const [n,w,h] of [['crate',16,16],['shelf',32,16],['table',32,16],['chair',16,16],['vent',16,16],['pipe',16,16],['floor-light',16,16],['research-equipment',32,32]]){const im=image(w,h);if(n==='crate'){rect(im,2,2,12,12,palette.orange);outline(im,2,2,12,12,palette.steelDark);line(im,3,3,12,12,palette.yellow);line(im,12,3,3,12,palette.rust);}else if(n==='shelf'){rect(im,2,2,28,12,palette.steelDark);rect(im,2,5,28,2,palette.silver);rect(im,2,12,28,2,palette.steel);rect(im,6,3,5,2,palette.blue);rect(im,20,3,7,2,palette.orange);}else if(n==='table'){rect(im,3,3,26,9,palette.steel);outline(im,3,3,26,9,palette.silver);rect(im,6,12,3,3,palette.steelDark);rect(im,23,12,3,3,palette.steelDark);}else if(n==='chair'){rect(im,4,4,8,7,palette.blue);rect(im,4,3,8,2,palette.steel);rect(im,5,11,2,4,palette.steelDark);rect(im,9,11,2,4,palette.steelDark);}else if(n==='vent'){rect(im,1,3,14,10,palette.steelDark);outline(im,1,3,14,10,palette.steel);for(let y=5;y<12;y+=2)line(im,3,y,12,y,palette.silver);}else if(n==='pipe'){rect(im,4,0,8,16,palette.steel);rect(im,6,0,4,16,palette.silver);rect(im,2,4,12,3,palette.steelDark);rect(im,3,5,10,1,palette.cyan);}else if(n==='floor-light'){rect(im,1,5,14,6,palette.space);rect(im,2,6,12,4,palette.blue);rect(im,3,7,10,2,palette.cyan);}else{rect(im,5,5,22,22,palette.steelDark);rect(im,8,8,16,11,palette.space);rect(im,10,10,12,7,palette.blue);put(im,12,12,palette.cyan);rect(im,11,20,10,2,palette.silver);rect(im,8,27,16,2,palette.steel);}save(im,`environment/decorations/mars-${n}.png`);}

// 64px mission console states plus secondary terminals.
for(const state of ['inactive','active','highlighted']){const im=image(64,64,palette.space);rect(im,5,8,54,51,palette.steelDark);outline(im,5,8,54,51,palette.silver);rect(im,10,12,44,30,palette.steel);rect(im,13,15,38,24,state==='inactive'?palette.ink:palette.space);outline(im,13,15,38,24,palette.silver);if(state!=='inactive'){for(let x=17;x<46;x+=5)rect(im,x,20+(x%3),2,4,state==='highlighted'?palette.cyan:palette.blue);rect(im,17,31,28,2,palette.blue);rect(im,17,35,19,1,palette.cyan);}else{rect(im,18,25,4,2,palette.steel);}for(let i=0;i<5;i++)rect(im,13+i*8,47,5,4,i%2?palette.blue:palette.steel);for(let i=0;i<3;i++)put(im,48+i*4,53,state==='inactive'?palette.steel:palette.cyan);rect(im,8,60,48,2,palette.ink);if(state==='highlighted'){outline(im,2,5,60,56,palette.cyan);put(im,58,9,palette.white);put(im,4,56,palette.white);}save(im,`consoles/mission-console-${state}.png`);}
for(const n of ['wall-panel','workstation','mission-monitor','research-terminal','planet-map','radar','status-blue','warning-red','charging-station','scanner']){const im=image(n==='mission-monitor'?64:32,n==='mission-monitor'?48:32);const w=im.w,h=im.h;if(n.includes('status')||n==='warning-red'){ellipse(im,16,16,9,9,n==='status-blue'?palette.cyan:palette.orange);ellipse(im,16,16,5,5,n==='status-blue'?palette.blue:palette.rust);}else{rect(im,3,3,w-6,h-6,palette.steelDark);outline(im,3,3,w-6,h-6,palette.silver);rect(im,6,6,w-12,h-14,palette.space);rect(im,8,8,w-16,h-19,n==='warning-red'?palette.rust:palette.blue);if(n==='radar'){line(im,w/2,8,w/2,h-9,palette.cyan);line(im,8,h/2,w-8,h/2,palette.cyan);ellipse(im,w/2,h/2,5,5,palette.cyan);}if(n==='planet-map'){ellipse(im,w/2,h/2,7,6,palette.rust);put(im,w/2+6,h/2-2,palette.cyan);}rect(im,10,h-7,w-20,2,palette.steel);}save(im,`consoles/${n}.png`);}

for(const n of ['data-chip','mission-tablet','sample-container','mars-rock','mineral-blue','mineral-red','mineral-green','oxygen-tank','power-cell','toolbox','keycard','measuring-device','objective-beacon']){const im=image(16,16);if(n==='data-chip'){rect(im,3,2,10,12,palette.blue);outline(im,3,2,10,12,palette.cyan);rect(im,5,4,6,2,palette.white);rect(im,5,8,2,4,palette.space);}else if(n==='mission-tablet'){rect(im,2,1,12,14,palette.steelDark);outline(im,2,1,12,14,palette.silver);rect(im,4,3,8,8,palette.blue);put(im,7,13,palette.cyan);}else if(n==='sample-container'){rect(im,4,4,8,10,palette.steel);outline(im,4,4,8,10,palette.silver);rect(im,5,7,6,5,palette.orange);rect(im,5,2,6,2,palette.blue);}else if(n==='mars-rock'){for(const [x,y,c] of [[6,4,palette.rust],[7,3,palette.orange],[8,3,palette.orange],[9,4,palette.rust],[5,5,palette.rust],[10,5,palette.orange],[4,6,palette.rust],[11,6,palette.rust],[5,7,palette.orange],[6,8,palette.rust],[10,8,palette.rust],[7,9,palette.rust],[8,9,palette.orange],[9,8,palette.rust]])put(im,x,y,c);}else if(n.startsWith('mineral')){const c=n.endsWith('blue')?palette.cyan:n.endsWith('red')?palette.orange:palette.green;rect(im,5,2,6,3,c);rect(im,3,5,10,7,c);rect(im,5,12,6,2,palette.steel);put(im,6,5,palette.white);}else if(n==='oxygen-tank'){rect(im,5,3,7,11,palette.silver);rect(im,6,1,5,2,palette.blue);rect(im,7,6,3,4,palette.cyan);outline(im,5,3,7,11,palette.steelDark);}else if(n==='power-cell'){rect(im,4,3,8,11,palette.blue);outline(im,4,3,8,11,palette.cyan);rect(im,6,1,4,2,palette.silver);rect(im,7,5,2,6,palette.white);}else if(n==='toolbox'){rect(im,2,5,12,9,palette.orange);outline(im,2,5,12,9,palette.steelDark);rect(im,6,3,4,2,palette.steel);rect(im,7,8,2,3,palette.yellow);}else if(n==='keycard'){rect(im,2,4,12,8,palette.blue);outline(im,2,4,12,8,palette.cyan);rect(im,4,6,5,1,palette.white);rect(im,11,9,1,1,palette.yellow);}else if(n==='measuring-device'){rect(im,5,4,7,9,palette.steelDark);rect(im,6,5,5,4,palette.cyan);rect(im,2,2,2,12,palette.silver);line(im,3,2,6,5,palette.silver);}else{ellipse(im,8,8,6,6,palette.blue);ellipse(im,8,8,3,3,palette.cyan);put(im,8,8,palette.white);line(im,8,1,8,4,palette.cyan);}save(im,`items/${n}.png`);}

// Reusable compact UI frames and a panoramic 320x128 home-screen starfield.
for(const n of ['dialog-frame','nine-slice-panel','continue-indicator','interaction-prompt','menu-cursor','arrow-left','arrow-right','button-normal','button-selected','button-pressed','button-disabled','volume-slider','settings-frame','mission-notification','objective-indicator','inventory-slot','loading-indicator']){const im=image(32,32);const col=n.includes('selected')||n.includes('cursor')||n.includes('interaction')?palette.cyan:palette.steel;rect(im,2,2,28,28,palette.space);outline(im,2,2,28,28,col);rect(im,4,4,24,24,palette.steelDark);if(n==='continue-indicator'||n==='arrow-right'){for(let y=10;y<22;y++)for(let x=10;x<20;x++)if(x>=10+Math.abs(y-16))put(im,x,y,palette.cyan);}else if(n==='arrow-left'){for(let y=10;y<22;y++)for(let x=10;x<20;x++)if(x<=19-Math.abs(y-16))put(im,x,y,palette.cyan);}else if(n==='interaction-prompt'){ellipse(im,16,16,8,8,palette.blue);rect(im,14,9,4,14,palette.white);rect(im,9,14,14,4,palette.white);}else if(n==='menu-cursor'){rect(im,7,14,18,4,palette.cyan);line(im,18,10,23,16,palette.cyan);line(im,23,16,18,22,palette.cyan);}else if(n.includes('button')){rect(im,6,11,20,10,col);outline(im,6,11,20,10,palette.white);if(n==='button-pressed')rect(im,9,17,14,1,palette.steelDark);if(n==='button-disabled')rect(im,8,14,16,3,palette.steel);}else if(n==='volume-slider'){rect(im,6,14,20,4,palette.steel);rect(im,6,14,12,4,palette.blue);rect(im,16,10,4,12,palette.white);}else if(n==='loading-indicator'){for(let i=0;i<8;i++)put(im,16+Math.round(Math.cos(i*Math.PI/4)*9),16+Math.round(Math.sin(i*Math.PI/4)*9),i%2?palette.blue:palette.cyan);}else{rect(im,7,7,18,18,palette.steelDark);outline(im,7,7,18,18,col);rect(im,10,10,12,3,palette.blue);}save(im,`ui/${n}.png`);}
const bg=image(320,128,palette.space);for(let i=0;i<90;i++){const x=(i*73+19)%320,y=(i*37+11)%96;put(bg,x,y,i%5===0?palette.cyan:palette.white);}for(let x=0;x<320;x++){const ridge=93+Math.floor(Math.sin(x/23)*5)+Math.floor(Math.sin(x/9)*2);for(let y=ridge;y<128;y++)put(bg,x,y,y>116?palette.rust:palette.orange);}ellipse(bg,253,91,22,15,palette.rust);ellipse(bg,248,87,20,14,palette.orange);ellipse(bg,243,84,17,11,palette.orange);rect(bg,209,95,83,3,palette.rust);save(bg,'backgrounds/mars-menu-space.png');
const hero=image(320,128,palette.space); // A title-screen vignette assembled from the same native palette.
for(let i=0;i<70;i++)put(hero,(i*59+17)%320,(i*31+7)%90,i%4===0?palette.cyan:palette.white);
for(let x=0;x<320;x++){const y=92+Math.floor(Math.sin(x/26)*4);for(let yy=y;yy<128;yy++)put(hero,x,yy,yy>116?palette.rust:palette.orange);}
ellipse(hero,247,94,22,15,palette.rust);ellipse(hero,242,90,20,14,palette.orange);
const figure=astronaut('front');for(let y=0;y<32;y++)for(let x=0;x<32;x++){const s=(y*32+x)*4;if(figure.px[s+3])hero.px[((77+y)*320+78+x)*4]=figure.px[s];if(figure.px[s+3])hero.px[((77+y)*320+78+x)*4+1]=figure.px[s+1];if(figure.px[s+3])hero.px[((77+y)*320+78+x)*4+2]=figure.px[s+2];if(figure.px[s+3])hero.px[((77+y)*320+78+x)*4+3]=figure.px[s+3];}
save(hero,'backgrounds/mars-menu-hero.png');

for(const item of manifest){if(item.name.startsWith('astronaut-walk-')){item.frameCount=4;item.frameArrangement='Four individual PNG frames numbered 1–4; direction in filename.';item.usage='Player movement animation; 32×32 frame per file.';}else if(item.name.startsWith('astronaut-idle-')){item.frameCount=1;item.frameArrangement='Single 32×32 frame.';item.usage='Player directional idle pose.';}else if(item.name.startsWith('mission-console-'))item.usage='64×64 main mission console state.';}
for(const item of manifest){item.usage=item.usage==='Reusable original pixel art asset'?`Reusable ${item.category} pixel art asset.`:item.usage;}
fs.writeFileSync(path.join(root,'asset-manifest.json'),JSON.stringify({version:1,artStyle:'Original procedural pixel art; hard edges; palette in palette.json',assets:manifest},null,2)+'\n');
fs.writeFileSync(path.join(root,'palette.json'),JSON.stringify(palette,null,2)+'\n');
console.log(`Wrote ${manifest.length} PNG assets under ${root}`);
