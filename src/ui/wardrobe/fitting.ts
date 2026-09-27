import type {CharacterPose} from '../../game/types';

export type Point=readonly [number,number];
export type Triangle=readonly [Point,Point,Point];
/** An affine triangle in the original 2D sprite. No camera or 3D model. */
export function triangleTransform(from:Triangle,to:Triangle){
  const [[x0,y0],[x1,y1],[x2,y2]]=from,[[u0,v0],[u1,v1],[u2,v2]]=to;
  const det=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
  if(Math.abs(det)<.0001)throw new Error('Triângulo de roupa sem área.');
  const a=((u1-u0)*(y2-y0)-(u2-u0)*(y1-y0))/det;
  const c=((u2-u0)*(x1-x0)-(u1-u0)*(x2-x0))/det;
  const b=((v1-v0)*(y2-y0)-(v2-v0)*(y1-y0))/det;
  const d=((v2-v0)*(x1-x0)-(v1-v0)*(x2-x0))/det;
  return `matrix(${a} ${b} ${c} ${d} ${u0-a*x0-c*y0} ${v0-b*x0-d*y0})`;
}
// Collar corners and waist, measured in the five original illustrations.
const shoulders:Record<CharacterPose,Triangle>={
  character_intro:[[293,293],[409,298],[347,443]],
  character_thinking:[[290,299],[399,299],[339,436]],
  character_alert:[[315,292],[435,299],[384,438]],
  character_success:[[303,283],[427,297],[358,436]],
  character_failure:[[285,286],[413,295],[338,441]],
};
export const torsoTransform=(pose:CharacterPose)=>triangleTransform(shoulders.character_intro,shoulders[pose]);
const head:Record<CharacterPose,Triangle>={
  character_intro:[[244,127],[480,144],[352,291]],
  character_thinking:[[241,122],[480,152],[349,290]],
  character_alert:[[255,112],[511,143],[372,288]],
  character_success:[[258,116],[507,155],[367,290]],
  character_failure:[[244,99],[508,151],[359,283]],
};
export const headTransform=(pose:CharacterPose)=>triangleTransform(head.character_intro,head[pose]);
export const wornVestOutline='M295 291L307 300L319 346L366 308L399 296L418 298Q399 322 405 346L423 369L411 433Q345 463 278 442L282 417Q265 393 265 357Q267 321 295 291Z';
export const closedVestOutline='M290 295Q339 322 401 297L417 302Q398 330 410 351L426 372L412 435Q349 460 277 443L282 418Q265 394 264 358Q270 320 290 295Z';
