import { useEffect, useRef, useState } from "react";
import { useGame } from "../../stores/gameStore";
import type { GameSettings,Quality } from "../../game/types";
import {graphicsPresets,graphicsTiers} from '../../config/graphics';
import {recheckGraphics,useGraphicsRuntime,useResolvedGraphics} from '../../stores/graphicsStore';
export function SettingsPanel({ close }: { close: () => void }) {
  const { progress: s, graphics, reset } = useGame();
  const q=useResolvedGraphics(),runtime=useGraphicsRuntime();
  const [confirmReset, setConfirmReset] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const setMenu = (_: boolean) => close();
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <section
      className="settings panel"
      aria-label="Configurações"
      ref={panel}
      tabIndex={-1}
    >
      <div className="eyebrow">DO SEU JEITO</div>
      <div className="settings-heading"><h2>Gráficos e desempenho</h2><button className="settings-close" aria-label="Fechar configurações" onClick={close}>×</button></div>
      <label>
        Qualidade gráfica
        <select
          value={s.settings.quality}
          onChange={(e) =>
            graphics({quality:e.target.value as Quality})
          }
        >
          <option value="AUTO">Automático · recomendado</option>
          {graphicsTiers.map(tier=><option key={tier} value={tier}>{graphicsPresets[tier].label}{tier==='ULTRA'?' · máximo detalhe':''}</option>)}
        </select>
      </label>
      <div className="graphics-summary" aria-live="polite">
        <strong>{s.settings.quality==='AUTO'?'Automático: ':''}{q.label}</strong>
        <p>{q.description}</p>
        <span>{q.shadows?'Sombras ativadas':'Sem sombras'} · {q.cityDetail===2?'Detalhamento completo':q.cityDetail===1?'Detalhamento ampliado':'Cena simplificada'}</span>
      </div>
      {s.settings.quality==='AUTO'&&<div className="graphics-auto">
        <p>{runtime.measuring?'Medindo a fluidez da cena…':runtime.reason+'.'}</p>
        <button className="text-button" onClick={recheckGraphics} disabled={runtime.measuring}>Reavaliar dispositivo</button>
      </div>}
      <label htmlFor="render-scale">Escala de resolução <output>{s.settings.renderScale}%</output></label>
      <input id="render-scale" className="graphics-range" type="range" min="60" max="150" step="5" value={s.settings.renderScale} onChange={e=>graphics({renderScale:Number(e.target.value)})}/>
      <p className="graphics-hint">Diminua para ganhar fluidez. Aumente para uma imagem mais nítida, dentro do limite do perfil.</p>
      <label>Sombras<select value={s.settings.shadows} onChange={e=>graphics({shadows:e.target.value as GameSettings['shadows']})}>
        <option value="PRESET">Seguir qualidade escolhida</option><option value="OFF">Desativadas · mais leve</option><option value="SOFT">Suaves</option><option value="DETAILED">Detalhadas</option>
      </select></label>
      <label className="checkbox"><input type="checkbox" checked={s.settings.ambientAnimation} onChange={e=>graphics({ambientAnimation:e.target.checked})}/>Animar água e ambiente</label>
      <p className="graphics-hint">Disponível em Alta e Ultra. Desligar economiza processamento quando o mapa está parado.</p>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={s.settings.reducedMotion}
          onChange={(e) => graphics({reducedMotion:e.target.checked})}
        />
        Reduzir movimentos
      </label>
      <label className="checkbox"><input type="checkbox" checked={s.settings.showPerformance} onChange={e=>graphics({showPerformance:e.target.checked})}/>Mostrar desempenho</label>
      {s.settings.showPerformance&&<div className="graphics-measurement">
        <strong>{runtime.measuring?'Medindo…':runtime.fps?`${runtime.fps} FPS medidos`:'Aguardando a cena'}</strong>
        <p>Amostra curta de renderização. A fluidez varia conforme a área do mapa.</p>
        <button className="text-button" disabled={runtime.measuring} onClick={()=>useGraphicsRuntime.setState(v=>({probe:v.probe+1}))}>Medir novamente</button>
      </div>}
      <p className="muted">
        Seu progresso é salvo automaticamente neste navegador.
      </p>
      <button className="primary" onClick={() => setMenu(false)}>
        Voltar ao jogo
      </button>
      {confirmReset ? (
        <div>
          <p>Apagar o progresso desta partida?</p>
          <button
            className="danger"
            onClick={() => {
              reset();
              setMenu(false);
              setConfirmReset(false);
            }}
          >
            Sim, começar de novo
          </button>
          <button
            className="text-button"
            onClick={() => setConfirmReset(false)}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button className="text-button" onClick={() => setConfirmReset(true)}>
          Recomeçar a história
        </button>
      )}
    </section>
  );
}
