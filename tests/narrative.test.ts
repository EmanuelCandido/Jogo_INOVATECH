import {describe,it,expect} from 'vitest';
import {NarrativeManager} from '../src/game/NarrativeManager';
import {ProblemManager} from '../src/game/ProblemManager';
import {initialProgress,decodeSave} from '../src/game/save';
import {dialogueNodes} from '../src/content/dialogues';
import {characters} from '../src/content/characters';
import {tutorialQuestion} from '../src/content/questions';
import {overview,open} from './helpers';
describe('narrativa e cinco poses do mesmo companheiro',()=>{
 it('mostra oito falas e não libera o mapa antes de concluir o tutorial',()=>{
  let s=initialProgress();const seen:string[]=[];
  while(s.phase==='INTRO'){seen.push(s.dialogueNodeId!);s=NarrativeManager.next(s);}
  expect(seen).toHaveLength(8);expect(s.phase).toBe('TUTORIAL_QUESTION');expect(s.decisions).toHaveLength(0);expect(s.coins).toBe(1500);
  expect(ProblemManager.select(s,'pollution_01')).toBe(s);
  s=NarrativeManager.next(NarrativeManager.choose(s,'observe'));expect(s.phase).toBe('OVERVIEW');expect(s.tutorialCompleted).toBe(true);
 });
 it.each(['rush','ignore'])('tutorial %s explica e permite tentar de novo, sem custo',(id)=>{
  let s=initialProgress();while(s.phase==='INTRO')s=NarrativeManager.next(s);
  s=NarrativeManager.choose(s,id);expect(s.phase).toBe('TUTORIAL_RESULT');expect(s.tutorialCompleted).toBe(false);
  expect(decodeSave(JSON.stringify({version:1,data:s}))).toEqual(s);
  s=NarrativeManager.next(s);expect(s.phase).toBe('TUTORIAL_QUESTION');expect(s.coins).toBe(1500);expect(s.decisions).toHaveLength(0);
 });
 it('comentário, contexto e pergunta são etapas separadas',()=>{
  let s=NarrativeManager.cameraArrived(ProblemManager.select(overview(),'pollution_01'));expect(s.phase).toBe('COMMENT');
  s=NarrativeManager.next(s);expect(s.phase).toBe('CONTEXT');s=NarrativeManager.next(s);expect(s.phase).toBe('QUESTION');expect(open().phase).toBe('QUESTION');
 });
 it('usa cinco arquivos distintos e nenhuma imagem do personagem antigo',()=>{
  const c=characters.companion;expect(Object.keys(characters)).toEqual(['companion']);expect(new Set(Object.values(c.poses)).size).toBe(5);
  for(const url of Object.values(c.poses))expect(url).toMatch(/robot\/pose-[1-5]\.webp$/);
  expect(Object.values(dialogueNodes).every(n=>n.characterId==='companion')).toBe(true);
  expect(tutorialQuestion.alternatives.every(a=>a.cost===0)).toBe(true);
 });
 it('restaura o cursor narrativo e ignora escolhas inválidas',()=>{
  const s=NarrativeManager.next(initialProgress());expect(decodeSave(JSON.stringify({version:1,data:s}))).toEqual(s);
  expect(NarrativeManager.choose(s,'missing')).toBe(s);
  expect(()=>decodeSave(JSON.stringify({version:1,data:{...s,dialogueNodeId:'missing'}}))).toThrow('Diálogo inválido');
 });
});
