import { describe, expect, it } from 'vitest';
import { OrthographicCamera, Vector3 } from 'three';
import { flightZoom, frameProblemShot, problemViewport } from '../src/game/problemFraming';
import type { CameraShot } from '../src/game/types';

const shot: CameraShot = { position: [14, 10, 19], target: [3, .3, 4], zoom: 65, duration: 1.4 };

describe('mission framing', () => {
  it.each([[360, 640], [412, 839], [720, 1024], [844, 390]])('keeps the target inside the clear viewport at %s × %s', (width, height) => {
    const framed = frameProblemShot(shot, width, height);
    const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 850);
    camera.position.set(...framed.position);
    camera.lookAt(new Vector3(...framed.target));
    camera.zoom = framed.zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const projected = new Vector3(...shot.target).project(camera);
    const view = problemViewport(width, height)!;
    expect((projected.x + 1) * width / 2).toBeCloseTo(view.x + view.width / 2);
    expect((1 - projected.y) * height / 2).toBeCloseTo(view.y + view.height / 2);
    expect(projected.z).toBeGreaterThan(-1);
    expect(projected.z).toBeLessThan(1);
    const direction = new Vector3(...framed.position).sub(new Vector3(...framed.target)).normalize();
    const originalDirection = new Vector3(...shot.position).sub(new Vector3(...shot.target)).normalize();
    expect(direction.distanceTo(originalDirection)).toBeLessThan(1e-10);
    // Even the foreground ground remains beyond the near clipping plane.
    const foreground = new Vector3(0, -.9, -1).unproject(camera);
    expect(foreground.y).toBeGreaterThan(10);
  });

  it('preserves desktop framing and the source shot', () => {
    expect(problemViewport(1440, 900)).toBeNull();
    expect(frameProblemShot(shot, 1440, 900)).toEqual({ ...shot, zoom: 65 * 900 / 760 });
    expect(shot.target).toEqual([3, .3, 4]);
  });

  it('zooms continuously in equal relative steps, in both directions', () => {
    const values = [0, .25, .5, .75, 1].map(t => flightZoom(4, 64, t));
    expect(values).toEqual([4, 8, 16, 32, 64]);
    for (let i = 0; i < values.length; i++) expect(flightZoom(64, 4, i / 4)).toBe(values[4 - i]);
  });
});
