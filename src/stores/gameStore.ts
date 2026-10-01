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
import {beginEnding,cityTransformed,endingDue,nextEnding,skipEnding,type Ending} from '../game/ending';
import {introNode,dialogueEntry} from '../content/dialogues';
import type {Arrival,ArrivalBeat} from '../game/arrival';
interface Store {
  progress: Progress;
  notice: string | null;
  overlay: 'missions' | 'shop' | null;
  resolution: Resolution | null;
  /** The ending sequence while it plays; null otherwise. */
  ending: Ending | null;
  finishResolution: (sequence:number) => void;
  /** Starts the ending when it is due (back on the map after the last solution). */
  startEnding: () => void;
  /** Plays the ending again, for the Extra menu. Needs the whole city solved. */
  playEnding: () => boolean;
  advanceEnding: () => void;
  skipEnding: () => void;
  closeEnding: () => void;
  /** Impactus' arrival cinematic before the first line of a new story. */
  arrival: Arrival | null;
  startArrival: () => void;
  arrivalBeat: (sequence:number, beat:ArrivalBeat) => void;
  finishArrival: (sequence:number) => void;
  /** Plays the arrival again from the map, for the Extra menu. Needs motion. */
  playArrival: () => boolean;
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
let endingSequence = 0;
let arrivals = 0;
const reducedMotion = (progress: Progress) =>
  progress.settings.reducedMotion || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
/** The arrival plays only at the very start of a story, with motion allowed. */
function newArrival(progress: Progress): Arrival | null {
  const fresh = progress.phase === 'INTRO' && progress.introIndex === 0 && introNode(progress).id === dialogueEntry;
  return fresh && !reducedMotion(progress) ? { sequence: ++arrivals, clock: { value: 0 }, beat: 'approach' } : null;
}
export const useGame = create<Store>((set, get) => {
  function commit(progress: Progress, presentation:Partial<Pick<Store,'resolution'|'overlay'|'ending'|'arrival'>>={}, fresh=false) {
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
    ending: null,
    finishResolution: sequence => { if(get().resolution?.sequence===sequence)set({resolution:null}); },
    startEnding: () => {
      const {progress,ending,resolution,arrival}=get();
      if(!ending&&!resolution&&!arrival&&endingDue(progress))set({ending:beginEnding(false,++endingSequence),overlay:null});
    },
    playEnding: () => {
      const {progress,ending,resolution,arrival}=get();
      if(ending||resolution||arrival||progress.phase!=='OVERVIEW'||!cityTransformed(progress))return false;
      set({ending:beginEnding(true,++endingSequence),overlay:null});
      return true;
    },
    advanceEnding: () => {
      const ending=get().ending;if(!ending)return;
      const next=nextEnding(ending);
      // Reaching the closing screen marks the ending as seen; a reload before it plays it again.
      if(next.step==='closing'&&!get().progress.endingSeen)commit({...get().progress,endingSeen:true},{ending:next});
      else if(next!==ending)set({ending:next});
    },
    skipEnding: () => {
      const ending=get().ending;if(!ending)return;
      const next=skipEnding(ending);
      if(next.step==='closing'&&!get().progress.endingSeen)commit({...get().progress,endingSeen:true},{ending:next});
      else set({ending:next});
    },
    closeEnding: () => {
      if(!get().ending)return;
      const progress=get().progress;
      if(progress.endingSeen)set({ending:null});else commit({...progress,endingSeen:true},{ending:null});
    },
    arrival: null,
    startArrival: () => { const arrival = get().arrival ? null : newArrival(get().progress); if (arrival) set({ arrival }); },
    arrivalBeat: (sequence, beat) => { const arrival = get().arrival; if (arrival?.sequence === sequence && arrival.beat !== beat) set({ arrival: { ...arrival, beat } }); },
    finishArrival: sequence => { if (get().arrival?.sequence === sequence) set({ arrival: null }); },
    playArrival: () => {
      const {progress,ending,resolution,arrival}=get();
      if(ending||resolution||arrival||progress.phase!=='OVERVIEW'||reducedMotion(progress))return false;
      set({arrival:{sequence:++arrivals,clock:{value:0},beat:'approach'},overlay:null});
      return true;
    },
    openOverlay: (overlay) => {
      if (overlay && (get().progress.phase !== 'OVERVIEW' || get().ending || get().arrival)) return;
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
    select: (id) => { if(!get().ending)commit(ProblemManager.select(get().progress, id)); },
    revisit: (id) => { if(!get().ending)commit(ProblemManager.revisit(get().progress, id)); },
    leave: () => commit(ProblemManager.leave(get().progress),{resolution:null}),
    choose: (id) => {
      try {
        const before=get().progress,after=ProblemManager.decide(before,id);
        commit(after,{resolution:createResolution(before,after,reducedMotion(before))});
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
    reset: () => { const progress = initialProgress(); commit(progress,{overlay:null,resolution:null,ending:null,arrival:newArrival(progress)},true); },
    collectIncome: () => {
      const progress=get().progress;
      // Save only when whole coins are due, or to start the clock.
      if(!progress.income||owedIncome(progress,Date.now()).coins>0)commit({...progress});
    },
  };
});
