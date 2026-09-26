import { publicAsset } from '../../assets/publicAsset';
import { dailyMissionList, missionCount } from '../../game/dailyMissions';
import { useGame } from '../../stores/gameStore';

export function JourneyNav() {
  const { progress, openOverlay } = useGame();
  const daily=progress.dailyMissions;
  const rewardReady=dailyMissionList.some(m=>missionCount(daily,m.id)>=m.goal&&!daily.claimed.includes(m.id)) || (daily.claimed.length===4&&!daily.bonusClaimed);
  return <nav className="journey-nav" aria-label="Atividades da cidade">
    <button type="button" className="journey-badge" onClick={()=>openOverlay('missions')} aria-label={rewardReady?'Missões — recompensa disponível':'Missões'} aria-haspopup="dialog"><span className="journey-badge-disc"/><img src={publicAsset('/assets/ui/journey/clipboard.webp')} alt="" draggable="false" width="256" height="256"/><span className="journey-badge-label">Missões</span>{rewardReady&&<span className="journey-badge-alert" aria-hidden="true">!</span>}</button>
    <button type="button" className="journey-badge" onClick={()=>openOverlay('shop')} aria-label="Loja" aria-haspopup="dialog"><span className="journey-badge-disc"/><img src={publicAsset('/assets/ui/journey/cart.webp')} alt="" draggable="false" width="256" height="256"/><span className="journey-badge-label">Loja</span></button>
  </nav>;
}
