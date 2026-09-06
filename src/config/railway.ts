import {CatmullRomCurve3,Vector3} from 'three';
export const railCurve=new CatmullRomCurve3([[-51,-9],[-43,-8.5],[-37,-11],[-35.2,-13.2],[-34.5,-15.9]].map(([x,z])=>new Vector3(x,.14,z)),false,'catmullrom',.3);
export const railSamples=railCurve.getSpacedPoints(110);
