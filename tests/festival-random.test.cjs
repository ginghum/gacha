const {run,assert,reseed,els}=require('./arena-harness.cjs');
run('loaded=true');
// Every existing character starts with twice its normal HP, including the knight.
for(let char=0;char<=50;char++){
 run(`ofFestival=false;selected=[${char},50];reset();globalThis.baseHP=fighters[0].maxHp;ofFestival=true;reset()`);
 assert.equal(run('fighters[0].maxHp'),run('baseHP*2'),`HP for char ${char}`);
}
// Each OF, including special automatic OFs, fires at all three festival stages.
for(let char=0;char<=50;char++){
 run(`ofFestival=true;manualMode=false;selected=[${char},50];start();fighters[1].maxHp=fighters[1].hp=10000000`);
 for(let stage=0;stage<3;stage++){
  run(`overflow=null;overflowQueue=[];fighters[0].petrified=0;arenaField=null;fighters[0].hp=fighters[0].maxHp*FESTIVAL_LEVELS[${stage}];beginOverflow(0)`);
  assert.equal(run('fighters[0].festivalCount'),stage+1,`OF stage ${stage}, char ${char}`);
  run('for(let n=0;n<400&&overflow&&running;n++)step(.02)');
  assert(run('running&&fighters[0].hp>0'),`unexpected death char ${char}`);
 }
 assert.equal(run('beginOverflow(0)'),false);
}
// Lethal blows stop at the outstanding thresholds, and healing does not rearm stages.
run('selected=[0,50];start();beginOverflow(0);overflow=null;applyDamageHP(fighters[0],999999,true,fighters[1])');assert.equal(run('fighters[0].hp/fighters[0].maxHp'),.5);
run('fighters[0].overflowQueued=false;beginOverflow(0);overflow=null;applyDamageHP(fighters[0],999999,true,fighters[1])');assert.equal(run('fighters[0].hp/fighters[0].maxHp'),.2);
run('fighters[0].overflowQueued=false;beginOverflow(0);overflow=null;restoreHP(fighters[0],999999,true)');assert.equal(run('fighters[0].festivalCount'),3);assert(!run('festivalReady(fighters[0])'));
run('applyDamageHP(fighters[0],999999,true,fighters[1])');assert.equal(run('fighters[0].hp'),0);
run('selected=[2,50];start();beginOverflow(0)');assert(run('fighters[0].ogreAid===8&&fighters[0].overflowName==="オーガの補助"&&fighters[0].diamondBarrier>0'));
run('selected=[37,50];start();beginOverflow(0);globalThis.before=fighters[0].hp;for(let n=0;n<310;n++)step(.02)');assert(run('running&&fighters[0].hp>=before&&fighters[0].darkStand===0'));
// Judge refreshes the summoned guardian on every festival OF.
run('selected=[32,50];start();fighters[1].maxHp=fighters[1].hp=1000000;globalThis.lastSerial=-1');
for(let stage=0;stage<3;stage++){
 run(`overflow=null;overflowQueue=[];fighters[0].hp=fighters[0].maxHp*FESTIVAL_LEVELS[${stage}];beginOverflow(0);for(let n=0;n<100&&overflow;n++)step(.02)`);
 assert(run('diamondSoldiers.filter(v=>v.jend&&v.owner===0).length===1&&livingJend(0).serial>lastSerial'));run('lastSerial=livingJend(0).serial');
}
// A deterministic six-source draw demonstrates independent HP, skin, skills and OF.
run('ofFestival=false;randomStartPreview=[{hp:9,look:3,skills:[0,1,2],of:13},null];selected=[51,50];reset();randomStartPreview=null');
assert.equal(run('fighters[0].maxHp'),800);assert.equal(run('fighters[0].randomMan.look'),3);assert.equal(run('fighters[0].char'),13);
assert.equal(run('fighterSkills(fighters[0]).map(s=>s.name).join("/")'),run('[skills[0][0].name,skills[1][1].name,skills[2][2].name].join("/")'));
const preview=run('JSON.stringify(fighters[0].randomMan)');run('start()');assert.equal(run('JSON.stringify(fighters[0].randomMan)'),preview);
// All 48 ordinary character skill sets can be borrowed and survive delayed execution.
for(let donor=0;donor<48;donor++)for(let slot=0;slot<3;slot++){
 reseed(donor*3+slot+1);run(`ofFestival=false;mysterySkill=-1;manualMode=true;randomStartPreview=[{hp:0,look:1,skills:[${donor},${donor},${donor}],of:0},null];selected=[51,50];reset();randomStartPreview=null;running=true;elapsed=10;fighters[0].money=100;fighters[0].cd=Infinity;fighters[0].cds=[0,0,0];fighters[0].x=200;fighters[0].y=400;fighters[1].x=350;fighters[1].y=400;fighters[1].frozen=100;fighters[1].maxHp=fighters[1].hp=100000;useManualSkill(${slot});for(let n=0;n<100&&running;n++)step(.02)`);
 assert(run('fighters.every(f=>Number.isFinite(f.hp)&&Number.isFinite(f.x)&&Number.isFinite(f.y))'),`borrowed ${donor}/${slot}`);
}
// Shared borrowed resources affect the carrier rather than a detached copy.
run('ofFestival=false;randomStartPreview=[{hp:0,look:1,skills:[15,34,46],of:0},null];selected=[51,50];reset();randomStartPreview=null;running=true;elapsed=10;fighters[0].money=100;globalThis.baseAttack=attackScale(fighters[0]);cast(fighters[0],0);fighters[0].dash=null;events=[];fighters[0].skillLock=0;cast(fighters[0],1);fighters[0].dash=null;events=[];fighters[0].skillLock=0;cast(fighters[0],2)');
assert(run('fighters[0].strength===1&&fighters[0].hatTempo===1&&fighters[0].moneyEaten===100&&attackScale(fighters[0])>baseAttack'));
// Every native OF is usable by Random Man with its native activation behavior.
for(const donor of run('roster.map((r,i)=>i<48&&r.overflow?i:-1).filter(i=>i>=0)')){
 run(`ofFestival=true;manualMode=false;randomStartPreview=[{hp:0,look:1,skills:[0,1,2],of:${donor}},null];selected=[51,50];reset();randomStartPreview=null;running=true;fighters[1].maxHp=fighters[1].hp=100000;beginOverflow(0);for(let n=0;n<400&&overflow&&running;n++)step(.02)`);
 assert(run('fighters[0].festivalCount===1&&fighters[0].overflowUsed&&running'),`borrowed OF ${donor}`);
}
// Borrowed Ultimate Flow accelerates a foreign third skill without canceling its dash.
run('ofFestival=true;mysterySkill=-1;manualMode=true;randomStartPreview=[{hp:0,look:1,skills:[0,1,0],of:47},null];selected=[51,50];reset();randomStartPreview=null;running=true;beginOverflow(0);fighters[0].cd=Infinity;fighters[0].cds[2]=0;fighters[0].x=200;fighters[0].y=400;fighters[1].x=350;fighters[1].y=400;fighters[1].frozen=100;fighters[1].festivalCount=3;fighters[1].maxHp=fighters[1].hp=100000;useManualSkill(2)');
assert(run('fighters[0].cds[2]===.1&&fighters[0].skillLock<=.1'));
run('for(let n=0;n<100;n++){useManualSkill(2);step(.02)}');assert(run('fighters[1].hp<100000'));
// Combined modes and relay entrants preserve doubled random HP and fast borrowed CTs.
run('ofFestival=true;mysterySkill=1;teamMode=true;teamDraft=[[0,51,null],[50,50,null]];start();fighters[0].festivalCount=3;fighters[0].hp=0;finish();tickRelayTransition(1.1)');
assert(run('!!fighters[0].randomMan&&fighters[0].maxHp===fighters[0].arenaBaseMaxHp*2&&fighterSkills(fighters[0])[1].cd===.1'));
run('ofFestival=false;teamMode=false;mysterySkill=-1;selected=[0,1];reset()');assert.equal(run('fighters[0].maxHp'),1500);
console.log('PASS: doubled HP, three festival OF stages across all characters, Ogre aid, lethal thresholds, healing, Dark wings, independent Random Man loadouts, all borrowed skills/OFs, preview, relay and combined modes');
