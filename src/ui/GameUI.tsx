import { useEffect, useState } from "react";
import { useGame } from "../stores/gameStore";
import { DialogueStage } from "./dialogue/DialogueStage";
import { QuestPanel } from "./hud/QuestPanel";
import { JourneyNav } from './hud/JourneyNav';
import { Shop } from './wardrobe/Shop';
import { SettingsPanel } from "./menus/SettingsPanel";
import {PerformanceReadout} from './hud/PerformanceReadout';
import { TitleScreen } from './menus/TitleScreen';
import { Balance } from './hud/Balance';
import { HudControl, HudIcon } from './hud/HudControl';
import { useOverlayPresence } from './menus/useOverlayPresence';
export function GameUI({ sceneReady }: { sceneReady: boolean }) {
  const { progress: s, notice, leave, overlay, refreshMissions, resolution, finishResolution } = useGame();
  const [menu, setMenu] = useState(false);
  const layer=useOverlayPresence(overlay??(menu?'settings':null),s.settings.reducedMotion);
  // The title is presentation state; opening it must never reset a saved game.
  const [showTitle, setShowTitle] = useState(() => s.phase === 'INTRO' && s.introIndex === 0);
  const showHeader = !resolution&&(menu || (!showTitle && !['INTRO', 'FOCUSING', 'COMMENT', 'CONTEXT'].includes(s.phase)));
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (useGame.getState().overlay || useGame.getState().resolution || layer.overlay || event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); setMenu(open => !open); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [layer.overlay]);
  useEffect(() => {
    const timer=window.setInterval(refreshMissions,60000);
    return ()=>window.clearInterval(timer);
  },[refreshMissions]);
  return (
    <div className={`interface${showTitle ? ' on-title' : ''}`}>
      <div className="game-hud" inert={Boolean(layer.overlay)}>
      {showHeader && <header className="topbar">
        <div className="header-actions">
          {!showTitle && <Balance coins={s.coins}/>}
          <HudControl
            icon="settings"
            label="Configurações"
            className="icon-button"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-haspopup="dialog"
          />
        </div>
      </header>}
      {showTitle ? (
        <TitleScreen sceneReady={sceneReady} onPlay={() => setShowTitle(false)} />
      ) : (
        <>
          {s.selectedProblem && ['FOCUSING', 'COMMENT', 'CONTEXT', 'QUESTION', 'RESULT'].includes(s.phase) && (
            <button className="back-to-map" onClick={leave} aria-label="Voltar ao mapa">
              <HudIcon name="back"/>
              Voltar
            </button>
          )}
          {s.phase === 'OVERVIEW' && <JourneyNav />}
          <DialogueStage sceneReady={sceneReady} />
          {resolution&&<div className="resolution-status" data-problem={resolution.problemId}>
            <span className="sr-only" role="status">Acompanhe a transformação da cidade. O resultado aparecerá após a animação.</span>
            <button className="resolution-skip" onClick={()=>finishResolution(resolution.sequence)}>Ver resultado <HudIcon name="forward"/></button>
          </div>}
          {["FOCUSING", "RETURNING"].includes(s.phase) && (
            <div className={s.phase === 'FOCUSING' ? 'camera-preview-status' : 'camera-status'} role="status">
              {s.phase === "FOCUSING"
                ? "Observe o problema. O diálogo aparecerá em instantes…"
                : "Voltando à cidade…"}
            </div>
          )}
        </>
      )}
      {!showTitle && s.phase === 'OVERVIEW' && <footer className="footer">
        <span>CADA ESCOLHA DEIXA UMA MARCA.</span>
        <span>{notice ? "○ Verifique o aviso" : "✓ Progresso automático"}</span>
      </footer>}
      <PerformanceReadout/>
      </div>
      {layer.overlay&&<div className="hud-overlay" data-state={layer.closing?'closing':'open'}>
        <div className="hud-overlay-content" inert={layer.closing}>
          {layer.overlay==='settings'&&<div className="menu-scrim" onClick={event=>{if(event.target===event.currentTarget)setMenu(false);}}><SettingsPanel close={()=>setMenu(false)} sceneReady={sceneReady}/></div>}
          {layer.overlay==='missions'&&<QuestPanel sceneReady={sceneReady}/>}
          {layer.overlay==='shop'&&<Shop/>}
        </div>
      </div>}
      {notice && <div className="notice" role="alert">{notice}</div>}
    </div>
  );
}
