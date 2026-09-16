import { Vector3 } from 'three';
import type { CameraShot, Vec3 } from './types';

// Shared with the dialogue dock through App's CSS custom properties. The canvas
// stays full size throughout the flight, so opening a dialogue cannot resize it.
export const problemViewHeight = .42;
export const problemViewWidth = .44;

export function problemViewport(width: number, height: number) {
  const landscape = height <= 500 && width > height;
  if (width >= 1000 && !landscape) return null;
  return landscape
    ? { x: 16, y: 16, width: width * problemViewWidth - 32, height: height - 32 }
    : { x: 16, y: 80, width: width - 32, height: height * problemViewHeight - 96 };
}

export function frameProblemShot(shot: CameraShot, width: number, height: number): CameraShot {
  const viewport = problemViewport(width, height);
  if (!viewport) return { ...shot, zoom: shot.zoom * Math.min(width / 1100, height / 760, 1.25) };
  const zoom = shot.zoom * Math.min(viewport.width / 650, Math.max(48, viewport.height) / 400, 1);
  const forward = new Vector3(...shot.target).sub(new Vector3(...shot.position)).normalize();
  const right = forward.clone().cross(new Vector3(0, 1, 0)).normalize();
  const up = right.clone().cross(forward).normalize();
  const shift = right.multiplyScalar((width / 2 - viewport.x - viewport.width / 2) / zoom)
    .addScaledVector(up, (viewport.y + viewport.height / 2 - height / 2) / zoom);
  // Orthographic zoom does not need an eye close to the ground. Pull it back
  // along the same viewing direction so a tall phone's lower rays do not start
  // below the terrain after moving the subject toward the top of the screen.
  const distance = Math.max(200, new Vector3(...shot.position).distanceTo(new Vector3(...shot.target)));
  return {
    ...shot, zoom,
    position: new Vector3(...shot.target).addScaledVector(forward, -distance).add(shift).toArray() as Vec3,
    target: new Vector3(...shot.target).add(shift).toArray() as Vec3,
  };
}

// Equal relative zoom steps avoid the abrupt early magnification of a linear
// zoom when moving from the whole city to a small street-level detail.
export function flightZoom(from: number, to: number, progress: number) {
  return from * (to / from) ** progress;
}
