import type {Progress,CharacterPose} from '../game/types';
import {story} from './story';
export type DialogueEvent='NEXT_LINE'|'SHOW_CITY'|'SHOW_QUESTION'|'RETURN_CITY'|'SHOW_TUTORIAL';
export interface NarrativeChoice {id:string;text:string;event:DialogueEvent;next?:string}
export interface DialogueNode {id:string;characterId:string;text:string;pose:CharacterPose;view:'city'|'west'|'river';title?:string;next?:string;actionLabel?:string;event?:DialogueEvent;choices?:NarrativeChoice[]}
export const dialogueEntry='arrival';
export const legacyIntroNodes=['arrival','arrival_1'];
export const dialogueNodes:Record<string,DialogueNode>=Object.fromEntries(story.intro.map((text,i)=> {
 const id=i?'arrival_'+i:'arrival';
 return [id,{id,characterId:'companion',text,title:i===0?'A chegada':i===7?'Um primeiro passo':'Um olhar para a cidade',pose:i<3?'character_intro':i===3?'character_alert':'character_thinking',view:i<3||i===7?'city':i<5?'river':'west',next:i<7?'arrival_'+(i+1):undefined,actionLabel:i===7?'Pensar no primeiro passo':'Continuar',event:i===7?'SHOW_TUTORIAL':'NEXT_LINE'}];
}));
export const dialogueCopy={contextTitle:'Vamos olhar mais de perto.',contextAction:'Pensar nas soluções',questionLabel:'Uma decisão para a cidade',resultAction:'Voltar à cidade',narrator:'Seu companheiro de jornada'};
export function introNode(s:Progress){return dialogueNodes[s.dialogueNodeId??legacyIntroNodes[s.introIndex]??dialogueEntry]??dialogueNodes[dialogueEntry];}
