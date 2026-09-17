import {publicAsset} from '../../assets/publicAsset';
import {useEffect,useRef} from 'react';
import {useGame} from '../../stores/gameStore';
import {introNode,dialogueCopy} from '../../content/dialogues';
import {characters} from '../../content/characters';
import {problemById} from '../../content/problems';
import {questions,tutorialQuestion} from '../../content/questions';
import {story} from '../../content/story';
import {canAfford} from '../../game/economy';
import {CharacterStage} from './CharacterStage';
import {ChoiceList} from '../choices/ChoiceList';
import type {CharacterPose} from '../../game/types';
export function DialogueStage({sceneReady}:{sceneReady:boolean}){
 const {progress:s,next,narrativeChoice,choose}=useGame(),panel=useRef<HTMLElement>(null);
 const tap=useRef<{id:number;x:number;y:number}|null>(null);
 const discardClick=useRef(false);
 const node=introNode(s),p=s.selectedProblem?problemById[s.selectedProblem]:null;
 const tutorial=s.phase==='TUTORIAL_QUESTION'||s.phase==='TUTORIAL_RESULT';
 const isQuestion=s.phase==='QUESTION'||s.phase==='TUTORIAL_QUESTION';
 const canContinue=sceneReady&&!isQuestion;
 const q=tutorial?tutorialQuestion:p?questions[p.questionId]:null;
 const decision=p?s.decisions.findLast(d=>d.problemId===p.id):null;
 const answer=tutorial?tutorialQuestion.alternatives.find(a=>a.id===s.tutorialAnswerId):q?.alternatives.find(a=>a.id===decision?.alternativeId);
 const result=(s.phase==='RESULT'||s.phase==='TUTORIAL_RESULT')&&answer;
 const characterId='companion',character=characters[characterId];
 const pose:CharacterPose=s.phase==='INTRO'?node.pose:result?(answer.effectiveness==='COMPLETE'?'character_success':'character_failure'):s.phase==='COMMENT'?(p?.characterPose??'character_thinking'):'character_thinking';
 const title=s.phase==='INTRO'?node.title:result?answer.consequence:isQuestion?q?.text:p?.title;
 const text=s.phase==='INTRO'?node.text:result?answer.explanation:s.phase==='COMMENT'?p?.comment:s.phase==='CONTEXT'?p?.description:tutorial?story.tutorial.context:story.tutorial.costs;
 useEffect(()=>{
  if(s.phase!=='FOCUSING'||!p)return;
  // Use the clear preview to decode the incoming portrait, so a cold reload
  // does not spend its entrance animation waiting for the image to download.
  const image=new Image();image.src=character.poses[p.characterPose];
  void image.decode().catch(()=>{});
 },[s.phase,p,character]);
 useEffect(()=>{panel.current?.focus({preventScroll:true});panel.current?.scrollTo(0,0);},[s.phase,s.dialogueNodeId,s.selectedProblem]);
 if(!['INTRO','COMMENT','CONTEXT','QUESTION','RESULT','TUTORIAL_QUESTION','TUTORIAL_RESULT'].includes(s.phase))return null;
 const advanceLabel=s.phase==='INTRO'?node.actionLabel:s.phase==='COMMENT'?'Entender a situação':s.phase==='CONTEXT'?dialogueCopy.contextAction:s.phase==='TUTORIAL_RESULT'?(answer?.effectiveness==='COMPLETE'?'Investigar a cidade':'Tentar novamente'):dialogueCopy.resultAction;
 return <div className={'narrative-stage '+(p?'problem-dialogue ':'')+(s.phase==='COMMENT'?'problem-arrival ':'')+(isQuestion?'has-choices ':'')+(result?'has-result ':'')+(canContinue?'can-continue':'')}
  onPointerDown={e=>{
   discardClick.current=false;
   tap.current=canContinue&&e.isPrimary&&e.button===0?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;
  }}
  onPointerMove={e=>{
   const start=tap.current;
   if(start&&start.id===e.pointerId&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)tap.current=null;
  }}
  onPointerCancel={()=>{tap.current=null;}}
  onPointerUp={e=>{
   const start=tap.current;tap.current=null;
   // Browsers can omit click after a touch scroll. Handle a completed primary
   // tap once; native buttons keep their own click and keyboard behavior.
   if(!canContinue||!start||start.id!==e.pointerId||!e.isPrimary||!(e.target instanceof Element)
    ||e.target.closest('button,a,input,select,textarea,[role="button"]')
    ||window.getSelection()?.isCollapsed===false)return;
   e.preventDefault();
   discardClick.current=true;
   next();
  }}
  onClickCapture={e=>{
   // A touch can synthesize click after pointerup has already changed the UI.
   // Consume that click even if a new button is now under the finger.
   if(discardClick.current&&e.detail>0){discardClick.current=false;e.preventDefault();e.stopPropagation();}
  }}>
  <div className="narrative-content">
   <div className="dialogue-scene">
   <CharacterStage characterId={characterId} pose={pose}/>
   <section className={'dialogue-box '+(result?'result':'')} ref={panel} tabIndex={-1}
    aria-label={result?'Resultado da decisão':isQuestion?'Escolher uma solução':s.phase==='INTRO'?'Apresentação do companheiro':s.phase==='COMMENT'?'Observação do companheiro':'Contexto do problema'}
    data-effectiveness={result?answer.effectiveness:undefined}
    onKeyDown={e=>{if(sceneReady&&!isQuestion&&e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)next();}}}>
    <div className="speaker-plate"><b>{character.name}</b></div>
    <img className="dialogue-stripes" src={publicAsset('/assets/ui/figma/stripes.svg')} alt="" />
    <div className="dialogue-body" key={`${s.phase}:${s.dialogueNodeId}`}>
     {result&&<div className="eyebrow">{story.results[answer.effectiveness].label}</div>}
     {(isQuestion||result)&&<h2>{title}</h2>}
     {!isQuestion&&<p>{text}</p>}
     {result&&!tutorial&&p&&<div className="result-receipt"><span>✦ − {answer.cost} moedas investidas</span>{answer.effectiveness==='COMPLETE'&&<span>+ {p.rewards} pela transformação</span>}</div>}
    </div>
    <div className="dialogue-actions">
     {!sceneReady&&<span className="scene-loading" role="status">Preparando a cidade…</span>}
     {isQuestion?<span className="choice-prompt">Selecione uma alternativa</span>:<button className="dialogue-continue" onClick={next} disabled={!sceneReady} aria-label={`${advanceLabel} →`}>Toque para continuar...</button>}
    </div>
   </section>
   </div>
   {isQuestion&&q&&<ChoiceList key={`${s.selectedProblem??'tutorial'}:${s.phase}`} choices={q.alternatives.map(a=>({id:a.id,text:a.text,cost:tutorial?undefined:a.cost,disabled:!sceneReady||!canAfford(s.coins,a.cost),hint:!canAfford(s.coins,a.cost)?'Faltam '+(a.cost-s.coins).toLocaleString('pt-BR')+' moedas':undefined}))} onChoose={tutorial?narrativeChoice:choose}/>}
  </div>
 </div>;
}
