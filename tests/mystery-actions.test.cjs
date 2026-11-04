const {run,assert,reseed}=require('./arena-harness.cjs');
function ready(char,slot){
 run(`loaded=true;teamMode=false;manualMode=true;mysterySkill=${slot};selected=[${char},50];start();elapsed=9;fighters[0].x=170;fighters[0].y=400;fighters[0].prevX=170;fighters[0].prevY=400;fighters[0].cd=Infinity;fighters[0].money=100;fighters[0].cds=[0,0,0];fighters[1].x=400;fighters[1].y=400;fighters[1].prevX=400;fighters[1].prevY=400;fighters[1].frozen=1000;fighters[1].maxHp=fighters[1].hp=100000`);
}
// Repeated attempts may not replace a dash before its hit callback completes.
ready(0,0);run('useManualSkill(0);globalThis.firstDash=fighters[0].dash;step(.02)');
assert.equal(run('cast(fighters[0],0)'),false);assert(run('fighters[0].dash===firstDash'));assert.equal(run('fighterSkills(fighters[0])[0].cd'),.1);
run('for(let n=0;n<60;n++){useManualSkill(0);step(.02)}');assert(run('fighters[1].hp<100000'));
// Delayed dash starts, charged attacks, and multi-stage slashes must all hit.
for(const [char,slot] of [[0,1],[0,2],[2,1],[4,0],[4,2],[15,2],[16,2],[18,2],[36,0],[36,2],[37,0],[41,2],[43,2],[45,0],[46,1],[49,1]]){
 ready(char,slot);if(char===45)run('fighters[0].jekyllHyde=true');reseed(char*5+slot);
 run(`for(let n=0;n<200;n++){useManualSkill(${slot});step(.02)}`);
 assert(run('fighters[1].hp<100000'),`no damage from char ${char}, slot ${slot}`);
}
// Independent projectile bursts remain rapid, with no full-barrage lock.
ready(1,0);run('globalThis.casts=0;for(let n=0;n<100;n++){if(useManualSkill(0))casts++;step(.02)}');assert(run('casts>=15'),run('casts'));
// Clearing a pending action (including relay cleanup) cannot leave a stale lock.
ready(0,1);run('useManualSkill(1);events=[];fighters[0].skillLock=0;fighters[0].cds[1]=0');assert(run('!mysteryActionBusy(fighters[0])&&useManualSkill(1)'));
run('teamMode=true;teamDraft=[[0,null,null],[50,1,null]];start();manualMode=true;fighters[0].cds[1]=0;useManualSkill(1);fighters[1].hp=0;finish();tickRelayTransition(1.1)');assert(run('!mysteryActionBusy(fighters[0])'));
// Empress switching must retain new shots/units until they get an attack judgment.
ready(48,2);run('useManualSkill(2);globalThis.firstToken=fighters[0].emp.slots[1].token');assert.equal(run('useManualSkill(2)'),false);
run('for(let n=0;n<8;n++){useManualSkill(2);step(.02)}');assert(run('fighters[0].emp.slots[1].token===firstToken'));
run('for(let n=0;n<50&&!fighters[0].emp.slots[1].mysteryResolved;n++)step(.02)');assert(run('fighters[0].emp.slots[1].mysteryResolved&&fighters[1].hp<100000'));
assert(run('useManualSkill(2)'));assert(run('fighters[0].emp.slots[1].key==="guns"'));
run('globalThis.gunToken=fighters[0].emp.slots[1].token;globalThis.before=fighters[1].hp;for(let n=0;n<10;n++){useManualSkill(2);step(.02)}');assert(run('fighters[0].emp.slots[1].token===gunToken'));
run('for(let n=0;n<100&&!fighters[0].emp.slots[1].mysteryResolved;n++)step(.02)');assert(run('fighters[0].emp.slots[1].mysteryResolved&&fighters[1].hp<before'));
// Mystery readiness never prevents a manually requested OF interrupt.
ready(0,0);run('useManualSkill(0);fighters[0].hp=450');assert(run('manualSkillReady(fighters[0],3)'));
console.log('PASS: mystery dash and delayed-hit regressions, multi-stage attacks, rapid projectiles, cleanup, Empress shots/units, and OF interrupts');
