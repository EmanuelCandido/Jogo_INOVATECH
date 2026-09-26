import {useEffect, useLayoutEffect, useState} from 'react';

/** Reuse the HTML opening so downloading React/Three never produces a blank
 * screen or restarts the mascot animation. Readiness is the first city frame,
 * not a simulated timer or Three's percentage (its total grows as models load). */
export function useLoadingScreen(ready: boolean, failed: boolean, reducedMotion: boolean) {
  const [revealed, setRevealed] = useState(false);
  useLayoutEffect(() => {
    const screen = document.getElementById('game-loading');
    if (!screen) return;
    screen.dataset.reducedMotion = String(reducedMotion);
    screen.dataset.state = failed ? 'error' : ready ? 'ready' : 'loading';
    screen.setAttribute('aria-busy', String(!ready && !failed));
    // A later renderer failure must also surface over an already opened game.
    screen.hidden = revealed && !failed;
  }, [ready, failed, reducedMotion, revealed]);

  useEffect(() => {
    if (!ready || failed || revealed) return;
    const reduced = reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setRevealed(true), reduced ? 0 : 480);
    return () => window.clearTimeout(timer);
  }, [ready, failed, reducedMotion, revealed]);
  return revealed && !failed;
}
