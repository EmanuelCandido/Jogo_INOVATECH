import {surfaceShader} from '../../assets/surfaceFinish';
// The same fine turf covers the mainland and residential garden meshes.
export function GrassMaterial({attach}:{attach?:string}){return <meshStandardMaterial attach={attach} color='#7ac764' roughness={1} onBeforeCompile={surfaceShader('grass')} customProgramCacheKey={()=>'meadow-v2'}/>;}
