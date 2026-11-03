'use strict';
const TAS_ID=49;
const TAS_PROFILE={key:'tas',name:'タス',grade:null,tier:'S',hidden:true,special:true,opponentOnly:false,maxHp:1600,code:'ORIGINAL SELF / MASS + TENTACLES',ability:'質量操作＋背中の触手 / 隠しキャラ・S',color:'#efc477',attack:.84,defense:.96,speed:1.05,overflow:true,overflowText:'120%ブラックホール',overflowDesc:'隠しキャラ。ランダム抽選には出現しない。プラスと同じ質量操作・移動・技CTに、基礎攻撃力・耐久力の強化と背中の触手による追撃が加わる。HP30%以下で1戦1回、120%ブラックホールを発動。吸引・圧縮の各ダメージが通常のブラックホールの1.2倍（基礎攻撃力による強化は別途適用）。相手本体・兵士・分身すべてが対象。',descs:['プラスと同じ軽量化ダッシュからの5連打。触手が追撃する。CT5.2秒。','プラスと同じ質量タックル。触手が噛みついて追撃する。CT7.5秒。','プラスと同じスリングショット・パンチ。背中の触手2本が続けて追撃する。CT11秒。']};
function tasTentacleStrike(f,e,damage,side=1){
 if(!running||!battleAlive(f)||!battleAlive(e)||f.petrified>0||f.frozen>0||f.wordStop>0||f.shadowMove>0||empControlBlocked(f)||isSilenced(f)||f.menouSeal>0)return false;
 if(Math.hypot(f.x-e.x,f.y-e.y)>310)return false;
 fx.push({kind:'tasTentacle',x:f.x+side*18,y:f.y-45,tx:e.x,ty:e.y-32,c:'#d89aa4',r:9,life:.4,max:.4,side});
 playSE('tentacle',f);return hit(e,damage,f,'#efc477',.15,false,'plant');
}
function tasSkillTentacles(f,i,e){
 for(let n=0;n<(i===2?2:1);n++)schedule(.42+n*.17,()=>tasTentacleStrike(f,e,18,n%2?-1:1));
}
function tickTas(f,dt){
 if(f.char!==TAS_ID||!running||!battleAlive(f))return;
 f.tasTentacleCd=Math.max(0,f.tasTentacleCd-dt);
 if(f.tasTentacleCd>0||f.overflowQueued||f.brainwashTime>0||f.judgeLure>0||f.lieWait>0||f.resinBind>0||f.mudBind>0||f.grabbedBy>=0||f.grapple)return;
 const e=attackTarget(f);if(Math.hypot(e.x-f.x,e.y-f.y)>310)return;
 if(tasTentacleStrike(f,e,20,f.tasTentacleSide)){f.tasTentacleSide*=-1;f.tasTentacleCd=4.8}else f.tasTentacleCd=.6;
}
function drawTasMouth(x,y,angle,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
 ctx.fillStyle='#562d3c';ctx.strokeStyle='#efb9b0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,13,9,0,0,7);ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff0db';for(let n=-1;n<=1;n++)for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(n*7-3,side*6);ctx.lineTo(n*7+3,side*6);ctx.lineTo(n*7,side*1);ctx.closePath();ctx.fill()}ctx.restore();
}
function drawTasAura(f){
 if(!battleAlive(f))return;ctx.save();ctx.globalAlpha*=.8;ctx.strokeStyle='#b87c88';ctx.lineWidth=5;ctx.lineCap='round';
 for(const side of [-1,1]){const wave=Math.sin(elapsed*2.2+side)*10,x=side*(63+wave*.3),y=-75+wave;ctx.beginPath();ctx.moveTo(side*18,-30);ctx.bezierCurveTo(side*88,-5,side*95,-100,x,y);ctx.stroke();drawTasMouth(x,y,side*.3,.55)}ctx.restore();
}
function drawTasTentacle(q){
 const side=q.side||1;ctx.lineWidth=q.r;ctx.lineCap='round';ctx.strokeStyle='#995e70';ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.bezierCurveTo(q.x+(q.tx-q.x)*.3+side*65,q.y-100,q.x+(q.tx-q.x)*.7-side*45,q.ty+65,q.tx,q.ty);ctx.stroke();
 ctx.lineWidth=3;ctx.strokeStyle='#e3a6b0';ctx.stroke();drawTasMouth(q.tx,q.ty,Math.atan2(q.ty-q.y,q.tx-q.x),1);
}
function drawTasOverflow(o){
 if(fighters[o.owner].char!==TAS_ID)return;
 ctx.save();ctx.globalAlpha=Math.min(1,o.t/.7);ctx.strokeStyle='#f3c981';ctx.lineWidth=2;ctx.setLineDash([9,12]);ctx.beginPath();ctx.ellipse(o.cx,o.cy,176+Math.sin(o.t*8)*10,132,o.t*.5,0,7);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#ffe4a6';ctx.font='bold 21px sans-serif';ctx.textAlign='center';ctx.fillText('120% BLACK HOLE',W/2,160);ctx.restore();
}
