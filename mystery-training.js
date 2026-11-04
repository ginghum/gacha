'use strict';
const TRAINING_KNIGHT_ID=50;
let mysterySkill=-1;
const TRAINING_KNIGHT_SKILLS=[0,1,2].map(()=>({name:'攻撃なし',cd:1}));
const TRAINING_KNIGHT_PROFILE={key:'training-knight',name:'練習用騎士',grade:null,special:true,training:true,maxHp:5000,code:'TRAINING KNIGHT',ability:'走り回る練習相手 / HP5000',color:'#a8cbd9',attack:0,defense:1,speed:1.12,overflow:false,passiveLabel:'走行訓練 / OFなし',overflowText:'走行訓練',overflowDesc:'HP5000の練習相手。フィールドを走り回り、攻撃は行わない。',descs:['走り回る練習相手。','攻撃や技は使用しない。','HP5000。']};
const TRAINING_KNIGHT_SVG=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480" viewBox="0 0 320 480">
<defs><linearGradient id="plate" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#526575"/><stop offset=".45" stop-color="#c9dde5"/><stop offset=".65" stop-color="#a5b9c6"/><stop offset="1" stop-color="#536776"/></linearGradient><linearGradient id="dark" x2="1" y2="1"><stop stop-color="#354b60"/><stop offset="1" stop-color="#172d42"/></linearGradient></defs>
<g stroke="#243b50" stroke-width="4" stroke-linejoin="round">
<path d="M104 129 Q74 184 92 331 L150 363 173 350 228 330 Q240 220 213 134Z" fill="url(#dark)"/>
<path d="M118 303 155 308 147 393 139 437 107 438 111 383Z" fill="url(#plate)"/><path d="M167 307 204 303 210 385 218 437 183 440 172 391Z" fill="url(#plate)"/>
<path d="M111 376 145 380 142 397 108 395Z M175 380 209 376 212 395 178 398Z" fill="#819dad"/>
<path d="M105 425 141 427 142 451 Q112 461 82 451 L84 440Z M184 427 217 424 239 441 240 453 Q211 461 184 451Z" fill="url(#dark)"/>
<path d="M113 141 Q91 129 78 147 L68 194 82 239 104 230 99 194 121 170Z M207 141 Q228 129 241 147 L253 193 240 239 216 230 223 191 199 170Z" fill="url(#plate)"/>
<path d="M82 224 105 228 108 265 96 284 79 275 72 249Z M217 228 240 224 250 249 242 276 225 284 213 264Z" fill="url(#plate)"/>
<path d="M105 128 137 115 185 115 218 129 211 220 192 250 130 250 109 219Z" fill="url(#plate)"/>
<path d="M160 135 136 159 139 197 160 217 183 198 187 159Z" fill="#526f87"/><path d="M160 151 149 168 160 185 172 168Z" fill="#b9eff4" stroke="#d5f6f4" stroke-width="2"/>
<path d="M111 216 210 216 209 237 114 237Z" fill="#5b4a3e"/><rect x="149" y="216" width="25" height="22" rx="3" fill="#d4be85"/>
<path d="M113 237 159 245 157 296 107 292 102 270Z M164 245 210 237 220 273 211 295 164 297Z" fill="url(#plate)"/>
<path d="M80 146 104 125 128 131 120 161 93 174 72 163Z M194 130 218 125 243 145 251 163 227 174 201 160Z" fill="url(#plate)"/>
<path d="M139 109 184 109 195 131 178 148 143 145 129 130Z" fill="url(#dark)"/>
<path d="M126 47 Q160 26 195 48 L205 91 196 123 161 141 128 122 117 91Z" fill="url(#plate)"/>
<path d="M122 73 200 73 203 87 162 101 119 87Z" fill="#152b3b"/>
<path d="M134 83 153 86 M170 86 190 81" fill="none" stroke="#8bd9e8" stroke-width="3"/>
<path d="M160 49 163 135 M136 108 146 112 M179 112 188 108" fill="none" stroke="#526a7d" stroke-width="3"/>
<path d="M154 36 Q155 15 174 13 L183 29 168 39Z" fill="#537b96"/>
</g></svg>`;
window.ARENA_IMAGES=window.ARENA_IMAGES||{};
window.ARENA_IMAGES['training-knight']='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(TRAINING_KNIGHT_SVG);
function mysterySkills(f,base){return mysterySkill<0||f.char===TRAINING_KNIGHT_ID?base:base.map((skill,i)=>i===mysterySkill?{...skill,cd:.1}:skill)}
function initMysteryUI(){
 $('mystery-mode').value=String(mysterySkill);
 $('mystery-mode').onchange=e=>{
  const value=Number(e.target.value);if(!Number.isInteger(value)||value< -1||value>2)return;
  mysterySkill=value;reset();
 };
}
