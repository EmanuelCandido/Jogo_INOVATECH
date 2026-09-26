// Renders the original soundtrack from assets-source/audio/compose.js in
// headless Chromium and encodes it to MP3 with ffmpeg (FFMPEG env or PATH).
import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
const ffmpeg=process.env.FFMPEG??'ffmpeg',out='public/assets/audio/music',source=(await readFile('assets-source/audio/compose.js','utf8')).replaceAll('export async function','async function');
const tracks=[['theme','renderTheme',-18],['ambience','renderAmbience',-26],['jingle','renderJingle',-16]];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??undefined});
try{
 const page=await browser.newPage();await page.goto('about:blank');
 for(const [name,fn,lufs] of tracks){
  const result=await page.evaluate(async([code,fn])=>{
   const render=new Function(`${code};return ${fn}();`);const {buffer,loop}=await render();
   const channels=[0,1].map(c=>buffer.getChannelData(c)),sr=buffer.sampleRate,end=loop?Math.round(loop*sr):buffer.length;
   // Fold the reverb tail onto the start so the loop has no seam.
   if(loop)for(const d of channels)for(let i=end;i<d.length;i++)d[i-end]+=d[i];
   const pcm=new Int16Array(end*2);let peak=0;for(let i=0;i<end;i++)for(let c=0;c<2;c++)peak=Math.max(peak,Math.abs(channels[c][i]));
   const scale=peak>0?.89/peak:1;for(let i=0;i<end;i++)for(let c=0;c<2;c++)pcm[i*2+c]=Math.round(Math.max(-1,Math.min(1,channels[c][i]*scale))*32767);
   let s='';const bytes=new Uint8Array(pcm.buffer);for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));
   return {pcm:btoa(s),sr,seconds:end/sr,peak};
  },[source,fn]);
  const raw=`${tmpdir()}/${name}.pcm`;await writeFile(raw,Buffer.from(result.pcm,'base64'));
  execFileSync(ffmpeg,['-y','-loglevel','error','-f','s16le','-ar',String(result.sr),'-ac','2','-i',raw,'-af',`loudnorm=I=${lufs}:TP=-1.5:LRA=11`,'-ar','44100','-c:a','libmp3lame','-b:a',name==='ambience'?'64k':'112k',`${out}/${name}.mp3`]);
  await rm(raw);console.log(name,result.seconds.toFixed(1)+'s','peak',result.peak.toFixed(2));
 }
}finally{await browser.close();}
