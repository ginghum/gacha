const {run,assert,els,reseed}=require('./arena-harness.cjs');
run('loaded=true;teamMode=true;teamDraft=[[0,2,3],[1,4,null]];start()');
assert.equal(run('relayBattle.teams[1].length'),2);
run('fighters[0].hp=723;fighters[0].cds=[5,6,7];fighters[0].overflowUsed=true;fighters[0].strength=4;fighters[0].moneyEaten=9;fighters[0].burn=3;fighters[1].hp=0;globalThis.saved=fighters[0];finish()');
assert(run('!!relayPending&&!running'));
run('tickRelayTransition(.9)');assert.equal(run('fighters[1].char'),1);
run('tickRelayTransition(.11)');assert(run('running&&fighters[0]===saved'));assert.equal(run('fighters[0].hp'),723);assert.equal(run('fighters[0].cds.join()'),'5,6,7');assert(run('fighters[0].overflowUsed&&fighters[0].strength===4&&fighters[0].moneyEaten===9&&fighters[0].burn===3'));assert.equal(run('fighters[1].char'),4);assert.equal(run('fighters[1].hp===fighters[1].maxHp'),true);
run('fighters[1].hp=0;finish()');assert(run('!running&&!relayPending&&winnerId===0'));
// Empty slots are skipped, all-empty sides cannot start.
run('teamDraft=[[null,47,null],[null,null,48]];start()');assert.equal(run('fighters[0].char'),47);assert.equal(run('fighters[1].char'),48);assert.equal(run('fighters[1].maxHp'),1500);
run('teamDraft=[[null,null,null],[1,2,null]];start()');assert(run('!running&&relayBattle.invalid'));assert(els.start.disabled);
run('teamMode=false;reset()');assert(!els.start.disabled);assert(run('!relayBattle&&!relayPending'));
// Fresh entrant clocks are relative to entry, survivor clocks are untouched.
run('teamMode=true;teamDraft=[[0,47,30],[1,null,null]];start();elapsed=40;fighters[0].hp=0;finish();tickRelayTransition(1.1)');assert(run('fighters[0].char===47&&itoguchiLocked(fighters[0])'));assert.equal(run('fighters[0].enteredAt'),40);run('elapsed=48.01');assert(!run('itoguchiLocked(fighters[0])'));
run('fighters[0].hp=0;finish();tickRelayTransition(1.1)');assert.equal(run('fighters[0].tanakaNextReset'),55.01);
// Double KO, both reserves; one reserve; no reserve.
for(const teams of ['[[0,2,null],[1,3,null]]','[[0,null,null],[1,3,null]]','[[0,null,null],[1,null,null]]']){
 run(`teamDraft=${teams};start();fighters.forEach(f=>f.hp=0);finish();if(relayPending)tickRelayTransition(1.1)`);
 if(teams.includes('[0,2'))assert(run('running&&fighters[0].char===2&&fighters[1].char===3'));
 else if(teams.includes('[1,3'))assert(run('!running&&winnerId===1'));
 else assert(run('!running&&winnerId===-1'));
}
run('teamDraft=[[0,null,2],[1,3,null]];start();fighters[0].hp=0;finish();reset();tickRelayTransition(2)');assert(run('!running&&!relayPending&&fighters[0].char===0'));
run('randomizeFighters(0)');assert(run('teamDraft[0][1]===null&&teamDraft[0].filter(v=>v!==null).length===2'));
run('toggleEmpressChallenge()');assert(run('teamDraft[1][0]===48&&teamDraft[1][1]===null'));run('toggleEmpressChallenge()');assert(run('teamDraft[1][1]===3'));
// Random teams draw without replacement across both sides and skip Empress.
for(let trial=0;trial<300;trial++){
 run('teamDraft=[[0,0,48],[48,1,1]];randomizeFighters()');
 assert(run('new Set(teamDraft.flat()).size===6&&teamDraft.flat().every(char=>char!==EMPRESS_ID)'));
}
for(const side of [0,1])for(let trial=0;trial<100;trial++){
 run('teamDraft=[[0,null,2],[3,4,null]]');
 const other=run('JSON.stringify(teamDraft['+(1-side)+'])');
 run('randomizeFighters('+side+')');
 assert.equal(run('JSON.stringify(teamDraft['+(1-side)+'])'),other);
 assert(run('new Set(teamDraft.flat().filter(char=>char!==null)).size===4&&teamDraft.flat().filter(char=>char!==null).every(char=>char!==EMPRESS_ID)'));
 assert(run('teamDraft[0][1]===null&&teamDraft[1][2]===null'));
}
// Full simulations cover KO paths, transformations, revivals, and automatic OF.
for(let n=0;n<20;n++){
 reseed(n+100);run(`teamMode=true;teamDraft=[[${n%49},${(n*3+37)%49},47],[${(n*7+48)%49},${(n*5+32)%49},45]];start()`);
 let ticks=0,swaps=0;
 while(run('running||!!relayPending')&&ticks++<40000){
  if(run('!!relayPending')){swaps++;run('tickRelayTransition(1.1)')}
  else run('step(.02)');
  assert(run('fighters.every(f=>Number.isFinite(f.hp)&&Number.isFinite(f.x)&&Number.isFinite(f.y))'));
 }
 assert(ticks<40000,`match ${n} timed out`);
 console.log(`match ${n}: ${ticks} ticks, ${swaps} replacement breaks`);
}
console.log('PASS: relay retention, 3v2, empty slots, validation, fresh timers, double KO, reset cancellation, random, Empress, 20 full matches');
