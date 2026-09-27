import {expect,it} from 'vitest';
import {triangleTransform,torsoTransform,type Triangle} from '../src/ui/wardrobe/fitting';
import type {CharacterPose} from '../src/game/types';

it('mapeia os três pontos do tecido no corpo sem deslocar a ilustração',()=>{
  const from:Triangle=[[4,8],[12,6],[9,23]],to:Triangle=[[290,299],[399,299],[339,436]];
  const [a,b,c,d,e,f]=triangleTransform(from,to).slice(7,-1).split(' ').map(Number);
  for(let i=0;i<3;i++){
    expect(a*from[i][0]+c*from[i][1]+e).toBeCloseTo(to[i][0],8);
    expect(b*from[i][0]+d*from[i][1]+f).toBeCloseTo(to[i][1],8);
  }
  expect(()=>triangleTransform([[1,1],[2,2],[3,3]],to)).toThrow('sem área');
});
it('conserva a orientação e o tamanho do tecido nas cinco poses originais',()=>{
  const poses:CharacterPose[]=['character_intro','character_thinking','character_alert','character_success','character_failure'];
  for(const pose of poses){
    const [a,b,c,d,e,f]=torsoTransform(pose).slice(7,-1).split(' ').map(Number);
    expect([a,b,c,d,e,f].every(Number.isFinite)).toBe(true);
    expect(a*d-b*c).toBeGreaterThan(.8);expect(a*d-b*c).toBeLessThan(1.2);
  }
  expect(torsoTransform('character_intro')).toBe('matrix(1 0 0 1 0 0)');
});
