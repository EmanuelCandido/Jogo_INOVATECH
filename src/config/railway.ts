import {CatmullRomCurve3,Vector3} from 'three';
// A level elevated approach from the woodland tunnel to a terminal above the
// school district. The last seven metres are straight through the station.
export const railDeckTop=4.18;
export const railCurve=new CatmullRomCurve3([[-48,-35],[-43,-35],[-36,-36],[-25,-36],[-19,-36],[-15,-36],[-11.5,-36]].map(([x,z])=>new Vector3(x,railDeckTop,z)),false,'catmullrom',.18);
export const railSamples=railCurve.getSpacedPoints(110);
export const stationPosition:[number,number,number]=[-15,0,-36];
export const tunnelPosition:[number,number,number]=[-48,4.0,-35];
