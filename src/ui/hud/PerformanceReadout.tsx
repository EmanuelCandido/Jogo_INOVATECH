import {useGame} from '../../stores/gameStore';
import {useGraphicsRuntime,useResolvedGraphics} from '../../stores/graphicsStore';
export function PerformanceReadout(){
 const show=useGame(s=>s.progress.settings.showPerformance),s=useGraphicsRuntime(),q=useResolvedGraphics();
 return show?<aside className="graphics-performance" aria-label="Desempenho gráfico">
  {q.label} · {s.measuring?'Medindo…':s.fps?`${s.fps} FPS medidos`:'Aguardando medição'}
 </aside>:null;
}
