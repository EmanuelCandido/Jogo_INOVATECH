import {corridorGap,type Point} from './spatial';

/** Local footpath search with a full-width corridor checked at every edge. */
export function groundConnection(start:Point,end:Point,obstacles:Point[][],usable:(p:Point)=>boolean,width=1.4):Point[]{
 const step=.5,pad=12,minX=Math.floor(Math.min(start[0],end[0])-pad),minY=Math.floor(Math.min(start[1],end[1])-pad);
 const nx=Math.ceil((Math.max(start[0],end[0])+pad-minX)/step)+1,ny=Math.ceil((Math.max(start[1],end[1])+pad-minY)/step)+1;
 const point=(i:number):Point=>[minX+(i%nx)*step,minY+Math.floor(i/nx)*step];
 const clear=(a:Point,b:Point)=>{
  if(obstacles.some(poly=>corridorGap(poly,[a,b],width)<.02))return false;
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25));
  const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/d*width/2,ny=(b[0]-a[0])/d*width/2;
  for(let j=0;j<=n;j++)for(const side of [-1,0,1])if(!usable([a[0]+(b[0]-a[0])*j/n+nx*side,a[1]+(b[1]-a[1])*j/n+ny*side]))return false;
  return true;
 };
 const parent=new Int32Array(nx*ny).fill(-1),queue:number[]=[];
 for(let i=0;i<parent.length;i++)if(Math.hypot(point(i)[0]-start[0],point(i)[1]-start[1])<=1&&clear(start,point(i))){parent[i]=i;queue.push(i);}
 let found=-1;
 for(let head=0;head<queue.length;head++){
  const i=queue[head],p=point(i),x=i%nx,y=Math.floor(i/nx);
  if(Math.hypot(p[0]-end[0],p[1]-end[1])<=1&&clear(p,end)){found=i;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   if(x+dx<0||x+dx>=nx||y+dy<0||y+dy>=ny)continue;
   const j=i+dx+dy*nx;if(parent[j]>=0||!clear(p,point(j)))continue;
   parent[j]=i;queue.push(j);
  }
 }
 if(found<0)throw new Error('No continuous ground connection between station entrances');
 const path:Point[]=[end];let i=found;
 while(parent[i]!==i){path.push(point(i));i=parent[i];}path.push(point(i),start);path.reverse();
 // Simplify only where the entire shortcut remains clear.
 const result:Point[]=[start];let at=0;
 while(at<path.length-1){let next=path.length-1;while(next>at+1&&!clear(path[at],path[next]))next--;result.push(path[next]);at=next;}
 return result;
}
