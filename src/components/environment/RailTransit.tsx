import {railStructure,railAssets} from '../../config/railTransit';
import {AssetBatch} from '../city/AssetBatch';
import {DetailInstances} from './Landscape';
export function RailTransit(){return <group name="Linha elevada e estação solar">
 <DetailInstances details={railStructure}/><AssetBatch placements={railAssets}/>
</group>;}
