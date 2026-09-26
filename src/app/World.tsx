import { Canvas } from "@react-three/fiber";
import { City } from "../components/City";
import { CameraRig } from "../game/CameraDirector";
import { overview } from "../config/world";
import {useGraphicsRuntime,useResolvedGraphics} from '../stores/graphicsStore';
import {GraphicsRuntime} from '../components/city/GraphicsRuntime';
import {AmbientFrames} from '../components/city/AmbientFrames';
import { SceneReady } from "../components/city/SceneReady";
import { ShadowCache } from "../components/city/ShadowCache";
import {InstanceCulling} from '../components/city/InstanceCulling';
import {ShaderWarmup} from '../components/city/ShaderWarmup';
import {DepthPrepass} from '../components/city/DepthPrepass';
import {MotionResolution} from '../components/city/MotionResolution';
import {ShaderGate} from '../components/city/ShaderGate';
import {LiveFrameRate} from '../components/city/LiveFrameRate';
import {ResolutionDirector} from '../components/city/ResolutionScene';
import {lazy,Suspense,useRef} from 'react';
import {staticFrameEnabled,trackInvalidate} from '../game/staticFrame';
import type {DirectionalLight} from 'three';
const Benchmark=lazy(()=>import('../components/city/Benchmark'));
const Diagnostic=lazy(()=>import('../components/city/Diagnostic'));
const benchmarking=new URLSearchParams(location.search).get('benchmark')==='1';
const diagnosing=new URLSearchParams(location.search).get('diagnostico')==='1';
export default function World({ onReady, interactive }: { onReady: () => void; interactive: boolean }) {
  const q=useResolvedGraphics();
  const sun=useRef<DirectionalLight>(null);
  const pixelRatio=useGraphicsRuntime(s=>s.pixelRatio);
  return (
    <Canvas
      frameloop="demand"
      orthographic
      shadows={q.shadows}
      dpr={pixelRatio}
      camera={{
        position: overview.position,
        zoom: overview.zoom,
        near: 0.1,
        far: 850,
      }}
      gl={{ antialias: !staticFrameEnabled, alpha: false }}
      onCreated={({ gl, set, invalidate }) => {
        gl.setClearColor("#dcebee", 1);
        // Frames requested by anything but the water animation redraw the city.
        if (staticFrameEnabled) set({ invalidate: trackInvalidate(invalidate) });
      }}
    >
      <hemisphereLight args={["#e4f1ff", "#b1ad94", 1.25]} />
      <directionalLight
        ref={sun}
        key={`sun-${q.shadowSize}`}
        position={[-45, 90, 45]}
        color="#fff2db"
        intensity={3}
        castShadow={q.shadows}
        shadow-mapSize={[Math.max(512,q.shadowSize), Math.max(512,q.shadowSize)]}
        shadow-camera-left={-155}
        shadow-camera-right={155}
        shadow-camera-top={155}
        shadow-camera-bottom={-155}
        shadow-camera-far={380}
        shadow-normalBias={0.12}
        shadow-bias={-0.00025}
        shadow-radius={2.5}
      />
      <CameraRig interactive={interactive} />
      <ResolutionDirector interactive={interactive}/>
      <GraphicsRuntime ready={interactive}/>
      <MotionResolution/>
      <LiveFrameRate/>
      <AmbientFrames/>
      <City interactive={interactive} />
      <ShadowCache light={sun}/>
      <InstanceCulling/>
      <DepthPrepass/>
      <ShaderWarmup ready={interactive}/>
      <ShaderGate/>
      <SceneReady onReady={onReady} />
      {benchmarking&&<Suspense fallback={null}><Benchmark/></Suspense>}
      {diagnosing&&<Suspense fallback={null}><Diagnostic/></Suspense>}
    </Canvas>
  );
}
