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
import {lazy,Suspense,useRef} from 'react';
import type {DirectionalLight} from 'three';
const Benchmark=lazy(()=>import('../components/city/Benchmark'));
const benchmarking=new URLSearchParams(location.search).get('benchmark')==='1';
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
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor("#dcebee", 1);
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
      <GraphicsRuntime ready={interactive}/>
      <AmbientFrames/>
      <City interactive={interactive} />
      <ShadowCache light={sun}/>
      <InstanceCulling/>
      <ShaderWarmup ready={interactive}/>
      <SceneReady onReady={onReady} />
      {benchmarking&&<Suspense fallback={null}><Benchmark/></Suspense>}
    </Canvas>
  );
}
