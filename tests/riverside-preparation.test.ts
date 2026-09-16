import {expect,test} from 'vitest';
import {riversideAssets,riversidePreparation} from '../src/config/referenceDetails';
import prepared from '../src/config/riverside-layout.json';

test('the browser snapshot preserves every placement produced by authoring',()=>{
 // Vitest uses the original SSR placement search, not the cached browser path.
 expect(import.meta.env.SSR).toBe(true);
 expect(riversideAssets.length).toBeGreaterThan(300);
 expect(JSON.parse(JSON.stringify(riversidePreparation))).toEqual(prepared);
 expect(new Set(prepared.map(p=>p.sourceIndex)).size).toBe(riversideAssets.length);
 expect(prepared.map(p=>p.position)).toEqual(riversideAssets.map(p=>p.position));
});
