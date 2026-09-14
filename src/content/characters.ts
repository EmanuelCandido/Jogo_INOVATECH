import type {CharacterPose} from '../game/types';
export interface DialogueCharacter {id:string;name:string;role:string;accent:string;poses:Record<CharacterPose,string>}
export const characters:Record<string,DialogueCharacter>={
 companion:{id:'companion',name:'Impactus',role:'Observando a cidade com você',accent:'#6555f5',poses:{
  character_intro:'/assets/portraits/robot/pose-1.webp',character_thinking:'/assets/portraits/robot/pose-2.webp',character_alert:'/assets/portraits/robot/pose-3.webp',character_success:'/assets/portraits/robot/pose-4.webp',character_failure:'/assets/portraits/robot/pose-5.webp'
 }}
};
