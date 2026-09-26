import {useGame} from '../../stores/gameStore';
import {useGraphicsRuntime,useResolvedGraphics} from '../../stores/graphicsStore';
import {useLiveFrames} from '../../components/city/LiveFrameRate';
export function PerformanceReadout(){
 const show=useGame(s=>s.progress.settings.showPerformance),s=useGraphicsRuntime(),q=useResolvedGraphics(),live=useLiveFrames(l=>l.live);
 if(!show)return null;
 return <aside className="graphics-performance" aria-label="Desempenho gráfico">
  {q.label} · {live?`${live.fps} FPS · pior quadro ${live.worstMs} ms`:s.measuring?'Medindo…':s.fps!==null?`${s.fps} FPS medidos`:'Aguardando medição'}
  {live&&<><br/>{(live.triangles/1e6).toLocaleString('pt-BR',{maximumFractionDigits:2})} mi triângulos · {live.calls} desenhos · {live.width}×{live.height}</>}
  {s.renderer&&<><br/>{s.renderer.replace(/^ANGLE \((.*)\)$/,'$1').slice(0,60)}</>}
 </aside>;
}
