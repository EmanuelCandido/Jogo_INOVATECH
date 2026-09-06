import { useMap } from "../../stores/mapStore";
export function MapControls() {
  const {zoom,ready,send}=useMap();
  return <nav className="map-controls" aria-label="Navegação do mapa">
    <div className="map-zoom">
      <button aria-label="Aproximar mapa" disabled={!ready||zoom>=3.5-.001} onClick={()=>send("in")}>+</button>
      <output aria-label="Zoom do mapa">{Math.round(zoom*100)}%</output>
      <button aria-label="Afastar mapa" disabled={!ready||zoom<=1.001} onClick={()=>send("out")}>−</button>
      <button aria-label="Centralizar mapa" title="Centralizar mapa (Home)" disabled={!ready} onClick={()=>send("reset")}>⌂</button>
    </div>
    <small>Arraste para explorar · Role ou use dois dedos para zoom</small>
  </nav>;
}
