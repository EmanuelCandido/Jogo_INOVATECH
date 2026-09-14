/** Keep every vehicle on its authored route; never hide a placement to clear a crossing. */
export function reserveTraffic<T>(items:T[],blocked:(item:T)=>boolean,candidate:(item:T,offset:number)=>T|null,overlaps:(a:T,b:T)=>boolean,maxDistance:number){
 const result=items.slice(),pending=items.map((item,index)=>({item,index})).filter(({item,index})=>blocked(item)||items.slice(0,index).some(other=>overlaps(item,other)));
 const moving=new Set(pending.map(p=>p.index));
 const options=new Map<number,{values:T[];cursor:number}>();
 function* choices(index:number):Generator<T>{
  let saved=options.get(index);
  if(!saved){saved={values:[],cursor:0};options.set(index,saved);}
  yield* saved.values;
  while(saved.cursor<Math.floor(maxDistance*2)*2){
   const step=saved.cursor++,delta=(Math.floor(step/2)+1)*.5,sign=step%2===0?-1:1;
   // Always sample from the original placement: callers associate its identity
   // with an authored route, lane and distance along that route.
   const next=candidate(items[index],delta*sign);
   if(next!==null&&!blocked(next)){saved.values.push(next);yield next;}
  }
 }
 for(const {item,index} of pending){
  let attempts=20000;
  const place=(at:number,depth:number,locked:Set<number>):boolean=>{
   const conflicts=(next:T)=>result.flatMap((other,j)=>j!==at&&(!moving.has(j)||locked.has(j))&&overlaps(next,other)?[j]:[]);
   const occupied:{next:T;blockers:number[]}[]=[];
   for(const next of choices(at)){
    if(--attempts<0)return false;
    const blockers=conflicts(next);
    if(!blockers.length){result[at]=next;return true;}
    if(depth>0&&blockers.length<=2&&!blockers.some(j=>locked.has(j)))occupied.push({next,blockers});
   }
   // Only disturb neighbours when no free position exists. Reserve the new
   // position while moving them, and roll the whole branch back on failure.
   const protectedIndices=new Set([...locked,at]);
   for(const {next,blockers} of occupied){
    if(attempts<0)return false;
    const before=result.slice();result[at]=next;
    if(blockers.every(j=>place(j,depth-1,protectedIndices))&&conflicts(next).length===0)return true;
    for(let j=0;j<result.length;j++)result[j]=before[j];
   }
   return false;
  }
  if(!place(index,4,new Set()))throw new Error(`No free position on the authored route for vehicle ${index}: ${JSON.stringify(item)}`);
  moving.delete(index);
 }
 return result;
}
