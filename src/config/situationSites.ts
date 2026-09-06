// Only vegetation/decorations are cleared in these small teaching areas.
// Streets, buildings, public equipment and the map layout stay in place.
export const situationClearings=[
 {x:-31,z:-28,r:2.5},{x:-24,z:-36,r:3.9},{x:26,z:-26,r:3.1},
 {x:17.5,z:6.5,r:1.2},{x:-6.8,z:-1.8,r:1.8},{x:-15,z:12,r:1.3}
];
export function inSituationClearing(x:number,z:number){return situationClearings.some(c=>Math.hypot(x-c.x,z-c.z)<c.r);}
