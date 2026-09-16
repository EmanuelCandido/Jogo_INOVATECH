import { Vector3 } from 'three';
import type { CameraShot, Vec3 } from './types';

// Reading time starts after the camera flight, including with reduced motion.
export const problemPreviewDuration = 2200;

export function frameProblemShot(shot: CameraShot, width: number, height: number): CameraShot {
  const mobile = width < 1000;
  const zoom = shot.zoom * (mobile
    ? Math.min(width / 650, height / 500, 1)
    : Math.min(width / 1100, height / 760, 1.25));
  if (!mobile) return { ...shot, zoom };
  const forward = new Vector3(...shot.target).sub(new Vector3(...shot.position)).normalize();
  // Orthographic zoom does not need an eye close to the ground. Pull it back
  // along the same viewing direction so a tall phone's lower rays do not start
  // below the terrain. The mission is centered during the unobstructed preview.
  const distance = Math.max(200, new Vector3(...shot.position).distanceTo(new Vector3(...shot.target)));
  return {
    ...shot, zoom,
    position: new Vector3(...shot.target).addScaledVector(forward, -distance).toArray() as Vec3,
  };
}

// Equal relative zoom steps avoid the abrupt early magnification of a linear
// zoom when moving from the whole city to a small street-level detail.
export function flightZoom(from: number, to: number, progress: number) {
  return from * (to / from) ** progress;
}
