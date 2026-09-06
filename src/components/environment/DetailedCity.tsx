import {lazy,Suspense} from 'react';
import {useResolvedGraphics} from '../../stores/graphicsStore';
const DetailedLayer=lazy(()=>import('./DetailedLayer'));
export function DetailedCity(){
 const {cityDetail}=useResolvedGraphics();
 return cityDetail!==0?<Suspense fallback={null}><DetailedLayer level={cityDetail}/></Suspense>:null;
}
