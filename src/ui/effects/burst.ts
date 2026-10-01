import {publicAsset} from '../../assets/publicAsset';

export function reduced(){
 return document.querySelector('.game.reduced-motion')!==null||matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function centre(element:Element){const r=element.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}

/** Coins leap from a button and fly into the visible balance. Decorative only:
 * the balance itself already changed and is announced by its status role. */
export function coinBurst(from:Element,count=8){
 if(reduced())return;
 const start=centre(from),targets=[...document.querySelectorAll('.balance')].filter(e=>e.getBoundingClientRect().width>0);
 const target=targets.length?centre(targets.at(-1)!):{x:start.x,y:start.y-160};
 const layer=document.createElement('div');layer.className='fx-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 const flights=Array.from({length:count},(_,i)=>{
  const coin=document.createElement('img');coin.src=publicAsset('/assets/ui/figma/coin.webp');coin.className='fx-coin';coin.alt='';layer.append(coin);
  const angle=-Math.PI/2+(i/(count-1)-.5)*2.2,spread=46+Math.random()*34,peak={x:start.x+Math.cos(angle)*spread,y:start.y+Math.sin(angle)*spread};
  return coin.animate([
   {transform:`translate(${start.x}px,${start.y}px) translate(-50%,-50%) scale(.3) rotate(0deg)`,opacity:0},
   {transform:`translate(${peak.x}px,${peak.y}px) translate(-50%,-50%) scale(1.1) rotate(${160+i*25}deg)`,opacity:1,offset:.32},
   {transform:`translate(${target.x}px,${target.y}px) translate(-50%,-50%) scale(.55) rotate(${420+i*30}deg)`,opacity:.9},
  ],{duration:820+i*45,delay:i*35,easing:'cubic-bezier(.3,.1,.3,1)',fill:'both'}).finished;
 });
 void Promise.allSettled(flights).then(()=>{
  layer.remove();
  for(const balance of targets)balance.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:320,easing:'cubic-bezier(.3,1.6,.5,1)'});
 });
}
/** A ring of sparks around an element, for saved outfits and big moments. */
export function sparkleBurst(around:Element,count=12){
 if(reduced())return;
 const {x,y}=centre(around),r=around.getBoundingClientRect(),radius=Math.max(r.width,r.height)*.42;
 const layer=document.createElement('div');layer.className='fx-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 const colours=['#ffd35c','#c792ff','#7fe0c0','#ff9fb8'];
 const sparks=Array.from({length:count},(_,i)=>{
  const s=document.createElement('span');s.className='fx-spark';s.style.background=colours[i%colours.length];layer.append(s);
  const a=i/count*Math.PI*2,d=radius*(.7+Math.random()*.5);
  return s.animate([
   {transform:`translate(${x}px,${y}px) scale(0) rotate(0deg)`,opacity:1},
   {transform:`translate(${x+Math.cos(a)*d}px,${y+Math.sin(a)*d}px) scale(1) rotate(90deg)`,opacity:1,offset:.6},
   {transform:`translate(${x+Math.cos(a)*d*1.15}px,${y+Math.sin(a)*d*1.15+10}px) scale(.2) rotate(180deg)`,opacity:0},
  ],{duration:900,delay:i*12,easing:'cubic-bezier(.2,.8,.3,1)',fill:'both'}).finished;
 });
 void Promise.allSettled(sparks).then(()=>layer.remove());
}
/** Fireworks over the city and a shower of confetti, for the finale. Returns
 * a cancel function: skipping the scene removes every particle at once. */
export function fireworks(duration=4200){
 if(reduced())return ()=>{};
 const layer=document.createElement('div');layer.className='fx-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 const colours=['#ffd35c','#c792ff','#7fe0c0','#ff9fb8','#8fd3ff','#ffffff'];
 const w=window.innerWidth,h=window.innerHeight,timers:number[]=[];
 const add=(className:string,colour:string)=>{const s=document.createElement('span');s.className=className;s.style.background=colour;s.style.color=colour;layer.append(s);return s;};
 const bursts=Math.round(Math.min(9,Math.max(5,w/170)));
 for(let b=0;b<bursts;b++)timers.push(window.setTimeout(()=>{
  const x=w*(.1+Math.random()*.8),y=h*(.1+Math.random()*.32),colour=colours[b%colours.length],rise=Math.min(h*.45,260);
  const rocket=add('fx-rocket',colour);
  rocket.animate([
   {transform:`translate(${x}px,${y+rise}px) scale(.6)`,opacity:0},
   {transform:`translate(${x}px,${y+rise*.6}px) scale(1)`,opacity:1,offset:.2},
   {transform:`translate(${x}px,${y}px) scale(.8)`,opacity:1},
  ],{duration:520,easing:'cubic-bezier(.2,.7,.4,1)',fill:'forwards'}).finished.then(()=>{
   rocket.remove();
   const count=w<600?16:24,radius=Math.min(w,h)*(w<600?.16:.12);
   for(let i=0;i<count;i++){
    const spark=add('fx-spark fx-firework',i%3?colour:colours[(b+2)%colours.length]);
    const a=i/count*Math.PI*2+Math.random()*.2,d=radius*(.75+Math.random()*.4);
    spark.animate([
     {transform:`translate(${x}px,${y}px) scale(1.2)`,opacity:1},
     {transform:`translate(${x+Math.cos(a)*d}px,${y+Math.sin(a)*d}px) scale(.9)`,opacity:1,offset:.55},
     {transform:`translate(${x+Math.cos(a)*d*1.12}px,${y+Math.sin(a)*d*1.12+d*.45}px) scale(.2)`,opacity:0},
    ],{duration:1250+Math.random()*250,easing:'cubic-bezier(.15,.75,.35,1)',fill:'forwards'});
   }
  },()=>{});
 },b*duration*.7/bursts));
 const confetti=w<600?28:44;
 for(let i=0;i<confetti;i++){
  const piece=add('fx-confetti',colours[i%colours.length]);
  const x=Math.random()*w,drift=(Math.random()-.5)*160,spin=360+Math.random()*540;
  piece.animate([
   {transform:`translate(${x}px,-24px) rotate(0deg) rotateY(0deg)`},
   {transform:`translate(${x+drift}px,${h+24}px) rotate(${spin}deg) rotateY(${spin*1.5}deg)`},
  ],{duration:2600+Math.random()*1600,delay:200+Math.random()*duration*.45,easing:'cubic-bezier(.3,.1,.6,1)',fill:'both'});
 }
 const end=window.setTimeout(()=>layer.remove(),duration+2400);
 return ()=>{timers.forEach(window.clearTimeout);window.clearTimeout(end);layer.remove();};
}
