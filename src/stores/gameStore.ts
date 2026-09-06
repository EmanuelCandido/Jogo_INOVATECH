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
interface Store {
  progress: Progress;
  notice: string | null;
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
}
const loaded = loadProgress(browserSave);
export const useGame = create<Store>((set, get) => {
  function commit(progress: Progress) {
    if (progress === get().progress) return;
    let notice: string | null = null;
    try {
      saveProgress(browserSave, progress);
    } catch {
      notice =
        "O navegador não permitiu salvar. Seu progresso está disponível apenas nesta sessão.";
    }
    set({ progress, notice });
  }
  return {
    progress: loaded.data,
    notice: loaded.warning,
    select: (id) => commit(ProblemManager.select(get().progress, id)),
    revisit: (id) => commit(ProblemManager.revisit(get().progress, id)),
    leave: () => commit(ProblemManager.leave(get().progress)),
    choose: (id) => {
      try {
        commit(ProblemManager.decide(get().progress, id));
      } catch (error) {
        set({ notice: (error as Error).message });
      }
    },
    next: () => commit(NarrativeManager.next(get().progress)),
    narrativeChoice: (id) =>
      commit(NarrativeManager.choose(get().progress, id)),
    cameraArrived: () => commit(NarrativeManager.cameraArrived(get().progress)),
    settings: (quality, reducedMotion) =>
      commit({ ...get().progress, settings: { ...get().progress.settings, quality, reducedMotion } }),
    graphics: (patch) => commit({...get().progress,settings:normalizeGraphicsSettings({...get().progress.settings,...patch})}),
    reset: () => commit(initialProgress()),
  };
});
