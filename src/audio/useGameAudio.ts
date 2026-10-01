import {useEffect} from 'react';
import {useGame} from '../stores/gameStore';
import {gameAudio,type MusicMood,type Sfx} from './gameAudio';
import type {Progress} from '../game/types';
import {endingTiming,finaleBeat,type Ending} from '../game/ending';
import type {ArrivalBeat} from '../game/arrival';

const storyPhases=new Set(['INTRO','TUTORIAL_QUESTION','TUTORIAL_RESULT','FOCUSING','CONTEXT','COMMENT','QUESTION','RESULT']);
function moodFor(progress:Progress,overlay:string|null,ending:Ending|null=null,arriving=false):MusicMood{
 if(overlay)return 'indoor';
 if(arriving)return 'city';
 // The tour and the closing screen play the full soundtrack; the talk lowers it.
 if(ending)return ending.step==='opening'||ending.step==='dialogue'?'story':'city';
 return storyPhases.has(progress.phase)?'story':'city';
}
/** Which cue a click on a control plays, unless it declares `data-sfx`. */
function clickCue(target:Element):Sfx|null{
 const control=target.closest<HTMLElement>('button,[role="tab"],summary,input[type="checkbox"],select,[data-sfx]');
 if(!control||control.matches('[aria-disabled="true"]'))return null;
 const declared=control.dataset.sfx;if(declared)return declared==='none'?null:declared as Sfx;
 if(control instanceof HTMLInputElement)return control.checked?'toggle-on':'toggle-off';
 if(control.matches('select'))return null;
 if(control.matches('[role="tab"],summary,.accessory-card'))return 'select';
 if(control.matches('.back-to-map,.shop-back,.round-close,.settings-close,[aria-label^="Fechar"],[aria-label^="Voltar"]'))return 'back';
 return 'tap';
}

/** Connects the game's state changes and controls to sound. Components stay
 * silent: outcomes (coins, purchases, solved places) are heard from the store. */
export function useGameAudio(revealed:boolean){
 const settings=useGame(s=>s.progress.settings);
 useEffect(()=>{gameAudio.setVolumes(settings.muted?0:settings.musicVolume,settings.muted?0:settings.sfxVolume);},[settings.muted,settings.musicVolume,settings.sfxVolume]);
 useEffect(()=>{
  const unlock=(event:Event)=>{
   gameAudio.unlock();
   // Disabled buttons never receive clicks; answer the attempt with a soft refusal.
   if(event.type==='pointerdown'&&event.target instanceof Element&&event.target.closest('button:disabled'))gameAudio.play('blocked');
  };
  const click=(event:MouseEvent)=>{if(event.target instanceof Element){const cue=clickCue(event.target);if(cue)gameAudio.play(cue,{detune:cue==='tap'?Math.random()*120-60:0});}};
  const visibility=()=>gameAudio.suspend(document.visibilityState==='hidden');
  window.addEventListener('pointerdown',unlock,true);window.addEventListener('keydown',unlock,true);
  window.addEventListener('click',click,true);document.addEventListener('visibilitychange',visibility);
  return ()=>{window.removeEventListener('pointerdown',unlock,true);window.removeEventListener('keydown',unlock,true);window.removeEventListener('click',click,true);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{if(revealed)gameAudio.startMusic();},[revealed]);
 useEffect(()=>{
  gameAudio.setMood(moodFor(useGame.getState().progress,useGame.getState().overlay,useGame.getState().ending,!!useGame.getState().arrival));
  return useGame.subscribe((state,prev)=>{
   const a=state.progress,b=prev.progress;
   gameAudio.setMood(moodFor(a,state.overlay,state.ending,!!state.arrival));
   if(state.ending!==prev.ending)endingCue(state.ending,prev.ending);
   if(state.arrival&&state.arrival.beat!==(prev.arrival?.sequence===state.arrival.sequence?prev.arrival.beat:undefined))arrivalCue(state.arrival.beat);
   if(state.overlay!==prev.overlay)gameAudio.play(state.overlay?'open':'close');
   if(state.notice&&state.notice!==prev.notice)gameAudio.play('notice');
   if(a===b)return;
   const gained=a.coins-b.coins;
   if(gained>0)gameAudio.play(a.dailyMissions.bonusClaimed&&!b.dailyMissions.bonusClaimed?'level-up':'coin');
   else if(gained<0&&state.overlay==='shop')gameAudio.play('purchase');
   if(a.dailyMissions.energy&&!b.dailyMissions.energy)gameAudio.play('bonus');
   if(JSON.stringify(a.wardrobe.equipped)!==JSON.stringify(b.wardrobe.equipped))gameAudio.play('success');
   const available=(p:Progress)=>Object.values(p.problemStates).filter(v=>v!=='HIDDEN'&&v!=='LOCKED').length;
   if(available(a)>available(b))window.setTimeout(()=>gameAudio.play('unlock'),900);
   if(a.phase==='FOCUSING'&&b.phase!=='FOCUSING')gameAudio.play('focus');
   if(a.decisions.length>b.decisions.length){
    gameAudio.play('confirm');
    // With an animation the outcome sounds when the city finishes changing.
    if(!state.resolution)outcome(a);else gameAudio.play('progress',{volume:.8});
   }
   else if(a.dialogueNodeId!==b.dialogueNodeId||a.introIndex!==b.introIndex)gameAudio.play('advance');
  });
 },[]);
 useEffect(()=>useGame.subscribe((state,prev)=>{if(prev.resolution&&!state.resolution&&state.progress.decisions.length)outcome(state.progress);}),[]);
}
/** The ending: a chime when Impactus notices, one as each place's balloon
 * appears, the fanfare over the whole city and a flourish on the closing screen. */
function endingCue(ending:Ending|null,previous:Ending|null){
 if(!ending)return;
 if(!previous||previous.sequence!==ending.sequence){gameAudio.play('achievement');return;}
 if(ending.step==='tour'&&(previous.step!=='tour'||previous.beat!==ending.beat)){
  if(ending.beat>=finaleBeat){window.setTimeout(()=>{if(useGame.getState().ending===ending){gameAudio.fanfare();gameAudio.play('level-up');}},endingTiming.finaleFlight*500);return;}
  window.setTimeout(()=>{if(useGame.getState().ending===ending)gameAudio.play('unlock',{volume:.8});},endingTiming.flight*1000);
 }
 else if(ending.step==='dialogue'&&(previous.step!=='dialogue'||previous.line!==ending.line))gameAudio.play('advance');
 else if(ending.step==='closing'&&previous.step!=='closing')gameAudio.play('success');
}
/** Impactus' arrival: a distant gust, the pass by the camera, the dive and the landing. */
function arrivalCue(beat:ArrivalBeat){
 if(beat==='approach')gameAudio.whoosh({seconds:1.6,from:700,to:1900,volume:.18,pan:[.8,.3]});
 else if(beat==='flyby')gameAudio.whoosh({seconds:1,from:450,to:2600,volume:.5,pan:[.5,-.8]});
 else if(beat==='dive')gameAudio.whoosh({seconds:1,from:2400,to:420,volume:.42,pan:[-.6,0]});
 else{gameAudio.impact();window.setTimeout(()=>gameAudio.play('success',{volume:.8}),350);}
}
function outcome(progress:Progress){
 const effectiveness=progress.decisions.at(-1)?.effectiveness;
 if(effectiveness==='COMPLETE'){gameAudio.play('achievement');gameAudio.fanfare();}
 else if(effectiveness==='TEMPORARY')gameAudio.play('warning');
 else gameAudio.play('error');
}
