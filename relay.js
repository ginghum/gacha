'use strict';
// The simulation always has two actors. Teams supply replacements only after a KO.
let teamMode=false,teamDraft=[[0,2,3],[1,4,5]],relayBattle=null,relayPending=null,relayEmpressBackup=null;
function initRelayUI(){
 $('relay-toggle').onclick=()=>{
  teamMode=!teamMode;
  if(teamMode){teamDraft[0][0]=selected[0];teamDraft[1][0]=selected[1]}
  $('relay-toggle').textContent='3on3 勝ち抜き '+(teamMode?'ON':'OFF');
  $('relay-toggle').setAttribute('aria-pressed',String(teamMode));
  $('relay-editor').hidden=!teamMode;$('solo-selection').hidden=teamMode;$('relay-score').hidden=!teamMode;
  syncRelayEditor();reset();
 };
 for(let side=0;side<2;side++)for(let slot=0;slot<3;slot++){
  $('relay-select'+side+slot).onchange=e=>{
   const value=e.target.value,char=value===''?null:Number(value);
   if(char!==null&&(!Number.isInteger(char)||!roster[char]||roster[char].opponentOnly))return;
   teamDraft[side][slot]=char;relayEmpressBackup=null;reset();
  };
 }
 syncRelayEditor();
}
function syncRelayEditor(){for(let side=0;side<2;side++)for(let slot=0;slot<3;slot++)$('relay-select'+side+slot).value=teamDraft[side][slot]===null?'':String(teamDraft[side][slot])}
function prepareRelayReset(){
 relayPending=null;relayBattle=null;$('start').disabled=!loaded;
 if(!teamMode)return;
 const teams=teamDraft.map(team=>team.filter(char=>char!==null&&roster[char]&&!roster[char].opponentOnly));
 relayBattle={teams,at:[0,0],active:false,invalid:teams.some(team=>!team.length)};
 selected=teams.map((team,id)=>team[0]??id);
}
function renderRelayHUD(){
 $('relay-score').hidden=!teamMode;if(!teamMode||!relayBattle)return;
 $('relay-score').innerHTML=teamDraft.map((team,side)=>{
  let index=-1;const current=relayBattle.at[side];
  return '<div class="relay-line"><strong>P'+(side+1)+' <small>'+relayBattle.teams[side].length+'人</small></strong>'+team.map((char,slot)=>{
   if(char===null)return '<div class="relay-member empty"><small>'+['先鋒','次鋒','大将'][slot]+'</small><span>空欄</span></div>';
   index++;const dead=index<current||(index===current&&relayBattle.started&&!battleAlive(fighters[side]));
   const active=index===current&&!dead,state=dead?'敗退':active?'出場中':'待機';
   return '<div class="relay-member '+(dead?'defeated':active?'active':'waiting')+'"><img src="'+imgs[char].src+'" alt=""><div><small>'+['先鋒','次鋒','大将'][slot]+' · '+state+'</small><span>'+roster[char].name+'</span></div></div>';
  }).join('')+'</div>';
 }).join('');
}
function randomizeRelay(side){
 if(!loaded)return false;
 const sides=side===0||side===1?[side]:[0,1];
 const used=new Set(teamDraft.flatMap((team,id)=>sides.includes(id)?[]:team.filter(char=>char!==null)));
 const pool=roster.map((r,i)=>i===EMPRESS_ID||r.special||r.opponentOnly||used.has(i)?-1:i).filter(i=>i>=0);
 for(const id of sides)teamDraft[id]=teamDraft[id].map(char=>{
  if(char===null)return null;
  return pool.splice(Math.floor(Math.random()*pool.length),1)[0];
 });
 relayEmpressBackup=null;syncRelayEditor();reset();return true;
}
function toggleRelayEmpress(){
 if(relayEmpressBackup){teamDraft[1]=relayEmpressBackup;relayEmpressBackup=null}
 else{relayEmpressBackup=teamDraft[1].slice();teamDraft[1]=[EMPRESS_ID,null,null]}
 syncRelayEditor();reset();
}
function clearDefeatedWorld(dead){
 const ids=new Set(dead.map(f=>f.id));
 for(const f of dead)if(f.char===EMPRESS_ID&&f.emp){empClearSlot(f,0);empClearSlot(f,1)}
 shots=shots.filter(o=>!ids.has(o.owner));bombs=bombs.filter(o=>!ids.has(o.owner));pools=pools.filter(o=>!ids.has(o.owner));
 thunderStorms=thunderStorms.filter(o=>!ids.has(o.owner));lightningZones=lightningZones.filter(o=>!ids.has(o.owner));
 diamondSoldiers=diamondSoldiers.filter(o=>!ids.has(o.owner));illusions=illusions.filter(o=>!ids.has(o.owner));
 if(arenaField&&ids.has(arenaField.owner))arenaField=null;if(stoneField&&ids.has(stoneField.owner))stoneField=null;
}
function handleRelayKO(){
 if(!teamMode||!relayBattle?.active)return false;
 if(relayPending)return true;
 const dead=fighters.filter(f=>!battleAlive(f));if(!dead.length)return false;
 const advancing=dead.filter(f=>relayBattle.at[f.id]+1<relayBattle.teams[f.id].length);
 if(!advancing.length){
  relayBattle.active=false;renderRelayHUD();
  if(dead.length===2){finishRelayDraw();return true}
  return false;
 }
 // Stop the current step before replacing objects captured by skills/cinematics.
 running=false;clearManualInput();battleToken++;events=[];overflow=null;ultimateFocus=null;
 overflowQueue=overflowQueue.filter(id=>!dead.some(f=>f.id===id));
 for(const f of fighters){releaseGrip(f);f.dash=null;f.iceDash=null;f.windup=0;f.follow=0;f.vx=f.vy=f.mx=f.my=0;f.illusionTarget=null;f.blindAim=null}
 clearDefeatedWorld(dead);
 relayPending={left:1,ids:advancing.map(f=>f.id)};
 $('status').textContent='NEXT FIGHTER';
 for(const f of dead)log(nameOf(f)+'（P'+(f.id+1)+'）が敗退');
 call('次の選手が入場','#efe2ad');renderRelayHUD();updateManualHUD();
 return true;
}
function tickRelayTransition(dt){
 if(!relayPending)return;relayPending.left-=dt;if(relayPending.left>0)return;
 const ids=relayPending.ids;relayPending=null;events=[];
 for(const id of ids){
  relayBattle.at[id]++;const char=relayBattle.teams[id][relayBattle.at[id]];
  selected[id]=char;const f=createFighter(id,char),enemy=fighters[1-id];
  if(char!==47){
   const points=[[150,220],[490,540],[150,540],[490,220]];
   points.sort((a,b)=>Math.hypot(b[0]-enemy.x,b[1]-enemy.y)-Math.hypot(a[0]-enemy.x,a[1]-enemy.y));
   [f.x,f.y]=points[0];f.prevX=f.x;f.prevY=f.y;
  }
  fighters[id]=f;log(nameOf(f)+'（P'+(id+1)+'）が入場！');ring(f.x,f.y-25,roster[char].color,65,'renew',.8);
 }
 renderMatchup();renderRelayHUD();running=true;$('status').textContent='FIGHTING';updateHUD();
 if(fighters.some(f=>!battleAlive(f)))finish();else{call('BATTLE CONTINUE','#efe2ad');playSE('start')}
}
function finishRelayDraw(){
 battleToken++;running=false;winnerId=-1;events=[];overflow=null;overflowQueue=[];ultimateFocus=null;clearManualInput();
 $('pause').disabled=true;$('status').textContent='DRAW';$('overlay').hidden=false;
 $('overlay').querySelector('h2').textContent='DRAW / 両チーム全員敗退';
 $('message').textContent='両チームが同時に全員倒れました。';$('start').innerHTML='もう一度対戦 <span>↻</span>';log('両チーム全員敗退・引き分け');
}
