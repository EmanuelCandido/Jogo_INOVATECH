import {publicAsset} from '../assets/publicAsset';

export const sfxIds=['tap','open','close','select','toggle-on','toggle-off','back','advance','focus','blocked','confirm','notice','start','warning','error','coin','purchase','success','achievement','level-up','bonus','unlock','progress'] as const;
export type Sfx=typeof sfxIds[number];
/** Relative loudness per cue; the player's effects volume scales all of them. */
const cueVolume:Partial<Record<Sfx,number>>={tap:.35,select:.5,advance:.3,'toggle-on':.5,'toggle-off':.5,focus:.6,progress:.55,coin:.8,achievement:.9,'level-up':.9};
/** Loop points of the rendered soundtrack (scripts/render-audio.mjs). */
const tracks={theme:{url:'/assets/audio/music/theme.mp3',seconds:80,level:.55},ambience:{url:'/assets/audio/music/ambience.mp3',seconds:48,level:.6}} as const;
type Track=keyof typeof tracks;
/** Space for MP3 encoder priming when the browser keeps it in the decoded audio. */
const MP3_PRIMING=1105/44100;
export type MusicMood='city'|'story'|'indoor'|'celebration';
const moods:Record<MusicMood,{theme:number;ambience:number;cutoff:number}>={
 city:{theme:.75,ambience:1,cutoff:18000},story:{theme:.42,ambience:.6,cutoff:5000},
 indoor:{theme:.6,ambience:.18,cutoff:1300},celebration:{theme:.25,ambience:.4,cutoff:18000},
};

/** Web Audio mixer: short cues, a looping soundtrack and city ambience.
 * The context is created on the first trusted gesture, as browsers require. */
class GameAudio {
 private ctx:AudioContext|null=null;
 private sfxBus:GainNode|null=null; private musicBus:GainNode|null=null; private filter:BiquadFilterNode|null=null;
 private trackGain=new Map<Track,GainNode>(); private playing=new Set<Track>();
 private buffers=new Map<string,Promise<AudioBuffer|null>>(); private lastPlayed=new Map<Sfx,number>();
 private volumes={music:.6,sfx:.8}; private mood:MusicMood='city'; private wantsMusic=false;
 get unlocked(){return this.ctx!==null;}
 unlock(){
  if(!this.ctx){
   const Context=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!Context)return;
   const ctx=new Context({latencyHint:'interactive'});this.ctx=ctx;
   const master=ctx.createDynamicsCompressor();master.threshold.value=-10;master.ratio.value=4;master.connect(ctx.destination);
   this.sfxBus=ctx.createGain();this.sfxBus.connect(master);
   this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.Q.value=.5;this.filter.connect(master);
   this.musicBus=ctx.createGain();this.musicBus.connect(this.filter);
   for(const track of Object.keys(tracks) as Track[]){const g=ctx.createGain();g.gain.value=0;g.connect(this.musicBus);this.trackGain.set(track,g);}
   this.applyVolumes(0);this.applyMood(0);
   for(const id of ['tap','open','close','select','coin'] as Sfx[])void this.load(this.sfxUrl(id));
   if(this.wantsMusic)this.startMusic();
  }
  if(this.ctx.state==='suspended'&&document.visibilityState==='visible')void this.ctx.resume();
 }
 suspend(hidden:boolean){if(!this.ctx)return;if(hidden)void this.ctx.suspend();else void this.ctx.resume();}
 setVolumes(music:number,sfx:number){this.volumes={music:music/100,sfx:sfx/100};this.applyVolumes(.25);}
 setMood(mood:MusicMood){if(mood===this.mood)return;this.mood=mood;this.applyMood(1.2);}
 startMusic(){
  this.wantsMusic=true;const ctx=this.ctx;if(!ctx)return;
  for(const track of Object.keys(tracks) as Track[]){
   if(this.playing.has(track))continue;this.playing.add(track);
   void this.load(tracks[track].url).then(buffer=>{
    if(!buffer||!this.ctx){this.playing.delete(track);return;}
    const source=this.ctx.createBufferSource(),spec=tracks[track];
    source.buffer=buffer;source.loop=true;
    const start=buffer.duration>spec.seconds+.01?MP3_PRIMING:0;
    source.loopStart=start;source.loopEnd=Math.min(buffer.duration,start+spec.seconds);
    source.connect(this.trackGain.get(track)!);source.start(this.ctx.currentTime+.05,start);
    this.applyMood(track==='theme'?3:4);
   });
  }
 }
 play(id:Sfx,{volume=1,detune=0}:{volume?:number;detune?:number}={}){
  const ctx=this.ctx;if(!ctx||this.volumes.sfx<=0||ctx.state!=='running')return;
  // Rapid repeats (double taps, several coins at once) restart instead of stacking.
  const now=performance.now(),last=this.lastPlayed.get(id)??0;if(now-last<70)return;this.lastPlayed.set(id,now);
  void this.load(this.sfxUrl(id)).then(buffer=>{
   if(!buffer||!this.ctx||!this.sfxBus)return;
   const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
   source.buffer=buffer;source.detune.value=detune;gain.gain.value=(cueVolume[id]??.75)*volume;
   source.connect(gain);gain.connect(this.sfxBus);source.start();
  });
 }
 /** A short musical flourish over a briefly lowered soundtrack. */
 fanfare(){
  const ctx=this.ctx;if(!ctx||!this.sfxBus)return;
  const previous=this.mood;this.setMood('celebration');
  void this.load('/assets/audio/music/jingle.mp3').then(buffer=>{
   if(!buffer||!this.ctx||!this.sfxBus)return;
   const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;gain.gain.value=.9;
   source.connect(gain);gain.connect(this.sfxBus);source.start();
  });
  window.setTimeout(()=>{if(this.mood==='celebration')this.setMood(previous);},2600);
 }
 private sfxUrl(id:Sfx){return `/assets/audio/sfx/${id}.mp3`;}
 private load(url:string){
  let pending=this.buffers.get(url);
  if(!pending){
   pending=fetch(publicAsset(url)).then(r=>{if(!r.ok)throw new Error(url);return r.arrayBuffer();})
    .then(data=>new Promise<AudioBuffer>((resolve,reject)=>this.ctx!.decodeAudioData(data,resolve,reject))).catch(()=>{this.buffers.delete(url);return null;});
   this.buffers.set(url,pending);
  }
  return pending;
 }
 private applyVolumes(seconds:number){
  const ctx=this.ctx;if(!ctx)return;const t=ctx.currentTime;
  this.sfxBus!.gain.setTargetAtTime(this.volumes.sfx,t,seconds/3+.001);
  this.musicBus!.gain.setTargetAtTime(this.volumes.music**1.5,t,seconds/3+.001);
 }
 private applyMood(seconds:number){
  const ctx=this.ctx;if(!ctx)return;const t=ctx.currentTime,m=moods[this.mood];
  for(const [track,gain] of this.trackGain){
   const target=this.playing.has(track)?m[track]*tracks[track].level:0;
   gain.gain.cancelScheduledValues(t);gain.gain.setTargetAtTime(target,t,seconds/3+.001);
  }
  this.filter!.frequency.cancelScheduledValues(t);this.filter!.frequency.setTargetAtTime(m.cutoff,t,seconds/4+.001);
 }
}
export const gameAudio=new GameAudio();
