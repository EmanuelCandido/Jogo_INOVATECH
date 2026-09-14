import {useEffect,useRef} from 'react';
import {useGame} from '../../stores/gameStore';
import {introNode,dialogueCopy} from '../../content/dialogues';
import {characters} from '../../content/characters';
import {problemById,categories} from '../../content/problems';
import {questions,tutorialQuestion} from '../../content/questions';
import {story} from '../../content/story';
import {canAfford} from '../../game/economy';
import {CharacterStage} from './CharacterStage';
import {ChoiceList} from '../choices/ChoiceList';
import type {CharacterPose} from '../../game/types';
export function DialogueStage({sceneReady}:{sceneReady:boolean}){
 const {progress:s,next,narrativeChoice,choose,leave}=useGame(),panel=useRef<HTMLElement>(null);
 const node=introNode(s),p=s.selectedProblem?problemById[s.selectedProblem]:null;
 const tutorial=s.phase==='TUTORIAL_QUESTION'||s.phase==='TUTORIAL_RESULT';
 const isQuestion=s.phase==='QUESTION'||s.phase==='TUTORIAL_QUESTION';
 const q=tutorial?tutorialQuestion:p?questions[p.questionId]:null;
 const decision=p?s.decisions.findLast(d=>d.problemId===p.id):null;
 const answer=tutorial?tutorialQuestion.alternatives.find(a=>a.id===s.tutorialAnswerId):q?.alternatives.find(a=>a.id===decision?.alternativeId);
 const result=(s.phase==='RESULT'||s.phase==='TUTORIAL_RESULT')&&answer;
 const characterId='companion',character=characters[characterId];
 const pose:CharacterPose=s.phase==='INTRO'?node.pose:result?(answer.effectiveness==='COMPLETE'?'character_success':'character_failure'):s.phase==='COMMENT'?(p?.characterPose??'character_thinking'):'character_thinking';
 const title=s.phase==='INTRO'?node.title:result?answer.consequence:isQuestion?q?.text:p?.title;
 const text=s.phase==='INTRO'?node.text:result?answer.explanation:s.phase==='COMMENT'?p?.comment:s.phase==='CONTEXT'?p?.description:tutorial?story.tutorial.context:story.tutorial.costs;
 useEffect(()=>{panel.current?.focus({preventScroll:true});panel.current?.scrollTo(0,0);},[s.phase,s.dialogueNodeId,s.selectedProblem]);
 if(!['INTRO','COMMENT','CONTEXT','QUESTION','RESULT','TUTORIAL_QUESTION','TUTORIAL_RESULT'].includes(s.phase))return null;
 const advanceLabel=s.phase==='INTRO'?node.actionLabel:s.phase==='COMMENT'?'Entender a situação':s.phase==='CONTEXT'?dialogueCopy.contextAction:s.phase==='TUTORIAL_RESULT'?(answer?.effectiveness==='COMPLETE'?'Investigar a cidade':'Tentar novamente'):dialogueCopy.resultAction;
 return <div className={'narrative-stage '+(isQuestion?'has-choices ':'')+(result?'has-result':'')}>
  <div className="narrative-content">
   <div className="dialogue-scene">
   <CharacterStage characterId={characterId} pose={pose}/>
   <section className={'dialogue-box '+(result?'result':'')} ref={panel} tabIndex={-1}
    aria-label={result?'Resultado da decisão':isQuestion?'Escolher uma solução':s.phase==='INTRO'?'Apresentação do companheiro':s.phase==='COMMENT'?'Observação do companheiro':'Contexto do problema'}
    data-effectiveness={result?answer.effectiveness:undefined}
    onKeyDown={e=>{if(sceneReady&&!isQuestion&&e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();next();}}}>
    <div className="speaker-plate"><b>{character.name}</b></div>
    <span className="dialogue-stripes" aria-hidden="true"><i/><i/><i/></span>
    <div className="dialogue-body">
     {result&&<div className="eyebrow">{story.results[answer.effectiveness].label}</div>}
     {!isQuestion&&s.phase!=='INTRO'&&p&&!result&&<div className="eyebrow">{categories[p.category].label+' · '+p.regionName}</div>}
     {s.phase!=='INTRO'&&<h2>{title}</h2>}
     {!isQuestion&&<p>{text}</p>}
     {result&&!tutorial&&p&&<div className="result-receipt"><span>✦ − {answer.cost} moedas investidas</span>{answer.effectiveness==='COMPLETE'&&<span>+ {p.rewards} pela transformação</span>}</div>}
    </div>
    <div className="dialogue-actions">
     {!sceneReady&&<span className="scene-loading" role="status">Preparando a cidade…</span>}
     {sceneReady&&s.phase==='INTRO'&&<span className="dialogue-progress" aria-label={`Fala ${s.introIndex+1} de ${story.intro.length}`}>{story.intro.map((_,i)=><i key={i} className={i===s.introIndex?'current':''}/>)}</span>}
     {isQuestion?<span className="choice-prompt">Selecione uma alternativa</span>:<button className="dialogue-continue" onClick={next} disabled={!sceneReady} aria-label={`${advanceLabel} →`}>{s.phase==='INTRO'&&node.actionLabel==='Continuar'?'Toque para continuar…':advanceLabel}<span aria-hidden="true">▸</span></button>}
    </div>
   </section>
   </div>
   {isQuestion&&q&&<ChoiceList choices={q.alternatives.map(a=>({id:a.id,text:a.text,cost:tutorial?undefined:a.cost,disabled:!sceneReady||!canAfford(s.coins,a.cost),hint:!canAfford(s.coins,a.cost)?'Faltam '+(a.cost-s.coins).toLocaleString('pt-BR')+' moedas':undefined}))} onChoose={tutorial?narrativeChoice:choose}/>}
   {isQuestion&&!tutorial&&<button className="text-button decide-later" onClick={leave} disabled={!sceneReady}>Decidir depois · voltar ao mapa</button>}
  </div>
 </div>;
}
