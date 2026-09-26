import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {create} from 'zustand';
import {useLoadingSnapshot} from '../../game/useLoadingActive';

/** First reveal only: 'waiting' until the city has loaded, 'compiling' while
 * its shaders compile in parallel, then 'ready'. */
export const useShaderGate=create<{state:'waiting'|'compiling'|'ready';compileMs?:number}>(()=>({state:'waiting'}));
/** True until the first reveal: frames drawn under the loading screen are
 * never seen, and on phones each one compiled new shaders synchronously as
 * models arrived, freezing the loading animation for seconds. */
export const shaderGatePending=()=>useShaderGate.getState().state!=='ready';

/** Drawing the loaded city for the first time used to link every shader
 * program synchronously, blocking the page (and the loading animation) for
 * seconds on phones. Compile them with KHR_parallel_shader_compile first,
 * while the loading screen still covers the canvas, and hold rendering until
 * they are ready. Browsers without the extension keep the old behaviour. */
export function ShaderGate(){
 const {gl,scene,camera,invalidate}=useThree();
 const {active,loaded}=useLoadingSnapshot();
 useEffect(()=>{
  if(active||loaded===0||useShaderGate.getState().state!=='waiting')return;
  if(!gl.extensions.has('KHR_parallel_shader_compile')){useShaderGate.setState({state:'ready'});return;}
  useShaderGate.setState({state:'compiling'});
  let settled=false;const start=performance.now();
  const release=()=>{if(settled)return;settled=true;useShaderGate.setState({state:'ready',compileMs:performance.now()-start});invalidate();};
  gl.compileAsync(scene,camera).then(release,release);
  // Never hold the game back indefinitely on a misbehaving driver.
  const timer=setTimeout(release,20000);
  return()=>clearTimeout(timer);
 },[gl,scene,camera,invalidate,active,loaded]);
 return null;
}
