const {run,assert,reseed}=require('./arena-harness.cjs');
run('loaded=true;selected=[TAS_ID,0];start()');
assert(run('roster[TAS_ID].special&&roster[TAS_ID].hidden&&roster[TAS_ID].tier==="S"'));
assert(run('JSON.stringify(skills[TAS_ID])===JSON.stringify(skills[0])&&roster[TAS_ID].speed===roster[0].speed'));
assert(run('fighters[0].maxHp>fighters[1].maxHp&&attackScale(fighters[0])>attackScale(fighters[1])&&stoneDefense(fighters[0])<stoneDefense(fighters[1])'));
// Routing and voluntary movement must exactly match Plus under the same inputs.
const positions=[];
for(const char of [0,49]){
 reseed(300);run('selected=['+char+',1];start();fighters[0].turn=0');
 run('for(let n=0;n<30;n++)moveFighter(fighters[0],fighters[1],.02)');
 positions.push(run('JSON.stringify([fighters[0].x,fighters[0].y,fighters[0].mx,fighters[0].my])'));
}
assert.equal(positions[0],positions[1]);
run('selected=[TAS_ID,0];start();fighters[0].x=250;fighters[0].y=400;fighters[1].x=300;fighters[1].y=400;globalThis.before=fighters[1].hp;tickTas(fighters[0],3)');
assert(run('fighters[1].hp<before&&fx.some(q=>q.kind==="tasTentacle")'));
run('globalThis.before=fighters[1].hp;tickTas(fighters[0],.1)');assert(run('fighters[1].hp===before'));
// Each inherited skill still casts, consumes its original CT, and adds tentacle follow-up.
for(let i=0;i<3;i++){
 run('reset();running=true;cast(fighters[0],'+i+')');
 assert(run('fighters[0].cds['+i+']===skills[0]['+i+'].cd&&events.some(e=>e.at>=.42)'));
}
// Check the OF base damage multiplier independently of stronger character stats.
run('reset();running=true;fighters[0].hp=540;beginOverflow(0);globalThis.realHit=hit;globalThis.damageCalls=[];hit=(target,damage)=>{damageCalls.push(damage);return true};overflow.t=2.4;tickCrowdOverflow(overflow,0);hit=realHit');
assert(run('fighters[0].overflowName==="120%ブラックホール"&&overflow.kind==="blackhole"&&overflow.power===1.2'));
assert.equal(run('JSON.stringify(damageCalls)'),JSON.stringify([44.2*1.2,44.2*1.2,44.2*1.2,338*1.2]));
run('teamMode=true;teamDraft=[[49,null,0],[1,2,null]];start();fighters[0].hp=0;finish();tickRelayTransition(1.1)');assert(run('running&&fighters[0].char===0'));
run('teamDraft=[[0,49,null],[1,null,null]];start();fighters[0].hp=0;finish();tickRelayTransition(1.1)');assert(run('fighters[0].char===TAS_ID&&fighters[0].tasTentacleCd===2.5'));
for(let n=0;n<300;n++){
 run('teamMode=false;randomizeFighters()');assert(run('selected.every(id=>id!==TAS_ID&&id!==EMPRESS_ID)'));
 run('teamMode=true;teamDraft=[[49,0,null],[48,1,2]];randomizeFighters()');assert(run('teamDraft.flat().filter(id=>id!==null).every(id=>id!==TAS_ID&&id!==EMPRESS_ID)&&new Set(teamDraft.flat().filter(id=>id!==null)).size===5'));
}
// Manual controls retain all four actions and the hidden fighter can finish relay matches.
run('teamMode=false;selected=[TAS_ID,0];start();manualMode=true;fighters[0].cds=[0,0,0];fighters[0].skillLock=0');
assert(run('useManualSkill(0)'));run('fighters[0].skillLock=0');assert(run('useManualSkill(1)'));run('fighters[0].skillLock=0');assert(run('useManualSkill(2)'));
run('fighters[0].hp=fighters[0].maxHp*.3;fighters[0].skillLock=0');assert(run('useManualSkill(3)&&fighters[0].overflowQueued'));run('step(.01)');assert(run('overflow?.name==="120%ブラックホール"')); 
for(const teams of ['[[49,47,0],[48,49,37]]','[[49,49,49],[49,49,49]]']){
 run('manualMode=false;teamMode=true;teamDraft='+teams+';start();globalThis.ticks=0;while((running||relayPending)&&ticks++<30000){if(relayPending)tickRelayTransition(1.1);else step(.02)}');
 assert(run('ticks<30000&&!running&&!relayPending&&fighters.every(f=>Number.isFinite(f.hp))'));
}
console.log('PASS: Tas stats, Plus movement and all three skills, tentacle cooldown, 120% OF damage, relay entry, random exclusions');
