window.PF_FALLBACK_PATTERNS = [
  {
    id: "origin", num: 1, name: "Origin", desc: "Concentric sine waves sampled by an emergent grid",
    author: "Seunghun LEE", license: "CC-BY-SA-4.0", slug: "origin", labOnly: false,
    code: `// Pattern: Origin
// Author: Seunghun LEE
// SPDX-License-Identifier: CC-BY-SA-4.0
function hsvToRgb(h,s,v){let r,g,b;let i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);switch(((i%6)+6)%6){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;default:r=v;g=p;b=q;}return[Math.floor(r*255),Math.floor(g*255),Math.floor(b*255)];}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function setup(p){p.hue=0;p.speed=2;p.mode=0;p.freq=.06;p.timeAcc=0;}
export function update(dt,input,p){if(input&&input.knobValues){let v=input.knobValues;if(!p.lastKnob)p.lastKnob=[...v];if(Math.abs(v[0]-p.lastKnob[0])>1e-6)p.hue=v[0];if(Math.abs(v[1]-p.lastKnob[1])>1e-6)p.speed=v[1];if(Math.abs(v[2]-p.lastKnob[2])>1e-6)p.mode=v[2];if(Math.abs(v[3]-p.lastKnob[3])>1e-6)p.freq=v[3];p.lastKnob=[...v];}if(input&&input.btnPressed){if(input.btnPressed[0])p.hue=0;if(input.btnPressed[1])p.speed=0;if(input.btnPressed[2])p.mode=0;if(input.btnPressed[3])p.freq=0;}p.timeAcc+=dt*p.speed;}
export function draw(display,p){let w=display.width,h=display.height,t=p.timeAcc;let mode=Math.floor(clamp(p.mode,0,4));let rows,cols,gap,tileSize,gridStep,gridCells;if(mode===0){rows=1;cols=2;gap=4;tileSize=56;gridStep=7;gridCells=8;}else if(mode===1){rows=2;cols=4;gap=3;tileSize=27;gridStep=3;gridCells=9;}else if(mode===2){rows=3;cols=6;gap=2;tileSize=18;gridStep=3;gridCells=6;}else if(mode===3){rows=3;cols=6;gap=2;tileSize=18;gridStep=2;gridCells=9;}else{rows=6;cols=12;gap=0;tileSize=10;gridStep=2;gridCells=5;}let totalW=cols*tileSize+(cols+1)*gap,totalH=rows*tileSize+(rows+1)*gap,offsetX=Math.floor((w-totalW)/2),offsetY=Math.floor((h-totalH)/2),cellW=tileSize+gap,cellH=tileSize+gap,cx=tileSize/2,knobFreqBase=50+p.freq*950,knobFreqVar=p.freq*1000,hc=hsvToRgb(p.hue,1,1);for(let y=0;y<h;y++){let py=y-offsetY;for(let x=0;x<w;x++){let px=x-offsetX,r=0,g=0,b=0,ti=Math.floor((px-gap)/cellW),tj=Math.floor((py-gap)/cellH);if(ti>=0&&ti<cols&&tj>=0&&tj<rows){let lx=px-(gap+ti*cellW),ly=py-(gap+tj*cellH);if(lx>=0&&lx<tileSize&&ly>=0&&ly<tileSize){let gx=Math.min(Math.floor(lx/gridStep),gridCells-1),gy=Math.min(Math.floor(ly/gridStep),gridCells-1),sx=gx*gridStep+gridStep/2,sy=gy*gridStep+gridStep/2,dx=sx-cx,dy=sy-cx,dist=Math.sqrt(dx*dx+dy*dy),tileFreq=knobFreqBase+(tj*cols+ti)*knobFreqVar*.15,wave=Math.sin(dist*tileFreq*.5+t*2),tt=clamp((wave*.8+1)*.5,0,1);if(tt>=.154){r=10;g=10;b=10;}if(tt>=.556){r=clamp(Math.floor(hc[0]*1.5),0,255);g=clamp(Math.floor(hc[1]*1.5),0,255);b=clamp(Math.floor(hc[2]*1.5),0,255);}if(tt>=.816){r=255;g=255;b=255;}}}display.setPixel(x,y,r,g,b);}}}`
  },
  {
    id: "wave-saw", num: 2, name: "Wave Saw", desc: "Rotated sawtooth waves with fractal noise distortion",
    author: "Seunghun LEE", license: "CC-BY-SA-4.0", slug: "wave-saw", labOnly: false,
    code: `// Pattern: Wave Saw
// Author: Seunghun LEE
// SPDX-License-Identifier: CC-BY-SA-4.0
// Knob 1: Angle · Knob 2: Scale · Knob 3: Distortion · Knob 4: Distortion scale
function hash(x,y){let n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);}function noise(px,py){let ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),n00=hash(ix,iy),n10=hash(ix+1,iy),n01=hash(ix,iy+1),n11=hash(ix+1,iy+1),nx0=n00+(n10-n00)*ux,nx1=n01+(n11-n01)*ux;return nx0+(nx1-nx0)*uy;}function fractalNoise(px,py){let sum=0,amp=1,maxAmp=0,freq=1;for(let i=0;i<2;i++){sum+=noise(px*freq,py*freq)*amp;maxAmp+=amp;amp*=.22;freq*=2;}return sum/maxAmp;}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function setup(p){p.angle=0;p.scale=3;p.dist=0;p.dScale=.15;p.timeAcc=0;}
export function update(dt,input,p){if(input&&input.knobValues){p.angle=input.knobValues[0];p.scale=input.knobValues[1];p.dist=input.knobValues[2];p.dScale=input.knobValues[3];}p.timeAcc+=dt;}
export function draw(display,p){let w=display.width,h=display.height,angle=p.angle*6.28318,scale=clamp(p.scale,.5,6),dist=clamp(p.dist,0,4),dScale=.3+clamp(p.dScale,0,1)*4.7,phase=p.timeAcc*2.4,cosA=Math.cos(angle),sinA=Math.sin(angle),halfW=w/2,halfH=h/2;for(let y=0;y<h;y++){let v=(y-halfH)/w;for(let x=0;x<w;x++){let u=(x-halfW)/halfW,xr=u*cosA-v*sinA,yr=u*sinA+v*cosA,n=xr*scale*20+phase;if(dist>.01){let nz=fractalNoise(xr*dScale,yr*dScale)*2-1;n+=dist*nz;}let tt=n/6.28318;tt-=Math.floor(tt);let r,g,b;if(tt<.14){r=255;g=255;b=255;}else if(tt<.4){r=255;g=0;b=0;}else{r=0;g=0;b=255;}display.setPixel(x,y,r,g,b);}}}`
  }
];
