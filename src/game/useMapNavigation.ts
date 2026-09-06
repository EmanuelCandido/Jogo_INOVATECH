import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from "three";
import { useMap, type MapCommand } from "../stores/mapStore";
import { clampTarget, clampZoom } from "./mapNavigation";
import { overview } from "../config/world";

export function useMapNavigation(enabled: boolean, baseZoom: number, target: RefObject<Vector3>) {
  const {camera,gl,invalidate}=useThree();
  const command=useMap(s=>s.command);
  const report=useMap(s=>s.report);
  const home=useRef(new Vector3());
  const cam=camera as OrthographicCamera;
  const move=useCallback((delta: Vector3)=>{
    const [x,z]=clampTarget(target.current.x+delta.x,target.current.z+delta.z);
    const shift=new Vector3(x-target.current.x,0,z-target.current.z);
    camera.position.add(shift);target.current.add(shift);invalidate();
  },[camera,target,invalidate]);
  const zoom=useCallback((factor:number)=>{
    cam.zoom=baseZoom*clampZoom(cam.zoom/baseZoom*factor);
    cam.updateProjectionMatrix();report(cam.zoom/baseZoom,true);invalidate();
  },[cam,baseZoom,report,invalidate]);
  useEffect(()=>{report(enabled?cam.zoom/baseZoom:1,enabled);},[enabled,baseZoom,cam,report]);
  useEffect(()=>{
    if(!enabled)return;
    home.current.copy(camera.position).sub(target.current);
    const el=gl.domElement;
    const pointers=new Map<number,Vector2>();
    const ray=new Raycaster(), plane=new Plane(new Vector3(0,1,0),0);
    const ground=(p:Vector2)=>{
      const rect=el.getBoundingClientRect();
      camera.updateMatrixWorld();
      ray.setFromCamera(new Vector2((p.x-rect.left)/rect.width*2-1,1-(p.y-rect.top)/rect.height*2),camera);
      return ray.ray.intersectPlane(plane,new Vector3());
    };
    const midpoint=()=>{const values=[...pointers.values()];return values.length===1?values[0].clone():values[0].clone().add(values[1]).multiplyScalar(.5);};
    const distance=()=>{const values=[...pointers.values()];return values.length>1?values[0].distanceTo(values[1]):0;};
    const down=(e:PointerEvent)=>{
      if(e.button!==0 && e.button!==1)return;
      e.preventDefault();el.focus({preventScroll:true});pointers.set(e.pointerId,new Vector2(e.clientX,e.clientY));el.setPointerCapture(e.pointerId);el.classList.add("dragging");
    };
    const drag=(e:PointerEvent)=>{
      if(!pointers.has(e.pointerId))return;
      const before=ground(midpoint()),oldDistance=distance();
      pointers.set(e.pointerId,new Vector2(e.clientX,e.clientY));
      if(pointers.size>1 && oldDistance>0)zoom(distance()/oldDistance);
      camera.updateMatrixWorld();
      const after=ground(midpoint());
      if(before&&after)move(before.sub(after));
    };
    const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);if(!pointers.size)el.classList.remove("dragging");};
    const wheel=(e:WheelEvent)=>{e.preventDefault();const units=e.deltaMode===1?16:e.deltaMode===2?el.clientHeight:1;zoom(Math.exp(-e.deltaY*units*.0015));};
    const key=(e:KeyboardEvent)=>{
      const keys:Record<string,MapCommand>={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","+":"in","=":"in","-":"out",Home:"reset"};
      const command=keys[e.key];
      if(command){e.preventDefault();useMap.getState().send(command);}
    };
    el.tabIndex=0;el.setAttribute("aria-label","Mapa da cidade: arraste para mover, use a roda para zoom. Teclado: setas, mais, menos e Home.");
    el.addEventListener("pointerdown",down);el.addEventListener("pointermove",drag);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);el.addEventListener("lostpointercapture",up);el.addEventListener("wheel",wheel,{passive:false});el.addEventListener("keydown",key);
    return ()=>{
      for(const id of pointers.keys())if(el.hasPointerCapture(id))el.releasePointerCapture(id);
      pointers.clear();el.classList.remove("dragging");el.tabIndex=-1;
      el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",drag);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);el.removeEventListener("lostpointercapture",up);el.removeEventListener("wheel",wheel);el.removeEventListener("keydown",key);
    };
  },[enabled,camera,gl,move,zoom,target]);
  useEffect(()=>{
    if(!enabled||!command)return;
    switch(command.type){
      case "in":zoom(1.25);break;
      case "out":zoom(.8);break;
      case "reset":target.current.set(...overview.target);camera.position.copy(home.current).add(target.current);cam.zoom=baseZoom;cam.updateProjectionMatrix();report(1,true);invalidate();break;
      default: {
        const right=new Vector3().setFromMatrixColumn(camera.matrixWorld,0).setY(0).normalize();
        const up=new Vector3().setFromMatrixColumn(camera.matrixWorld,1).setY(0).normalize();
        const delta=(command.type==="left"||command.type==="right"?right:up).multiplyScalar((command.type==="left"||command.type==="down"?-1:1)*2.5/(cam.zoom/baseZoom));move(delta);
      }
    }
    // Commands are consumed once; re-enabling after a mission must not replay one.
    useMap.setState({command:null});
  },[command,enabled,zoom,move,camera,cam,baseZoom,report,invalidate,target]);
}
