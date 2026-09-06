import {initialProgress} from '../src/game/save';
import {NarrativeManager} from '../src/game/NarrativeManager';
import {ProblemManager} from '../src/game/ProblemManager';
import type {Progress} from '../src/game/types';
export function overview(){let s=initialProgress();while(s.phase==='INTRO')s=NarrativeManager.next(s);return NarrativeManager.next(NarrativeManager.choose(s,'observe'));}
export function open(s:Progress=overview(),id='accessibility_01'){
 return NarrativeManager.next(NarrativeManager.next(NarrativeManager.cameraArrived(ProblemManager.select(s,id))));
}
export const finish=(s:Progress)=>NarrativeManager.cameraArrived(NarrativeManager.next(s));
