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
