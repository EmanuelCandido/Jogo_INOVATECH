import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const out='docs/performance/gpu-adapter-audit';await mkdir(out,{recursive:true});
const results=[];
for(const channel of [undefined,'chrome'])for(const mode of ['default','preference','forced']){
 const args=['--enable-gpu','--use-angle=d3d11',...(mode==='forced'?['--force-high-performance-gpu']:[])];
 let browser;
 try{
  browser=await chromium.launch({channel,headless:true,args});
  const page=await browser.newPage();
  const webgl=await page.evaluate(preference=>{
   const canvas=document.createElement('canvas');
   const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,...(preference?{powerPreference:'high-performance'}:{})});
   if(!gl)return null;
   const ext=gl.getExtension('WEBGL_debug_renderer_info');
   return {renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),attributes:gl.getContextAttributes(),version:gl.getParameter(gl.VERSION),userAgent:navigator.userAgent};
  },mode!=='default');
  const cdp=await browser.newBrowserCDPSession(),info=await cdp.send('SystemInfo.getInfo');await cdp.detach();
  results.push({channel:channel??'bundled-chromium',mode,args,webgl,devices:info.gpu.devices});
 }catch(error){results.push({channel:channel??'bundled-chromium',mode,error:String(error)});}
 finally{await browser?.close();}
 console.log(JSON.stringify(results.at(-1)));await writeFile(`${out}/results.json`,JSON.stringify({date:new Date().toISOString(),results},null,2));
}
