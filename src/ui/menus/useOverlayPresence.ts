import { useEffect, useState } from 'react';

type HudOverlay = 'missions' | 'shop' | 'settings';

/** Keep the overlay mounted and the map blocked until its exit finishes. */
export function useOverlayPresence(active: HudOverlay | null, reducedMotion: boolean) {
  const [previous,setPrevious]=useState(active);
  useEffect(()=>{
    if(active){setPrevious(active);return;}
    const duration=reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches?0:180;
    const timer=window.setTimeout(()=>setPrevious(null),duration);
    return ()=>window.clearTimeout(timer);
  },[active,reducedMotion]);
  return {overlay:active??previous,closing:!active&&previous!==null};
}
