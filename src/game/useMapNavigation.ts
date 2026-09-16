import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from "three";
import { useMap, type MapCommand } from "../stores/mapStore";
import { clampTarget, clampZoom, mapFootprint } from "./mapNavigation";
import { overview } from "../config/world";
import {frameTask} from './frameTask';
import {preparationActivity} from './resourcePreparation';

const arrowDirections:Record<string,readonly [number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};
const discreteKeys:Record<string,MapCommand>={'+':'in','=':'in','-':'out',Home:'reset'};

export function useMapNavigation(enabled: boolean, baseZoom: number, target: RefObject<Vector3>) {
  const {camera,gl,invalidate}=useThree();
  const activity=preparationActivity(gl.domElement);
  const command=useMap(s=>s.command);
  const report=useMap(s=>s.report);
  const home=useRef(new Vector3());
  const held=useRef(new Set<string>()),lastKeyFrame=useRef(0);
  const scratch=useRef({shift:new Vector3(),zero:new Vector3(),right:new Vector3(),up:new Vector3(),delta:new Vector3()});
  const cam=camera as OrthographicCamera;
  const move=useCallback((delta: Vector3)=>{
    const [x,z]=clampTarget(target.current.x+delta.x,target.current.z+delta.z,mapFootprint(cam.zoom,cam.right-cam.left,cam.top-cam.bottom));
    const shift=scratch.current.shift.set(x-target.current.x,0,z-target.current.z);
    if(shift.lengthSq()>0)activity.touch();
    camera.position.add(shift);target.current.add(shift);invalidate();
  },[camera,cam,target,invalidate,activity]);
  const zoom=useCallback((factor:number)=>{
    activity.touch();
    cam.zoom=baseZoom*clampZoom(cam.zoom/baseZoom*factor);
    cam.updateProjectionMatrix();move(scratch.current.zero);report(cam.zoom/baseZoom,true);invalidate();
  },[cam,baseZoom,report,invalidate,move,activity]);
  const pan=useCallback((x:number,y:number,distance:number)=>{
    const s=scratch.current;
    s.right.setFromMatrixColumn(camera.matrixWorld,0).setY(0).normalize();
    s.up.setFromMatrixColumn(camera.matrixWorld,1).setY(0).normalize();
    s.delta.copy(s.right).multiplyScalar(x).addScaledVector(s.up,y).normalize().multiplyScalar(distance/(cam.zoom/baseZoom));
    move(s.delta);
  },[camera,cam,baseZoom,move]);
  useFrame(()=>{
    if(!enabled||document.hidden||!held.current.size)return;
    // Demand mode can sleep for seconds. Integrate from the actual keydown,
    // not the renderer's idle delta; ignore OS key-repeat events entirely.
    const now=performance.now(),seconds=Math.min(.1,Math.max(0,(now-lastKeyFrame.current)/1000));
    lastKeyFrame.current=now;
    let x=0,y=0;
    for(const key of held.current){const direction=arrowDirections[key];x+=direction[0];y+=direction[1];}
    if(x||y)pan(x,y,30*seconds);
    invalidate();
  },-1);
  useEffect(()=>{report(enabled?cam.zoom/baseZoom:1,enabled);},[enabled,baseZoom,cam,report]);
  useEffect(()=>{
    if(!enabled)return;
    home.current.copy(camera.position).sub(target.current);move(scratch.current.zero);
    const el=gl.domElement;
    const pointers=new Map<number,Vector2>();
    const pending=new Map<number,Vector2>();
    let wheelRatio:number|null=null;
    const ray=new Raycaster(), plane=new Plane(new Vector3(0,1,0),0);
    const midpointValue=new Vector2(),ndc=new Vector2(),beforePoint=new Vector3(),afterPoint=new Vector3();
    const ground=(p:Vector2,rect:DOMRect,out:Vector3)=>{
      camera.updateMatrixWorld();
      ray.setFromCamera(ndc.set((p.x-rect.left)/rect.width*2-1,1-(p.y-rect.top)/rect.height*2),camera);
      return ray.ray.intersectPlane(plane,out);
    };
    const midpoint=()=>{let count=0;midpointValue.set(0,0);for(const p of pointers.values()){midpointValue.add(p);if(++count===2)break;}return midpointValue.multiplyScalar(1/Math.max(1,count));};
    const distance=()=>{let first:Vector2|undefined;for(const p of pointers.values()){if(first)return first.distanceTo(p);first=p;}return 0;};
    const updates=frameTask(()=>{
      if(pending.size){
        const rect=el.getBoundingClientRect(),before=ground(midpoint(),rect,beforePoint),oldDistance=distance();
        for(const [id,p] of pending)pointers.get(id)?.copy(p);
        pending.clear();
        if(pointers.size>1&&oldDistance>0)zoom(distance()/oldDistance);
        const after=ground(midpoint(),rect,afterPoint);if(before&&after)move(before.sub(after));
      }
      if(wheelRatio!==null){zoom(wheelRatio/(cam.zoom/baseZoom));wheelRatio=null;}
    });
    const down=(e:PointerEvent)=>{
      if(e.button!==0 && e.button!==1)return;
      updates.flush();
      activity.hold(pointers);
      e.preventDefault();el.focus({preventScroll:true});pointers.set(e.pointerId,new Vector2(e.clientX,e.clientY));el.setPointerCapture(e.pointerId);el.classList.add("dragging");
    };
    const drag=(e:PointerEvent)=>{
      if(!pointers.has(e.pointerId))return;
      const point=pending.get(e.pointerId)??new Vector2();point.set(e.clientX,e.clientY);pending.set(e.pointerId,point);updates.schedule();
    };
    const up=(e:PointerEvent)=>{updates.flush();pointers.delete(e.pointerId);if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);if(!pointers.size){el.classList.remove("dragging");activity.release(pointers);}};
    const wheel=(e:WheelEvent)=>{e.preventDefault();const units=e.deltaMode===1?16:e.deltaMode===2?el.clientHeight:1;wheelRatio=clampZoom((wheelRatio??cam.zoom/baseZoom)*Math.exp(-e.deltaY*units*.0015));updates.schedule();};
    const key=(e:KeyboardEvent)=>{
      const direction=arrowDirections[e.key];
      if(direction){
        e.preventDefault();
        if(e.repeat||held.current.has(e.key))return;
        updates.flush();if(!held.current.size)lastKeyFrame.current=performance.now();
        held.current.add(e.key);activity.hold(held.current);pan(direction[0],direction[1],2.5);invalidate();return;
      }
      const command=discreteKeys[e.key];
      if(command){e.preventDefault();updates.flush();useMap.getState().send(command);}
    };
    const release=(e:KeyboardEvent)=>{if(arrowDirections[e.key]){e.preventDefault();held.current.delete(e.key);if(!held.current.size)activity.release(held.current);}};
    const clearKeys=()=>{held.current.clear();activity.release(held.current);lastKeyFrame.current=0;};
    const visibility=()=>{if(document.hidden)clearKeys();};
    el.tabIndex=0;el.setAttribute("aria-label","Mapa da cidade: arraste para mover, use a roda para zoom. Teclado: setas, mais, menos e Home.");
    el.addEventListener("pointerdown",down);el.addEventListener("pointermove",drag);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);el.addEventListener("lostpointercapture",up);el.addEventListener("wheel",wheel,{passive:false});el.addEventListener("keydown",key);
    el.addEventListener('keyup',release);el.addEventListener('blur',clearKeys);window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',visibility);
    return ()=>{
      updates.cancel();pending.clear();wheelRatio=null;
      clearKeys();el.removeEventListener('keyup',release);el.removeEventListener('blur',clearKeys);window.removeEventListener('blur',clearKeys);document.removeEventListener('visibilitychange',visibility);
      for(const id of pointers.keys())if(el.hasPointerCapture(id))el.releasePointerCapture(id);
      pointers.clear();activity.release(pointers);el.classList.remove("dragging");el.tabIndex=-1;
      el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",drag);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);el.removeEventListener("lostpointercapture",up);el.removeEventListener("wheel",wheel);el.removeEventListener("keydown",key);
    };
  },[enabled,camera,cam,baseZoom,gl,move,zoom,target,pan,invalidate,activity]);
  useEffect(()=>{
    if(!enabled||!command)return;
    switch(command.type){
      case "in":zoom(1.25);break;
      case "out":zoom(.8);break;
      case "reset":held.current.clear();activity.release(held.current);activity.touch();target.current.set(...overview.target);camera.position.copy(home.current).add(target.current);cam.zoom=baseZoom;cam.updateProjectionMatrix();move(scratch.current.zero);report(1,true);invalidate();break;
      default: {
        pan(command.type==='left'?-1:command.type==='right'?1:0,command.type==='down'?-1:command.type==='up'?1:0,2.5);
      }
    }
    // Commands are consumed once; re-enabling after a mission must not replay one.
    useMap.setState({command:null});
  },[command,enabled,zoom,move,camera,cam,baseZoom,report,invalidate,target,pan,activity]);
}
