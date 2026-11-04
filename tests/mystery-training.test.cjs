const {run,assert,els,reseed}=require('./arena-harness.cjs');
run('loaded=true');
// All playable fighters use the chosen cooldown; switching off restores base data.
for(let slot=0;slot<3;slot++)for(let char=0;char<50;char++){
 run(`teamMode=false;manualMode=false;mysterySkill=${slot};selected=[${char},TRAINING_KNIGHT_ID];start();elapsed=10;fighters[0].money=100;fighters[0].cds=[0,0,0];fighters[0].skillLock=0`);
 assert.equal(run(`fighterSkills(fighters[0])[${slot}].cd`),.1);
 run(`cast(fighters[0],${slot})`);
 assert.equal(run(`fighters[0].cds[${slot}]`),.1,`char ${char}, slot ${slot}`);
 assert(run('fighters[0].skillLock<=.1'));
}
run('mysterySkill=1;selected=[45,50];start();fighters[0].jekyllHyde=true');assert.equal(run('fighterSkills(fighters[0])[1].cd'),.1);
run('mysterySkill=-1;selected=[0,1];start()');assert.equal(run('fighterSkills(fighters[0])[1].cd'),7.5);assert.equal(run('skills[0][1].cd'),7.5);
// Mode selection resets the match and applies to fresh relay entrants.
run('mysterySkill=-1;selected=[0,1];start()');els['mystery-mode'].onchange({target:{value:'2'}});assert(run('!running&&mysterySkill===2&&fighters.every(f=>f.cds[2]===.1)'));
run('teamMode=true;teamDraft=[[0,45,null],[1,null,null]];start();fighters[0].hp=0;finish();tickRelayTransition(1.1)');assert(run('fighters[0].char===45&&fighters[0].cds[2]===.1&&fighterSkills(fighters[0])[2].cd===.1'));
// Both mode sides can cast repeatedly, and manual controls recover on the fast cooldown.
run('teamMode=false;manualMode=true;mysterySkill=0;selected=[1,50];start();fighters[0].cds[0]=0;globalThis.casts=0');
run('for(let n=0;n<100;n++){if(useManualSkill(0))casts++;step(.02)}');assert(run('casts>=15'),run('casts'));
// A normal attack-capable fighter demonstrates that the knight takes real damage.
run('manualMode=false;mysterySkill=-1;selected=[0,50];start();fighters[0].x=250;fighters[0].y=400;fighters[1].x=350;fighters[1].y=400;hit(fighters[1],100,fighters[0],"#fff")');assert(run('fighters[1].hp<5000'));
// Knights only wander: no skills, OF, shots, or damage, even under brainwashing.
for(const slot of [-1,0,1,2]){
 reseed(44);run(`mysterySkill=${slot};selected=[50,50];start();globalThis.startX=fighters[1].x;globalThis.startY=fighters[1].y;fighters[0].brainwashTime=6;for(let n=0;n<1000;n++)step(.02)`);
 assert(run('fighters.every(f=>f.hp===5000&&!f.overflowUsed)&&shots.length===0&&bombs.length===0&&diamondSoldiers.length===0'));
 assert(run('Math.hypot(fighters[1].x-startX,fighters[1].y-startY)>50'));
 for(let i=0;i<3;i++)assert.equal(run('cast(fighters[0],'+i+')'),false);
 run('manualMode=true');for(let i=0;i<4;i++)assert.equal(run('useManualSkill('+i+')'),false);run('manualMode=false');
}
for(let n=0;n<100;n++){run('teamMode=false;randomizeFighters()');assert(run('selected.every(char=>char!==TRAINING_KNIGHT_ID)'))}
console.log('PASS: three mode variants across all 50 fighters, OFF restoration, mode UI, relay entrants, repeated manual casts, and nonattacking HP5000 roaming knight');
