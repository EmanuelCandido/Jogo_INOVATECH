import {afterEach, expect, test, vi} from 'vitest';
import {publicAsset} from '../src/assets/publicAsset';
import {modelUrl} from '../src/assets/modelLayout';

afterEach(() => vi.unstubAllEnvs());

test('public images and models resolve beneath the hosting subdirectory', () => {
  vi.stubEnv('BASE_URL', '/Jogo_INOVATECH/');
  expect(publicAsset('/assets/ui/figma/logo.svg')).toBe('/Jogo_INOVATECH/assets/ui/figma/logo.svg');
  expect(modelUrl({kind: 'glb', url: '/assets/models/tree-oak.glb'}, 'ULTRA'))
    .toBe('/Jogo_INOVATECH/assets/models/tree-oak.glb');
});

test('local root hosting keeps the existing asset addresses', () => {
  vi.stubEnv('BASE_URL', '/');
  expect(publicAsset('/assets/portraits/robot/pose-2.webp')).toBe('/assets/portraits/robot/pose-2.webp');
});
