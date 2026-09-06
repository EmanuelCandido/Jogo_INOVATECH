// Scalar river layout shared by content and renderer without loading Three.js.
export const riverCenter=(x:number)=>-45.5+Math.sin((x+20)/18)*.4-13*(Math.min(1,Math.max(0,(x+18)/20))**2*(3-2*Math.min(1,Math.max(0,(x+18)/20))));
export const riverHalfWidth=1.4;
