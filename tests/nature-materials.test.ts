import {describe,it,expect} from 'vitest';
import {modelIO} from './modelIO';

const roofs=['townhouse-sage','townhouse-cream','townhouse-coral','townhouse-pink','house-coral','house-terrace','hospital','school','office-glass','factory','port-warehouse','corner-cafe','fuel-station'];
describe('materiais da vegetação',()=>{
 it('separa a grama dos 13 telhados das folhas das árvores nas duas variantes',async()=>{
  const io=modelIO();
  for(const model of roofs)for(const suffix of ['','-low']){
   const doc=await io.read(`public/assets/models/${model}${suffix}.glb`);
   const materials=doc.getRoot().listMaterials().map(m=>m.getName());
   expect(materials,`${model}${suffix}`).toContain('eco.roofgrass');
  }
  const tree=await io.read('public/assets/models/tree-oak.glb');
  expect(tree.getRoot().listMaterials().some(m=>m.getName()==='eco.roofgrass')).toBe(false);
 });
});
