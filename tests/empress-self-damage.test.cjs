const {run,assert,reseed}=require('./arena-harness.cjs');
function startPair(other){run('loaded=true;teamMode=false;selected=[EMPRESS_ID,'+other+'];start()')}
startPair(8);
run('reflectDamage(fighters[1],fighters[0],1000)');
assert.equal(run('fighters[0].maxHp-fighters[0].hp'),60);assert.equal(run('fighters[1].totalReflected'),60);
assert(run('labels.some(l=>l.text==="反射 −60")'));
startPair(8);run('fighters[1].reflectBoost=4;reflectDamage(fighters[1],fighters[0],1000)');assert.equal(run('fighters[0].maxHp-fighters[0].hp'),130);
startPair(25);run('fighters[1].riftMirror=7;interceptTransfer(fighters[1],fighters[0],300,false,"direct")');
assert.equal(run('fighters[0].maxHp-fighters[0].hp'),60);assert.equal(run('fighters[1].totalReflected'),60);assert(run('labels.some(l=>l.text==="転移反射 −60")'));
// A normal enemy attack uses the same damage roll, with or without brainwashing.
for(const washed of [false,true]){
 startPair(43);run('fighters[0].brainwashTime='+(washed?6:0));reseed(7);
 run('globalThis.before=fighters[0].hp;hit(fighters[0],100,fighters[1],"#fff")');
 const ordinary=run('before-fighters[0].hp');assert(ordinary>50);
}
// Menou redirects the caster's own skill; apply the resistance once after normal damage scaling.
let normal,self;
startPair(43);reseed(20);run('globalThis.before=fighters[0].hp;hit(fighters[0],100,fighters[0],"#fff")');normal=run('before-fighters[0].hp');
startPair(43);reseed(20);run('fighters[0].brainwashTime=6;globalThis.before=fighters[0].hp;withSelfSkill(0,()=>hit(fighters[1],100,fighters[0],"#fff"))');self=run('before-fighters[0].hp');
assert.equal(self,normal);assert(run('fighters[1].hp===fighters[1].maxHp'));assert(self<35);
// Compare to the same self-inflicted hit with only the resistance disabled.
startPair(43);reseed(20);run('globalThis.savedFactor=empSelfDamageFactor;empSelfDamageFactor=()=>1;globalThis.before=fighters[0].hp;hit(fighters[0],100,fighters[0],"#fff");empSelfDamageFactor=savedFactor');
assert.equal(self,Math.round(run('before-fighters[0].hp')*.2));
// Regular characters retain their original reflection damage.
run('selected=[0,8];start();reflectDamage(fighters[1],fighters[0],1000)');assert.equal(run('fighters[0].maxHp-fighters[0].hp'),300);
// A different Empress is still an enemy; identical character IDs do not imply ownership.
startPair(48);run('globalThis.before=fighters[0].hp;applyDamageHP(fighters[0],100,true,fighters[1])');assert.equal(run('before-fighters[0].hp'),100);
// A reflected projectile retains its original caster after changing ownership.
startPair(48);run('empEquip(fighters[0],1,"beams");empEquip(fighters[1],0,"reflect");empShot(fighters[0],fighters[1],1,100);globalThis.shot=shots[0];empInterceptShot(fighters[1],shot)');
assert(run('shot.owner===1&&shot.damageOrigin===fighters[0]'));
run('globalThis.before=fighters[0].hp;applyDamageHP(fighters[0],100,true,fighters[1],shot.damageOrigin)');assert.equal(run('before-fighters[0].hp'),20);
const fs=require('fs'),path=require('path');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert.equal((html.match(/タス\/質量操作\+触手/g)||[]).length,8);
console.log('PASS: Empress own-damage resistance for reflection, transfer, brainwashing, and reflected shots; normal enemy damage unchanged; Tas labels updated');
