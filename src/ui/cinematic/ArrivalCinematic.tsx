import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useGame} from '../../stores/gameStore';
import {story} from '../../content/story';
import {arrivalPoseIds,type Arrival} from '../../game/arrival';
import {CharacterAvatar} from '../wardrobe/CharacterAvatar';
import {HudIcon} from '../hud/HudControl';
import {arrivalStage,heroTransform,resetArrivalStage} from './arrivalStage';
import {arrivalPoses,heroFeet,poseBox} from './arrivalPoses';

type Stage='playing'|'handoff'|'settle';
const exitMs=300;

/** Letterbox, Impactus, his trail and the chapter card over the 3D arrival.
 * His drawings are stacked and the timeline cross-fades them; they show the
 * classic look, the outfit appears as he jumps into the portrait. When the
 * arrival ends (or is skipped) the story's first line is already
 * mounted underneath: Impactus jumps into the dialogue portrait and the
 * overlay leaves. */
export function ArrivalCinematic(){
 const arrival=useGame(s=>s.arrival),finish=useGame(s=>s.finishArrival),outfit=useGame(s=>s.progress.wardrobe.equipped);
 const [shown,setShown]=useState<Arrival|null>(arrival);
 const [stage,setStage]=useState<Stage>('playing');
 const hero=useRef<HTMLDivElement>(null),turn=useRef<HTMLDivElement>(null),pose=useRef<HTMLDivElement>(null),intro=useRef<HTMLDivElement>(null),trail=useRef<HTMLCanvasElement>(null),skip=useRef<HTMLButtonElement>(null);
 // Beats replace the store object; the sequence identifies one arrival.
 if(arrival&&arrival!==shown){setShown(arrival);if(arrival.sequence!==shown?.sequence)setStage('playing');}
 else if(!arrival&&shown&&stage==='playing')setStage('handoff');
 const sequence=shown?.sequence;
 useLayoutEffect(()=>{
  if(sequence===undefined)return;
  resetArrivalStage();
  const layers=Object.fromEntries(arrivalPoseIds.map(id=>[id,hero.current?.querySelector<HTMLElement>(`[data-pose=${id}]`)]));
  Object.assign(arrivalStage,{hero:hero.current,turn:turn.current,pose:pose.current,trail:trail.current,layers,ready:false,size:hero.current?.offsetWidth??0});
  // The timeline holds the flight until the drawings are decoded.
  let active=true;
  Promise.all([...hero.current?.querySelectorAll('img')??[]].map(image=>image.decode().catch(()=>{}))).then(()=>{if(active)arrivalStage.ready=true;});
  const resize=new ResizeObserver(()=>{arrivalStage.size=hero.current?.offsetWidth??0;});
  if(hero.current)resize.observe(hero.current);
  return()=>{active=false;resize.disconnect();Object.assign(arrivalStage,{hero:null,turn:null,pose:null,trail:null,layers:{},ready:false,size:0});};
 },[sequence]);
 useEffect(()=>{if(sequence!==undefined)skip.current?.focus({preventScroll:true});},[sequence]);
 useLayoutEffect(()=>{
  if(stage!=='handoff')return;
  // Fly into the portrait of the first line, which mounted in this commit.
  // The portrait is cropped at the top of the dialogue box: the legs fade
  // into that edge on the way, so nothing is left over the text.
  const portrait=document.querySelector('.narrative-stage .character-avatar'),box=portrait?.getBoundingClientRect();
  const crop=portrait?.closest('.character-stage')?.getBoundingClientRect();
  const element=hero.current,size=element?.offsetWidth??0;
  if(!element||!turn.current||!box?.width||!crop||!size||element.style.opacity!=='1'){setStage('settle');return;}
  const scale=box.width/size,hidden=Math.min(100,Math.max(0,(box.bottom-crop.bottom)/box.height*100));
  const end=heroTransform(box.left+scale*heroFeet.x*size,box.top+scale*heroFeet.y*size,scale,0,size,-1);
  const timing={duration:520,easing:'cubic-bezier(.3,1.15,.45,1)',fill:'forwards'} as const;
  // On the way he changes into the portrait's drawing, with the outfit.
  const blend={duration:220,easing:'ease-out',fill:'forwards'} as const;
  const animations=[
   element.animate([{transform:element.style.transform},{transform:end}],timing),
   turn.current.animate([{transform:turn.current.style.transform||'scaleX(1)',clipPath:'inset(0 0 0 0)'},{transform:'scaleX(-1)',clipPath:`inset(0 0 ${hidden}% 0)`}],timing),
   ...Object.values(arrivalStage.layers).filter(e=>e!==undefined).map(e=>e.animate([{opacity:e.style.opacity||'0'},{opacity:0}],blend)),
  ];
  if(pose.current)animations.push(pose.current.animate([{transform:pose.current.style.transform||'none'},{transform:'none'}],timing));
  if(intro.current)animations.push(intro.current.animate([{opacity:0},{opacity:1}],blend));
  // Finished, they hold him in the portrait while the overlay fades out.
  let active=true,landed=false;
  animations[0].finished.then(()=>{if(active){landed=true;setStage('settle');}},()=>{});
  return()=>{active=false;if(!landed)animations.forEach(a=>a.cancel());};
 },[stage]);
 useEffect(()=>{
  if(stage!=='settle')return;
  const timer=window.setTimeout(()=>{setShown(null);setStage('playing');},exitMs);
  return()=>window.clearTimeout(timer);
 },[stage]);
 if(!shown)return null;
 return <section className="arrival" data-beat={shown.beat} data-stage={stage} aria-label="Chegada de Impactus à cidade">
  <div className="arrival-bars" aria-hidden="true"><i/><i/></div>
  <canvas className="arrival-trail" ref={trail} aria-hidden="true"/>
  <div className="arrival-flash" aria-hidden="true"/>
  <div className="arrival-hero" ref={hero} style={{opacity:0}} aria-hidden="true">
   <span className="arrival-impact"/>
   <div className="arrival-turn" ref={turn}>
    <div className="arrival-pose" ref={pose}>
     {arrivalPoseIds.map(id=><img key={id} className="arrival-drawing" data-pose={id} src={arrivalPoses[id].src} alt="" width="768" height="768" style={{...poseBox(arrivalPoses[id]),opacity:0}}/>)}
     <div className="arrival-avatar" ref={intro} data-pose="intro" style={{opacity:0}}><CharacterAvatar outfit={outfit} pose="character_intro" label=""/></div>
    </div>
   </div>
   <p className="arrival-bubble">Cheguei!</p>
  </div>
  <header className="arrival-title">
   <h2>Eco City</h2>
   <p>{story.chapter.title}</p>
  </header>
  <p className="sr-only" role="status">Impactus está chegando voando à Eco City.</p>
  <button ref={skip} className="arrival-skip" onClick={()=>{if(arrival)finish(arrival.sequence);}} disabled={stage!=='playing'}>
   Pular abertura <HudIcon name="forward"/>
  </button>
 </section>;
}
