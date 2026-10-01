import {useGame} from '../../stores/gameStore';
import {cityTransformed} from '../../game/ending';
import {HudIcon} from '../hud/HudControl';

/** Extra: the game's special scenes, with their conversations, to watch
 * again. A scene unlocks once the player has seen it in the story. */
export function ExtraScenes({close}:{close:()=>void}){
 const progress=useGame(s=>s.progress),playEnding=useGame(s=>s.playEnding);
 const endingOpen=Boolean(progress.endingSeen)&&cityTransformed(progress);
 const onMap=progress.phase==='OVERVIEW';
 return <fieldset className="extra-scenes">
  <legend>Extra</legend>
  <p className="graphics-hint">Reveja as cenas especiais e as conversas do Impactus.</p>
  <button type="button" className="extra-scene" disabled={!endingOpen||!onMap} onClick={()=>{close();playEnding();}}>
   <span className="extra-scene-icon" aria-hidden="true"><HudIcon name={endingOpen?'sparkles':'lock'}/></span>
   <span><b>O final: a cidade transformada</b><small>{!endingOpen?'Resolva as dez situações para liberar.':onMap?'Passeio pela cidade, festa e conversa final.':'Volte ao mapa para assistir.'}</small></span>
  </button>
 </fieldset>;
}
