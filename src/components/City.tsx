import {ReferenceCity} from './environment/ReferenceCity';
import {SituationLayers} from './city/SituationLayers';
export function City({interactive}:{interactive:boolean}){
 return <group><ReferenceCity/><SituationLayers interactive={interactive}/></group>;
}
