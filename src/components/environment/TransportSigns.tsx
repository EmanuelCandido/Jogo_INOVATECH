import {useEffect,useMemo} from 'react';
import {CanvasTexture,SRGBColorSpace,DoubleSide} from 'three';
import {railFacilities,worldPoint,facing} from '../../config/referenceMap';

/** Small physical signs, using local fonts and no remote font downloads. */
export function TransportSigns(){
 const textures=useMemo(()=>railFacilities.map(s=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=112;
  const c=canvas.getContext('2d')!;c.fillStyle='#205363';c.fillRect(0,0,512,112);
  c.strokeStyle='#eddda5';c.lineWidth=5;c.strokeRect(6,6,500,100);
  c.fillStyle='#fff4d7';c.textAlign='center';c.textBaseline='middle';c.font='bold 27px sans-serif';c.fillText(s.name.toUpperCase(),256,43,475);
  c.font='17px sans-serif';c.fillText(s.route.id==='monotrilho'?'MONOTRILHO · EMBARQUE':'TREM REGIONAL · EMBARQUE',256,80,475);
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return texture;
 }),[]);
 useEffect(()=>()=>textures.forEach(t=>t.dispose()),[textures]);
 return <group name='Estações identificadas'>{railFacilities.map((s,i)=><mesh key={s.name} position={worldPoint(...s.centre,s.height+2.24)} rotation={[0,facing(...s.n),0]}>
  <planeGeometry args={[2.38,.52]}/><meshStandardMaterial map={textures[i]} side={DoubleSide} roughness={.8}/>
 </mesh>)}</group>;
}
