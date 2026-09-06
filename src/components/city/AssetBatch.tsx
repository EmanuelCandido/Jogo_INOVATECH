import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { InstancedMesh, Mesh, Object3D, Matrix4 } from "three";
import { assetRegistry } from "../../assets/registry";
import { Asset, Surface } from "../Asset";
import type { Placement } from "../../game/types";
function PrimitiveInstances({
  mesh,
  placements,
  castShadow,
}: {
  mesh: Mesh;
  placements: Placement[];
  castShadow: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  const {invalidate,gl}=useThree();
  useLayoutEffect(() => {
    const object = new Object3D();
    const matrix = new Matrix4();
    placements.forEach((p, i) => {
      object.position.set(...p.position);
      object.rotation.set(...(p.rotation ?? [0, 0, 0]));
      object.scale.set(...(p.scale ?? [1, 1, 1]));
      object.updateMatrix();
      matrix.multiplyMatrices(object.matrix, mesh.matrixWorld);
      ref.current!.setMatrixAt(i, matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
    // A new outcome can finish loading after the scene's last requested frame.
    gl.shadowMap.needsUpdate=true;
    invalidate();
  }, [mesh, placements,gl,invalidate]);
  return (
    <instancedMesh
      ref={ref}
      args={[mesh.geometry, mesh.material, placements.length]}
      castShadow={castShadow}
      receiveShadow
    />
  );
}
function GLBBatch({
  url,
  placements,
  castShadow,
}: {
  url: string;
  placements: Placement[];
  castShadow: boolean;
}) {
  const { scene } = useGLTF(url);
  const meshes = useMemo(() => {
    scene.updateMatrixWorld(true);
    const found: Mesh[] = [];
    scene.traverse((o) => {
      if (o instanceof Mesh) found.push(o);
    });
    return found;
  }, [scene]);
  return (
    <>
      {meshes.map((mesh) => (
        <PrimitiveInstances
          key={mesh.uuid}
          mesh={mesh}
          placements={placements}
          castShadow={castShadow}
        />
      ))}
    </>
  );
}
function BoxBatch({
  material,
  placements,
}: {
  material: string;
  placements: Placement[];
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const object = new Object3D();
    placements.forEach((p, i) => {
      object.position.set(...p.position);
      object.rotation.set(...(p.rotation ?? [0, 0, 0]));
      object.scale.set(...(p.scale ?? [1, 1, 1]));
      object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [placements]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, placements.length]}
      // Coplanar, centimetre-thick ground tiles otherwise shadow themselves in
      // the city-wide shadow map, producing stripes across roads and paving.
      castShadow={!["asphalt.default","sidewalk.default","grass.healthy","water.clean","track","field"].includes(material)}
      receiveShadow
    >
      <boxGeometry />
      <Surface id={material} />
    </instancedMesh>
  );
}
export function AssetBatch({ placements, castShadow=true }: { placements: Placement[]; castShadow?: boolean }) {
  const groups = useMemo(
    () =>
      placements.reduce<Record<string, Placement[]>>((all, p) => {
        (all[p.asset] ??= []).push(p);
        return all;
      }, {}),
    [placements],
  );
  return (
    <>
      {Object.entries(groups).map(([id, items]) => {
        const a = assetRegistry[id];
        return (
          <Suspense key={id} fallback={null}>
            {a.kind === "glb" ? (
              <GLBBatch url={a.url} placements={items!} castShadow={castShadow} />
            ) : a.kind === "box" ? (
              <BoxBatch material={a.material} placements={items!} />
            ) : (
              items!.map((p, i) => <Asset key={i} {...p} />)
            )}
          </Suspense>
        );
      })}
    </>
  );
}
