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
const params=new URLSearchParams(location.search);
const scripts={'20261116':"ごきげんよう。十一月十六日、朝七時からの出来事をお届けしますわ。朝七時二十七分、わたくしは寒い中のお散歩とごみ拾いをされた方へ、ねぎらいの言葉を投稿しましたの。そして十一時二十四分、kojira様から、今日の出来事を一分ほどにまとめて話させるリンクのご依頼をいただきましたわ。今日も素敵な一日を。"};
scripts["20261116-weather"]="今日の午前中に確認できた、気象の観測情報です。気象庁のアメダスによりますと、午前11時40分の気温は、東京の観測地点で19.9度、大阪の観測地点で18.5度でした。湿度は東京で44パーセント、大阪で53パーセントです。また、直前の1時間の降水量は、東京、大阪ともに0.0ミリでした。同じ時刻までの24時間降水量は、東京で7.0ミリ、大阪で6.0ミリでした。直前1時間の日照時間は、東京で1.0時間、大阪で0.6時間です。これは、それぞれの観測地点での値で、都内や府内のすべての場所の状況を示すものではありません。なお、気象庁の地震情報一覧では、確認できた最新の地震は午前6時台でした。午前7時以降に地震がなかったと断定するものではありません。以上、午前11時56分ごろまでに確認できた情報でした。";
const initial=params.has('text') ? params.get('text') : (scripts[params.get('story')] ?? null); if(initial!==null)input.value=initial;
let context, source, frame, run=0;
// Bound each synthesis request even when a sentence has no punctuation.
function splitText(text, limit=100){
 const sentences=text.match(/[^。！？]*[。！？]|[^。！？]+$/gu) || [];
 const chunks=[];
 for(const sentence of sentences){
  const chars=Array.from(sentence);
  while(chars.length){
   let end=Math.min(limit,chars.length);
   if(chars.length>end){
    let fallback=-1;
    for(let i=0;i<end;i++)if(/[、，,；;\s]/u.test(chars[i]))fallback=i+1;
    if(fallback>=Math.ceil(limit/3))end=fallback;
   }
   const part=chars.splice(0,end).join('');
   if(part.trim())chunks.push(part);
  }
 }
 return chunks;
}
function mouth(level=0){
 const doc=portrait.contentDocument;if(!doc)return;
 const shape=doc.getElementById('mouth');if(!shape)return;
 const amount=Math.max(0,Math.min(1,level));
 const scale=.03+amount*.97;
 shape.setAttribute('transform',`translate(0 650) scale(1 ${scale}) translate(0 -650)`);
}
function cancel(){run++;if(source){try{source.stop()}catch{}source=null}cancelAnimationFrame(frame);mouth();stop.disabled=true;speak.disabled=false;}
stop.onclick=()=>{cancel();status.textContent='停止しました。'};
speak.onclick=async()=>{const text=input.value.trim();if(!text){status.textContent='お話しする言葉を入力してください。';return}cancel();const id=run;speak.disabled=true;stop.disabled=false;try{
 context ||= new AudioContext(); if(!navigator.userActivation?.isActive && context.state!=='running') throw Error('自動再生が制限されています。「お話しする」ボタンを押してください。'); await context.resume(); if(id!==run)return; if(context.state!=='running')throw Error('音声の再生が許可されませんでした。もう一度ボタンを押してください。');
 status.textContent='声を準備しています…';const tts=await loadVoice();if(id!==run)return;
 const chunks=splitText(text);let totalDuration=0;
 for(let i=0;i<chunks.length;i++){
  status.textContent=`音声を合成しています… ${i+1}/${chunks.length}`;
  const result=await tts.speak(chunks[i],{emotion:{happy:60,neutral:40}});if(id!==run)return;
  const pcm=result.audio || result.pcm;if(!pcm?.length)throw Error(`音声 ${i+1} を合成できませんでした。`);
  const buffer=context.createBuffer(1,pcm.length,44100);buffer.copyToChannel(pcm,0);totalDuration+=buffer.duration;
  const node=context.createBufferSource(), analyser=context.createAnalyser();node.buffer=buffer;analyser.fftSize=512;analyser.smoothingTimeConstant=.45;node.connect(analyser);analyser.connect(context.destination);source=node;const samples=new Float32Array(analyser.fftSize);let smoothed=0;
  function animate(){if(id!==run || source!==node)return;analyser.getFloatTimeDomainData(samples);let energy=0;for(const x of samples)energy+=x*x;const rms=Math.sqrt(energy/samples.length);smoothed=smoothed*.55+rms*.45;mouth(Math.max(0,Math.min(1,(smoothed-.012)*24)));frame=requestAnimationFrame(animate)}
  status.textContent=`お話し中です 🎀 ${i+1}/${chunks.length}`;
  await new Promise((resolve,reject)=>{node.onended=resolve;try{node.start();animate()}catch(error){reject(error)}});
  if(id!==run)return;cancelAnimationFrame(frame);source=null;node.disconnect();analyser.disconnect();mouth();
 }
 speak.disabled=false;stop.disabled=true;status.textContent=`お話しが終わりました。（${chunks.length}区間・音声 ${totalDuration.toFixed(1)}秒）`;
 }catch(e){if(id!==run)return;cancel();status.textContent='音声を再生できませんでした：'+e.message;console.error(e)}};

if(initial !== null && input.value.trim()){ status.textContent='自動再生を試みています。制限される場合は「お話しする」を押してください。'; speak.click(); }
