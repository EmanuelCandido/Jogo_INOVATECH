import {useMemo} from 'react';
import {cityDecorations} from '../../config/cityDetails';
import {DetailInstances} from './Landscape';
import {AssetBatch} from '../city/AssetBatch';
export default function DetailedLayer({level}:{level:1|2}){
 const groups=useMemo(()=>cityDecorations.filter(g=>g.tier<=level),[level]);
 const details=useMemo(()=>groups.flatMap(g=>g.details),[groups]),assets=useMemo(()=>groups.flatMap(g=>g.assets),[groups]);
 return <group name="Detalhes urbanos"><DetailInstances details={details}/><AssetBatch placements={assets}/></group>;
}
