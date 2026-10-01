/** Composition axes in world space: u goes right in the image, v into the valley.
 * Kept apart from referenceMap so situation visuals can use it without a cycle. */
const h=Math.hypot(110,145);
export const mapBasis={rx:145/h,rz:-110/h,dx:-110/h,dz:-145/h};
