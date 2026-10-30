'use strict';
// Procedural battle SE: no downloads, no gameplay RNG, and bounded polyphony.
(()=>{
class ArenaSoundEngine{
 constructor({context=null}={}){this.context=context;this.enabled=false;this.volume=.35;this.voices=new Set();this.next=new Map();this.stats={played:0,dropped:0,peakVoices:0};this.seed=0x71c34a9;this.ready=false}
 unlock(){try{if(!this.context||this.context.state==='closed'){const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;this.context=new C();this.ready=false}if(!this.ready)this.init();if(this.context.state==='suspended'&&typeof this.context.startRendering!=='function')this.context.resume().catch(()=>{});return true}catch{return false}}
 init(){const c=this.context;this.bus=c.createDynamicsCompressor();this.bus.threshold.value=-14;this.bus.knee.value=12;this.bus.ratio.value=10;this.bus.attack.value=.003;this.bus.release.value=.12;this.master=c.createGain();this.master.gain.value=this.enabled?this.volume:0;this.bus.connect(this.master);this.master.connect(c.destination);this.noise=c.createBuffer(1,Math.ceil(c.sampleRate*2),c.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x|0;data[i]=((x>>>0)/4294967296)*2-1}this.ready=true}
 setEnabled(value){this.enabled=!!value;if(this.enabled)this.unlock();else this.stopAll();this.applyVolume()}
 setVolume(value){if(Number.isFinite(Number(value)))this.volume=Math.max(0,Math.min(1,Number(value)));this.applyVolume()}
 applyVolume(){if(this.ready)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.015)}
 stopAll(){for(const v of this.voices){try{v.source.stop(this.context.currentTime)}catch{}for(const node of v.nodes){try{node.disconnect()}catch{}}}this.voices.clear();this.next.clear()}
 layer(at,pan,{wave='sine',freq=200,end=freq,dur=.15,amp=.12,delay=0,noise=false,filter='lowpass',cutoff=1200,q=.7}){const c=this.context,t=at+delay,active=[...this.voices].filter(v=>v.start<=t&&v.end>t).length;if(active>=40){this.stats.dropped++;return}const source=noise?c.createBufferSource():c.createOscillator();let tail=source,nodes=[source];if(noise){source.buffer=this.noise;const f=c.createBiquadFilter();f.type=filter;f.frequency.setValueAtTime(cutoff,t);f.Q.value=q;source.connect(f);tail=f;nodes.push(f)}else{source.type=wave;source.frequency.setValueAtTime(Math.max(20,freq),t);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+dur)}const gain=c.createGain();gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(amp,t+Math.min(.008,dur/4));gain.gain.exponentialRampToValueAtTime(.0001,t+dur);tail.connect(gain);nodes.push(gain);if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;gain.connect(p);p.connect(this.bus);nodes.push(p)}else gain.connect(this.bus);const voice={source,nodes,start:t,end:t+dur+.015};this.voices.add(voice);this.stats.peakVoices=Math.max(this.stats.peakVoices,active+1);source.onended=()=>{this.voices.delete(voice);for(const node of nodes){try{node.disconnect()}catch{}}};source.start(t);source.stop(voice.end)}
 play(type,{pan=0,character=0,at=null}={}){if(!this.enabled||this.volume<=0||!this.ready)return false;const c=this.context,t=at??c.currentTime+.005;if(c.state==='closed')return false;let group=type,gap=.09;if(type.startsWith('shoot-')){group='projectile';gap=.055}else if(['hit','heavy','metal','ice','fire','thermal','slash','grapple','vine-hit'].includes(type)){group='impact';gap=.065}else if(['explosion','ultimate-impact'].includes(type)){group='explosion';gap=type==='ultimate-impact'?.2:.1}else if(type==='heal'){gap=.35}else if(['immune','poison','field-tick','root'].includes(type)){gap=.18}else if(type.startsWith('of-')){group='overflow';gap=.2}if(t<(this.next.get(group)||0)){this.stats.dropped++;return false}this.next.set(group,t+gap);this.stats.played++;pan=Math.max(-.75,Math.min(.75,pan));const tone=(freq,end,dur,amp=.12,wave='sine',delay=0)=>this.layer(t,pan,{freq,end,dur,amp,wave,delay}),noise=(dur,amp=.12,cutoff=1200,filter='lowpass',delay=0)=>this.layer(t,pan,{noise:true,dur,amp,cutoff,filter,delay});
 if(type.startsWith('shoot-')){const k=type.slice(6);tone(k==='ice'?1600:k==='explosive'?460:750,k==='ice'?900:180,.065,.08,'triangle');noise(.035,.07,k==='fire'?1600:3400,'highpass');return true}
 switch(type){
 case 'ui':tone(880,1100,.07,.07,'triangle');break;
 case 'start':[440,660,880].forEach((n,i)=>tone(n,n,.17,.12,'triangle',i*.09));break;
 case 'victory':[261.63,329.63,392,523.25].forEach((n,i)=>tone(n,n,.55,.12,'triangle',i*.11));tone(130.8,130.8,.75,.14,'sine',.2);break;
 case 'pause':tone(440,330,.09,.06,'triangle');break;
 case 'resume':tone(440,660,.1,.07,'triangle');break;
 case 'dash':case 'dodge':noise(.12,.12,1100,'highpass');break;
 case 'hit':noise(.065,.15,1400,'bandpass');tone(170,65,.1,.13,'triangle');break;
 case 'heavy':noise(.17,.18,1000);tone(110,38,.23,.24);break;
 case 'slash':noise(.13,.13,2600,'highpass');tone(760,190,.12,.08,'triangle');break;
 case 'metal':[1120,1810].forEach(n=>tone(n,n*.72,.22,.09,'triangle'));noise(.045,.1,2500,'highpass');break;
 case 'ice':tone(1450,2200,.16,.1,'triangle');noise(.08,.11,3600,'highpass');break;
 case 'fire':noise(.19,.17,1900);tone(190,65,.15,.1,'sawtooth');break;
 case 'thermal':tone(1450,2100,.2,.09,'triangle');noise(.2,.16,1800);tone(170,60,.2,.12,'sawtooth');break;
 case 'explosion':noise(.3,.22,1100);tone(105,32,.34,.24);noise(.08,.1,2600,'highpass');break;
 case 'ultimate-impact':noise(.75,.28,1200);tone(85,28,.8,.3);noise(.18,.14,2900,'highpass');break;
 case 'poison':tone(350,85,.13,.085);noise(.07,.05,650,'bandpass');break;
 case 'heal':[523.25,659.25,783.99].forEach((n,i)=>tone(n,n,.28,.075,'sine',i*.065));break;
 case 'root':case 'vine-hit':noise(.15,.1,1300,'bandpass');tone(340,150,.16,.08,'triangle');break;
 case 'reflect':tone(330,1600,.18,.1,'triangle');tone(980,1960,.16,.06);break;
 case 'immune':tone(1500,1800,.09,.055,'sine');break;
 case 'shield':tone(660,480,.3,.13,'triangle');tone(990,720,.3,.08);break;
 case 'grapple':tone(100,62,.14,.1);noise(.07,.06,500);break;
 case 'charge':tone(85,280,.45,.14,'sawtooth');noise(.35,.07,650,'bandpass');break;
 case 'growth':tone(65,105,.38,.2);noise(.22,.1,380);break;
 case 'air':noise(.16,.13,2100,'bandpass');tone(420,850,.12,.07,'triangle');break;
 case 'field-tick':tone(900,1200,.05,.035,'sine');noise(.035,.03,2500,'highpass');break;
 case 'skill':{const n=300+(character%5)*70;tone(n,n*1.5,.22,.11,'triangle');tone(n*2,n*2,.16,.07,'sine',.07);break}
 default:if(type.startsWith('of-')){const k=type.slice(3);tone(60,95,.6,.17);if(k==='blackhole'){tone(220,28,.95,.22,'sawtooth');noise(.8,.12,450)}else if(['freeze','dual'].includes(k)){[880,1320,1760].forEach((n,i)=>tone(n,n*1.25,.55,.08,'triangle',i*.07));noise(.4,.1,3300,'highpass');if(k==='dual'){noise(.65,.18,1500);tone(180,45,.6,.15,'sawtooth')}}else if(['heat','bigbang'].includes(k)){noise(.7,.2,1400);tone(100,340,.65,.14,'sawtooth')}else if(['sprout','fortune'].includes(k)){[330,495,660,990].forEach((n,i)=>tone(n,n,.65,.085,k==='sprout'?'sine':'triangle',i*.09))}else if(k==='colossus'){tone(42,90,.9,.24);noise(.75,.16,400)}else if(k==='repulsion'){[550,820,1100].forEach((n,i)=>tone(n,n*1.3,.2,.08,'triangle',i*.075));noise(.4,.1,2200,'bandpass')}else{tone(80,440,.6,.18,'sawtooth');noise(.3,.14,1200,'bandpass')}}else tone(440,660,.14,.07,'triangle');
 }
 return true}
}
window.ArenaSoundEngine=ArenaSoundEngine;
window.ArenaSound=new ArenaSoundEngine();
})();
