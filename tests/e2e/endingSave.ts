import {situations} from '../../src/content/situations';
/** A saved game on the result of the last situation, with the other nine
 * already solved: going back to the map finishes the city. `misses` adds a
 * wrong first answer to the first situations, for the closing statistics. */
export function lastSolutionSave({misses=0,endingSeen=false,phase='RESULT'}:{misses?:number;endingSeen?:boolean;phase?:'RESULT'|'OVERVIEW'}={}){
 const decisions:{problemId:string;alternativeId:string;effectiveness:string;cost:number;turn:number}[]=[];
 situations.forEach((s,i)=>{
  const costs=s.costBand==='community'?{COMPLETE:70,NONE:20}:{COMPLETE:80,NONE:20};
  const wrong=s.answers.find(a=>a.effectiveness==='NONE')!,right=s.answers.find(a=>a.effectiveness==='COMPLETE')!;
  if(i<misses)decisions.push({problemId:s.id,alternativeId:wrong.id,effectiveness:'NONE',cost:costs.NONE,turn:0});
  decisions.push({problemId:s.id,alternativeId:right.id,effectiveness:'COMPLETE',cost:costs.COMPLETE,turn:0});
 });
 decisions.forEach((d,i)=>{d.turn=i+1;});
 const last=decisions.at(-1)!.problemId;
 return JSON.stringify({version:1,data:{
  contentVersion:2,dialogueNodeId:'arrival_7',coins:420,currentChapter:'arrival',
  problemStates:Object.fromEntries(situations.map(s=>[s.id,'SOLVED'])),decisions,tutorialCompleted:true,
  settings:{quality:'AUTO',reducedMotion:false,renderScale:100,shadows:'PRESET',ambientAnimation:true,showPerformance:false,musicVolume:60,sfxVolume:80,muted:true},
  selectedProblem:phase==='RESULT'?last:null,phase,introIndex:7,rewarded:situations.map(s=>s.id),endingSeen,
 }});
}
