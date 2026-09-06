export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 3.5;
export function clampZoom(zoom: number) { return Math.max(MIN_MAP_ZOOM,Math.min(MAX_MAP_ZOOM,zoom)); }
// Keep the camera aimed at land, even after long drags or repeated key presses.
export function clampTarget(x: number, z: number): [number,number] {
  return [Math.max(-35,Math.min(60,x)),Math.max(-48,Math.min(38,z))];
}
