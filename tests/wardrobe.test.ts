import { describe, expect, it } from 'vitest';
import { accessories, buyAccessory, defaultOutfit, equipOutfit, initialWardrobe, normalizeWardrobe } from '../src/game/wardrobe';
import { claimMission, dailyMissionList, giveEnergy, initialDailyMissions, normalizeDailyMissions, trackDailyActivity } from '../src/game/dailyMissions';
import type { Progress } from '../src/game/types';

const now=new Date(2026,8,21,12);
const fixture=():Progress=>({contentVersion:2,coins:1500,currentChapter:'chapter_01',problemStates:{a:'AVAILABLE',b:'AVAILABLE'},decisions:[],tutorialCompleted:true,settings:{quality:'LOW',reducedMotion:true,renderScale:100,shadows:'OFF',ambientAnimation:false,showPerformance:false,musicVolume:60,sfxVolume:80,muted:false},selectedProblem:null,phase:'OVERVIEW',introIndex:0,rewarded:[],wardrobe:initialWardrobe(),dailyMissions:initialDailyMissions(now)});
describe('compras e combinações de acessórios',()=>{
  it('compra uma única vez, permite saldo exato e rejeita saldo insuficiente sem mutação',()=>{
    const base=fixture();base.coins=80;
    const bought=buyAccessory(base,'cape-comet');
    expect(bought.coins).toBe(0);expect(base.coins).toBe(80);
    expect(buyAccessory(bought,'cape-comet')).toBe(bought);
    expect(()=>buyAccessory(bought,'hat-cap')).toThrow('Faltam');
    expect(bought.wardrobe.owned).toEqual(['cape-star','cape-comet']);
    expect(()=>buyAccessory(base,'missing')).toThrow('não encontrado');
  });
  it('aceita todas as 294 combinações e retira peças sem afetar as outras categorias',()=>{
    const base=fixture();base.wardrobe.owned=accessories.map(a=>a.id);
    const capes=accessories.filter(a=>a.slot==='cape').map(a=>a.id);
    const jackets=[null,...accessories.filter(a=>a.slot==='jacket').map(a=>a.id)];
    const hats=[null,...accessories.filter(a=>a.slot==='hat').map(a=>a.id)];
    for(const cape of capes)for(const jacket of jackets)for(const hat of hats){
      const outfit={cape,jacket,hat};const equipped=equipOutfit(base,outfit);
      expect(equipped.wardrobe.equipped).toEqual(outfit);expect(equipped.coins).toBe(base.coins);
      expect(normalizeWardrobe(equipped.wardrobe)).toEqual(equipped.wardrobe);
    }
  });
  it('não equipa peças não compradas nem IDs de outra categoria',()=>{
    const base=fixture();
    expect(()=>equipOutfit(base,{...defaultOutfit(),hat:'hat-cap'})).toThrow();
    expect(()=>equipOutfit(base,{...defaultOutfit(),hat:'cape-star'})).toThrow();
    expect(base.wardrobe).toEqual(initialWardrobe());
    expect(normalizeWardrobe({owned:['unknown','cape-star'],equipped:{cape:'unknown',hat:'cape-star'}})).toEqual(initialWardrobe());
    expect(normalizeWardrobe(undefined)).toEqual(initialWardrobe());
  });
});
describe('missões diárias',()=>{
  it('não permite resgate antecipado nem resgate duplicado',()=>{
    const base=fixture();expect(claimMission(base,'energy',now)).toBe(base);
    const charged=giveEnergy(base,now), claimed=claimMission(charged,'energy',now);
    expect(claimed.coins).toBe(1580);expect(claimMission(claimed,'energy',now)).toBe(claimed);
    expect(giveEnergy(claimed,now)).toBe(claimed);
  });
  it('visitas repetidas não duplicam progresso; a emoção exige que o diálogo apareça',()=>{
    let base=fixture();
    for(const id of ['a','a','b']){
      const focused={...base,phase:'FOCUSING' as const,selectedProblem:id};
      let next=trackDailyActivity(base,focused,now);
      expect(next.dailyMissions.emotions).toEqual(base.dailyMissions.emotions);
      next=trackDailyActivity(next,{...next,phase:'COMMENT'},now);
      base={...next,phase:'OVERVIEW',selectedProblem:null};
    }
    expect(base.dailyMissions.explored).toEqual(['a','b']);expect(base.dailyMissions.emotions).toEqual(['a','b']);
  });
  it('renova à meia-noite sem apagar moedas, compras ou recompensas anteriores',()=>{
    const claimed=claimMission(giveEnergy(fixture(),now),'energy',now);
    const tomorrow=new Date(2026,8,22,0,1);
    const refreshed=giveEnergy(claimed,tomorrow);
    expect(refreshed.coins).toBe(claimed.coins);expect(refreshed.dailyMissions.claimed).toEqual([]);
    expect(refreshed.wardrobe).toEqual(claimed.wardrobe);
    expect(claimMission(refreshed,'energy',tomorrow).coins).toBe(1660);
    expect(normalizeDailyMissions({day:'2026-09-21',claimed:{}},now)).toEqual(initialDailyMissions(now));
  });
  it('abre o baú somente depois dos quatro resgates e paga o bônus uma vez',()=>{
    let progress=fixture();progress.dailyMissions={...progress.dailyMissions,energy:true,explored:['a','b','c','d','e'],emotions:['a'],helped:['a']};
    expect(claimMission(progress,'bonus',now)).toBe(progress);
    for(const mission of dailyMissionList)progress=claimMission(progress,mission.id,now);
    const withBonus=claimMission(progress,'bonus',now);
    expect(withBonus.coins-progress.coins).toBe(100);expect(claimMission(withBonus,'bonus',now)).toBe(withBonus);
  });
});
