import { ZenTts } from './vendor/zenryokukikai-zen-tts-38773bf/dist/index.js';
import { clearModelCache } from './vendor/zenryokukikai-zen-tts-38773bf/dist/runtime/model-fetch.js';
let ttsPromise;
function loadVoice(){
 if(!ttsPromise){
  const base='https://cdn.jsdelivr.net/gh/zenryokukikai/zen-tts@v1.3.0';
  ttsPromise=ZenTts.load({modelsUrl:base+'/models',cpuWasmUrl:base+'/cpu/tts-cpu.wasm',model:'https://huggingface.co/kojira/zen-tts-models/resolve/4c61092805c3cc37343e35c67c28c04c93129425/bluesky.ztm',backend:'cpu'}).catch(async error=>{await clearModelCache();ttsPromise=null;throw error});
 }
 return ttsPromise;
}
const $=id=>document.getElementById(id), input=$('text'), status=$('status'), speak=$('speak'), stop=$('stop'), portrait=$('portrait');
const initial=new URLSearchParams(location.search).get('text'); if(initial!==null)input.value=initial.slice(0,300);
let tts,context,source,frame,run=0;
function mouth(level=0){
 const doc=portrait.contentDocument;if(!doc)return;
 const shape=doc.getElementById('mouth');if(!shape)return;
 const amount=Math.max(0,Math.min(1,level));
 // Keep the original SVG path and its full width; compress only its height at rest.
 const scale=.03+amount*.97;
 shape.setAttribute('transform',`translate(0 650) scale(1 ${scale}) translate(0 -650)`);
}
function cancel(){run++;if(source){try{source.stop()}catch{}source=null}cancelAnimationFrame(frame);mouth();stop.disabled=true;speak.disabled=false;}
stop.onclick=()=>{cancel();status.textContent='停止しました。'};
speak.onclick=async()=>{const text=input.value.trim();if(!text){status.textContent='お話しする言葉を入力してください。';return}cancel();const id=run;speak.disabled=true;stop.disabled=false;try{
 context ||= new AudioContext(); if(!navigator.userActivation?.isActive && context.state!=='running') throw Error('自動再生が制限されています。「お話しする」ボタンを押してください。'); await context.resume(); if(context.state!=='running')throw Error('音声の再生が許可されませんでした。もう一度ボタンを押してください。');
 status.textContent='声を準備しています…';tts = await loadVoice();if(id!==run)return;
 status.textContent='音声を合成しています…';const result=await tts.speak(text,{emotion:{happy:60,neutral:40}});if(id!==run)return;
 const pcm=result.audio || result.pcm;const buffer=context.createBuffer(1,pcm.length,44100);buffer.copyToChannel(pcm,0);const node=context.createBufferSource(), analyser=context.createAnalyser();node.buffer=buffer;analyser.fftSize=512;analyser.smoothingTimeConstant=.45;node.connect(analyser);analyser.connect(context.destination);source=node;const samples=new Float32Array(analyser.fftSize);let smoothed=0;
 function animate(){if(id!==run)return;analyser.getFloatTimeDomainData(samples);let energy=0;for(const x of samples)energy+=x*x;const rms=Math.sqrt(energy/samples.length);smoothed=smoothed*.55+rms*.45;mouth(Math.max(0,Math.min(1,(smoothed-.012)*24)));frame=requestAnimationFrame(animate)}
 node.onended=()=>{if(id!==run)return;cancelAnimationFrame(frame);source=null;mouth();speak.disabled=false;stop.disabled=true;status.textContent='お話しが終わりました。'};node.start();status.textContent='お話し中です 🎀';animate();
 }catch(e){if(id!==run)return;cancel();status.textContent='音声を再生できませんでした：'+e.message;console.error(e)}};

if(initial !== null && input.value.trim()){ status.textContent='自動再生を試みています。制限される場合は「お話しする」を押してください。'; speak.click(); }
