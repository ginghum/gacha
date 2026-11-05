'use strict';
const RANDOM_MAN_ID=51;
let ofFestival=false,festivalCasting=-1,randomStartPreview=null;
const FESTIVAL_LEVELS=[1,.5,.2];
const RANDOM_MAN_PROFILE={key:'random-man',name:'ランダムマン',grade:null,special:true,maxHp:1500,color:'#b8a9ed',attack:.8,defense:1,speed:1,overflow:true,code:'RANDOM MAN',ability:'HP・見た目・技・OFを個別抽選',overflowText:'抽選されたOF',overflowDesc:'HP・見た目・技1〜3・OFをそれぞれ抽選する。抽選結果は編成時に確認できる。',descs:['ランダムなキャラの技1。','ランダムなキャラの技2。','ランダムなキャラの技3。']};
const RANDOM_MAN_SKILLS=[0,1,2].map(i=>({name:'抽選される技'+(i+1),cd:6+i*2}));
window.ARENA_IMAGES=window.ARENA_IMAGES||{};window.ARENA_IMAGES['random-man']='assets/plus.webp';
const borrowedViews=new WeakMap();
function borrowedFighter(f,char){
 if(!f.randomMan)return f;
 let views=borrowedViews.get(f);if(!views){views=new Map();borrowedViews.set(f,views)}
 if(!views.has(char))views.set(char,new Proxy(f,{get(target,key,receiver){if(key==='char')return char;if(key==='borrowedSkillView')return true;return Reflect.get(target,key,receiver)}}));
 return views.get(char);
}
function hasBorrowedSkill(f,char){return !!f.randomMan&&f.randomMan.skills.includes(char)}
function fighterBaseStats(f){return roster[f.randomMan?RANDOM_MAN_ID:f.char]}
function defaultMaxHp(f){return f.arenaBaseMaxHp===undefined?(roster[f.char].maxHp||MAX_HP):f.arenaBaseMaxHp*(ofFestival?2:1)}
function rollRandomMan(){
 const pool=roster.map((r,i)=>!r.special&&!r.training?i:-1).filter(i=>i>=0),ofPool=pool.filter(i=>roster[i].overflow),pick=a=>a[Math.floor(Math.random()*a.length)];
 return {hp:pick(pool),look:pick(pool),skills:[pick(pool),pick(pool),pick(pool)],of:pick(ofPool)};
}
function randomAwareSkills(f){
 if(!f.randomMan)return nativeFighterSkills(f);
 if(!f.borrowedSkillView)return randomManSkills(f);
 const base=nativeFighterSkills(f);return f.ultimateFlow?base.map((skill,i)=>i===2?{...skill,cd:.1}:skill):base;
}
function randomManSkills(f){return f.randomMan.skills.map((char,i)=>({...nativeFighterSkills(borrowedFighter(f,char))[i],cd:f.ultimateFlow&&i===2?.1:nativeFighterSkills(borrowedFighter(f,char))[i].cd}))}
function createFighter(id,char){
 const loadout=char===RANDOM_MAN_ID?(randomStartPreview?.[id]||rollRandomMan()):null;
 const f=createBaseFighter(id,loadout?loadout.of:char);
 if(loadout){f.randomMan={hp:loadout.hp,look:loadout.look,skills:loadout.skills.slice(),of:loadout.of};f.defense=RANDOM_MAN_PROFILE.defense;f.cds=[1.8+id*.7,4.8+id*.8,9+id*.8];}
 f.arenaBaseMaxHp=loadout?(roster[loadout.hp].maxHp||MAX_HP):(roster[char].maxHp||MAX_HP);
 f.maxHp=defaultMaxHp(f);f.hp=f.maxHp;f.festivalCount=0;f.ogreAid=0;
 if(mysterySkill>=0&&char!==TRAINING_KNIGHT_ID)f.cds[mysterySkill]=.1;
 return f;
}
function queueOverflow(f,requested=false){
 if(f.randomMan)f=fighters[f.id];
 if(ofFestival){checkPasterForm(f);return queueFestivalOF(f)}
 return queueBaseOverflow(f,requested);
}
function festivalReady(f){return f.festivalCount<3&&f.hp<=f.maxHp*FESTIVAL_LEVELS[f.festivalCount]+1e-6}
function queueFestivalOF(f){
 if(!running||!battleAlive(f)||f.summon||f.overflowQueued||!festivalReady(f))return;
 if((f.petrified>0||isSilenced(f)||f.wordStop>0)&&![11,30,37,45,47].includes(f.char)&&roster[f.char].overflow)return;
 f.overflowQueued=true;overflowQueue.push(f.id);
}
function festivalFloor(f){return ofFestival&&!f.summon&&f.festivalCount<3?Math.min(f.hp,f.maxHp*FESTIVAL_LEVELS[f.festivalCount]):0}
function beginOverflow(id){const f=fighters[id],result=ofFestival?beginFestivalOF(f):beginBaseOverflow(id);if(result&&f.randomMan)$('cutname').textContent='RANDOM MAN / '+roster[f.randomMan.of].name+' OF';return result}
function beginFestivalOF(f){
 if(!running||!battleAlive(f)||!festivalReady(f)){f.overflowQueued=false;return false}
 const previous=f.overflowUsed;f.overflowUsed=false;f.overflowQueued=false;f.festivalCount++;
 let success;
 if(!roster[f.char].overflow){
  f.ogreAid=8;f.diamondBarrier=Math.max(f.diamondBarrier,f.maxHp*.12);f.diamondBarrierTime=Math.max(f.diamondBarrierTime,8);f.overflowUsed=true;f.overflowName='オーガの補助';
  cutin(f,'オーガの補助','#eab58b',true);ring(f.x,f.y-30,'#eab58b',80,'shield',.75);playSE('shield',f);success=true;
 }else if(f.char===37){
  f.festivalDark=true;f.darkStandStarted=true;f.darkStand=5;f.darkCutCd=f.darkFeatherCd=0;f.overflowUsed=true;f.overflowName='不死鳥のレクイエム';
  cutin(f,f.overflowName,'#e9ddff',true);ring(f.x,f.y-30,'#e9ddff',90,'mirror',.65);playSE('of-shadow',f);success=true;
 }else{
  festivalCasting=f.id;try{success=beginBaseOverflow(f.id)}finally{festivalCasting=-1}
 }
 if(!success){f.festivalCount--;f.overflowUsed=previous;return false}
 log(nameOf(f)+'：OF祭り '+f.festivalCount+'/3');return true;
}
function tickFestivalRandom(f,dt){
 f.ogreAid=Math.max(0,(f.ogreAid||0)-dt);
 if(!f.randomMan)return;
 if(hasBorrowedSkill(f,33)&&f.char!==33)f.toxin=Math.min(AN_TOXIN_MAX,f.toxin+7*dt);
 if(hasBorrowedSkill(f,6)&&f.char!==6&&f.regenBoost>0)tickRegen(borrowedFighter(f,6),dt);
 if(hasBorrowedSkill(f,37)&&f.char!==37)f.darkArmor=Math.max(0,f.darkArmor-dt);
 if(hasBorrowedSkill(f,42)&&f.char!==42)tickRipia(borrowedFighter(f,42),dt);
 if(hasBorrowedSkill(f,45)&&f.char!==45){f.jekyllSwap=Math.max(0,f.jekyllSwap-dt);if(f.jekyllSwap<=0&&!f.overflowQueued)setJekyllForm(borrowedFighter(f,45),!f.jekyllHyde)}
}
function initFestivalRandomUI(){
 $('of-festival').onclick=()=>{ofFestival=!ofFestival;$('of-festival').setAttribute('aria-pressed',String(ofFestival));$('of-festival').textContent='OF祭り '+(ofFestival?'ON':'OFF');reset()};
}
function syncFestivalRandomHUD(){
 for(const f of fighters){
  const id=f.id;
  if(f.randomMan){
   const data=f.randomMan;colors[id]=roster[data.look].color;
   $('portrait'+id).src=imgs[data.look].src;$('portrait'+id).alt='ランダムマン / '+roster[data.look].name;
   $('name'+id).textContent='ランダムマン';$('ability'+id).textContent='見た目：'+roster[data.look].name+' / HP：'+roster[data.hp].name;$('hp'+id).style.background=colors[id];
   for(let i=0;i<3;i++)$('skill'+id+i).querySelector('span').textContent=fighterSkills(f)[i].name;
   $('skill'+id+'3').querySelector('span').textContent='✦ '+roster[data.of].overflowText;
  }
  if(f.ogreAid>0){const el=$('skill'+id+'3');el.title='オーガの補助：8秒間、攻撃力1.5倍・被ダメージ30%軽減・移動速度1.2倍・CT回復1.4倍・バリア';}
  if(ofFestival){
   const el=$('skill'+id+'3');el.querySelector('span').textContent=roster[f.char].overflow?'✦ '+roster[f.char].overflowText:'✦ オーガの補助';
   el.querySelector('b').textContent=f.overflowQueued?'発動待機':f.festivalCount>=3?'3/3 使用済':f.festivalCount+'/3 · '+Math.round(FESTIVAL_LEVELS[f.festivalCount]*100)+'%';
   if(manualMode&&id===0){const button=$('manual-skill3');button.disabled=true;button.querySelector('span').textContent=roster[f.char].overflow?'OF祭り':'オーガの補助';button.querySelector('b').textContent=f.festivalCount+'/3 · 自動';}
  }
 }
}
function syncRandomManInfo(){
 if(!fighters.some(f=>f.randomMan))return;
 $('fighter-info').innerHTML=fighters.map((f,id)=>{
  if(!f.randomMan){const r=roster[f.char];return '<article><span class="dot" style="background:'+colors[id]+'"></span><div><h3>'+nameOf(f)+' <span>P'+(id+1)+'</span></h3><p>'+r.ability+'</p><dl>'+skills[f.char].map((s,i)=>'<dt>0'+(i+1)+' '+s.name+'</dt><dd>'+r.descs[i]+'</dd>').join('')+'<dt>'+r.overflowText+'</dt><dd>'+r.overflowDesc+'</dd></dl></div></article>'}
  const data=f.randomMan;
  return '<article><span class="dot" style="background:'+colors[id]+'"></span><div><h3>ランダムマン <span>P'+(id+1)+'</span></h3><p>HP：'+roster[data.hp].name+' / 見た目：'+roster[data.look].name+'</p><dl>'+data.skills.map((char,i)=>'<dt>0'+(i+1)+' '+skills[char][i].name+' / '+roster[char].name+'</dt><dd>'+roster[char].descs[i]+'</dd>').join('')+'<dt>OF：'+roster[data.of].overflowText+' / '+roster[data.of].name+'</dt><dd>'+roster[data.of].overflowDesc+'</dd></dl></div></article>';
 }).join('');
}
