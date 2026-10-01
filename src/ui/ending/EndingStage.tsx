import {useEffect,useRef,useState} from 'react';
import {publicAsset} from '../../assets/publicAsset';
import {useGame} from '../../stores/gameStore';
import {characters} from '../../content/characters';
import {categories,problemById} from '../../content/problems';
import {endingCopy,endingDialogue,endingOpening,endingTour,type EndingLine} from '../../content/ending';
import {endingDue,endingStats,endingTiming,finaleBeat,type Ending} from '../../game/ending';
import {CharacterStage} from '../dialogue/CharacterStage';
import {CharacterAvatar} from '../wardrobe/CharacterAvatar';
import {ProblemGlyph} from '../../components/city/ProblemGlyph';
import {HudIcon} from '../hud/HudControl';
import {Logo} from '../Logo';
import {useDialog} from '../menus/useDialog';
import {fireworks,sparkleBurst} from '../effects/burst';
import './ending.css';

/** The game's ending, layered over the 3D city like the other scenes: a line
 * from Impactus, a camera tour of the ten transformed places, a celebration,
 * the closing conversation and a closing screen. The camera follows the same
 * store state (src/game/CameraDirector.tsx). */
export function EndingStage({sceneReady}:{sceneReady:boolean}){
 const ending=useGame(s=>s.ending),startEnding=useGame(s=>s.startEnding);
 const due=useGame(s=>endingDue(s.progress)&&!s.resolution&&!s.overlay);
 useEffect(()=>{if(sceneReady&&due)startEnding();},[sceneReady,due,startEnding]);
 if(!ending)return null;
 if(ending.step==='opening')return <EndingDialogue line={endingOpening} lineKey="opening" sceneReady={sceneReady}/>;
 if(ending.step==='tour')return <EndingTour ending={ending}/>;
 if(ending.step==='dialogue')return <EndingDialogue line={endingDialogue[ending.line]} lineKey={'line'+ending.line} sceneReady={sceneReady} skip/>;
 return <EndingClosing/>;
}

/** Runs `done` after `ms` of visible time: a hidden tab pauses the scene. */
function useVisibleTimer(ms:number,key:string,done:()=>void){
 const callback=useRef(done);callback.current=done;
 useEffect(()=>{
  let left=ms,started=0,timer=0;
  const resume=()=>{if(started)return;started=performance.now();timer=window.setTimeout(()=>callback.current(),Math.max(0,left));};
  const pause=()=>{if(!started)return;window.clearTimeout(timer);left-=performance.now()-started;started=0;};
  const visibility=()=>document.hidden?pause():resume();
  visibility();
  document.addEventListener('visibilitychange',visibility);
  return()=>{window.clearTimeout(timer);document.removeEventListener('visibilitychange',visibility);};
 },[ms,key]);
}

function EndingDialogue({line,lineKey,sceneReady,skip=false}:{line:EndingLine;lineKey:string;sceneReady:boolean;skip?:boolean}){
 const advance=useGame(s=>s.advanceEnding),skipEnding=useGame(s=>s.skipEnding);
 const panel=useRef<HTMLElement>(null),tap=useRef<{id:number;x:number;y:number}|null>(null),discardClick=useRef(false);
 const character=characters.companion,label=line.actionLabel??'Continuar';
 useEffect(()=>{panel.current?.focus({preventScroll:true});},[lineKey]);
 // Same tap handling as the story dialogue: a completed primary tap anywhere
 // continues once, and the click a touch synthesizes afterwards is discarded.
 return <div className={'narrative-stage ending-dialogue'+(sceneReady?' can-continue':'')}
  onPointerDown={e=>{discardClick.current=false;tap.current=sceneReady&&e.isPrimary&&e.button===0?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;}}
  onPointerMove={e=>{const start=tap.current;if(start&&start.id===e.pointerId&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)tap.current=null;}}
  onPointerCancel={()=>{tap.current=null;}}
  onPointerUp={e=>{
   const start=tap.current;tap.current=null;
   if(!sceneReady||!start||start.id!==e.pointerId||!e.isPrimary||!(e.target instanceof Element)||e.target.closest('button,a,[role="button"]')||window.getSelection()?.isCollapsed===false)return;
   e.preventDefault();discardClick.current=true;advance();
  }}
  onClickCapture={e=>{if(discardClick.current&&e.detail>0){discardClick.current=false;e.preventDefault();e.stopPropagation();}}}>
  <div className="narrative-content">
   <div className="dialogue-scene">
    <CharacterStage characterId="companion" pose={line.pose}/>
    <section className="dialogue-box" ref={panel} tabIndex={-1} aria-label="Conversa final com o companheiro"
     onKeyDown={e=>{if(sceneReady&&e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)advance();}}}>
     <div className="speaker-plate"><b>{character.name}</b></div>
     <img className="dialogue-stripes" src={publicAsset('/assets/ui/figma/stripes.svg')} alt=""/>
     <div className="dialogue-body" key={lineKey}><p>{line.text}</p></div>
     <div className="dialogue-actions">
      <button className="dialogue-continue" onClick={advance} disabled={!sceneReady} aria-label={`${label} →`}>Toque para continuar...</button>
     </div>
    </section>
   </div>
  </div>
  {skip&&<button className="resolution-skip ending-skip" onClick={skipEnding}>{endingCopy.skipDialogue} <HudIcon name="forward"/></button>}
 </div>;
}

