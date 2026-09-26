import { useEffect, useState } from 'react';
import { useGame } from '../../stores/gameStore';
import { categories, problems } from '../../content/problems';
import { Coin } from './Coin';
import { HudControl, HudIcon } from './HudControl';
import { DAILY_BONUS, dailyMissionList, missionCount, type DailyMissionId } from '../../game/dailyMissions';
import { useDialog } from '../menus/useDialog';
import { coinBurst, sparkleBurst } from '../effects/burst';

export function QuestPanel({ sceneReady }: { sceneReady: boolean }) {
  const { progress: s, select, revisit, openOverlay, energize, claim, refreshMissions }=useGame();
  const close=()=>openOverlay(null);
  const panel=useDialog(close);
  const [now,setNow]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('');
  useEffect(()=>{
    const refresh=()=>{setNow(new Date());refreshMissions();};
    const timer=window.setInterval(refresh,30000);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
  },[refreshMissions]);
  const midnight=new Date(now);midnight.setHours(24,0,0,0);
  const minutes=Math.max(1,Math.ceil((midnight.getTime()-now.getTime())/60000));
  const daily=s.dailyMissions;
  const complete=dailyMissionList.filter(m=>missionCount(daily,m.id)>=m.goal);
  const available=dailyMissionList.filter(m=>missionCount(daily,m.id)<m.goal);
  const solved=problems.filter(p=>s.problemStates[p.id]==='SOLVED').length;
  const redeem=(id:DailyMissionId|'bonus',reward:number,from:Element)=>{claim(id);setFeedback(`+${reward} moedas resgatadas!`);coinBurst(from,id==='bonus'?14:Math.min(12,4+Math.round(reward/25)));};
  const missionCard=(mission:typeof dailyMissionList[number])=>{
    const count=missionCount(daily,mission.id), done=count>=mission.goal, claimed=daily.claimed.includes(mission.id);
    return <article className={`daily-mission${done?' is-done':''}`} key={mission.id} data-mission={mission.id}>
      <span className={`mission-symbol${mission.id==='energy'&&!done?' energy-idle':''}`}><HudIcon name={mission.id==='care'?'sparkles':mission.id==='explore'?'pin':mission.id==='energy'?'energy':'chat'}/></span>
      <div className="mission-copy"><div className="mission-title"><h3>{mission.title}</h3><span className="reward-pill"><Coin/>+{mission.reward}</span></div><div className="mission-progress"><progress aria-label={`Progresso: ${mission.title}`} value={count} max={mission.goal}/><b>{done?'FEITA!':`${count}/${mission.goal}`}</b></div></div>
      {done ? <button className="claim-button" disabled={claimed} onClick={event=>redeem(mission.id,mission.reward,event.currentTarget)} aria-label={`${claimed?'Resgatada':'Resgatar'}: ${mission.title}`}>{claimed?<><HudIcon name="check"/>RESGATADA</>:'RESGATAR'}</button> : <HudControl className="mission-go" icon="forward" tone="quiet" title={mission.hint} label={mission.id==='energy'?'Dar energia ao Impactus':`${mission.title}: ${mission.hint}`} onClick={event=>{if(mission.id==='energy'){energize();sparkleBurst(event.currentTarget.closest('.daily-mission')??event.currentTarget);setFeedback('Impactus está cheio de energia! Resgate sua recompensa.');}else close();}}/>}
    </article>;
  };
  return <div className="journey-scrim" onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <section ref={panel} className="mission-modal" role="dialog" aria-modal="true" aria-labelledby="mission-title" tabIndex={-1}>
      <header className="mission-heading"><div><span className="panel-eyebrow">CADA AÇÃO CONTA</span><h2 id="mission-title">Nossa Jornada</h2></div><HudControl className="round-close" icon="close" tone="quiet" onClick={close} label="Fechar missões"/></header>
      <div className="mission-scroll">
        <div className="daily-summary"><span className="daily-medal" aria-hidden="true">★</span><div><div className="daily-summary-line"><b>Progresso diário</b><strong>{complete.length} de {dailyMissionList.length}</strong></div><progress value={complete.length} max={dailyMissionList.length} aria-label="Progresso diário"/><p>{complete.length<4?`Complete mais ${4-complete.length} para ganhar o baú bônus!`:daily.bonusClaimed?'Todas as recompensas de hoje foram resgatadas!':'Parabéns! Resgate suas missões e abra o baú bônus.'}</p></div></div>
        {complete.length>0&&<section className="mission-section completed"><h3>MISSÕES CUMPRIDAS</h3>{complete.map(missionCard)}</section>}
        {available.length>0&&<section className="mission-section"><div className="mission-section-heading"><h3>MISSÕES DISPONÍVEIS</h3><span title="As missões renovam à meia-noite">↻ {Math.floor(minutes/60)}h {minutes%60}min</span></div>{available.map(missionCard)}</section>}
        {complete.length===4&&<button className="bonus-button" disabled={daily.claimed.length<4||daily.bonusClaimed} onClick={event=>redeem('bonus',DAILY_BONUS,event.currentTarget)}>{daily.bonusClaimed?'✓ Baú resgatado':`Abrir baú bônus · +${DAILY_BONUS} moedas`}</button>}
        <details className="city-quests"><summary>Problemas da cidade <span>{solved}/{problems.length}</span></summary><p>Escolha um lugar para investigar. Cada solução transforma a cidade.</p>
          {problems.filter(p=>!['HIDDEN','LOCKED'].includes(s.problemStates[p.id])).map(p=><button className="city-quest" key={p.id} disabled={!sceneReady||s.problemStates[p.id]==='SOLVED'} onClick={()=>{close();s.problemStates[p.id]==='TEMPORARILY_SOLVED'?revisit(p.id):select(p.id);}}><span aria-hidden="true">{s.problemStates[p.id]==='SOLVED'?'✓':p.markerIcon}</span><span><b>{p.title}</b><small>{s.problemStates[p.id]==='SOLVED'?'Transformação permanente':s.problemStates[p.id]==='TEMPORARILY_SOLVED'?'Melhoria provisória · reavaliar':categories[p.category].label}</small></span></button>)}
        </details>
      </div><div className="mission-feedback" role="status">{feedback}</div>
    </section>
  </div>;
}
