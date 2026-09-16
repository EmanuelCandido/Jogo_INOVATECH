import {describe,expect,it} from 'vitest';
import {graphicsPixelRatio,maximumGraphicsSettings,resolveGraphics} from '../src/config/graphics';

describe('referência de medição no máximo gráfico',()=>{
 it('mantém Ultra completo mesmo se o dispositivo recomendar qualidade mínima',()=>{
  const q=resolveGraphics(maximumGraphicsSettings,'MINIMUM');
  expect(q).toMatchObject({tier:'ULTRA',renderScale:150,shadowSize:4096,shadows:true,forestDensity:1,undergrowth:1,flowers:1,traffic:1,visitors:1,cityDetail:2,waterEffects:true,smoothGeometry:true,animate:true});
  expect(graphicsPixelRatio(1280,800,1,q,150)).toBe(1.5);
  expect(graphicsPixelRatio(390,844,3,q,150)).toBe(3);
 });
});