function EndingTour({ending}:{ending:Ending}){
 const advance=useGame(s=>s.advanceEnding),skipEnding=useGame(s=>s.skipEnding);
 const reduced=useGame(s=>s.progress.settings.reducedMotion);
 const finale=ending.beat>=finaleBeat;
 useVisibleTimer(finale?endingTiming.finale:endingTiming.place,`${ending.sequence}:${ending.beat}`,advance);
 const stop=finale?null:endingTour[ending.beat],problem=stop?problemById[stop.problemId]:null;
 useEffect(()=>{
  // Sparkles greet each place's check balloon as the camera arrives.
  if(!stop)return;
  const timer=window.setTimeout(()=>{
   const balloon=document.querySelector(`[data-solved="${stop.problemId}"]`);
   if(balloon)sparkleBurst(balloon,14);
  },reduced?150:endingTiming.flight*1000);
  return()=>window.clearTimeout(timer);
 },[stop,reduced]);
 useEffect(()=>{
  if(!finale)return;
  let cancel=()=>{};
  const timer=window.setTimeout(()=>{cancel=fireworks(3600);},reduced?0:endingTiming.finaleFlight*500);
  return()=>{window.clearTimeout(timer);cancel();};
 },[finale,reduced]);
 return <div className="ending-tour" data-beat={ending.beat}>
  {problem&&stop?<div className="ending-caption" key={ending.beat} data-category={problem.category}>
   <ol className="ending-dots" aria-hidden="true">{endingTour.map((_,i)=><li key={i} data-state={i<ending.beat?'done':i===ending.beat?'active':'next'}/>)}</ol>
   <span className="ending-place"><span className="ending-glyph"><ProblemGlyph id={problem.id} fallback={problem.markerIcon}/></span>{categories[problem.category].label} · {problem.regionName}</span>
   <strong>{problem.title}</strong>
   <p>{stop.caption}</p>
  </div>:<div className="ending-finale" key="finale">
   <span className="ending-finale-badge" aria-hidden="true"><HudIcon name="check"/></span>
   <strong>{endingCopy.finaleTitle}</strong>
   <p>{endingCopy.finaleText}</p>
  </div>}
  <span className="sr-only" role="status">{problem&&stop?`${ending.beat+1} de ${endingTour.length}: ${problem.title}. ${stop.caption}`:`${endingCopy.finaleTitle} ${endingCopy.finaleText}`}</span>
  <button className="resolution-skip ending-skip" onClick={skipEnding}>{endingCopy.skipTour} <HudIcon name="forward"/></button>
 </div>;
}

function EndingClosing(){
 const progress=useGame(s=>s.progress),closeEnding=useGame(s=>s.closeEnding),playEnding=useGame(s=>s.playEnding),reset=useGame(s=>s.reset);
 const [confirm,setConfirm]=useState(false);
 const panel=useDialog(closeEnding);
 const stats=endingStats(progress);
 const hero=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{if(hero.current)sparkleBurst(hero.current,16);},700);
  return()=>window.clearTimeout(timer);
 },[]);
 return <div className="ending-closing">
  <section className="ending-card" ref={panel} role="dialog" aria-modal="true" aria-labelledby="ending-title" tabIndex={-1}>
   <div className="ending-logo"><Logo compact/></div>
   <div className="ending-hero" ref={hero}><CharacterAvatar outfit={progress.wardrobe.equipped} pose="character_success" label="Impactus comemorando"/></div>
   <span className="panel-eyebrow">{endingCopy.eyebrow}</span>
   <h2 id="ending-title">{endingCopy.title}</h2>
   <ul className="ending-stats">
    <li><b>{stats.places}/{stats.total}</b><span>lugares transformados</span></li>
    <li><b>{stats.decisions}</b><span>{stats.decisions===1?'decisão tomada':'decisões tomadas'}</span></li>
    <li><b>{stats.firstTry}</b><span>{stats.firstTry===1?'acerto de primeira':'acertos de primeira'}</span></li>
   </ul>
   <p className="ending-message">{stats.firstTry===stats.total?endingCopy.perfect:endingCopy.learned}</p>
   <p className="ending-thanks">{endingCopy.thanks}</p>
   {confirm?<div className="ending-confirm" role="alertdialog" aria-label={endingCopy.restart}>
    <p>{endingCopy.restartConfirm}</p>
    <button className="danger" onClick={reset}>{endingCopy.restartYes}</button>
    <button className="text-button" onClick={()=>setConfirm(false)}>{endingCopy.restartNo}</button>
   </div>:<div className="ending-actions">
    <button className="primary" data-sfx="start" onClick={closeEnding}>{endingCopy.explore} <HudIcon name="forward"/></button>
    <button className="ending-secondary" onClick={()=>{closeEnding();playEnding();}}>{endingCopy.replay}</button>
    <button className="text-button" onClick={()=>setConfirm(true)}>{endingCopy.restart}</button>
   </div>}
  </section>
 </div>;
}
