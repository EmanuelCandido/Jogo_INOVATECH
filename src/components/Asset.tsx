import { Suspense, useMemo } from "react";
import { Clone, useGLTF, useTexture } from "@react-three/drei";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { assetRegistry, materials } from "../assets/registry";
import type { Placement, Vec3 } from "../game/types";
function TexturedMaterial({ id }: { id: string }) {
  const m = materials[id];
  const map = useTexture(m.texture!);
  return (
    <meshStandardMaterial
      color={m.color}
      map={map}
      roughness={m.roughness ?? 0.9}
    />
  );
}
export function Surface({ id }: { id: string }) {
  const m = materials[id];
  return m.texture ? (
    <Suspense fallback={<meshStandardMaterial color={m.color} />}>
      <TexturedMaterial id={id} />
    </Suspense>
  ) : (
    <meshStandardMaterial color={m.color} roughness={m.roughness ?? 0.9} />
  );
}
export function Box({
  at = [0, 0, 0],
  size = [1, 1, 1],
  material,
  rotation,
}: {
  at?: Vec3;
  size?: Vec3;
  material: string;
  rotation?: Vec3;
}) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Surface id={material} />
    </mesh>
  );
}
function GLB({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <Clone object={scene} castShadow receiveShadow />;
}
function Ramp({ material }: { material: string }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const a = [-0.85, 0, -0.8],
      b = [0.85, 0, -0.8],
      c = [-0.85, 0.36, -0.8],
      d = [0.85, 0.36, -0.8],
      e = [-0.85, 0, 0.8],
      f = [0.85, 0, 0.8];
    g.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          ...c,
          ...e,
          ...f,
          ...c,
          ...f,
          ...d,
          ...a,
          ...e,
          ...c,
          ...b,
          ...d,
          ...f,
          ...a,
          ...c,
          ...d,
          ...a,
          ...d,
          ...b,
          ...a,
          ...b,
          ...f,
          ...a,
          ...f,
          ...e,
        ],
        3,
      ),
    );
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <Surface id={material} />
    </mesh>
  );
}
function Procedural({ model, material }: { model: string; material: string }) {
  switch (model) {
    case "fountain":
      return (
        <group>
          <mesh position={[0, 0.53, 0]} receiveShadow>
            <cylinderGeometry args={[0.8, 0.85, 0.3, 12]} />
            <Surface id={material} />
          </mesh>
          <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.68, 20]} />
            <Surface id="water.clean" />
          </mesh>
          <Box at={[0, 0.95, 0]} size={[0.22, 0.5, 0.22]} material={material} />
        </group>
      );
    case "bench":
      return (
        <group>
          <Box at={[0, 0.65, 0]} size={[0.42, 0.14, 1.3]} material={material} />
          <Box
            at={[0.2, 0.92, 0]}
            size={[0.1, 0.55, 1.3]}
            material={material}
          />
          {[-0.45, 0.45].map((z) => (
            <Box
              key={z}
              at={[0, 0.44, z]}
              size={[0.3, 0.35, 0.1]}
              material="metal.green"
            />
          ))}
        </group>
      );
    case "building":
      return (
        <group>
          <Box at={[0, 1.25, 0]} size={[2.3, 2.5, 2.1]} material={material} />
          <Box at={[0, 2.57, 0]} size={[2.5, 0.18, 2.3]} material="roof" />
          <Box
            at={[0, 0.53, 1.065]}
            size={[0.48, 1.06, 0.06]}
            material="wood"
          />
          {[-0.7, 0.7].map((x) =>
            [0.8, 1.8].map((y) => (
              <group key={`${x}-${y}`}>
                <Box
                  at={[x, y, 1.06]}
                  size={[0.5, 0.6, 0.05]}
                  material="window"
                />
                <Box
                  at={[x, y - 0.34, 1.12]}
                  size={[0.64, 0.08, 0.15]}
                  material="white"
                />
              </group>
            )),
          )}
          <Box
            at={[0, 0.15, 1.2]}
            size={[2.5, 0.3, 0.4]}
            material="sidewalk.default"
          />
        </group>
      );
    case "tree":
      return (
        <group>
          <Box at={[0, 0.7, 0]} size={[0.18, 1.4, 0.18]} material="trunk" />
          <mesh position={[0, 1.75, 0]} castShadow>
            <icosahedronGeometry args={[0.95, 0]} />
            <Surface id={material} />
          </mesh>
        </group>
      );
    case "hero":
      return (
        <group>
          <Box
            at={[-0.13, 0.27, 0]}
            size={[0.18, 0.55, 0.22]}
            material="pants"
          />
          <Box
            at={[0.13, 0.27, 0]}
            size={[0.18, 0.55, 0.22]}
            material="pants"
          />
          <Box at={[0, 0.72, 0]} size={[0.52, 0.55, 0.3]} material={material} />
          <mesh position={[0, 1.18, 0]} castShadow>
            <sphereGeometry args={[0.23, 8, 8]} />
            <Surface id="skin" />
          </mesh>
          <Box
            at={[0, 1.36, -0.035]}
            size={[0.4, 0.13, 0.36]}
            material="hair"
          />
          <Box
            at={[-0.34, 0.7, 0]}
            size={[0.14, 0.45, 0.2]}
            material={material}
          />
          <Box
            at={[0.34, 0.7, 0]}
            size={[0.14, 0.45, 0.2]}
            material={material}
          />
        </group>
      );
    case "step":
      return (
        <group>
          <Box size={[1.8, 0.36, 1]} material={material} />
          <Box at={[0, 0.19, 0.42]} size={[1.8, 0.025, 0.14]} material="wood" />
        </group>
      );
    case "ramp":
      return (
        <group>
          <Ramp material={material} />
          <Box
            at={[-0.96, 0.5, 0]}
            size={[0.06, 0.06, 1.7]}
            material="metal.green"
            rotation={[0.18, 0, 0]}
          />
          <Box
            at={[0.96, 0.5, 0]}
            size={[0.06, 0.06, 1.7]}
            material="metal.green"
            rotation={[0.18, 0, 0]}
          />
          {[-0.96, 0.96].map((x) => (
            <Box
              key={x}
              at={[x, 0.25, -0.5]}
              size={[0.06, 0.5, 0.06]}
              material="metal.green"
            />
          ))}
        </group>
      );
    case "temporary":
      return (
        <group>
          <Ramp material={material} />
          <Box
            at={[1.2, 0.3, 0]}
            size={[0.3, 0.6, 0.3]}
            material="wall.terracotta"
          />
        </group>
      );
    case "trash":
    case "partial":
      return (
        <group>
          {Array.from({ length: model === "trash" ? 6 : 2 }, (_, i) => (
            <mesh
              key={i}
              position={[(i % 3) * 0.43 - 0.4, 0.24, Math.floor(i / 3) * 0.45]}
              castShadow
            >
              <icosahedronGeometry args={[0.32, 0]} />
              <Surface id={material} />
            </mesh>
          ))}
        </group>
      );
    case "bin":
      return (
        <group>
          <Box at={[0, 0.45, 0]} size={[0.65, 0.9, 0.65]} material={material} />
          <Box at={[0, 0.95, 0]} size={[0.75, 0.12, 0.75]} material="roof" />
          <Box
            at={[0, 0.55, 0.33]}
            size={[0.25, 0.22, 0.025]}
            material="white"
          />
        </group>
      );
    default:
      return null;
  }
}
export function Asset({ asset, position, scale, rotation }: Placement) {
  const definition = assetRegistry[asset];
  if (!definition) throw new Error(`Asset desconhecido: ${asset}`);
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <Suspense fallback={<Box material="sidewalk.default" />}>
        {definition.kind === "glb" ? (
          <GLB url={definition.url} />
        ) : definition.kind === "box" ? (
          <Box material={definition.material} />
        ) : (
          <Procedural model={definition.model} material={definition.material} />
        )}
      </Suspense>
    </group>
  );
}
export function preloadAsset(id: string) {
  const a = assetRegistry[id];
  if (a?.kind === "glb") useGLTF.preload(a.url);
}
