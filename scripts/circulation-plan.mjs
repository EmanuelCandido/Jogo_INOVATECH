import {createServer} from 'vite';
import {writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 let m;try{m=await server.ssrLoadModule('/src/config/referenceMap.ts');}catch(error){if(!error.layoutState)throw error;m=error.layoutState;console.error(error.message);}
 const out=process.argv[2]??'docs/screenshots/circulation-plan';await mkdir(out,{recursive:true});
 const project=([u,v])=>[(u+125)*6,(115-v)*6];
 const path=ps=>'M'+ps.map(p=>project(p).join(',')).join('L');
 const label=(p,s,c='#121d2c')=>{const [x,y]=project(p);return `<text x="${x}" y="${y}" fill="${c}" font-size="12" paint-order="stroke" stroke="white" stroke-width="2">${s}</text>`;};
 const roads=[...m.mapRoads,m.roadViaduct],colors=['#795548','#b71c1c','#1a237e','#e65100','#4a148c','#00695c','#880e4f'];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1620" height="1320"><rect width="100%" height="100%" fill="#a9d892"/>`+
 [...m.riverSamples.map(p=>[p,m.riverWidth(p[1])]),...m.canalSamples.map(p=>[p,9])].map(([p,w])=>{const [x,y]=project(p);return `<circle cx="${x}" cy="${y}" r="${w*3}" fill="#58bcdf"/>`;}).join('')+
 m.buildingLots.map(l=>`<path d="${path(l.footprint)}Z" fill="#fff6d7" stroke="#999"/>`+label([l.u,l.v],l.id)).join('')+
 roads.map((r,i)=>`<path d="${path(r.points)}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="${r.width*6}" opacity=".8"/>`+r.points.filter((_,j)=>j%20===0).map((p,j)=>label(p,`${r.id}:${j*20} ${m.routeHeight(r,j*20).toFixed(1)}`)).join('')).join('')+
 [m.monorail,m.centralRail].map(r=>`<path d="${path(r.points)}" fill="none" stroke="#fff" stroke-width="5"/><path d="${path(r.points)}" fill="none" stroke="#343e4c" stroke-width="2"/>`).join('')+'</svg>';
 await writeFile(out+'/plan.svg',svg);await sharp(Buffer.from(svg)).png().toFile(out+'/plan.png');
 const report=roads.map(r=>({id:r.id,points:r.points.filter((_,i)=>i%20===0).map(p=>p.map(v=>+v.toFixed(1))),wet:r.points.map((p,i)=>({p:p.map(v=>+v.toFixed(1)),i})).filter(({p})=>Math.abs(p[0]-m.riverU(p[1]))<m.riverWidth(p[1])/2||Math.abs(p[0]-m.canalU(p[1]))<4.5)}));
 await writeFile(out+'/routes.json',JSON.stringify(report,null,2));
 await writeFile(out+'/layout.json',JSON.stringify({lots:m.buildingLots.map(l=>({id:l.id,point:[l.u,l.v],height:l.placement.position[1],footprint:l.footprint})),unreachable:m.pedestrianNetwork.unreachable,junctions:m.roadProfiles?.junctions},null,2));
 console.log(JSON.stringify(report.map(r=>({...r,wet:r.wet.filter((_,i)=>i===0||i===r.wet.length-1)}))));
}finally{await server.close();}
