'use strict';
const EMPRESS_ID=48;
const EMPRESS_ABILITIES=Object.freeze({
 body:{name:'身体能力の極限強化',role:'support',duration:5},beams:{name:'十種の光線',role:'attack',duration:5.5},reflect:{name:'飛び道具反射',role:'support',duration:4},stop:{name:'触れたものを停止',role:'support',duration:3},disease:{name:'病気無効',role:'support',duration:6},ghost:{name:'幽霊化',role:'support',duration:2.2},insomnia:{name:'不眠',role:'support',duration:6},guns:{name:'機銃生成',role:'attack',duration:6},repulsion:{name:'斥力操作',role:'support',duration:4.5},flowers:{name:'花の生成',role:'attack',duration:5},element:{name:'エレメント弱体化',role:'support',duration:5},heal:{name:'自己回復',role:'support',duration:5},armor:{name:'透明な鎧',role:'support',duration:5},sense:{name:'生物の位置察知',role:'support',duration:5},adamant:{name:'アダマント生成・操作',role:'attack',duration:5},space:{name:'空間の壁を破壊',role:'attack',duration:2.5},wings:{name:'竜の翼',role:'support',duration:5},clone:{name:'不完全な分身',role:'attack',duration:6},life:{name:'生物生成',role:'attack',duration:6},time:{name:'時間の微加速',role:'support',duration:5}
});
const EMPRESS_SKILLS=[{name:'こちらへいらっしゃい',cd:5.2},{name:'その程度ですの？',cd:7},{name:'受け入れなさい',cd:6}];
const EMPRESS_PROFILE={key:'empress',name:'エンプレス',grade:5,special:true,maxHp:4200,color:'#ebbd72',code:'SS / EMPRESS · OPPONENT ONLY',ability:'捕食・触手＋所持する20能力 / 同時使用3種類まで',attack:1.2,defense:.8,speed:1.03,overflow:true,overflowRatio:.35,overflowText:'帝国の収穫祭',overflowDesc:'対戦相手専用の特別キャラ・ティアSS。HP35%以下で1戦に1回。旧能力と生成物を終了し、6秒間「捕食・触手＋時間の微加速＋十種の光線」に固定。触手で逃げ道を塞ぎながら十種の光線を順番に放つ。回復・鎧・反射などの追加併用はしない。',descs:['ミルクと同系統の触手を広げ、捕らえて引き寄せ、最大4連撃。捕食・触手で1枠を使用する。','戦況に応じて防御・移動・回復系の能力を1種類選ぶ。回復・反射・幽霊化・鎧・察知・翼・身体強化・微加速・停止・斥力・エレメント弱体化・病気無効・不眠。','攻撃・生成系の能力を1種類選ぶ。十種の光線・機銃・花・アダマント・空間破壊・不完全な分身・生物生成。切り替え時は旧能力の弾・召喚物・継続効果を終了。技2・3のCTは引き継ぐ。']};
function newEmpressState(){return {slots:[null,null],serial:0,cycle:0,supportTurn:0,attackTurn:0,ofLeft:0,ofTick:0,history:[]}}
function empHas(f,key){return !!(f&&f.char===EMPRESS_ID&&!f.summon&&f.emp?.slots.some(s=>s&&s.key===key&&s.left>0))}
function empSlot(f,key){return f?.emp?.slots.find(s=>s&&s.key===key&&s.left>0)}
function empActive(f){return f?.char===EMPRESS_ID?['predation',...f.emp.slots.filter(s=>s&&s.left>0).map(s=>s.key)]:[]}
function empControlBlocked(f){return !!(f.empStop?.left>0||f.sleepTime>0)}
function empCanLocate(source,target){return empHas(source,'sense')&&target.invisible>0&&!(target.shadowMove>0)&&!(target.jekyllVeil>0)&&!empHas(target,'ghost')}
function empClearSlot(f,index){
 const slot=f.emp?.slots[index];if(!slot)return;
 shots=shots.filter(s=>!(s.owner===f.id&&s.empSlot===index));
 diamondSoldiers=diamondSoldiers.filter(v=>!(v.owner===f.id&&v.empSlot===index));
 fx=fx.filter(v=>!(v.empOwner===f.id&&v.empSlot===index));
 for(const e of [...fighters,...diamondSoldiers])for(const field of ['empStop','empBlind'])if(e[field]?.owner===f.id&&e[field].slot===index)e[field]=null;
 f.emp.slots[index]=null;
}
function empEquip(f,index,key,duration,force=false){
 if(f.char!==EMPRESS_ID||f.summon||!EMPRESS_ABILITIES[key]||index<0||index>1||f.emp.ofLeft>0&&!force)return false;
 if(f.emp.slots.some((s,i)=>i!==index&&s?.key===key&&s.left>0))return false;
 empClearSlot(f,index);
 const slot={key,left:duration??EMPRESS_ABILITIES[key].duration,token:++f.emp.serial,tick:0,uses:0,selfSkillOwner:selfSkillContext?.owner,shield:key==='adamant'?180:0,index};f.emp.slots[index]=slot;f.emp.cycle++;if(index===0)f.emp.supportTurn++;else f.emp.attackTurn++;
 f.emp.history.push(key);if(f.emp.history.length>40)f.emp.history.shift();
 const e=attackTarget(f);slot.x=clamp(e.x,75,W-75);slot.y=clamp(e.y,150,H-80);
 if(['guns','clone','life'].includes(key))empSpawnUnits(f,index,key);
 if(key==='space'){
  if(Math.hypot(e.x-f.x,e.y-f.y)<680){e.diamondBarrier=0;e.diamondBarrierTime=0;e.guard=0;e.reflectBoost=0;e.riftMirror=0;e.riftEvade=0;if(arenaField?.owner===e.id)arenaField=null;if(stoneField?.owner===e.id)stoneField=null;hit(e,100,f,'#ffe8b5');empVisual(f,'fracture',f.x,f.y-30,e.x,e.y-30,80,index)}
 }
 if(key==='repulsion')empRepel(f,index,85);
 ring(f.x,f.y-30,'#ebbd72',65,'ring',.5);log('エンプレス：'+EMPRESS_ABILITIES[key].name+' / 同時使用 '+empActive(f).length+'/3');return true;
}
function empVisual(f,style,x,y,tx,ty,r=60,slot=-1,life=.45){fx.push({kind:'empVisual',style,x,y,tx,ty,r,c:'#ebbd72',empOwner:f.id,empSlot:slot,life,max:life})}
function empStateLabel(f){return empActive(f).map(k=>k==='predation'?'捕食・触手':EMPRESS_ABILITIES[k].name).join(' ＋ ')}
function empressSkills(f){return EMPRESS_SKILLS.map((s,i)=>({...s,name:i===0?s.name:f.emp?.slots[i-1]?s.name+' / '+EMPRESS_ABILITIES[f.emp.slots[i-1].key].name:s.name}))}
function empSkillAllowed(f,i){return f.char!==EMPRESS_ID||!f.summon&&!(f.emp.ofLeft>0&&i>0)&&!(i===0&&empHas(f,'ghost'))}
function empSupportChoice(f,e){
 const other=f.emp.slots[1]?.key,options=[];
 if(f.sleepTime>0)options.push('insomnia');if(f.diseaseTime>0)options.push('disease');
 if(isConcealed(e)||illusions.some(v=>v.owner===e.id)||diamondSoldiers.some(v=>v.owner===e.id&&v.hattanClone))options.push('sense');
 if(e.overflowQueued||e.windup>0&&Math.hypot(e.x-f.x,e.y-f.y)<230)options.push('ghost');
 if(f.hp<f.maxHp*.65)options.push('heal');
 if(shots.some(s=>s.owner!==f.id&&Math.hypot(s.x-f.x,s.y-f.y)<430))options.push('reflect');
 if([1,19,21].includes(e.char))options.push('element');
 const d=Math.hypot(e.x-f.x,e.y-f.y);if(d<150)options.push('stop','body');
 const pool=['armor','body','time','wings','repulsion'];options.push(pool[f.emp.supportTurn%pool.length],...pool);
 return options.find(k=>k!==other&&k!==f.emp.slots[0]?.key)||'armor';
}
function empAttackChoice(f,e){
 const other=f.emp.slots[0]?.key,options=[];
 if(e.diamondBarrier>0||e.riftMirror>0||e.riftEvade>0||e.guard>0||arenaField?.owner===e.id||stoneField?.owner===e.id)options.push('space');
 if(diamondSoldiers.some(v=>v.owner===e.id))options.push('adamant');
 if(empHas(f,'heal'))options.push('guns');
 const pool=['beams','guns','flowers','adamant','clone','life'];options.push(pool[f.emp.attackTurn%pool.length],...pool);
 return options.find(k=>k!==other&&k!==f.emp.slots[1]?.key)||'beams';
}
function empTentacle(f,e,damage,reach,bind=false){
 if(!running||!battleAlive(f)||empHas(f,'ghost')||!titanRushCanAct(f))return false;
 fx.push({x:f.x,y:f.y-35,tx:e.x,ty:e.y-25,c:'#d6a4b0',r:9,kind:'tentacle',life:.35,max:.35});
 if(Math.hypot(e.x-f.x,e.y-f.y)>reach)return false;
 const landed=hit(e,damage,f,'#ebbd72');if(landed&&bind){e.bind=Math.max(e.bind,.7);const a=Math.atan2(e.y-f.y,e.x-f.x);e.vx-=Math.cos(a)*240;e.vy-=Math.sin(a)*240}return landed;
}
function castEmpress(f,i,e){
 if(!empSkillAllowed(f,i))return false;
 if(i===0){for(let n=0;n<4;n++)schedule(n*.16,()=>empTentacle(f,attackTarget(f),42,450,n<2));return true}
 return empEquip(f,i-1,i===1?empSupportChoice(f,e):empAttackChoice(f,e));
}
function empShot(f,e,slotIndex,damage=40,offset=0,options={}){
 const slot=f.emp.slots[slotIndex];if(!slot)return;
 const origin=options.origin||f,point=options.point||{x:origin.x,y:origin.y-25},angle=Math.atan2(e.y-25-point.y,e.x-point.x)+offset,velocity=options.velocity||900;
 shots.push({x:point.x,y:point.y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,r:options.r||9,type:options.adamant?'empCrystal':'empBeam',c:options.color||'#ffe2ab',damage,life:2.8,owner:f.id,origin,empSlot:slotIndex,empToken:slot.token,empHoming:options.homing||false,empCurve:options.curve||0});
}
const EMPRESS_BEAM_COLORS=['#ffe7ad','#f7b0c4','#b8efff','#d4b8ff','#ffbb8e','#c4ffd1','#fff6c9','#8edfea','#f7bbef','#ffffff'];
function empBeam(f,index){
 const slot=f.emp.slots[index],e=attackTarget(f),n=slot.uses++%10,c=EMPRESS_BEAM_COLORS[n],angle=Math.PI+n*Math.PI/9,point=f.emp.ofLeft>0?{x:f.x+Math.cos(angle)*85,y:f.y-70+Math.sin(angle)*70}:{x:f.x,y:f.y-30};
 if(n===2||n===9){hit(e,n===9?100:65,f,c);empVisual(f,'ray',point.x,point.y,e.x,e.y-30,n===9?16:8,index,.3);return}
 const count=n===1||n===8?3:n===6?5:n===5?2:1;
 for(let j=0;j<count;j++)empShot(f,e,index,n===4?75:count>1?24:45,(j-(count-1)/2)*(n===6?.16:.12),{point,color:c,r:n===4?22:8,velocity:n===4?560:1000,homing:n===3||n===8,curve:n===7?1.1:0});
}
function empRepel(f,index,damage=30){
 empVisual(f,'wave',f.x,f.y-30,f.x,f.y-30,300,index,.65);
 for(const e of crowdOverflowTargets(f.id))if(Math.hypot(e.x-f.x,e.y-f.y)<300&&hit(e,damage,f,'#ebbd72')){const a=Math.atan2(e.y-f.y,e.x-f.x);e.vx+=Math.cos(a)*400;e.vy+=Math.sin(a)*400}
}
function empSpawnUnits(f,index,key){
 const before=new Set(diamondSoldiers);summonDiamondSoldiers(f,2);
 for(const v of diamondSoldiers)if(!before.has(v)){Object.assign(v,{empUnit:true,empKind:key,empSlot:index,empToken:f.emp.slots[index].token,emp:null,invisible:0,jend:false,hattanClone:false,wordSoldier:false,life:f.emp.slots[index].left,hp:key==='clone'?70:key==='guns'?110:140,maxHp:key==='clone'?70:key==='guns'?110:140,attackCd:.35,defense:1});empVisual(f,'crystal',v.x,v.y-30,v.x,v.y-30,30,index,.4);}
}
function tickEmpressUnit(v,dt){
 const f=fighters[v.owner],slot=f.emp?.slots[v.empSlot];if(!slot||slot.token!==v.empToken){v.life=0;return}
 const e=attackTarget(f),dx=e.x-v.x,dy=e.y-v.y,d=Math.hypot(dx,dy)||1;
 if(isConcealed(e)&&!empHas(f,'sense'))return;
 if(v.empKind!=='guns'&&d>90){const travel=Math.min(d-85,270*dt);v.x=clamp(v.x+dx/d*travel,55,W-55);v.y=clamp(v.y+dy/d*travel,135,H-65)}
 v.mx=(v.x-v.prevX)/dt;v.my=(v.y-v.prevY)/dt;
 if(v.attackCd<=0){v.attackCd=v.empKind==='guns'?.5:.8;if(v.empKind==='guns')empShot(f,e,v.empSlot,18,0,{origin:v,velocity:1100});else if(d<150){hit(e,v.empKind==='clone'?18:26,f,'#e9c794',0,false,'direct',v);v.attack=.25;empVisual(f,'ray',v.x,v.y-25,e.x,e.y-25,3,v.empSlot,.2)}}
}
function empAdvanceShot(s,dt){
 if(s.empSlot===undefined)return true;
 const f=fighters[s.owner],slot=f?.emp?.slots[s.empSlot];if(!slot||slot.token!==s.empToken||slot.left<=0){s.life=0;return false}
 if(s.empHoming){const e=attackTarget(f),speed=Math.hypot(s.vx,s.vy),a=Math.atan2(e.y-25-s.y,e.x-s.x);const blend=1-Math.exp(-5*dt);s.vx+=(Math.cos(a)*speed-s.vx)*blend;s.vy+=(Math.sin(a)*speed-s.vy)*blend}
 if(s.empCurve){const a=s.empCurve*dt,vx=s.vx;s.vx=vx*Math.cos(a)-s.vy*Math.sin(a);s.vy=vx*Math.sin(a)+s.vy*Math.cos(a)}return true;
}
function empInterceptShot(target,s){
 if(!target||target.summon)return false;
 if(empHas(target,'reflect')){const slot=empSlot(target,'reflect');s.owner=target.id;s.origin=target;s.vx=-s.vx;s.vy=-s.vy;s.empSlot=slot.index;s.empToken=slot.token;s.empHoming=false;s.empCurve=0;s.x+=s.vx*.035;s.y+=s.vy*.035;ring(target.x,target.y-30,'#fff0c0',60,'mirror',.3);return true}
 const wall=empSlot(target,'adamant');if(wall&&wall.shield>0){wall.shield-=s.damage||25;s.life=0;empVisual(target,'crystal',target.x,target.y-30,target.x,target.y-30,65,wall.index,.3);return true}return false;
}
function empApplyStatus(f,kind,duration){
 if(!running||!battleAlive(f)||untouchable(f))return false;
 if(kind==='sleep'){if(empHas(f,'insomnia'))return false;f.sleepTime=Math.max(f.sleepTime||0,duration);return true}
 if(kind==='disease'){if(empHas(f,'disease'))return false;f.diseaseTime=Math.max(f.diseaseTime||0,duration);return true}return false;
}
function tickEmpressWorld(dt){
 for(const f of [...fighters,...diamondSoldiers]){
  f.sleepTime=Math.max(0,(f.sleepTime||0)-dt);f.diseaseTime=Math.max(0,(f.diseaseTime||0)-dt);
  for(const k of ['empStop','empBlind'])if(f[k]){f[k].left-=dt;const source=fighters[f[k].owner],slot=source?.emp?.slots[f[k].slot];if(f[k].left<=0||!slot||slot.token!==f[k].token)f[k]=null}
  if(f.char!==EMPRESS_ID||f.summon||!battleAlive(f))continue;
  const state=f.emp;if(state.ofLeft>0)state.ofLeft=Math.max(0,state.ofLeft-dt);
  for(let i=0;i<2;i++){
   const slot=state.slots[i];if(!slot)continue;slot.left-=dt;if(slot.left<=0){empClearSlot(f,i);continue}
   withSelfSkill(slot.selfSkillOwner,()=>{slot.tick-=dt;const e=attackTarget(f),distance=Math.hypot(e.x-f.x,e.y-f.y);
   if(slot.key==='heal')restoreHP(f,26*dt);
   if(slot.key==='disease')f.diseaseTime=0;if(slot.key==='insomnia')f.sleepTime=0;
   if(slot.key==='stop'&&!slot.uses&&distance<145&&hit(e,40,f,'#ffe8b0')){slot.uses++;e.empStop={owner:f.id,slot:i,token:slot.token,left:.9};empVisual(f,'stop',e.x,e.y-30,e.x,e.y-30,65,i,.9)}
   if(slot.key==='flowers'&&Math.hypot(e.x-slot.x,e.y-slot.y)<180&&!untouchable(e))e.empBlind={owner:f.id,slot:i,token:slot.token,left:.25};
   if(slot.tick<=0){
    if(slot.key==='beams'){slot.tick=.5;empBeam(f,i)}
    else if(slot.key==='adamant'){slot.tick=.85;empShot(f,e,i,55,0,{adamant:true,velocity:950,r:11})}
    else if(slot.key==='repulsion'){slot.tick=1.4;empRepel(f,i,24)}
   }
   });if(!running)return;
  }
  if(state.ofLeft>0){state.ofTick-=dt;if(state.ofTick<=0){state.ofTick=.8;empTentacle(f,attackTarget(f),22,650,true)}}
 }
}
function beginEmpressOverflow(f){
 if(!running||!battleAlive(f)||f.overflowUsed||!overflowReady(f))return false;
 empClearSlot(f,0);empClearSlot(f,1);f.emp.ofLeft=6;f.emp.ofTick=0;
 empEquip(f,0,'time',6,true);empEquip(f,1,'beams',6,true);f.overflowUsed=true;f.overflowQueued=false;f.overflowName='帝国の収穫祭';f.skillLock=.5;
 cutin(f,'帝国の収穫祭','#f3c477',true);$('cutname').textContent='EMPRESS / OVERFLOW';playSE('ultimate-impact',f);log('帝国の収穫祭：触手＋微加速＋十種の光線 / 3能力・6秒間');return true;
}
function empAttackFactor(f){return empHas(f,'body')?1.45:1}
function empMotorFactor(f){return (empHas(f,'body')?1.2:1)*(empHas(f,'time')?1.2:1)*(empHas(f,'wings')?1.4:1)}
function empRecoveryFactor(f){return (empHas(f,'time')?1.35:1)*(empHas(f,'body')?1.15:1)*(f.diseaseTime>0?.8:1)}
function empDefenseFactor(f){return (empHas(f,'armor')?.58:1)*(empHas(f,'body')?.85:1)}
function empElementFactor(f,source,type){return empHas(f,'element')&&(type==='thermal'||[1,19,21].includes(source?.char))?.65:1}
function drawEmpUnit(v){
 ctx.save();ctx.translate(v.x,v.y);ctx.strokeStyle='#ebbd72';ctx.fillStyle='#654c3b';ctx.globalAlpha=Math.min(1,v.life/.4);
 if(v.empKind==='clone'){ctx.globalAlpha*=.55;ctx.drawImage(sprites[EMPRESS_ID],-46,-109,92,138)}
 else if(v.empKind==='guns'){ctx.fillRect(-20,-30,40,30);ctx.strokeRect(-20,-30,40,30);ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,-20);const target=fighters[1-v.owner],aim=Math.atan2(target.y-v.y,target.x-v.x);ctx.lineTo(Math.cos(aim)*38,-20+Math.sin(aim)*38);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(-28,25);ctx.moveTo(15,0);ctx.lineTo(28,25);ctx.stroke()}
 else{ctx.beginPath();ctx.ellipse(0,-25,30,32,0,0,7);ctx.fill();ctx.stroke();for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*20,-45);ctx.lineTo(side*35,-70);ctx.lineTo(side*8,-52);ctx.stroke()}ctx.fillStyle='#ffd9aa';ctx.fillRect(-14,-35,8,4);ctx.fillRect(6,-35,8,4)}
 ctx.globalAlpha=1;const bar=v.empKind==='clone'?-125:v.empKind==='guns'?-68:-90;ctx.fillStyle='#2a2630';ctx.fillRect(-28,bar,56,4);ctx.fillStyle='#ebbd72';ctx.fillRect(-28,bar,56*Math.max(0,v.hp/v.maxHp),4);ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(v.empKind==='clone'?'不完全な分身':v.empKind==='guns'?'機銃':'生成生物',0,bar-7);ctx.restore();
}
function drawEmpressAura(f){
 if(f.char!==EMPRESS_ID||f.summon)return;ctx.save();ctx.strokeStyle='#f1cf8a';ctx.fillStyle='#f1cf8a';ctx.lineWidth=2;
 if(empHas(f,'ghost'))ctx.globalAlpha=.45;
 if(empHas(f,'armor')){ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(0,-35,59,82,0,0,7);ctx.stroke()}
 if(empHas(f,'reflect')){ctx.save();ctx.rotate(elapsed*.35);for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.strokeRect(Math.cos(a)*66-8,Math.sin(a)*65-38,16,24)}ctx.restore()}
 if(empHas(f,'wings')){for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*20,-65);ctx.bezierCurveTo(side*80,-145,side*125,-85,side*65,-10);ctx.lineTo(side*45,-45);ctx.closePath();ctx.stroke()}}
 if(empHas(f,'body')||empHas(f,'time')){ctx.setLineDash([6,7]);ctx.beginPath();ctx.ellipse(0,-30,65,90,elapsed*.3,0,7);ctx.stroke();ctx.setLineDash([])}
 if(empHas(f,'sense')){ctx.beginPath();ctx.ellipse(0,-100,21,9,0,0,7);ctx.stroke();ctx.beginPath();ctx.arc(0,-100,4,0,7);ctx.fill()}
 if(f.emp.ofLeft>0){ctx.globalAlpha=.85;for(let n=0;n<10;n++){const a=Math.PI+n*Math.PI/9,x=Math.cos(a)*85,y=-70+Math.sin(a)*70;ctx.strokeStyle=EMPRESS_BEAM_COLORS[n];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,9,14,-a,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke()}}
 ctx.globalAlpha=1;ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(f.emp.ofLeft>0?'帝国の収穫祭 '+f.emp.ofLeft.toFixed(1)+'s':'EMPRESS · SS',0,-143);ctx.restore();
}
function drawEmpressFields(){
 for(const f of fighters)if(f.char===EMPRESS_ID&&f.emp)for(const slot of f.emp.slots)if(slot?.key==='flowers'){
  ctx.save();ctx.strokeStyle='#e8b7cb';ctx.fillStyle='#d398b4';ctx.globalAlpha=.16;ctx.beginPath();ctx.ellipse(slot.x,slot.y-20,180,110,0,0,7);ctx.fill();ctx.globalAlpha=.7;for(let n=0;n<12;n++){const a=n*2.4,x=slot.x+Math.cos(a)*150,y=slot.y-20+Math.sin(a)*80;ctx.beginPath();ctx.arc(x,y,5+n%3,0,7);ctx.fill()}ctx.restore();
 }
}
function drawEmpVisual(q,p){
 ctx.save();ctx.shadowBlur=0;ctx.strokeStyle=q.c;ctx.fillStyle=q.c;ctx.lineWidth=3;ctx.lineCap='round';
 if(q.style==='ray'){ctx.lineWidth=q.r*(1-p)+1;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.tx,q.ty);ctx.stroke();ctx.strokeStyle='#fff7de';ctx.lineWidth=2;ctx.stroke()}
 else if(q.style==='fracture'){ctx.translate(q.tx,q.ty);for(let n=0;n<8;n++){const a=n*Math.PI/4,r=20+p*85;ctx.beginPath();ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12);ctx.lineTo(Math.cos(a+.12)*r,Math.sin(a+.12)*r);ctx.stroke()}}
 else{ctx.translate(q.x,q.y);const r=q.r*(q.style==='wave'?.2+p:.75+p*.3);ctx.beginPath();for(let n=0;n<6;n++){const a=n*Math.PI/3-Math.PI/6;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.stroke();if(q.style==='stop'){ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-10,-18);ctx.lineTo(-10,18);ctx.moveTo(10,-18);ctx.lineTo(10,18);ctx.stroke()}}
 ctx.restore();
}
let empressPreviousOpponent=1;
function syncEmpressChallengeUI(){const active=selected[1]===EMPRESS_ID,button=$('empress-challenge');button.textContent=active?'通常対戦に戻す':'特別対戦：エンプレス SS';button.setAttribute('aria-pressed',String(active))}
function toggleEmpressChallenge(){
 if(selected[1]===EMPRESS_ID)selected[1]=roster[empressPreviousOpponent]&&!roster[empressPreviousOpponent].special?empressPreviousOpponent:1;
 else{empressPreviousOpponent=selected[1];selected[1]=EMPRESS_ID}
 reset();
}
