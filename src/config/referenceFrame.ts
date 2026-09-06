// Projection calibrated to the street directions and framing of the supplied image.
export const referenceFrame={width:1672,height:941,zoom:18.2};
export const mapFit=(width:number,height:number)=>Math.min(width/referenceFrame.width,height/referenceFrame.height);
export const mapTarget:[number,number,number]=[13.7,0,-9.1];
export const mapEye:[number,number,number]=[123.7,130,135.9];
/** Reference pixels of a ground point, for composition audits. */
export function referencePixel(x:number,z:number):[number,number]{
  const length=Math.hypot(110,145),rightX=145/length,rightZ=-110/length;
  const elevation=130/Math.hypot(length,130);
  const dx=x-mapTarget[0],dz=z-mapTarget[2];
  return [836+(dx*rightX+dz*rightZ)*18.2,470.5+(dx*-rightZ+dz*rightX)*elevation*18.2];
}
