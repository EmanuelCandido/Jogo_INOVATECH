import type {Progress,ProblemState} from './types';

/** Each situation the player fixed keeps paying the city a little while the
 * game is open, and for up to one hour while it is closed.
 *
 * Balance (details in docs/RENDA-PASSIVA.md): a complete solution pays 2 coins
 * per minute, half of it for a temporary one. The whole city solved yields 20
 * coins per minute (1,200 per hour): an average shop piece (175 coins) every
 * 9 minutes, and all 27 pieces (4,730 coins) only after about 4 hours. A
 * solution's 100-coin reward takes 50 minutes to be earned again passively,
 * so solving new situations stays the best source of coins. */
export const passiveIncome={
 perMinute:{SOLVED:2,TEMPORARILY_SOLVED:1} as Partial<Record<ProblemState,number>>,
 offlineCapMinutes:60,
};
export interface IncomeClock {at:number;carry:number}

export function incomePerMinute(progress:Pick<Progress,'problemStates'>){
 return Object.values(progress.problemStates).reduce((sum,state)=>sum+(passiveIncome.perMinute[state]??0),0);
}

/** Coins owed since the last payment, and the fraction carried to the next. */
export function owedIncome(progress:Pick<Progress,'problemStates'|'income'>,now:number){
 const clock=progress.income;
 if(!clock)return {coins:0,carry:0};
 const minutes=Math.min(passiveIncome.offlineCapMinutes,Math.max(0,now-clock.at)/60000);
 const total=clock.carry+incomePerMinute(progress)*minutes,coins=Math.floor(total);
 return {coins,carry:total-coins};
}

/** Pays what the previous state earned up to now and restarts the clock, so a
 * new solution only earns from the moment it exists. */
export function settleIncome(previous:Progress,next:Progress,now:number):Progress{
 const {coins,carry}=owedIncome(previous,now);
 return {...next,coins:next.coins+coins,income:{at:now,carry}};
}

export function normalizeIncome(value:unknown,now:number):IncomeClock|undefined{
 if(!value||typeof value!=='object')return undefined;
 const {at,carry}=value as Partial<IncomeClock>;
 if(typeof at!=='number'||!Number.isFinite(at)||typeof carry!=='number'||!(carry>=0&&carry<1))return undefined;
 // A clock set in the future (a changed device clock) restarts from now.
 return {at:Math.min(at,now),carry};
}
