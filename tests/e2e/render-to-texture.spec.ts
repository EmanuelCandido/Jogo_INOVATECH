import {test,expect} from '@playwright/test';
import {start} from './helpers';

// Safari on iPhone offers WEBGL_multisampled_render_to_texture. With it, the
// kept frame became a multisampled framebuffer after a resize, copying parts
// of it failed (as the extension's rules require) and the map vanished while
// it was dragged. The extension is imitated here, including that rule.
test('o mapa continua visível ao arrastar com render-to-texture (Safari)',async({page})=>{
 await page.addInitScript(()=>{
  if(!location.search)history.replaceState(null,'','?cacheDebug');
  const w=window as unknown as {ecoRtt:{attached:number;refused:number}};w.ecoRtt={attached:0,refused:0};
  const proto=WebGL2RenderingContext.prototype,rtt=new WeakSet<WebGLFramebuffer>();
  const getExtension=proto.getExtension as (this:WebGL2RenderingContext,n:string)=>unknown,supported=proto.getSupportedExtensions,blit=proto.blitFramebuffer;
  const name='WEBGL_multisampled_render_to_texture';
  proto.getExtension=function(this:WebGL2RenderingContext,n:string){
   if(n!==name)return getExtension.call(this,n);
   const gl=this;
   return{
    framebufferTexture2DMultisampleEXT(t:number,a:number,target:number,texture:WebGLTexture,level:number){
     w.ecoRtt.attached++;rtt.add(gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING));gl.framebufferTexture2D(t,a,target,texture,level);
    },
    renderbufferStorageMultisampleEXT(t:number,_s:number,f:number,width:number,height:number){gl.renderbufferStorage(t,f,width,height);},
   };
  } as typeof proto.getExtension;
  proto.getSupportedExtensions=function(this:WebGL2RenderingContext){return [...(supported.call(this)??[]),name];};
  proto.blitFramebuffer=function(this:WebGL2RenderingContext,x0:number,y0:number,x1:number,y1:number,dx0:number,dy0:number,dx1:number,dy1:number,mask:number,filter:number){
   const read=this.getParameter(this.READ_FRAMEBUFFER_BINDING);
   if(read&&rtt.has(read)&&(x0!==dx0||y0!==dy0||x1!==dx1||y1!==dy1)){w.ecoRtt.refused++;return;}
   blit.call(this,x0,y0,x1,y1,dx0,dy0,dx1,dy1,mask,filter);
  };
 });
 await start(page);
 // A taller view (Safari's toolbar hiding) makes the kept frame grow.
 const view=page.viewportSize()!;
 await page.setViewportSize({width:view.width,height:view.height+120});
 await page.waitForTimeout(1500);
 const box=(await page.locator('canvas').boundingBox())!,x=box.width*.4,y=box.height*.6;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y-20,{steps:8});await page.mouse.up();
 const rtt=await page.evaluate(()=>(window as unknown as {ecoRtt:{attached:number;refused:number}}).ecoRtt);
 expect(rtt).toEqual({attached:0,refused:0});
 // The moved image reached the screen, so moving frames stay in use.
 expect(await page.evaluate(()=>(window as unknown as {ecoStaticFrame:{moveFailed:boolean}}).ecoStaticFrame.moveFailed)).toBe(false);
});

// Whatever else makes a browser drop the moved image, the first moving frames
// check it reached the screen and the map is then drawn completely.
test('o mapa é desenhado completo quando o navegador recusa a imagem movida',async({page})=>{
 await page.addInitScript(()=>{
  if(!location.search)history.replaceState(null,'','?cacheDebug');
  const proto=WebGL2RenderingContext.prototype,blit=proto.blitFramebuffer;
  // Every copy to another place is dropped, as the iPhone did.
  proto.blitFramebuffer=function(this:WebGL2RenderingContext,x0:number,y0:number,x1:number,y1:number,dx0:number,dy0:number,dx1:number,dy1:number,mask:number,filter:number){
   if(x0!==dx0||y0!==dy0||x1!==dx1||y1!==dy1)return;
   blit.call(this,x0,y0,x1,y1,dx0,dy0,dx1,dy1,mask,filter);
  };
 });
 await start(page);
 const box=(await page.locator('canvas').boundingBox())!,x=box.width*.4,y=box.height*.6;
 await page.mouse.move(x,y);await page.mouse.down();
 for(let i=1;i<=8;i++){await page.mouse.move(x+i*10,y-i*3);await page.waitForTimeout(80);}
 const stats=await page.evaluate(()=>(window as unknown as {ecoStaticFrame:{moveFailed:boolean}}).ecoStaticFrame);
 expect(stats.moveFailed).toBe(true);
 // The screen still shows the city: the next complete frame is not blank.
 const drawn=await page.evaluate(()=>(window as unknown as {ecoStaticFrame:{reasons:Record<string,number>}}).ecoStaticFrame.reasons['move-failed']);
 expect(drawn).toBe(1);
 const shot=(globalThis as unknown as {process:{env:Record<string,string>}}).process.env.ECO_SHOT;
 if(shot)await page.screenshot({path:shot});
 await page.mouse.up();
});
