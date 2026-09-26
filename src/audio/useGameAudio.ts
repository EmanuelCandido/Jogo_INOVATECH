import {useEffect} from 'react';
import {useGame} from '../stores/gameStore';
import {gameAudio,type MusicMood,type Sfx} from './gameAudio';
import type {Progress} from '../game/types';

const storyPhases=new Set(['INTRO','TUTORIAL_QUESTION','TUTORIAL_RESULT','FOCUSING','CONTEXT','COMMENT','QUESTION','RESULT']);
function moodFor(progress:Progress,overlay:string|null):MusicMood{
 if(overlay)return 'indoor';
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
  gameAudio.setMood(moodFor(useGame.getState().progress,useGame.getState().overlay));
  return useGame.subscribe((state,prev)=>{
   const a=state.progress,b=prev.progress;
   gameAudio.setMood(moodFor(a,state.overlay));
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
function outcome(progress:Progress){
 const effectiveness=progress.decisions.at(-1)?.effectiveness;
 if(effectiveness==='COMPLETE'){gameAudio.play('achievement');gameAudio.fanfare();}
 else if(effectiveness==='TEMPORARY')gameAudio.play('warning');
 else gameAudio.play('error');
}
