import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createPreparationActivity,pausePreparation,preparationRunning,schedulePreparation} from '../src/game/resourcePreparation';

let idle:Map<number,IdleRequestCallback>,nextId:number;
beforeEach(()=>{
 vi.useFakeTimers();idle=new Map();nextId=0;
 vi.stubGlobal('window',{setTimeout,clearTimeout,requestIdleCallback:(cb:IdleRequestCallback)=>{idle.set(++nextId,cb);return nextId;},cancelIdleCallback:(id:number)=>idle.delete(id)});
});
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();vi.unstubAllGlobals();});
async function tick(ms:number,remaining=10,timedOut=false){
 await vi.advanceTimersByTimeAsync(ms);const callbacks=[...idle.values()];idle.clear();
 for(const cb of callbacks)cb({didTimeout:timedOut,timeRemaining:()=>remaining});
 await Promise.resolve();await Promise.resolve();
}
describe('prioridade da navegação na preparação opcional',()=>{
 it('mantém gestos simultâneos bloqueados até soltar o último e aguarda silêncio',()=>{
  let time=0;const activity=createPreparationActivity(()=>time),pointer={},keyboard={};
  expect(activity.busy()).toBe(false);activity.hold(pointer);activity.hold(keyboard);
  time=10000;expect(activity.busy()).toBe(true);activity.release(pointer);expect(activity.busy()).toBe(true);
  activity.release(keyboard);time+=499;expect(activity.busy()).toBe(true);time++;expect(activity.busy()).toBe(false);
  activity.touch();expect(activity.busy()).toBe(true);
 });
 it('não inicia trabalho durante interação, mesmo quando o callback de idle expira',async()=>{
  let busy=true;const step=vi.fn(()=>false),job=schedulePreparation({},'test',step,()=>!busy,0);
  await tick(0,0,true);await tick(80,0,true);expect(step).not.toHaveBeenCalled();expect(job.stats.deferred).toBe(2);
  busy=false;await tick(80);expect(step).toHaveBeenCalledOnce();expect(job.stats.pending).toBe(false);
 });
 it('admite somente uma unidade por callback e respeita o orçamento disponível',async()=>{
  let count=0;const step=vi.fn(()=>++count<3),job=schedulePreparation({},'test',step,()=>true,0);
  await tick(0,2);expect(step).not.toHaveBeenCalled();
  await tick(80);expect(count).toBe(1);await tick(80);expect(count).toBe(2);
  await tick(80);expect(count).toBe(3);expect(job.stats.completed).toBe(3);expect(job.stats.pending).toBe(false);
 });
 it('não deixa callbacks de idle curtos adiarem indefinidamente uma unidade',async()=>{
  let now=0;vi.spyOn(performance,'now').mockImplementation(()=>now);
  const step=vi.fn(()=>true),job=schedulePreparation({},'test',step,()=>true,0);
  await tick(0,1);expect(step).not.toHaveBeenCalled();
  for(let i=1;i<=6;i++){now=i*80;await tick(80,1);expect(step).not.toHaveBeenCalled();}
  now=560;await tick(80,1);expect(step).toHaveBeenCalledTimes(1);
  now=640;await tick(80,1);expect(step).toHaveBeenCalledTimes(1);
  now=1200;await tick(80,1);expect(step).toHaveBeenCalledTimes(2);job.cancel();vi.restoreAllMocks();
 });
 it('a espera máxima nunca ultrapassa a prioridade do gesto',async()=>{
  let now=0,busy=true;vi.spyOn(performance,'now').mockImplementation(()=>now);
  const step=vi.fn(()=>false),job=schedulePreparation({},'test',step,()=>!busy,0);
  await tick(0,1);now=10000;await tick(80,1);expect(step).not.toHaveBeenCalled();
  busy=false;await tick(80,1);expect(step).toHaveBeenCalledOnce();expect(job.stats.pending).toBe(false);vi.restoreAllMocks();
 });
 it('usa outro callback de idle sem espera artificial quando a unidade está pronta',async()=>{
  let count=0;const job=schedulePreparation({},'shaders',()=>++count<2,()=>true,0,0);
  await tick(0);expect(count).toBe(1);await tick(0);expect(count).toBe(2);expect(job.stats.pending).toBe(false);
 });
 it('mantém o recuo de 80 ms quando bloqueada, mesmo na fila sem intervalo',async()=>{
  const step=vi.fn(()=>true),job=schedulePreparation({},'shaders',step,()=>false,0,0);
  await tick(0);await tick(0);expect(job.stats.deferred).toBe(1);await tick(79);expect(job.stats.deferred).toBe(1);
  await tick(1);expect(job.stats.deferred).toBe(2);expect(step).not.toHaveBeenCalled();job.cancel();
 });
 it('não sobrepõe unidades assíncronas e cancela sem agendar a próxima',async()=>{
  let resolve!:(more:boolean)=>void;const step=vi.fn(()=>new Promise<boolean>(done=>{resolve=done;}));
  const job=schedulePreparation({},'test',step,()=>true,0);await tick(0);await tick(10000);
  expect(step).toHaveBeenCalledOnce();job.cancel();resolve(true);await tick(10000);
  expect(step).toHaveBeenCalledOnce();expect(job.stats.cancelled).toBe(true);expect(idle.size).toBe(0);
 });
 it('pausa novas unidades, aguarda a unidade em execução e retoma após o último dono',async()=>{
  const target={},first={},second={};let finish!:(more:boolean)=>void;
  const step=vi.fn(()=>new Promise<boolean>(resolve=>{finish=resolve;}));
  const job=schedulePreparation(target,'shaders',step,()=>true,0);
  await tick(0);expect(preparationRunning(target)).toBe(true);pausePreparation(target,first,true);pausePreparation(target,second,true);
  finish(true);await Promise.resolve();await Promise.resolve();expect(preparationRunning(target)).toBe(false);
  await tick(5000,0,true);expect(step).toHaveBeenCalledTimes(1);
  pausePreparation(target,first,false);await tick(80);expect(step).toHaveBeenCalledTimes(1);
  pausePreparation(target,second,false);await tick(80);expect(step).toHaveBeenCalledTimes(2);job.cancel();finish(false);
 });
 it('substitui trabalho pendente do mesmo dono sem executar callbacks antigos',async()=>{
  const target={},old=vi.fn(()=>false),current=vi.fn(()=>false);
  const job=schedulePreparation(target,'test',old,()=>true,0);await vi.advanceTimersByTimeAsync(0);
  schedulePreparation(target,'test',current,()=>true,0);await tick(0);
  expect(job.stats.cancelled).toBe(true);expect(old).not.toHaveBeenCalled();expect(current).toHaveBeenCalledOnce();
 });
 it('também respeita o bloqueio sem requestIdleCallback e absorve falha opcional',async()=>{
  delete (window as Partial<Window>).requestIdleCallback;let busy=true;
  const step=vi.fn(()=>Promise.reject(new Error('compile failed'))),job=schedulePreparation({},'test',step,()=>!busy,0);
  await tick(0);expect(step).not.toHaveBeenCalled();busy=false;await tick(80);
  expect(job.stats.errors).toBe(1);expect(job.stats.pending).toBe(false);await tick(10000);expect(step).toHaveBeenCalledOnce();
 });
});
