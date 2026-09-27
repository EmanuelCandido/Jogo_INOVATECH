import { create } from "zustand";
import {
  browserSave,
  initialProgress,
  loadProgress,
  saveProgress,
} from "../game/save";
import { ProblemManager } from "../game/ProblemManager";
import { NarrativeManager } from "../game/NarrativeManager";
import type { GameSettings, Progress, Quality } from "../game/types";
import {normalizeGraphicsSettings} from '../config/graphics';
import { buyAccessory, equipOutfit, type Outfit } from '../game/wardrobe';
import { claimMission, giveEnergy, refreshDaily, trackDailyActivity, type DailyMissionId } from '../game/dailyMissions';
import {createResolution,type Resolution} from '../game/resolution';
import {owedIncome,settleIncome} from '../game/passiveIncome';
interface Store {
  progress: Progress;
  notice: string | null;
  overlay: 'missions' | 'shop' | null;
  resolution: Resolution | null;
  finishResolution: (sequence:number) => void;
  openOverlay: (overlay: 'missions' | 'shop' | null) => void;
  buy: (id: string) => boolean;
  equip: (outfit: Outfit) => boolean;
  energize: () => void;
  claim: (id: DailyMissionId | 'bonus') => void;
  refreshMissions: () => void;
  select: (id: string) => void;
  revisit: (id: string) => void;
  leave: () => void;
  choose: (id: string) => void;
  next: () => void;
  narrativeChoice: (id: string) => void;
  cameraArrived: () => void;
  settings: (quality: Quality, reducedMotion: boolean) => void;
  graphics: (patch: Partial<GameSettings>) => void;
  reset: () => void;
  collectIncome: () => void;
}
const loaded = loadProgress(browserSave);
export const useGame = create<Store>((set, get) => {
  function commit(progress: Progress, presentation:Partial<Pick<Store,'resolution'|'overlay'>>={}, fresh=false) {
    if (progress === get().progress) return;
    // Pay the passive income the previous state earned before it changes.
    progress = fresh ? {...progress, income:{at:Date.now(),carry:0}} : settleIncome(get().progress, progress, Date.now());
    progress = trackDailyActivity(get().progress, progress);
    let notice: string | null = null;
    try {
      saveProgress(browserSave, progress);
    } catch {
      notice =
        "O navegador não permitiu salvar. Seu progresso está disponível apenas nesta sessão.";
    }
    set({ progress, notice, ...presentation });
  }
  return {
    progress: loaded.data,
    notice: loaded.warning,
    overlay: null,
    resolution: null,
    finishResolution: sequence => { if(get().resolution?.sequence===sequence)set({resolution:null}); },
    openOverlay: (overlay) => {
      if (overlay && get().progress.phase !== 'OVERVIEW') return;
      commit(refreshDaily(get().progress));
      set({ overlay });
    },
    buy: (id) => {
      try { commit(buyAccessory(get().progress, id)); return true; }
      catch (error) { set({ notice: (error as Error).message }); return false; }
    },
    equip: (outfit) => {
      try { commit(equipOutfit(get().progress, outfit)); return true; }
      catch (error) { set({ notice: (error as Error).message }); return false; }
    },
    energize: () => commit(giveEnergy(get().progress)),
    claim: (id) => commit(claimMission(get().progress, id)),
    refreshMissions: () => commit(refreshDaily(get().progress)),
    select: (id) => commit(ProblemManager.select(get().progress, id)),
    revisit: (id) => commit(ProblemManager.revisit(get().progress, id)),
    leave: () => commit(ProblemManager.leave(get().progress),{resolution:null}),
    choose: (id) => {
      try {
        const before=get().progress,after=ProblemManager.decide(before,id);
        const reduced=before.settings.reducedMotion||(typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
        commit(after,{resolution:createResolution(before,after,reduced)});
      } catch (error) {
        set({ notice: (error as Error).message });
      }
    },
    next: () => { if(!get().resolution)commit(NarrativeManager.next(get().progress)); },
    narrativeChoice: (id) =>
      commit(NarrativeManager.choose(get().progress, id)),
    cameraArrived: () => commit(NarrativeManager.cameraArrived(get().progress)),
    settings: (quality, reducedMotion) =>
      commit({ ...get().progress, settings: { ...get().progress.settings, quality, reducedMotion } }),
    graphics: (patch) => commit({...get().progress,settings:normalizeGraphicsSettings({...get().progress.settings,...patch})}),
    reset: () => commit(initialProgress(),{overlay:null,resolution:null},true),
    collectIncome: () => {
      const progress=get().progress;
      // Save only when whole coins are due, or to start the clock.
      if(!progress.income||owedIncome(progress,Date.now()).coins>0)commit({...progress});
    },
  };
});
