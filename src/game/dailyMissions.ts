import type { Progress } from './types';

export type DailyMissionId = 'energy' | 'explore' | 'emotion' | 'care';
export interface DailyMissions {
  day: string;
  energy: boolean;
  explored: string[];
  emotions: string[];
  helped: string[];
  claimed: DailyMissionId[];
  bonusClaimed: boolean;
}
export const dailyMissionList: { id: DailyMissionId; title: string; goal: number; reward: number; hint: string }[] = [
  { id: 'energy', title: 'Dar energia ao Impactus', goal: 1, reward: 80, hint: 'Recarregue as energias do seu companheiro.' },
  { id: 'explore', title: 'Explorar a cidade', goal: 5, reward: 150, hint: 'Visite 5 lugares diferentes no mapa hoje.' },
  { id: 'emotion', title: 'Conhecer uma emoção', goal: 1, reward: 1, hint: 'Ouça a observação do Impactus sobre um problema.' },
  { id: 'care', title: 'Cuidar da cidade', goal: 1, reward: 100, hint: 'Resolva completamente um problema hoje.' },
];
export const DAILY_BONUS = 100;
export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export const initialDailyMissions = (now = new Date()): DailyMissions => ({ day: localDay(now), energy: false, explored: [], emotions: [], helped: [], claimed: [], bonusClaimed: false });
export function missionCount(daily: DailyMissions, id: DailyMissionId): number {
  switch (id) {
    case 'energy': return Number(daily.energy);
    case 'explore': return Math.min(5, daily.explored.length);
    case 'emotion': return Math.min(1, daily.emotions.length);
    case 'care': return Math.min(1, daily.helped.length);
  }
}
export function normalizeDailyMissions(value: unknown, now = new Date()): DailyMissions {
  const fresh = initialDailyMissions(now);
  if (!value || typeof value !== 'object') return fresh;
  const raw = value as Partial<DailyMissions>;
  if (raw.day !== fresh.day) return fresh;
  const ids = (list: unknown) => Array.isArray(list) ? [...new Set(list.filter((id): id is string => typeof id === 'string'))].slice(0, 100) : [];
  const daily: DailyMissions = { ...fresh, energy: raw.energy === true, explored: ids(raw.explored), emotions: ids(raw.emotions), helped: ids(raw.helped) };
  const claimed = Array.isArray(raw.claimed) ? raw.claimed : [];
  daily.claimed = dailyMissionList.filter(m => claimed.includes(m.id) && missionCount(daily, m.id) >= m.goal).map(m => m.id);
  daily.bonusClaimed = raw.bonusClaimed === true && daily.claimed.length === dailyMissionList.length;
  return daily;
}
export function refreshDaily(progress: Progress, now = new Date()): Progress {
  return progress.dailyMissions.day === localDay(now) ? progress : { ...progress, dailyMissions: initialDailyMissions(now) };
}
export function trackDailyActivity(previous: Progress, next: Progress, now = new Date()): Progress {
  let result = refreshDaily(next, now);
  const id = next.selectedProblem;
  const add = (key: 'explored' | 'emotions' | 'helped', value: string) => {
    if (!result.dailyMissions[key].includes(value)) result = { ...result, dailyMissions: { ...result.dailyMissions, [key]: [...result.dailyMissions[key], value] } };
  };
  if (id && next.phase === 'FOCUSING' && (previous.phase !== 'FOCUSING' || previous.selectedProblem !== id)) add('explored', id);
  if (id && next.phase === 'COMMENT' && previous.phase === 'FOCUSING') add('emotions', id);
  if (id && next.phase === 'RESULT' && previous.decisions.length < next.decisions.length && next.problemStates[id] === 'SOLVED') add('helped', id);
  return result;
}
export function giveEnergy(progress: Progress, now = new Date()): Progress {
  const next = refreshDaily(progress, now);
  return next.dailyMissions.energy ? next : { ...next, dailyMissions: { ...next.dailyMissions, energy: true } };
}
export function claimMission(progress: Progress, id: DailyMissionId | 'bonus', now = new Date()): Progress {
  const next = refreshDaily(progress, now);
  const daily = next.dailyMissions;
  if (id === 'bonus') {
    if (daily.bonusClaimed || daily.claimed.length < dailyMissionList.length) return next;
    return { ...next, coins: next.coins + DAILY_BONUS, dailyMissions: { ...daily, bonusClaimed: true } };
  }
  const mission = dailyMissionList.find(m => m.id === id);
  if (!mission || daily.claimed.includes(id) || missionCount(daily, id) < mission.goal) return next;
  return { ...next, coins: next.coins + mission.reward, dailyMissions: { ...daily, claimed: [...daily.claimed, id] } };
}
