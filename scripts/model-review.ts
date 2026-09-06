import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetRegistry } from '../src/assets/registry';

const group = new URLSearchParams(location.search).get('group') ?? 'props';
const reverse=new URLSearchParams(location.search).get('view')==='rear';
document.body.dataset.group = group;
const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
renderer.setSize(480,360);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
const loader=new GLTFLoader();
const expansion=['building.warehouse','prop.truck','building.office','building.fuel','building.cafe','prop.crane','prop.container.red','prop.container.blue','prop.ship','prop.lighthouse','prop.train','prop.bus','prop.playground'];
const models=Object.entries(assetRegistry).filter(([id,a])=>a.kind==='glb' && (group==='woodland' ? id.startsWith('tree.') : group==='expansion' ? expansion.includes(id) : group==='buildings' ? id.startsWith('building.') : !id.startsWith('building.')));
for(const [id,asset] of models){
  if(asset.kind!=='glb')continue;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#f3f4eb');
  const {scene:model}=await loader.loadAsync(asset.url);
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(model);
  const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const span=Math.max(size.x,size.y,size.z)*1.45;
  const camera=new THREE.OrthographicCamera(-span*2/3,span*2/3,span/2,-span/2,.01,100);
  camera.position.copy(center).add(new THREE.Vector3(reverse?-9:9,8,reverse?-12:12));camera.lookAt(center);
  scene.add(new THREE.HemisphereLight('#e4f1ff','#b1ad94',1.7));
  const sun=new THREE.DirectionalLight('#fff2db',2.5);sun.position.set(-10,22,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;sun.shadow.normalBias=.05;scene.add(sun);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#f3f4eb',roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=bounds.min.y-.012;floor.receiveShadow=true;scene.add(floor);
  renderer.render(scene,camera);
  const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
  figure.dataset.asset=id;
  img.src=renderer.domElement.toDataURL('image/png');caption.textContent=id;
  figure.append(img,caption);document.querySelector('main')!.append(figure);
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
  floor.geometry.dispose();(floor.material as THREE.Material).dispose();sun.shadow.map?.dispose();
}
renderer.dispose();document.body.dataset.ready='true';

