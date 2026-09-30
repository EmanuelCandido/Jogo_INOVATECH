import {useEffect,useRef,useState} from 'react';
import type {Resolution} from '../../game/resolution';
import {fallbackSteps,resolutionStep,resolutionSteps} from '../../content/resolutionSteps';

/** Names the current step and fills a bar with the animation clock. The
 * bar is updated outside React; only a new step re-renders the caption. */
export function ResolutionProgress({resolution}:{resolution:Resolution}) {
 const steps=resolutionSteps[resolution.problemId]?.[resolution.to]??fallbackSteps;
 const [step,setStep]=useState(()=>resolutionStep(resolution.clock.value));
 const bar=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  let frame=0;
  const tick=()=>{
   const value=resolution.clock.value;
   if(bar.current)bar.current.style.transform=`scaleX(${value.toFixed(4)})`;
   setStep(resolutionStep(value));
   frame=requestAnimationFrame(tick);
  };
  tick();return()=>cancelAnimationFrame(frame);
 },[resolution]);
 return <div className="resolution-progress" data-outcome={resolution.to} aria-hidden="true">
  <ol className="resolution-steps">
   {steps.map((label,i)=><li key={i} data-state={i<step?'done':i===step?'active':'next'}><span className="resolution-dot">{i<step?'✓':i+1}</span></li>)}
  </ol>
  <strong key={step} className="resolution-caption">{steps[step]}</strong>
  <span className="resolution-track"><span ref={bar}/></span>
 </div>;
}
