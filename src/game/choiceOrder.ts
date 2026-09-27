/** Alternatives are shown in a shuffled order, so the complete solution is not
 * always in the same place. The order comes from a seed rather than from
 * Math.random: it stays the same while the player reads, re-renders and
 * reloads, and changes when the situation is evaluated again. */
export function choiceOrder<T>(items:readonly T[],seed:string):T[]{
 let h=2166136261;
 for(let i=0;i<seed.length;i++)h=Math.imul(h^seed.charCodeAt(i),16777619);
 const random=()=>{h=h+0x6d2b79f5|0;let t=Math.imul(h^h>>>15,1|h);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
 const order=[...items];
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 return order;
}

/** One seed per visit: the situation, how many times it was already decided
 * and the turn in which it is asked. */
export function choiceSeed(problemId:string,decisions:readonly {problemId:string}[]){
 return problemId+':'+decisions.filter(d=>d.problemId===problemId).length+':'+decisions.length;
}
