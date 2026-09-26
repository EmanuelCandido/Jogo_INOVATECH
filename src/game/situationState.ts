import type {Progress} from './types';
import type {VisualKey} from '../config/situationVisuals';

export function situationVisualKey(s:Progress,id:string):VisualKey {
 const state=s.problemStates[id];
 if(state==='SOLVED')return 'solved';
 if(state==='TEMPORARILY_SOLVED'||(state==='ACTIVE'&&s.decisions.findLast(d=>d.problemId===id)?.effectiveness==='TEMPORARY'))return 'temporary';
 return 'initial';
}
