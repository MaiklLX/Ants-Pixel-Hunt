import {RASTER_ARTWORK} from "./artwork-data.js";

export const SIZE=35;
export const GRID_SIZE=450;
export const BLOCK_SIZE=GRID_SIZE/SIZE;
export const BOX_CAPACITY=30;
export const SLOT_COUNT=5;
export const TRAY_SIZE=3;
export const LOCKED_BOX_INDEX=8;
export const LOCKED_BOX_COLUMN=2;
export const LINKED_BOX_START=12;
export const COLORS={
 black:{hex:"#171b1a",name:"Чёрные контуры",short:"ЧР"},
 forest:{hex:"#315b3d",name:"Хвойные",short:"ХВ"},
 green:{hex:"#4f8a50",name:"Листовые",short:"ЛС"},
 lime:{hex:"#a5bd63",name:"Салатовые",short:"СЛ"},
 olive:{hex:"#788746",name:"Оливковые",short:"ОЛ"},
 sky:{hex:"#83c5e8",name:"Небесные",short:"НБ"},
 blue:{hex:"#3977aa",name:"Синие",short:"СН"},
 turquoise:{hex:"#55b8ad",name:"Бирюзовые",short:"БР"},
 purple:{hex:"#8061b0",name:"Фиолетовые",short:"ФИ"},
 pink:{hex:"#d77da8",name:"Розовые",short:"РЗ"},
 red:{hex:"#c84f49",name:"Алые",short:"АЛ"},
 orange:{hex:"#e58a3d",name:"Оранжевые",short:"ОР"},
 yellow:{hex:"#f0c94f",name:"Жёлтые",short:"ЖЛ"},
 cream:{hex:"#f0e1b8",name:"Кремовые",short:"КМ"},
 brown:{hex:"#875a3e",name:"Коричневые",short:"КР"},
 gray:{hex:"#9aa5a0",name:"Серые",short:"СР"}
};
const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
const circle=(x,y,cx,cy,r)=>(x-cx)**2+(y-cy)**2<=r*r;
function inWing(x,y){
 return ellipse(x,y,86,88,48,43)||ellipse(x,y,164,88,48,43)||
  ellipse(x,y,94,137,36,43)||ellipse(x,y,156,137,36,43);
}
const flowerPetals=Array.from({length:8},(_,p)=>({x:125+Math.cos(p*Math.PI/4)*23,y:211+Math.sin(p*Math.PI/4)*23}));
function lineDistance(px,py,x1,y1,x2,y2){
 const dx=x2-x1,dy=y2-y1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy)));
 return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
}
function createFrogBoard(){
 // The visible field is 250×250 tiny squares. Each collectible artwork block
 // occupies a crisp 5×5 group of those squares, so one ant carries one large pixel.
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const px=(x+.5)*300/SIZE-25,py=(y+.5)*300/SIZE-25;
  const head=ellipse(px,py,125,126,87,91);
  const headRim=ellipse(px,py,125,126,94,98);
  if(headRim)board[y][x]="purple";
  if(head)board[y][x]="green";
  const leftSocket=ellipse(px,py,83,65,35,38),rightSocket=ellipse(px,py,167,65,35,38);
  if(leftSocket||rightSocket)board[y][x]="purple";
  if(ellipse(px,py,83,65,29,31)||ellipse(px,py,167,65,29,31))board[y][x]="green";
  if(ellipse(px,py,83,63,20,21)||ellipse(px,py,167,63,20,21))board[y][x]="yellow";
  if(ellipse(px,py,88,65,9,13)||ellipse(px,py,162,65,9,13))board[y][x]="purple";
  if(circle(px,py,88,60,3)||circle(px,py,162,60,3))board[y][x]="blue";
  if(circle(px,py,91,57,2)||circle(px,py,165,57,2))board[y][x]="yellow";
  if(ellipse(px,py,62,119,17,12)||ellipse(px,py,188,119,17,12))board[y][x]="blue";
  if(circle(px,py,55,92,5)||circle(px,py,195,92,5)||circle(px,py,70,151,4)||circle(px,py,180,151,4))board[y][x]="purple";
  if(circle(px,py,63,99,3)||circle(px,py,187,99,3)||circle(px,py,76,143,2)||circle(px,py,174,143,2))board[y][x]="yellow";
  const mouth=ellipse(px,py,125,158,59,25);
  if(mouth)board[y][x]="purple";
  if(ellipse(px,py,125,154,52,17))board[y][x]="red";
  if(ellipse(px,py,125,165,33,8))board[y][x]="yellow";
  if(circle(px,py,112,128,3)||circle(px,py,138,128,3))board[y][x]="purple";
  if(circle(px,py,111,127,1)||circle(px,py,137,127,1))board[y][x]="yellow";
  if(ellipse(px,py,125,220,54,23))board[y][x]="blue";
  if(ellipse(px,py,125,216,43,15))board[y][x]="green";
 }
 return board;
}

function createButterflyBoard(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 const e=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const left=e(x,y,9.5,11,8.2,8.4)||e(x,y,10,23,7.2,7.1);
  const right=e(x,y,25.5,11,8.2,8.4)||e(x,y,25,23,7.2,7.1);
  if(left||right)board[y][x]="purple";
  if(e(x,y,9.5,11,6.8,7)||e(x,y,25.5,11,6.8,7))board[y][x]="blue";
  if(e(x,y,10,23,5.8,5.7)||e(x,y,25,23,5.8,5.7))board[y][x]="red";
  if(e(x,y,9,10,3,3)||e(x,y,26,10,3,3)||e(x,y,10,23,2.5,2.5)||e(x,y,25,23,2.5,2.5))board[y][x]="yellow";
  if(Math.abs(x-17)<=1&&y>=8&&y<=27)board[y][x]="green";
  if((x-17)**2+(y-7)**2<=5)board[y][x]="yellow";
  if(y>=4&&y<=8&&Math.abs(x-17)<=1)board[y][x]="purple";
  if(y>=27&&y<=30&&Math.abs(x-17)<=1)board[y][x]="purple";
 }
 return board;
}
function createFlowerBoard(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 const e=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const petalCenters=[[17,6],[24,10],[27,17],[24,24],[17,27],[10,24],[7,17],[10,10]];
  if(petalCenters.some(([cx,cy])=>e(x,y,cx,cy,4.8,4.8)))board[y][x]="red";
  if(petalCenters.some(([cx,cy])=>e(x,y,cx,cy,3.2,3.2)))board[y][x]="yellow";
  if((x-17)**2+(y-17)**2<=5.8**2)board[y][x]="yellow";
  if((x-17)**2+(y-17)**2<=3.4**2)board[y][x]="purple";
  if(Math.abs(x-17)<=1&&y>=22&&y<=32)board[y][x]="green";
  if(e(x,y,12,27,5,2.5)||e(x,y,22,29,5,2.5))board[y][x]="blue";
  if(e(x,y,12,27,3.4,1.5)||e(x,y,22,29,3.4,1.5))board[y][x]="green";
 }
 return board;
}

function createMushroomBoard(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const cap=((x-17)/14)**2+((y-13)/9)**2<=1&&y<=16;
  const stem=((x-17)/6)**2+((y-23)/10)**2<=1&&y>=13;
  if(cap)board[y][x]="red";
  if(cap&&(((x-11)**2+(y-12)**2<=7)||((x-22)**2+(y-9)**2<=6)||((x-17)**2+(y-15)**2<=5)))board[y][x]="yellow";
  if(stem)board[y][x]="yellow";
  if(stem&&y>=24)board[y][x]="blue";
  if(y>=30&&y<=32&&Math.abs(x-17)<=10)board[y][x]="green";
  if(((x-6)**2+(y-29)**2<=9)||((x-28)**2+(y-30)**2<=8))board[y][x]="green";
 }
 return board;
}
function createAcornBoard(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const body=((x-17)/11)**2+((y-20)/13)**2<=1&&y>=10;
  const cap=((x-17)/12)**2+((y-10)/5.5)**2<=1&&y<=14;
  if(body)board[y][x]="yellow";
  if(body&&y>=17&&y<=25)board[y][x]="red";
  if(cap)board[y][x]="green";
  if(cap&&((x+y)%5===0))board[y][x]="blue";
  if(Math.abs(x-17)<=1&&y>=2&&y<=7)board[y][x]="green";
  if(((x-20)**2+(y-4)**2<=8))board[y][x]="green";
  if(y>=32&&Math.abs(x-17)<=7)board[y][x]="blue";
 }
 return board;
}
function createSnailBoard(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const shell=((x-17)/11)**2+((y-17)/11)**2<=1;
  const inner=((x-17)/6.8)**2+((y-17)/6.8)**2<=1;
  const body=((x-19)/14)**2+((y-28)/4.8)**2<=1;
  if(shell)board[y][x]="purple";
  if(inner)board[y][x]="yellow";
  if(((x-17)**2+(y-17)**2<=3.5**2))board[y][x]="red";
  if(body)board[y][x]="blue";
  if(body&&x>=19)board[y][x]="green";
  if((x===25&&y>=10&&y<=15)||(x===29&&y>=10&&y<=15))board[y][x]="green";
  if((x===24&&y===9)||(x===28&&y===9))board[y][x]="yellow";
  if((x-24)**2+(y-8)**2<=2||(x-28)**2+(y-8)**2<=2)board[y][x]="purple";
  if(y>=33&&x>=5&&x<=29)board[y][x]="green";
 }
 return board;
}

function createFireflyBoard(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 const silhouette=Array.from({length:SIZE},(_,y)=>Array.from({length:SIZE},(_,x)=>
  ellipse(x,y,10,13,8.5,8.2)||ellipse(x,y,24,13,8.5,8.2)||
  ellipse(x,y,17,7,4.7,4.8)||ellipse(x,y,17,14,5.4,5.5)||
  ellipse(x,y,17,22,6.4,10.2)||ellipse(x,y,17,31,5.2,3.2)||
  lineDistance(x,y,14,4,11,1)<=.9||lineDistance(x,y,20,4,23,1)<=.9||
  lineDistance(x,y,12,19,8,23)<=.9||lineDistance(x,y,22,19,26,23)<=.9
 ));
 // Measure depth from outside-connected air so each color band opens from the
 // perimeter inward, following the same four-way accessibility rule as play.
 const outside=Array.from({length:SIZE},()=>Array(SIZE).fill(false)),air=[];
 const addAir=(x,y)=>{
  if(x<0||y<0||x>=SIZE||y>=SIZE||outside[y][x]||silhouette[y][x])return;
  outside[y][x]=true;air.push([x,y]);
 };
 for(let x=0;x<SIZE;x++){addAir(x,0);addAir(x,SIZE-1);}
 for(let y=0;y<SIZE;y++){addAir(0,y);addAir(SIZE-1,y);}
 for(let head=0;head<air.length;head++){
  const [x,y]=air[head];
  addAir(x-1,y);addAir(x+1,y);addAir(x,y-1);addAir(x,y+1);
 }
 const depth=Array.from({length:SIZE},()=>Array(SIZE).fill(Infinity)),queue=[];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(outside[y][x]){
  depth[y][x]=0;queue.push([x,y]);
 }
 // Match the gameplay rule: occupied cells on the board edge are exposed
 // directly to the virtual exterior, even though they are not empty air.
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(
  silhouette[y][x]&&(x===0||y===0||x===SIZE-1||y===SIZE-1)
 ){
  depth[y][x]=1;queue.push([x,y]);
 }
 for(let head=0;head<queue.length;head++){
  const [x,y]=queue[head],next=depth[y][x]+1;
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(nx<0||ny<0||nx>=SIZE||ny>=SIZE||depth[ny][nx]<=next)continue;
   depth[ny][nx]=next;queue.push([nx,ny]);
  }
 }
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(silhouette[y][x]){
  const layer=depth[y][x];
  board[y][x]=layer<=1?"green":layer<=3?"blue":layer<=5?"purple":layer<=7?"yellow":"red";
 }
 return board;
}


const GENERATED_MOTIFS=[
 {type:"flower",name:"Цветок",emoji:"🌼"},
 {type:"tree",name:"Дерево",emoji:"🌳"},
 {type:"mushroom",name:"Гриб",emoji:"🍄"},
 {type:"butterfly",name:"Бабочка",emoji:"🦋"},
 {type:"house",name:"Домик",emoji:"🏡"},
 {type:"fish",name:"Рыбка",emoji:"🐟"},
 {type:"snail",name:"Улитка",emoji:"🐌"},
 {type:"rocket",name:"Ракета",emoji:"🚀"},
 {type:"bird",name:"Птичка",emoji:"🐦"},
 {type:"acorn",name:"Жёлудь",emoji:"🌰"},
 {type:"bee",name:"Пчёлка",emoji:"🐝"},
 {type:"cloud",name:"Облачко",emoji:"☁️"},
 {type:"monster",name:"Лесной монстрик",emoji:"👾"},
 {type:"dragon",name:"Дракончик",emoji:"🐉"},
 {type:"pineapple",name:"Ананас",emoji:"🍍"},
 {type:"crystal-flower",name:"Кристальный цветок",emoji:"💠"}
];
const GENERATED_ART_PALETTES={
 flower:["green","pink","yellow","cream"],tree:["brown","green","lime","yellow"],
 mushroom:["red","cream","brown","green"],butterfly:["purple","blue","pink","yellow"],
 house:["red","brown","cream","blue"],fish:["blue","turquoise","yellow","orange"],
 snail:["green","brown","orange","cream"],rocket:["red","blue","cream","yellow"],
 bird:["brown","sky","yellow","orange"],acorn:["brown","yellow","cream","green"],
 bee:["yellow","brown","cream","blue"],cloud:["sky","cream","yellow","blue"],
 monster:["purple","pink","blue","turquoise","lime","yellow","cream","red"],
 dragon:["forest","green","lime","yellow","orange","red","cream","purple"],
 pineapple:["yellow","orange","lime","green","brown","cream","red","turquoise"],
 "crystal-flower":["purple","pink","blue","turquoise","sky","yellow","cream","green"]
};
function generatedMotifDetail(type,zone,u,v,variant){
 const x=Math.floor(u*35),y=Math.floor(v*35),phase=variant%7;
 const line=(x1,y1,x2,y2,w=.72)=>lineDistance(x,y,x1*35,y1*35,x2*35,y2*35)<=w;
 const oval=(cx,cy,rx,ry)=>ellipse(u,v,cx,cy,rx,ry);
 const dot=(cx,cy,r=.035)=>circle(x,y,cx*35,cy*35,r*35);
 switch(type){
  case "flower":
   if(zone===1&&(line(.5,.29,.30,.12)||line(.5,.29,.70,.12)||line(.5,.29,.28,.38)||line(.5,.29,.72,.38)))return 5;
   if(zone===2&&(oval(.5,.29,.055,.055)||((x+y+phase)%5===0&&oval(.5,.29,.09,.09))))return 6;
   if(zone===0&&(line(.5,.55,.5,.94,.9)||line(.5,.72,.35,.67)||line(.5,.79,.66,.75)))return 7;
   if(zone===3&&(oval(.34,.72,.05,.035)||oval(.66,.79,.045,.03)))return 8;
   break;
  case "tree":
   if(zone===1){
    if(oval(.34,.25,.09,.065)||oval(.63,.34,.075,.06)||oval(.48,.48,.08,.055)||oval(.72,.48,.07,.05))return 5;
    if(line(.3,.4,.44,.24)||line(.57,.45,.7,.29)||line(.38,.5,.5,.34,.55))return 6;
    if(((Math.floor(u*12)+Math.floor(v*12)+phase)%5===0)&&oval(.5,.34,.34,.28))return 7;
   }
   if(zone===0&&(line(.46,.65,.54,.65)||line(.46,.79,.54,.79)||line(.46,.9,.54,.9)))return 8;
   break;
  case "mushroom":
   if(zone===1&&(oval(.3,.28,.055,.045)||oval(.51,.2,.06,.05)||oval(.7,.34,.055,.045)||oval(.42,.39,.04,.035)))return 5;
   if(zone===0&&(line(.4,.55,.6,.55)||line(.42,.63,.58,.63)||line(.44,.71,.56,.71)))return 6;
   if(zone===0&&oval(.46,.8,.035,.025))return 7;
   break;
  case "butterfly":
   if((zone===1||zone===2)&&(
    oval(.28,.34,.075,.085)||oval(.72,.34,.075,.085)||oval(.34,.68,.06,.07)||oval(.66,.68,.06,.07)
   ))return 5;
   if(zone===1||zone===2){
    if(line(.5,.48,.12,.12)||line(.5,.48,.2,.5)||line(.5,.48,.32,.82)||line(.5,.48,.88,.12)||line(.5,.48,.8,.5)||line(.5,.48,.68,.82))return 6;
    if(((Math.floor(u*14)+Math.floor(v*14)+phase)%6===0)&&oval(zone===1?.28:.72,.34,.22,.22))return 7;
   }
   if(zone===0&&(line(.5,.3,.5,.72,.7)||oval(.5,.23,.035,.035)))return 8;
   break;
  case "house":
   if(zone===1&&(line(.2,.27,.8,.27)||line(.27,.18,.73,.18)||line(.34,.1,.66,.1)))return 5;
   if(zone===0&&(line(.2,.58,.8,.58)||line(.2,.76,.8,.76)||line(.2,.86,.8,.86)))return 6;
   if(zone===3&&(line(.34,.52,.34,.65)||line(.28,.585,.4,.585)||line(.67,.52,.67,.65)||line(.61,.585,.73,.585)))return 7;
   if(zone===2&&oval(.55,.82,.018,.018))return 8;
   break;
  case "fish":
   if(zone===1){
    const gx=Math.floor(u*12),gy=Math.floor(v*12);
    if(((gx+gy+phase)%3===0)&&oval((gx+.5)/12,(gy+.5)/12,.035,.03))return 5;
    if(line(.34,.34,.34,.66,.8)||line(.38,.36,.38,.64,.65))return 6;
    if(oval(.27,.43,.025,.03))return 7;
   }
   if(zone===2&&(line(.78,.39,.94,.5)||line(.78,.61,.94,.5)))return 8;
   if(zone===3&&(line(.48,.3,.57,.18)||line(.48,.7,.57,.82)))return 9;
   if(zone===4&&(oval(.27,.43,.018,.02)))return 10;
   break;
  case "snail":
   if(zone===1){
    const r=Math.hypot((u-.47)*1.05,v-.44);
    if(Math.abs(r-.19)<.025||Math.abs(r-.12)<.022||Math.abs(r-.055)<.018)return 5;
    if(line(.47,.44,.65,.29,.8)||line(.47,.44,.32,.58,.8))return 6;
    if(((Math.floor(u*10)+Math.floor(v*10))%4===0)&&oval(.47,.44,.27,.27))return 7;
   }
   if(zone===0&&(line(.7,.29,.7,.16)||line(.85,.29,.85,.16)))return 8;
   if(zone===3&&(oval(.7,.2,.018,.022)||oval(.85,.2,.018,.022)))return 9;
   break;
  case "rocket":
   if(zone===1){
    const r=Math.hypot((u-.5)*.95,v-.47);
    if(Math.abs(r-.12)<.025)return 5;
    if(Math.abs(r-.075)<.02)return 6;
    if(line(.5,.3,.5,.65,.8)||line(.42,.34,.42,.58,.55)||line(.58,.34,.58,.58,.55))return 7;
   }
   if(zone===0&&(line(.45,.78,.45,.91)||line(.55,.78,.55,.91)))return 8;
   if(zone===2&&(line(.4,.18,.6,.18)||line(.43,.23,.57,.23)))return 9;
   if(zone===4&&(oval(.5,.4,.035,.035)))return 10;
   break;
  case "bird":
   if(zone===1&&(line(.3,.54,.58,.4)||line(.34,.61,.62,.48)||line(.4,.67,.65,.55)))return 5;
   if(zone===2&&(oval(.48,.54,.07,.055)||line(.3,.48,.57,.48,.55)))return 6;
   if(zone===4&&(oval(.65,.42,.018,.02)))return 7;
   if(zone===3&&(line(.78,.53,.95,.56,.8)))return 8;
   break;
  case "acorn":
   if(zone===2){
    const gx=Math.floor(u*14),gy=Math.floor(v*14);
    if((gx+gy+phase)%3===0&&oval((gx+.5)/14,(gy+.5)/14,.025,.02))return 5;
    if(line(.28,.32,.72,.32)||line(.3,.39,.7,.39))return 6;
   }
   if(zone===1&&(oval(.4,.58,.06,.12)||oval(.56,.68,.045,.1)))return 7;
   if(zone===0&&line(.5,.16,.55,.05))return 8;
   break;
  case "bee":
   if(zone===1&&(line(.25,.43,.75,.43)||line(.21,.54,.79,.54)||line(.25,.65,.75,.65)))return 5;
   if(zone===2&&(line(.28,.2,.45,.34)||line(.55,.34,.73,.2)))return 6;
   if(zone===4&&(line(.35,.18,.48,.28)||line(.6,.28,.75,.18)))return 7;
   if(zone===0&&(oval(.76,.5,.025,.03)))return 8;
   break;
  case "cloud":
   if(zone===1&&(
    oval(.34,.57,.08,.07)||oval(.53,.42,.09,.08)||oval(.73,.58,.07,.065)
   ))return 5;
   if(zone===2&&(line(.79,.02,.79,.12)||line(.9,.08,.96,.14)||line(.95,.2,.99,.2)||line(.68,.08,.62,.14)||line(.79,.28,.79,.36)))return 6;
   if(zone===1&&line(.2,.68,.8,.68))return 7;
   break;
  case "monster":
   if(zone===1&&(oval(.36,.34,.075,.09)||oval(.64,.34,.075,.09)))return 5;
   if(zone===1&&(oval(.36,.35,.035,.05)||oval(.64,.35,.035,.05)))return 6;
   if(zone===1&&line(.39,.51,.61,.51,.9))return 7;
   if(zone===0&&(line(.4,.69,.6,.69)||line(.43,.76,.57,.76)))return 8;
   if(zone===4&&(line(.13,.7,.21,.82)||line(.87,.7,.79,.82)))return 9;
   break;
  case "dragon":
   if(zone===1&&(oval(.42,.27,.035,.045)||oval(.58,.27,.035,.045)))return 5;
   if(zone===1&&(oval(.42,.27,.016,.025)||oval(.58,.27,.016,.025)))return 6;
   if(zone===2&&(line(.13,.43,.28,.52)||line(.87,.43,.72,.52)))return 7;
   if(zone===0&&(line(.38,.61,.62,.61)||line(.4,.7,.6,.7)))return 8;
   if(zone===4&&(line(.45,.87,.4,.94)||line(.55,.87,.6,.94)))return 9;
   break;
  case "pineapple":
   if(zone===0){
    const gx=Math.floor(u*12),gy=Math.floor(v*14);
    if((gx+gy)%4===0&&line((gx+.2)/12,(gy+.15)/14,(gx+.8)/12,(gy+.85)/14,.8))return 5;
    if((gx-gy+24)%5===0&&line((gx+.8)/12,(gy+.1)/14,(gx+.15)/12,(gy+.9)/14,.8))return 6;
   }
   if(zone===1&&(line(.5,.22,.5,.08)||line(.5,.2,.35,.04)||line(.5,.2,.66,.04)))return 7;
   if(zone===2&&line(.35,.88,.65,.88))return 8;
   break;
  case "crystal-flower":
   if(zone===1&&(line(.5,.12,.5,.4)||line(.2,.39,.42,.39)||line(.58,.39,.8,.39)))return 5;
   if(zone===1&&(oval(.5,.25,.045,.06)||oval(.27,.39,.045,.05)||oval(.73,.39,.045,.05)))return 6;
   if(zone===2&&(line(.5,.46,.5,.63)||line(.25,.39,.4,.5)||line(.75,.39,.6,.5)))return 7;
   if(zone===0&&(line(.5,.72,.5,.94)||line(.5,.8,.36,.72)||line(.5,.84,.65,.75)))return 8;
   break;
 }
 return -1;
}
function generatedPixelIconDetail(type,zone,u,v,variant){
 // A 14×14 logical pixel grid gives each motif deliberate interior marks.
 const x=Math.floor(u*14),y=Math.floor(v*14),p=variant%3;
 const pixel=(cx,cy)=>x===cx&&y===cy;
 const hline=(yy,x1,x2)=>y===yy&&x>=x1&&x<=x2;
 const vline=(xx,y1,y2)=>x===xx&&y>=y1&&y<=y2;
 switch(type){
  case "flower":
   if(pixel(6,6)||pixel(7,6)||pixel(6,7)||pixel(7,7))return 2;
   if((x===6||x===7)&&((y>=1&&y<=4)||(y>=9&&y<=12)))return 5;
   if((y===6||y===7)&&((x>=1&&x<=4)||(x>=9&&x<=12)))return 5;
   break;
  case "butterfly":
   if((zone===0||zone===1)&&vline(6,3,10))return 0;
   if((zone===1||zone===2)&&(pixel(3,4)||pixel(4,4)||pixel(9,4)||pixel(10,4)||pixel(3,9)||pixel(4,9)||pixel(9,9)||pixel(10,9)))return 3;
   if((zone===1||zone===2)&&(pixel(4,5)||pixel(9,5)||pixel(4,8)||pixel(9,8)))return 1;
   break;
  case "mushroom":
   if(zone===1&&(pixel(3,3)||pixel(6,2)||pixel(10,3)||pixel(8,4)))return 2;
   if(zone===0&&(hline(7,4,9)||hline(9,5,8)||hline(11,5,8)))return 10;
   break;
  case "house":
   if(zone===0&&(pixel(4,7)||pixel(5,7)||pixel(4,8)||pixel(5,8)||pixel(9,7)||pixel(10,7)||pixel(9,8)||pixel(10,8)))return 3;
   if(zone===0&&(hline(10,6,8)||vline(7,9,12)))return 2;
   if(zone===1&&(hline(3,2,11)||hline(4,3,10)))return 5;
   break;
  case "fish":
   if(zone===1&&(pixel(10,6)||pixel(10,7)))return 2;
   if(zone===1&&(pixel(4,5)||pixel(4,6)||pixel(5,5)||pixel(5,6)))return 3;
   if(zone===1&&vline(7,4,9)&&x>5)return 5;
   break;
  case "snail":
   if(zone===1&&((x===5&&y>=4&&y<=9)||(x===6&&y===4)||(x===7&&y===5)||(x===8&&y===6)||(x===8&&y===7)||(x===7&&y===8)||(x===6&&y===8)))return 2;
   if(zone===0&&(pixel(10,3)||pixel(12,3)))return 3;
   if(zone===0&&(pixel(10,2)||pixel(12,2)))return 5;
   break;
  case "rocket":
   if(zone===1&&(x===6||x===7)&&y>=3&&y<=10)return 3;
   if(zone===1&&(pixel(6,5)||pixel(7,5)||pixel(6,6)||pixel(7,6)))return 1;
   if(zone===1&&(x===4||x===9)&&(y===8||y===9||y===10))return 5;
   if(zone===0&&(x===6||x===7)&&y>=11&&y<=13)return 2;
   break;
  case "bird":
   if(zone===1&&(pixel(9,4)||pixel(10,4)))return 2;
   if(zone===2&&(pixel(11,5)||pixel(12,5)))return 3;
   // Stepped feather patch gives the body a clear wing direction and stays
   // connected at the rendered board scale.
   if(zone===1&&(
    (y===6&&x>=4&&x<=8)||(y===7&&x>=3&&x<=8)||
    (y===8&&x>=4&&x<=7)||(y===9&&x>=5&&x<=7)
   ))return 5;
   break;
  case "acorn":
   if(zone===1&&(hline(5,4,9)||hline(6,3,10)))return 5;
   if(zone===0&&(x===6||x===7)&&y>=8&&y<=10)return 2;
   break;
  case "bee":
   if(zone===1&&(hline(5,4,9)||hline(8,4,9)))return 2;
   if(zone===2&&(pixel(5,3)||pixel(9,3)||pixel(5,10)||pixel(9,10)))return 5;
   if(zone===1&&(pixel(10,6)||pixel(10,7)))return 3;
   break;
  case "tree":{
   // Connected foliage clusters and a trunk highlight read as branches,
   // rather than evenly scattered decorative pixels.
   if(zone===0&&(x===6||x===7)&&y>=7&&y<=12)return 0;
   const leafCluster=(cx,cy,rx,ry)=>
    ((x-cx)*(x-cx))/(rx*rx)+((y-cy)*(y-cy))/(ry*ry)<=1;
   if(zone===1&&(
    leafCluster(4,4,2.1,1.8)||leafCluster(8,3,2.4,2.0)||
    leafCluster(10,6,1.8,1.7)||leafCluster(5,7,2.0,1.4)
   ))return 2;
   if(zone===1&&(x===6||x===7)&&y>=5&&y<=8)return 3;
   break;
  }
  case "cloud":
   if(zone===1&&(pixel(4,6)||pixel(5,6)||pixel(8,6)||pixel(9,6)))return 3;
   if(zone===1&&hline(8,3,10))return 5;
   break;
 }
 return -1;
}
function generatedMotifColor(type,zone,u,v,variant,scenePalette){
 const sourcePalette=GENERATED_ART_PALETTES[type]||GENERATED_ART_PALETTES.flower;
 // Four clear pigments form broad, connected color regions. Details are
 // intentional pixel-art features, not random speckles or near-identical shades.
 const palette=sourcePalette;
 if(u>.06&&u<.94&&v>.06&&v<.93){
  const pixelDetail=generatedPixelIconDetail(type,zone,u,v,variant);
  if(pixelDetail>=0)return palette[pixelDetail%palette.length];
  const detail=generatedMotifDetail(type,zone,u,v,variant);
  if(detail>=0)return palette[detail%palette.length];
 }
 return palette[zone%palette.length]||palette[0];
}
const GENERATED_CHAPTERS=[
 "Светлячковая роща","Тихий ручей","Солнечная опушка","Старый дуб",
 "Мшистые холмы","Лунный сад","Долина огоньков","Затерянная тропа",
 "Сказочная чаща","Большой лес"
];
function generatedPartCount(number){
 // Every level is one coherent illustration. Variety comes from changing
 // the subject, pose, details and palette — never from combining unrelated icons.
 return 1;
}
function generatedChapter(number){
 if(number<=50)return "Светлячковая роща";
 return GENERATED_CHAPTERS[Math.min(9,Math.floor((number-51)/50)+1)];
}
const GENERATED_LEVELS=Array.from({length:493},(_,index)=>{
 const number=index+8,count=generatedPartCount(number);
 const motifIndices=[];
 for(let part=0;part<count;part++){
  const seed=(Math.imul(number,0x9e3779b1)^Math.imul(part+1,0x85ebca6b))>>>0;
  let motifIndex=seed%GENERATED_MOTIFS.length;
  while(motifIndices.includes(motifIndex))motifIndex=(motifIndex+1)%GENERATED_MOTIFS.length;
  motifIndices.push(motifIndex);
 }
 const motifs=motifIndices.map(index=>GENERATED_MOTIFS[index]);
 const names=motifs.map(item=>item.name);
 const name=names.length===1?names[0]+" на полянке":names.slice(0,-1).join(", ")+" и "+names[names.length-1];
 const artworkHint=count===1?"Знакомимся с новым силуэтом и цветовыми слоями":count===2?"Две самостоятельные картинки на одном поле — следи за цветами обоих рисунков":count===3?"Три части общей картины: планируй очередь для каждой":"Четыре объекта на одном поле — продумывай порядок открытия";
 const obstacleHint=number>=301?"Корни, камни и осы: чередуй строителей и военных, у преград несколько уровней прочности":number>=151?"Корневые завалы и пауки-стражи: сначала расчисти путь специалистами":number>=51?"На рисунке есть жук-страж — военные прогонят его, строители разбирают корни":number>=26?"Корневой завал закрывает цветной блок — отправь к нему муравьёв-строителей":"";
 return {id:"meadow-"+String(number).padStart(3,"0"),number,chapter:generatedChapter(number),name,emoji:motifs[0].emoji,hint:obstacleHint?artworkHint+" · "+obstacleHint:artworkHint};
}).concat([
 {id:"meadow-501",number:501,chapter:"Испытательная тропа",name:"Монстрик из мшистой пещеры",emoji:"👾",hint:"Пилотный уровень: 8 цветов, лицо и тело открываются разными слоями"},
 {id:"meadow-502",number:502,chapter:"Испытательная тропа",name:"Маленький лесной дракон",emoji:"🐉",hint:"Пилотный уровень: крылья, чешуя и мордочка образуют отдельные цветовые группы"},
 {id:"meadow-503",number:503,chapter:"Испытательная тропа",name:"Золотой ананас",emoji:"🍍",hint:"Пилотный уровень: плотная фактура кожуры и листья проверяют работу очереди"},
 {id:"meadow-504",number:504,chapter:"Испытательная тропа",name:"Кристальный цветок",emoji:"💠",hint:"Пилотный уровень: многослойные лепестки и стебель с контрастными оттенками"}
]);
function inTriangle(px,py,ax,ay,bx,by,cx,cy){
 const sign=(x1,y1,x2,y2,x3,y3)=>(x1-x3)*(y2-y3)-(x2-x3)*(y1-y3);
 const a=sign(px,py,ax,ay,bx,by),b=sign(px,py,bx,by,cx,cy),c=sign(px,py,cx,cy,ax,ay);
 return (a>=0&&b>=0&&c>=0)||(a<=0&&b<=0&&c<=0);
}
function generatedMotifZone(type,u,v,variant){
 const dx=((variant%7)-3)*.009,dy=((Math.floor(variant/7)%7)-3)*.009;
 const sx=1+((Math.floor(variant/49)%5)-2)*.018,sy=1+((Math.floor(variant/245)%5)-2)*.018;
 const x=.5+(u-.5)*sx+dx,y=.5+(v-.5)*sy+dy;
 const E=(cx,cy,rx,ry)=>ellipse(x,y,cx,cy,rx,ry);
 const R=(x1,y1,x2,y2)=>x>=x1&&x<=x2&&y>=y1&&y<=y2;
 const T=(ax,ay,bx,by,cx,cy)=>inTriangle(x,y,ax,ay,bx,by,cx,cy);
 const L=(x1,y1,x2,y2,w=.035)=>lineDistance(x,y,x1,y1,x2,y2)<=w;
 switch(type){
  case "flower":
   if(R(.46,.48,.54,.96))return 0;
   if(E(.34,.72,.17,.09)||E(.66,.79,.16,.08))return 3;
   if(E(.5,.25,.18,.16)||E(.29,.36,.16,.15)||E(.71,.36,.16,.15)||E(.36,.13,.15,.14)||E(.64,.13,.15,.14))return 1;
   if(E(.5,.29,.095,.09))return 2;
   break;
  case "tree":
   if(R(.43,.56,.57,.98))return 0;
   if(E(.5,.32,.37,.31)||E(.28,.43,.22,.2)||E(.72,.43,.22,.2))return 1;
   if(E(.34,.25,.055,.06)||E(.63,.34,.06,.065)||E(.48,.48,.055,.06)||E(.72,.48,.05,.055))return 2;
   break;
  case "mushroom":
   if(R(.39,.48,.61,.94))return 0;
   if(E(.5,.34,.43,.28)&&y<.52)return 1;
   if(E(.3,.31,.055,.06)||E(.51,.2,.06,.065)||E(.7,.34,.055,.06))return 2;
   break;
  case "butterfly":
   if(R(.46,.28,.54,.78)||E(.5,.23,.09,.09))return 0;
   if(E(.28,.34,.24,.25)||E(.72,.34,.24,.25))return 1;
   if(E(.34,.68,.18,.19)||E(.66,.68,.18,.19))return 2;
   if(E(.28,.34,.09,.1)||E(.72,.34,.09,.1)||L(.46,.2,.35,.04)||L(.54,.2,.65,.04))return 3;
   break;
  case "house":
   if(R(.2,.42,.8,.92))return 0;
   if(T(.12,.45,.5,.08,.88,.45)||R(.68,.16,.77,.4))return 1;
   if(R(.43,.67,.58,.92))return 2;
   if(R(.28,.52,.4,.65)||R(.61,.52,.73,.65))return 3;
   break;
  case "fish":
   if(E(.47,.5,.34,.27))return 1;
   if(T(.7,.5,.98,.28,.98,.72))return 2;
   if(T(.42,.3,.55,.12,.63,.35)||T(.42,.7,.55,.88,.63,.65))return 3;
   if(E(.27,.43,.045,.05))return 4;
   break;
  case "snail":
   if(E(.48,.76,.4,.14)||R(.68,.25,.73,.69)||R(.83,.25,.88,.67))return 0;
   if(E(.47,.44,.3,.3))return 1;
   if(E(.47,.44,.17,.17)&&!E(.47,.44,.1,.1))return 2;
   if(E(.7,.2,.065,.07)||E(.85,.2,.065,.07))return 3;
   break;
  case "rocket":
   if(T(.5,.94,.38,.72,.62,.72))return 0;
   if(E(.5,.47,.2,.38))return 1;
   if(T(.5,.04,.31,.29,.69,.29))return 2;
   if(T(.32,.62,.12,.83,.38,.79)||T(.68,.62,.88,.83,.62,.79))return 3;
   if(E(.5,.4,.085,.09))return 4;
   break;
  case "bird":
   if(E(.47,.53,.34,.25))return 1;
   if(E(.48,.54,.2,.16))return 2;
   if(T(.75,.48,.99,.56,.76,.64))return 3;
   if(L(.42,.74,.39,.94)||L(.55,.74,.59,.94))return 0;
   if(E(.65,.42,.04,.045))return 4;
   break;
  case "acorn":
   if(E(.5,.59,.31,.37))return 1;
   if(E(.5,.31,.34,.16)&&y<.48)return 2;
   if(L(.5,.16,.55,.05))return 0;
   break;
  case "bee":
   if(E(.5,.54,.31,.23))return 1;
   if(E(.39,.52,.055,.24)||E(.61,.52,.055,.24))return 2;
   if(E(.42,.23,.18,.14)||E(.65,.23,.18,.14))return 4;
   if(E(.76,.5,.11,.13))return 0;
   if(E(.79,.47,.025,.03))return 3;
   break;
  case "cloud":
   if(E(.34,.57,.22,.2)||E(.53,.42,.25,.27)||E(.73,.58,.2,.18))return 1;
   if(E(.79,.2,.13,.13))return 2;
   if(L(.79,.02,.79,.07)||L(.95,.2,.99,.2)||L(.63,.2,.59,.2)||L(.79,.36,.79,.4))return 3;
   break;
  case "monster":
   if(E(.32,.49,.09,.08)||E(.68,.49,.09,.08))return 5;
   if(E(.5,.68,.13,.1))return 6;
   if(E(.2,.57,.09,.1)||E(.8,.57,.09,.1))return 7;
   if(T(.24,.2,.22,.005,.45,.27)||T(.55,.27,.78,.005,.76,.2))return 2;
   if(E(.32,.37,.09,.11)||E(.68,.37,.09,.11))return 3;
   if(T(.16,.64,.04,.84,.28,.78)||T(.84,.64,.96,.84,.72,.78))return 4;
   if(E(.5,.36,.34,.29)||E(.25,.36,.11,.19)||E(.75,.36,.11,.19))return 1;
   if(E(.5,.64,.29,.25)||E(.5,.84,.23,.12))return 0;
   break;
  case "dragon":
   if(E(.5,.34,.15,.075))return 5;
   if(E(.5,.61,.15,.17))return 6;
   if(E(.5,.88,.14,.07))return 7;
   if(E(.5,.44,.19,.16))return 4;
   if(T(.3,.48,.03,.31,.18,.68)||T(.7,.48,.97,.31,.82,.68))return 2;
   if(E(.37,.79,.13,.12)||E(.63,.79,.13,.12))return 3;
   if(E(.5,.27,.23,.2)||T(.34,.23,.18,.04,.43,.13)||T(.57,.13,.82,.04,.66,.24))return 1;
   if(E(.49,.55,.25,.3)||E(.5,.8,.19,.14))return 0;
   break;
  case "pineapple":
   if(E(.5,.59,.1,.14))return 7;
   if(E(.5,.56,.16,.18))return 3;
   if(E(.5,.75,.17,.09))return 4;
   if(E(.5,.15,.12,.14))return 5;
   if(E(.35,.42,.08,.1)||E(.65,.42,.08,.1))return 6;
   if(T(.5,.47,.44,.62,.56,.62))return 7;
   if(E(.36,.18,.12,.16)||E(.64,.17,.12,.16)||E(.5,.12,.09,.16))return 1;
   if(E(.5,.88,.18,.06))return 2;
   if(E(.5,.59,.29,.35))return 0;
   break;
  case "crystal-flower":
   if(E(.5,.39,.12,.13))return 3;
   if(E(.5,.74,.14,.1))return 4;
   if(T(.5,.1,.35,.32,.65,.32))return 5;
   if(E(.3,.4,.1,.13)||E(.7,.4,.1,.13))return 6;
   if(E(.5,.54,.13,.14))return 7;
   if(E(.27,.39,.15,.16)||E(.73,.39,.15,.16)||T(.5,.07,.42,.27,.58,.27)||T(.5,.43,.42,.68,.58,.68)||T(.08,.39,.31,.29,.31,.49)||T(.92,.39,.69,.29,.69,.49))return 2;
   if(E(.5,.25,.14,.18)||E(.27,.39,.17,.15)||E(.73,.39,.17,.15)||E(.34,.65,.16,.15)||E(.66,.65,.16,.15))return 1;
   if(R(.39,.65,.61,.97))return 0;
   break;
 }
 return -1;
}
function applyGeneratedDepthPalette(source,palette){
 const depth=Array.from({length:SIZE},()=>Array(SIZE).fill(0));
 const outside=Array.from({length:SIZE},()=>Array(SIZE).fill(false)),air=[];
 const addAir=(x,y)=>{
  if(x<0||y<0||x>=SIZE||y>=SIZE||outside[y][x]||source[y][x])return;
  outside[y][x]=true;air.push([x,y]);
 };
 for(let x=0;x<SIZE;x++){addAir(x,0);addAir(x,SIZE-1);}
 for(let y=0;y<SIZE;y++){addAir(0,y);addAir(SIZE-1,y);}
 const occupied=[];
 const expose=(x,y)=>{
  if(x<0||y<0||x>=SIZE||y>=SIZE||!source[y][x]||depth[y][x])return;
  depth[y][x]=1;occupied.push([x,y]);
 };
 for(let head=0;head<air.length;head++){
  const [x,y]=air[head];
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(nx<0||ny<0||nx>=SIZE||ny>=SIZE)continue;
   if(source[ny][nx])expose(nx,ny);else addAir(nx,ny);
  }
 }
 for(let head=0;head<occupied.length;head++){
  const [x,y]=occupied[head],next=depth[y][x]+1;
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(nx<0||ny<0||nx>=SIZE||ny>=SIZE||!source[ny][nx]||depth[ny][nx])continue;
   depth[ny][nx]=next;occupied.push([nx,ny]);
  }
 }
 const result=source.map(row=>row.slice()),colorOrder=Object.keys(COLORS);
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const original=source[y][x];if(!original)continue;
  const layer=depth[y][x];
  if(layer===1){result[y][x]="black";continue;}
  const sourceIndex=palette.indexOf(original);
  const role=(sourceIndex>=0?sourceIndex:colorOrder.indexOf(original))%5;
  // Enclosed pockets are intentionally assigned to the deepest shade group;
  // they must not become a second black contour when the pocket is opened.
  const band=layer===0?2:Math.min(2,Math.floor((layer-2)/3));
  result[y][x]=palette[band*5+role]||palette[role]||original;
 }
 return result;
}

function generatedSceneLayout(count,variant){
 const layouts={
  1:[[[0,0,45,45]]],
  2:[
   [[0,7,28,31],[17,7,28,31]],
   [[0,1,28,31],[17,13,28,31]],
   [[0,13,28,31],[17,1,28,31]]
  ],
  3:[
   [[0,0,26,26],[19,0,26,26],[9,19,26,26]],
   [[0,0,26,26],[19,0,26,26],[9,19,26,26]],
   [[0,0,26,26],[19,0,26,26],[9,19,26,26]]
  ]
 };
 const choices=layouts[count]||layouts[3];
 const scale=SIZE/35;
 return choices[variant%choices.length].map(([x,y,width,height])=>{
  const left=Math.round(x*scale),top=Math.round(y*scale);
  const right=Math.round((x+width)*scale),bottom=Math.round((y+height)*scale);
  return [left,top,right-left,bottom-top];
 });
}
const rasterArtworkCache=new Map();
const BASE64_ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function createRasterArtworkBoard(type,native=false){
 const source=RASTER_ARTWORK[type];if(!source)return null;
 const cacheKey=type+(native?":native":"");
 if(!rasterArtworkCache.has(cacheKey)){
  const bytes=[];let accumulator=0,bits=0;
  for(const character of source.data){
   const value=BASE64_ALPHABET.indexOf(character);if(value<0)continue;
   accumulator=(accumulator<<6)|value;bits+=6;
   if(bits>=8){bits-=8;bytes.push((accumulator>>bits)&255);accumulator&=(1<<bits)-1;}
  }
  // The authored masters are 35×35. Starter portraits keep their original
  // collectible footprint while the 35×35 field gains a scenic
  // non-collectible margin; procedural compositions use crisp nearest-neighbour
  // enlargement to fill their larger placements.
  const sourceSize=35,sourceBoard=Array.from({length:sourceSize},()=>Array(sourceSize).fill(""));
  let bit=0;
  for(let y=0;y<sourceSize;y++)for(let x=0;x<sourceSize;x++){
   let value=0;
   for(let index=0;index<3;index++){value=(value<<1)|((bytes[bit>>3]>>(7-(bit&7)))&1);bit++;}
   sourceBoard[y][x]=value===7?"":source.palette[value]||"";
  }
  let board;
  if(native){
   board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
   const offset=Math.floor((SIZE-sourceSize)/2);
   for(let y=0;y<sourceSize;y++)for(let x=0;x<sourceSize;x++)board[y+offset][x+offset]=sourceBoard[y][x];
  }else{
   board=Array.from({length:SIZE},(_,y)=>Array.from({length:SIZE},(_,x)=>
    sourceBoard[Math.min(sourceSize-1,Math.floor(y*sourceSize/SIZE))][Math.min(sourceSize-1,Math.floor(x*sourceSize/SIZE))]
   ));
  }
  rasterArtworkCache.set(cacheKey,board);
 }
 return rasterArtworkCache.get(cacheKey).map(row=>row.slice());
}
function createComposedArtworkBoard(number){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 const count=generatedPartCount(number),layoutVariant=(number+Math.floor(number/11))%3;
 const placements=number>=501&&number<=504?[[0,0,SIZE,SIZE]]:generatedSceneLayout(count,layoutVariant),usedMotifs=new Set();
 for(let part=0;part<count;part++){
  const motifSeed=(Math.imul(number,0x9e3779b1)^Math.imul(part+1,0x85ebca6b))>>>0;
  let motifIndex=motifSeed%GENERATED_MOTIFS.length;
  while(usedMotifs.has(motifIndex))motifIndex=(motifIndex+1)%GENERATED_MOTIFS.length;
  usedMotifs.add(motifIndex);
  const motif=number>=501&&number<=504
   ?GENERATED_MOTIFS.find(item=>item.type===({501:"monster",502:"dragon",503:"pineapple",504:"crystal-flower"}[number]))
   :GENERATED_MOTIFS[motifIndex],variant=(Math.imul(number,0x45d9f3b)+part*0x27d4eb2d)>>>0;
  const [ox,oy,width,height]=placements[part];
  const raster=createRasterArtworkBoard(motif.type);
  if(raster){
   const palettes=[
    ["forest","green","lime","yellow"],["purple","blue","sky","pink"],
    ["red","orange","yellow","cream"],["blue","turquoise","sky","cream"],
    ["brown","orange","cream","green"],["pink","purple","yellow","cream"]
   ];
   const theme=palettes[Math.floor(number/8)%palettes.length];
   const sourcePalette=RASTER_ARTWORK[motif.type]?.palette||[];
   const pigmentMap=Object.fromEntries(sourcePalette.slice(1).map((color,index)=>[color,theme[index%theme.length]]));
   for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const x=ox+px,y=oy+py;if(x<0||y<0||x>=SIZE||y>=SIZE)continue;
    const scaleX=1+(((variant*7)%9)-4)*.025,scaleY=1+(((variant*11)%9)-4)*.025;
    const offsetX=(((variant*13)%7)-3)*.22,offsetY=(((variant*17)%7)-3)*.22;
    let sourceU=((px+.5)/width-.5)/scaleX+.5+offsetX/SIZE;
    const sourceV=((py+.5)/height-.5)/scaleY+.5+offsetY/SIZE;
    if(variant%2===0)sourceU=1-sourceU;
    const sx=Math.max(0,Math.min(SIZE-1,Math.floor(sourceU*SIZE)));
    const sy=Math.max(0,Math.min(SIZE-1,Math.floor(sourceV*SIZE)));
    const color=raster[sy][sx];if(color)board[y][x]=color==="black"?"black":(pigmentMap[color]||color);
   }
  }else{
   for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const zone=generatedMotifZone(motif.type,(px+.5)/width,(py+.5)/height,variant);
    if(zone<0)continue;
    const x=ox+px,y=oy+py;if(x<0||y<0||x>=SIZE||y>=SIZE)continue;
    board[y][x]=generatedMotifColor(motif.type,zone,(px+.5)/width,(py+.5)/height,variant);
   }
  }
 }
 // Keep every decorative detail attached to a real motif. Detached sparkle
 // crosses looked like stray pixels on the board and weakened the silhouette.
 return board;
}

export const LEVELS=[

 {id:"meadow-01",number:1,chapter:"Зелёная поляна",name:"Портрет лягушонка",emoji:"🐸",hint:"Знакомство с цветными боксами и пятью отсеками"},
 {id:"garden-02",number:2,chapter:"Цветочный сад",name:"Бабочка на ветру",emoji:"🦋",hint:"Новые сочетания цветов и более длинная очередь"},
 {id:"garden-03",number:3,chapter:"Цветочный сад",name:"Солнечный цветок",emoji:"🌻",hint:"Учимся открывать центральные блоки постепенно"},
 {id:"forest-04",number:4,chapter:"Грибной лес",name:"Красная шляпка",emoji:"🍄",hint:"Новый силуэт и более плотные цветовые группы"},
 {id:"forest-05",number:5,chapter:"Грибной лес",name:"Жёлудь для запаса",emoji:"🌰",hint:"Собираем осеннюю находку из пяти цветов"},
 {id:"forest-06",number:6,chapter:"Грибной лес",name:"Улитка-путешественница",emoji:"🐌",hint:"Финальная картинка первой маленькой главы"},
 {id:"forest-07",number:7,chapter:"Светлячковая роща",name:"Светлячок в сумерках",emoji:"✨",hint:"Снимаем пять мягких цветовых слоёв от крыльев к огоньку"}

,...GENERATED_LEVELS
];
export function getLevel(levelId="meadow-01"){
 return LEVELS.find(level=>level.id===levelId)||LEVELS[0];
}

function applyStarterPixelDetails(board,levelNumber){
 const paint=(x,y,color)=>{if(board[y]?.[x]&&board[y][x]!=="black")board[y][x]=color;};
 const line=(x1,y1,x2,y2,color)=>{
  const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
  for(let i=0;i<=steps;i++){const t=steps?i/steps:0;paint(Math.round(x1+(x2-x1)*t),Math.round(y1+(y2-y1)*t),color);}
 };
 if(levelNumber===1){
  for(const [x,y] of [[11,7],[23,7]]){paint(x,y,"purple");paint(x+1,y-1,"yellow");}
  paint(15,14,"purple");paint(19,14,"purple");
  line(12,17,15,19,"red");line(15,19,19,19,"red");line(19,19,22,17,"red");
 }
 if(levelNumber===2){
  for(const [cx,cy] of [[9,10],[25,10],[10,23],[24,23]])for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])paint(cx+dx,cy+dy,"pink");
  line(17,9,17,25,"purple");line(16,11,13,8,"cream");line(18,11,21,8,"cream");
 }
 if(levelNumber===3){
  for(const [x,y] of [[16,16],[17,16],[18,16],[16,17],[17,17],[18,17],[16,18],[17,18],[18,18]])paint(x,y,"orange");
  for(const [x1,y1,x2,y2] of [[17,11,17,13],[21,13,20,15],[23,17,21,17],[21,21,20,19],[17,23,17,21],[13,21,14,19],[11,17,13,17],[13,13,14,15]])line(x1,y1,x2,y2,"pink");
 }
 if(levelNumber===4){
  for(const [x,y] of [[11,9],[16,7],[21,9],[24,12],[13,12]])paint(x,y,"cream");
  for(let x=10;x<=24;x+=3)line(x,15,x+(x<17?1:-1),17,"brown");
 }
 if(levelNumber===5){
  line(8,11,25,11,"brown");line(10,13,23,13,"brown");
  for(const x of [11,15,19,23])line(x,8,x-1,12,"orange");
  line(8,15,26,15,"brown");
 }
 if(levelNumber===6){
  line(17,10,20,12,"orange");line(20,12,21,16,"orange");line(21,16,18,19,"orange");
  line(18,19,14,18,"orange");line(14,18,13,15,"orange");line(13,15,16,13,"orange");
  for(const [x,y] of [[25,9],[29,9]]){paint(x,y,"yellow");paint(x,y+1,"purple");}
 }
 if(levelNumber===7){
  for(let y=18;y<=27;y+=3)line(15,y,19,y,"yellow");
  line(10,8,7,5,"sky");line(24,8,27,5,"sky");line(10,13,7,16,"sky");line(24,13,27,16,"sky");
  paint(16,5,"yellow");paint(17,5,"yellow");paint(18,5,"yellow");
 }
 return board;
}
function normalizeStarterPalette(board,levelNumber){
 const palettes={
  1:{green:"green",forest:"green",lime:"green",olive:"green",purple:"purple",blue:"purple",yellow:"yellow",cream:"yellow",orange:"yellow",red:"red",pink:"red"},
  2:{blue:"blue",sky:"blue",turquoise:"blue",purple:"blue",pink:"pink",red:"pink",yellow:"yellow",cream:"yellow",orange:"yellow",green:"green",forest:"green",lime:"green"},
  3:{green:"green",forest:"green",lime:"green",olive:"green",pink:"pink",red:"pink",purple:"pink",yellow:"yellow",cream:"yellow",orange:"yellow",blue:"blue",sky:"blue"},
  4:{red:"red",pink:"red",orange:"red",cream:"cream",yellow:"cream",brown:"brown",green:"green",forest:"green",olive:"green",blue:"green"},
  5:{brown:"brown",orange:"brown",red:"brown",yellow:"yellow",cream:"cream",green:"green",forest:"green",olive:"green",blue:"green"},
  6:{green:"green",forest:"green",lime:"green",olive:"green",brown:"brown",orange:"orange",red:"orange",yellow:"yellow",cream:"yellow",purple:"brown",blue:"green",turquoise:"green",sky:"green"},
  7:{forest:"green",green:"green",lime:"green",olive:"green",purple:"purple",blue:"purple",pink:"purple",yellow:"yellow",orange:"yellow",cream:"yellow",sky:"blue",turquoise:"blue",red:"yellow",brown:"green"}
 };
 const map=palettes[levelNumber]||palettes[1];
 return board.map(row=>row.map(color=>!color||color==="black"?color:(map[color]||color)));
}
function enrichStarterArtwork(board,levelNumber){
 const palettes={
  1:{green:["forest","green","lime","olive"],purple:["purple","blue","pink"],yellow:["yellow","cream","orange"],blue:["blue","sky","turquoise"],red:["red","pink","orange"]},
  2:{purple:["purple","blue","pink"],blue:["blue","sky","turquoise"],red:["red","pink","orange"],yellow:["yellow","cream","orange"],green:["forest","green","lime"]},
  3:{red:["red","pink","orange"],yellow:["yellow","cream","orange"],green:["forest","green","lime"],blue:["blue","sky","turquoise"],purple:["purple","pink","blue"]},
  4:{red:["red","orange","pink"],yellow:["yellow","cream"],blue:["brown","cream","yellow"],green:["forest","green","olive"]},
  5:{yellow:["yellow","orange","cream"],red:["red","orange","brown"],green:["forest","green","olive"],blue:["brown","cream","yellow"]},
  6:{purple:["brown","orange","yellow"],yellow:["yellow","cream","orange"],red:["red","orange","brown"],blue:["blue","turquoise","sky"],green:["forest","green","lime"]},
  7:{forest:["forest","purple","blue"],purple:["purple","blue","pink"],yellow:["yellow","cream","orange"],cream:["cream","yellow","sky"],green:["forest","green","lime"]}
 };
 const palette=palettes[levelNumber]||palettes[1];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const base=board[y][x];if(!base||base==="black")continue;
  const shades=palette[base];if(!shades)continue;
  const u=x/(SIZE-1),v=y/(SIZE-1);
  // A broad upper-left light source gives each form a coherent lit and shaded side.
  const light=(1-u)*.52+(1-v)*.48;
  let shade=light>.73?0:light<.29?shades.length-1:Math.min(1,shades.length-1);
  const grain=(x*13+y*7+levelNumber*11)%19;
  // Fine material marks are clustered and restrained, preserving the silhouette.
  const textured=(levelNumber===4||levelNumber===5||levelNumber===6)&&grain<3;
  if(textured)shade=Math.min(shades.length-1,shade+1);
  // Petals, shell and wings receive gentle bands instead of flat color fills.
  if((levelNumber===2||levelNumber===3||levelNumber===6)&&
    ((x+y+levelNumber)%9===0))shade=Math.max(0,shade-1);
  board[y][x]=shades[shade]||base;
 }
 // Add a few object-specific highlights only where the original shape already exists.
 for(let y=1;y<SIZE-1;y++)for(let x=1;x<SIZE-1;x++){
  if(!board[y][x]||board[y][x]==="black")continue;
  const color=board[y][x],edge=board[y-1][x]&&board[y][x-1];
  if(levelNumber===1&&color==="green"&&((x-8)**2+(y-12)**2<10||(x-26)**2+(y-12)**2<10))board[y][x]="lime";
  if(levelNumber===2&&(color==="blue"||color==="purple")&&Math.abs(x-17)>4&&((x+y)%11===0))board[y][x]="pink";
  if(levelNumber===3&&color==="red"&&((x+y)%8===0))board[y][x]="pink";
  if(levelNumber===4&&color==="red"&&((x*3+y*5)%17===0))board[y][x]="cream";
  if(levelNumber===5&&color==="yellow"&&((x+y*2)%13===0))board[y][x]="orange";
  if(levelNumber===6&&color==="brown"&&((x+y)%7===0))board[y][x]="orange";
  if(levelNumber===7&&color==="purple"&&((x*2+y)%9===0))board[y][x]="sky";
 }
 return board;
}

const artworkBoardCache=new Map();
const ART_PALETTES={
 frog:["green","lime","olive","yellow","forest"],
 butterfly:["blue","turquoise","pink","yellow","purple"],
 flower:["pink","red","orange","yellow","green"],
 mushroom:["red","orange","cream","brown","olive"],
 acorn:["brown","orange","cream","olive","forest"],
 snail:["brown","orange","yellow","olive","green"],
 firefly:["forest","purple","yellow","cream","sky"],
 tree:["forest","green","lime","olive","brown"],
 house:["red","brown","cream","gray","green"],
 fish:["blue","turquoise","yellow","orange","red"],
 rocket:["red","orange","yellow","blue","cream"],
 bird:["sky","blue","yellow","orange","brown"],
 bee:["yellow","orange","brown","cream","blue"],
 cloud:["sky","blue","cream","yellow","turquoise"]
};
function artworkPaletteForLevel(level){
 const pilotPalettes={
  501:["purple","pink","blue","turquoise","lime","yellow","cream","red"],
  502:["forest","green","lime","yellow","orange","red","cream","purple"],
  503:["yellow","orange","lime","green","brown","cream","red","turquoise"],
  504:["purple","pink","blue","turquoise","sky","yellow","cream","green"]
 };
 if(pilotPalettes[level.number])return pilotPalettes[level.number];
 if(level.number===1)return ART_PALETTES.frog;
 if(level.number===2)return ART_PALETTES.butterfly;
 if(level.number===3)return ART_PALETTES.flower;
 if(level.number===4)return ART_PALETTES.mushroom;
 if(level.number===5)return ART_PALETTES.acorn;
 if(level.number===6)return ART_PALETTES.snail;
 if(level.number===7)return ART_PALETTES.firefly;
 const motifIndex=(level.number*7+Math.floor(level.number/13))%GENERATED_MOTIFS.length;
 return ART_PALETTES[GENERATED_MOTIFS[motifIndex].type]||ART_PALETTES.frog;
}
function applyPixelArtOutlines(source){
 const board=source.map(row=>row.slice());
 const outside=Array.from({length:SIZE},()=>Array(SIZE).fill(false)),queue=[];
 const add=(x,y)=>{
  if(x<0||y<0||x>=SIZE||y>=SIZE||outside[y][x]||source[y][x])return;
  outside[y][x]=true;queue.push([x,y]);
 };
 for(let x=0;x<SIZE;x++){add(x,0);add(x,SIZE-1);}
 for(let y=0;y<SIZE;y++){add(0,y);add(SIZE-1,y);}
 for(let head=0;head<queue.length;head++){
  const [x,y]=queue[head];
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])add(nx,ny);
 }
 // Black outer silhouette plus restrained internal ink lines. Internal
 // contours are drawn only where a pixel touches at least two distinct
 // neighboring pigments: this traces eyes, limbs, petals and object details
 // without turning every shade transition into a noisy checkerboard.
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const color=source[y][x];
  if(!color)continue;
  const neighbors=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dy)continue;
   const nx=x+dx,ny=y+dy;
   if(nx<0||ny<0||nx>=SIZE||ny>=SIZE)continue;
   const neighbor=source[ny][nx];
   if(neighbor&&neighbor!==color)neighbors.push(neighbor);
  }
  const outerEdge=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([nx,ny])=>
   nx<0||ny<0||nx>=SIZE||ny>=SIZE||outside[ny][nx]
  );
  const internalEdge=new Set(neighbors).size>=2;
  if(outerEdge||internalEdge)board[y][x]="black";
 }
 return board;
}

function mergeSparseArtworkColors(board,minimum=18){
 const totals=new Map();
 for(const row of board)for(const color of row)if(color&&color!=="black")totals.set(color,(totals.get(color)||0)+1);
 const dominant=[...totals].filter(([,count])=>count>=minimum).map(([color,count])=>({color,count}));
 if(!dominant.length){
  const largest=[...totals].sort((a,b)=>b[1]-a[1])[0];
  if(largest)dominant.push({color:largest[0],count:largest[1]});
 }
 const rgb=color=>{const hex=COLORS[color]?.hex||"#000000";return[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16));};
 for(const [rare,count] of [...totals].sort((a,b)=>a[1]-b[1])){
  if(count>=minimum)continue;
  const from=rgb(rare);
  const nearest=dominant.map(item=>{const to=rgb(item.color);const distance=(from[0]-to[0])**2*0.3+(from[1]-to[1])**2*0.59+(from[2]-to[2])**2*0.11;return{...item,distance};}).sort((a,b)=>a.distance-b.distance||b.count-a.count)[0];
  if(!nearest)continue;
  for(const row of board)for(let x=0;x<row.length;x++)if(row[x]===rare)row[x]=nearest.color;
  const target=dominant.find(item=>item.color===nearest.color);if(target)target.count+=count;
 }
 // Black is intentionally excluded from ordinary sparse-pigment merging so
 // authored outlines remain crisp. But a tiny rasterized black fragment cannot
 // form a legal 10-ant squad: fold only sub-ten fragments into the nearest
 // established pigment, preserving larger black contour regions.
 const blackCount=board.reduce((sum,row)=>sum+row.filter(color=>color==="black").length,0);
 if(blackCount>0&&blackCount<10&&dominant.length){
  const from=rgb("black");
  const nearest=dominant.map(item=>{const to=rgb(item.color);const distance=(from[0]-to[0])**2*0.3+(from[1]-to[1])**2*0.59+(from[2]-to[2])**2*0.11;return{...item,distance};}).sort((a,b)=>a.distance-b.distance||b.count-a.count)[0];
  if(nearest)for(const row of board)for(let x=0;x<row.length;x++)if(row[x]==="black")row[x]=nearest.color;
 }
 return board;
}
export function createArtworkBoard(levelId="meadow-01"){
 const level=getLevel(levelId);
 if(!artworkBoardCache.has(level.id)){
  let board;
  if(level.number>=8)board=createComposedArtworkBoard(level.number);
  else{
   const starterType={1:"frog",2:"butterfly",3:"flower",4:"mushroom",5:"acorn",6:"snail",7:"firefly"}[level.number];
   board=createRasterArtworkBoard(starterType,true);
   if(!board)board=level.number===1?createFrogBoard():createButterflyBoard();
  }
  // Keep the tested legacy pixel board as an offline fallback; the browser replaces it with the SVG-derived, non-black block mosaic as soon as the local illustration rasterizes.
  board=applyPixelArtOutlines(board);
  board=mergeSparseArtworkColors(board,18);
  artworkBoardCache.set(level.id,board);
 }
 // Return a fresh mutable board: gameplay clears cells in place, so cached
 // source artwork must never be shared with a running game or another caller.
 return artworkBoardCache.get(level.id).map(row=>row.slice());
}

export const INITIAL_BOARD=createArtworkBoard();
export function buildIncoming(board,levelNumber=1,diagnostics=null){
 const colors=Object.keys(COLORS),work=board.map(row=>row.slice());
 const totals=Object.fromEntries(colors.map(color=>[color,0]));
 for(const row of work)for(const color of row)if(color)totals[color]++;
 const leftTotal=Object.values(totals).reduce((sum,value)=>sum+value,0);
 if(!leftTotal)return [];
 const chunks={},nextChunk={},remaining={...totals};
 for(const color of colors){
  const total=totals[color];if(!total)continue;
  // Keep squads substantial, but deliberately avoid identical arithmetic
  // splits. Uneven sizes make queue order and free-slot planning matter.
  // For a colour with at least 13 cells, ordinary squads stay in 13–30 range;
  // smaller artwork accents remain a single genuinely small squad.
  let count=Math.max(1,Math.ceil(total/22));
  while(count>1&&Math.floor(total/count)<13)count--;
  const base=Math.floor(total/count),extra=total%count;
  const sizes=Array.from({length:count},(_,i)=>base+(i<extra?1:0));
  // Deterministic pairwise transfers create varied counts (e.g. 13, 17, 23)
  // without changing the total budget or producing undersized fragments.
  const colorSeed=[...color].reduce((sum,ch)=>sum+ch.charCodeAt(0),levelNumber||1);
  for(let pair=0;pair+1<sizes.length;pair+=2){
   const a=(pair+(colorSeed%2))%sizes.length,b=(a+1)%sizes.length;
   const donor=(colorSeed+pair)%2===0?a:b,receiver=donor===a?b:a;
   const transfer=Math.min(7,sizes[donor]-13,30-sizes[receiver]);
   if(transfer>0){sizes[donor]-=transfer;sizes[receiver]+=transfer;}
  }
  chunks[color]=sizes;nextChunk[color]=0;
 }
 const active=new Map(),deck=[];let left=leftTotal,lastColor=null,guard=0,decisionStep=0;
 if(diagnostics){diagnostics.maxActiveSquads=0;diagnostics.completed=false;diagnostics.decisions=0;}
 // Generate the deck by simulating the real outside-in game. A colour gets
 // one active squad at a time; it may wait for deeper matching blocks while
 // other colours are cleared, then its next squad enters only after it leaves.
 // Every third decision deliberately considers a colour whose current rim is
 // smaller than its squad. That box is a commitment: it will occupy a starter
 // compartment until other colours uncover enough matching cells. The other
 // decisions favour broad clears, so pressure is tactical rather than random.
 while(left>0&&guard++<SIZE*SIZE*4){
  const exposed=getExposedPixels(work),counts=Object.fromEntries(colors.map(color=>[color,0]));
  for(const point of exposed){const color=work[point.y][point.x];if(color)counts[color]++;}
  // Keep already-running squads eligible, but also admit newly exposed
  // colours in the same decision round. Otherwise a large dominant colour
  // can monopolize the generator while other playable colours are ignored.
  let candidates=colors.filter(color=>
   (active.has(color)||((nextChunk[color]||0)<(chunks[color]?.length||0)))&&counts[color]>0
  );
  if(!candidates.length)throw new Error("Artwork queue has no playable colour while blocks remain");
  const alternatives=candidates.filter(color=>color!==lastColor);
  if(alternatives.length)candidates=alternatives;
  // Keep a reserve starter slot for recovery. Deliberate waiting squads are
  // introduced only while at least two slots remain available; once four
  // colours are already waiting, prefer an existing squad or a new colour
  // that can be cleared in this exposed layer.
  const pressureTurn=levelNumber>=8&&decisionStep%3===2&&active.size<SLOT_COUNT-1;
  if(active.size>=SLOT_COUNT-1){
   const safeCandidates=candidates.filter(color=>{
    const size=active.has(color)?active.get(color):chunks[color][nextChunk[color]];
    return active.has(color)||size<=counts[color];
   });
   if(safeCandidates.length)candidates=safeCandidates;
  }
  const pressure=candidates.filter(color=>{
   const size=active.has(color)?active.get(color):chunks[color][nextChunk[color]];
   return Number.isFinite(size)&&size>counts[color];
  });
  if(pressureTurn&&pressure.length){
   pressure.sort((a,b)=>(counts[a]/(active.has(a)?active.get(a):chunks[a][nextChunk[a]]))-
    (counts[b]/(active.has(b)?active.get(b):chunks[b][nextChunk[b]]))||counts[a]-counts[b]);
   candidates=pressure;
  }else candidates.sort((a,b)=>counts[b]-counts[a]||colors.indexOf(a)-colors.indexOf(b));
  const color=candidates[0];
  if(!active.has(color)){
   const size=chunks[color][nextChunk[color]++];
   deck.push({color,ants:size});
   active.set(color,size);
  }
  const available=active.get(color);
  const batch=exposed.filter(point=>work[point.y][point.x]===color).slice(0,available);
  if(!batch.length)throw new Error("Artwork queue produced an empty active squad");
  for(const point of batch){work[point.y][point.x]="";left--;}
  const remainingAnts=available-batch.length;
  if(remainingAnts===0)active.delete(color);else active.set(color,remainingAnts);
  lastColor=color;decisionStep++;
  if(diagnostics){diagnostics.maxActiveSquads=Math.max(diagnostics.maxActiveSquads,active.size);diagnostics.decisions=decisionStep;}
 }
 if(left>0)throw new Error("Artwork queue stopped before every block was assigned");
 if(diagnostics)diagnostics.completed=left===0;
 // Keep two genuinely playable opening choices, then place one future-layer
 // colour in the third lane as a deliberate planning temptation.
 const openingColors=new Set(getExposedPixels(board).map(point=>board[point.y][point.x]));
 const decoyIndex=deck.findIndex((box,index)=>index>=2&&!openingColors.has(box.color));
 if(decoyIndex>2){const [decoy]=deck.splice(decoyIndex,1);deck.splice(2,0,decoy);}
 return deck;
}
function createLevelObstacles(levelId,board){
 const number=getLevel(levelId).number;
 if(number<26)return [];
 const count=number<51?1:number<151?2:number<301?3:4;
 const roles=count===1?["builder"]:count===2?["builder","warrior"]:count===3?["builder","warrior","builder"]:["builder","warrior","builder","warrior"];
 const hp=number>=301?15:number>=151?12:10;
 const candidates=getExposedPixels(board).slice();
 if(!candidates.length)return [];
 const selected=[candidates[0]];
 while(selected.length<Math.min(count,candidates.length)){
  let best=null,bestDistance=-1;
  for(const point of candidates){
   if(selected.some(item=>item.x===point.x&&item.y===point.y))continue;
   const distance=Math.min(...selected.map(item=>Math.abs(item.x-point.x)+Math.abs(item.y-point.y)));
   if(distance>bestDistance){bestDistance=distance;best=point;}
  }
  if(!best)break;
  selected.push(best);
 }
 return selected.map((point,index)=>({
  id:"obstacle-"+getLevel(levelId).number+"-"+(index+1),
  x:point.x,y:point.y,role:roles[index],hp,maxHp:hp,
  kind:roles[index]==="builder"?(number>=301?"stone":"roots"):number>=301?"wasp":number>=151?"spider":"beetle"
 }));
}
const incomingCache=new Map();
export function setArtworkBoard(levelId,board){
 const id=getLevel(levelId).id;
 if(!Array.isArray(board)||board.length!==SIZE||board.some(row=>!Array.isArray(row)||row.length!==SIZE))throw new Error("Artwork board must be a 35×35 grid");
 const normalized=mergeSparseArtworkColors(board.map(row=>row.slice()),18);
 artworkBoardCache.set(id,normalized);
 incomingCache.delete(id);
}
export function getIncoming(levelId="meadow-01"){
 const id=getLevel(levelId).id;
 if(!incomingCache.has(id)){
  const board=createArtworkBoard(id),obstacles=createLevelObstacles(id,board);
  const deck=buildIncoming(board,getLevel(id).number);
  const roleBoxes=[];
  for(const role of ["builder","warrior"]){
   const ants=obstacles.filter(item=>item.role===role).reduce((sum,item)=>sum+item.hp,0);
   if(ants)roleBoxes.push({color:role==="builder"?"orange":"red",ants,role,special:"specialist"});
  }
  deck.unshift(...roleBoxes);
  const start=deck.length>=14?LINKED_BOX_START:deck.length>=11?9:3;
  if(deck.length>start+1){
   deck[start]={...deck[start],special:"linked",pairId:id+"-linked"};
   deck[start+1]={...deck[start+1],special:"linked",pairId:id+"-linked"};
  }
  incomingCache.set(id,deck);
 }
 return incomingCache.get(id);
}
export function getLinkedPair(levelId="meadow-01"){
 const pair=getIncoming(levelId).filter(box=>box.special==="linked");
 return pair.length===2?pair.map(box=>getIncoming(levelId).indexOf(box)):[];
}
export function getLinkedPartner(levelId,index){
 const pair=getLinkedPair(levelId);
 return pair.includes(index)?pair.find(value=>value!==index):null;
}
export const INCOMING=getIncoming();
export function createGame(levelId="meadow-01"){
 const board=createArtworkBoard(levelId);
 return {levelId:getLevel(levelId).id,board,obstacles:createLevelObstacles(levelId,board),slots:Array(SLOT_COUNT).fill(null),
  tray:Array.from({length:TRAY_SIZE},(_,row)=>Array.from({length:TRAY_SIZE},(_,col)=>row*TRAY_SIZE+col)),
  nextContainer:TRAY_SIZE*TRAY_SIZE,remaining:board.reduce((sum,row)=>sum+row.filter(Boolean).length,0),won:false,lost:false,resolving:false,
  activeSlot:-1,activeTarget:null,activeSlots:[],sortedBoxes:0,
  lockedBoxOpen:false,lockProgressColumns:[],pendingLinkedIndex:null,
  message:"Открывай рисунок слоями: выпускай только муравьёв цвета доступного края. Один отряд каждого цвета за раз.",resolutionLog:[]};
}
export function getExposedPixels(board){
 const height=board.length,width=Math.max(0,...board.map(row=>row.length));
 const visited=Array.from({length:height},()=>Array(width).fill(false));
 const queue=[];
 const addEmpty=(x,y)=>{
  if(x<0||y<0||x>=width||y>=height||visited[y][x]||board[y]?.[x])return;
  visited[y][x]=true;queue.push([x,y]);
 };
 for(let x=0;x<width;x++){addEmpty(x,0);addEmpty(x,height-1);}
 for(let y=0;y<height;y++){addEmpty(0,y);addEmpty(width-1,y);}
 const exposed=new Set();
 for(let head=0;head<queue.length;head++){
  const [x,y]=queue[head];
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(nx<0||ny<0||nx>=width||ny>=height)continue;
   if(board[ny]?.[nx])exposed.add(nx+","+ny);else addEmpty(nx,ny);
  }
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(board[y]?.[x]&&(x===0||y===0||x===width-1||y===height-1))exposed.add(x+","+y);
 return [...exposed].map(key=>{const [x,y]=key.split(",").map(Number);return{x,y};});
}
export function getExposedTargets(state){
 const board=state.board,obstacles=state.obstacles||[],height=board.length,width=Math.max(0,...board.map(row=>row.length));
 const obstacleMap=new Map(obstacles.map(item=>[item.x+","+item.y,item]));
 const visited=Array.from({length:height},()=>Array(width).fill(false)),queue=[],targets=new Map();
 const occupied=(x,y)=>!!board[y]?.[x]||obstacleMap.has(x+","+y);
 const addEmpty=(x,y)=>{
  if(x<0||y<0||x>=width||y>=height||visited[y][x]||occupied(x,y))return;
  visited[y][x]=true;queue.push([x,y]);
 };
 const expose=(x,y)=>{
  const key=x+","+y,obstacle=obstacleMap.get(key);
  if(obstacle)targets.set(key,{...obstacle,kind:"obstacle"});
  else if(board[y]?.[x])targets.set(key,{x,y,kind:"pixel",color:board[y][x]});
 };
 for(let x=0;x<width;x++){addEmpty(x,0);addEmpty(x,height-1);}
 for(let y=0;y<height;y++){addEmpty(0,y);addEmpty(width-1,y);}
 for(let head=0;head<queue.length;head++){
  const [x,y]=queue[head];
  for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(nx<0||ny<0||nx>=width||ny>=height)continue;
   if(occupied(nx,ny))expose(nx,ny);else addEmpty(nx,ny);
  }
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(occupied(x,y)&&(x===0||y===0||x===width-1||y===height-1))expose(x,y);
 return [...targets.values()];
}
export function isGameComplete(state){
 return state.remaining<=0&&!(state.obstacles?.length);
}
export function isAccessible(board,x,y){
 if(!board[y]?.[x])return false;
 return getExposedPixels(board).some(point=>point.x===x&&point.y===y);
}
export function findAccessiblePixel(board,color){
 return findAccessiblePixels(board,color,1)[0]||null;
}
export function findAccessiblePixels(board,color,limit=Infinity){
 const exposed=getExposedPixels(board),found=[];
 for(const {x,y} of exposed)if(board[y][x]===color){found.push({x,y});if(found.length>=limit)return found;}
 return found;
}
export function findAntWave(state,reservedTargets=new Set(),pendingBySlot=new Map(),maxMoves=Infinity){
 if(maxMoves<=0)return[];
 const byColor=new Map(),byRole=new Map(),wave=[],cursor=new Map(),exposed=getExposedTargets(state);
 for(const target of exposed){
  const key=target.x+","+target.y;if(reservedTargets.has(key))continue;
  if(target.kind==="obstacle"){
   if(!byRole.has(target.role))byRole.set(target.role,[]);
   byRole.get(target.role).push(target);
  }else{
   if(!byColor.has(target.color))byColor.set(target.color,[]);
   byColor.get(target.color).push(target);
  }
 }
 const supplies=state.slots.map((box,slot)=>({slot,color:box?.color,role:box?.role,remaining:box&&box.ants>0&&box.status!=="departing"?Math.max(0,box.ants-(pendingBySlot.get(slot)||0)):0,assigned:0}));
 const scheduleOne=supply=>{
  if(!supply.remaining||supply.assigned>=supply.remaining)return false;
  const targets=supply.role?byRole.get(supply.role)||[]:byColor.get(supply.color)||[],key=supply.role||supply.color,index=cursor.get(key)||0;
  if(index>=targets.length)return false;
  const target=targets[index];
  wave.push({slot:supply.slot,color:supply.color,role:supply.role,target:target.kind==="pixel"?{x:target.x,y:target.y}:target});
  cursor.set(key,index+1);supply.assigned++;
  return true;
 };
 // Every eligible starter box gets its own first dispatch before any box receives a second.
 // A shared colour cursor prevents duplicate targets, not one box waiting behind another.
 for(const supply of supplies){
  if(wave.length>=maxMoves)break;
  scheduleOne(supply);
 }
 // Continue in fair rounds while each box still has ants and matching exposed pixels remain.
 while(wave.length<maxMoves){
  let scheduled=false;
  for(const supply of supplies){
   if(wave.length>=maxMoves)break;
   if(scheduleOne(supply))scheduled=true;
  }
  if(!scheduled)break;
 }
 return wave;
}
export function countOutboundBySlot(workers){
 const pending=new Map();
 for(const worker of workers.values())if(worker.phase==="outbound")pending.set(worker.slot,(pending.get(worker.slot)||0)+1);
 return pending;
}
export function countQueuedBySlot(workers){
 const pending=new Map();
 for(const worker of workers.values())if(worker.phase==="queued")pending.set(worker.slot,(pending.get(worker.slot)||0)+1);
 return pending;
}
/** Queued and outbound ants occupy dispatch capacity; returning ants do not. */
export function countDispatchingWorkers(workers){
 let count=0;
 for(const worker of workers.values())if(worker.phase==="queued"||worker.phase==="outbound")count++;
 return count;
}
export function countSlotWorkers(workers,slot){
 let count=0;for(const worker of workers.values())if(worker.slot===slot)count++;
 return count;
}
export function canDepartSlot(workers,slot){return countSlotWorkers(workers,slot)===0;}
export function freeSlotCount(state){return state.slots.filter(slot=>slot===null).length;}
export function canChoose(state){
 return !state.won&&!state.lost&&freeSlotCount(state)>0&&state.tray[0].some(index=>index!==null);
}
export function isLockedBox(state,index){
 return index===LOCKED_BOX_INDEX&&!state.lockedBoxOpen;
}
// A crate is a move only when its target type is on the currently exposed
// frontier. One active squad per color/role prevents duplicate crates from
// flooding the five starter cells while a different layer is needed.
export function canLaunchBox(state,index){
 const incoming=getIncoming(state.levelId),box=incoming[index];
 if(!box||isLockedBox(state,index))return false;
 const exposed=getExposedTargets(state);
 const hasTarget=candidate=>candidate.role
  ?exposed.some(target=>target.kind==="obstacle"&&target.role===candidate.role)
  :exposed.some(target=>target.kind==="pixel"&&target.color===candidate.color);
 if(box.special==="linked"){
  const partnerIndex=getLinkedPartner(state.levelId,index),partner=incoming[partnerIndex];
  return !!partner&&hasTarget(box)&&hasTarget(partner);
 }
 // Several squads of one color may work concurrently. The wave planner
 // shares the exposed-target cursor so they never claim the same pixel.
 return hasTarget(box);
}
// Correct only a vertical-lane collision; never promote a crate or change its queue depth.
export function normalizeLinkedTray(state){
 if(!state?.tray)return false;
 const pair=getLinkedPair(state.levelId);if(pair.length!==2)return false;
 const locate=index=>{
  for(let row=0;row<TRAY_SIZE;row++)for(let col=0;col<TRAY_SIZE;col++)if(state.tray[row][col]===index)return{row,col,index};
  return null;
 };
 const first=locate(pair[0]),second=locate(pair[1]);
 if(!first||!second||first.col!==second.col)return false;
 // Keep each crate at its existing queue depth; only move the partner sideways
 // when both linked crates would otherwise share one vertical lane.
 const targetCol=[0,1,2].find(col=>col!==first.col);
 if(targetCol===undefined)return false;
 const moving=second,displaced=state.tray[moving.row][targetCol];
 state.tray[moving.row][targetCol]=moving.index;
 state.tray[moving.row][first.col]=displaced;
 return true;
}
export function chooseTopColumn(state,column){
 if(!canChoose(state)||!Number.isInteger(column)||column<0||column>=TRAY_SIZE)return false;
 const selectedIndex=state.tray[0][column],incoming=getIncoming(state.levelId);
 if(selectedIndex===null||selectedIndex===undefined||isLockedBox(state,selectedIndex))return false;
 const box=incoming[selectedIndex];if(!box)return false;
 const freeSlots=state.slots.map((slot,index)=>slot===null?index:-1).filter(index=>index>=0);
 const shiftColumn=lane=>{
  state.tray[0][lane]=state.tray[1][lane];state.tray[1][lane]=state.tray[2][lane];
  state.tray[2][lane]=state.nextContainer<incoming.length?state.nextContainer:null;
  if(state.nextContainer<incoming.length)state.nextContainer++;
 };
 if(box.special==="linked"){
  const partnerIndex=getLinkedPartner(state.levelId,selectedIndex),partnerColumn=state.tray[0].findIndex(index=>index===partnerIndex);
  if(partnerColumn===column)return false;
  const partnerBox=incoming[partnerIndex];
  if(!partnerBox||partnerBox.special!=="linked"||partnerBox.pairId!==box.pairId)return false;
  if(freeSlots.length===1||partnerColumn<0){
   const freeSlot=freeSlots[0];state.slots[freeSlot]={...box,sourceIndex:selectedIndex};
   shiftColumn(column);normalizeLinkedTray(state);state.pendingLinkedIndex=null;
   state.message="Первая часть связки отправлена. Вторая останется в очереди и сможет занять следующий свободный отсек.";
   return true;
  }
  if(freeSlots.length<2)return false;
  const placements=[{slot:freeSlots[0],index:selectedIndex,crate:box},{slot:freeSlots[1],index:partnerIndex,crate:partnerBox}];
  for(const item of placements)state.slots[item.slot]={...item.crate,sourceIndex:item.index};
  shiftColumn(column);shiftColumn(partnerColumn);normalizeLinkedTray(state);state.pendingLinkedIndex=null;
  state.message="Связанная пара отправлена вместе — оба бокса заняли стартовые отсеки!";
  return true;
 }
 if(state.pendingLinkedIndex!==null&&state.pendingLinkedIndex!==undefined)return false;
 const freeSlot=freeSlots[0];if(freeSlot===undefined)return false;
 state.slots[freeSlot]={...box,sourceIndex:selectedIndex};
 // Only ordinary boxes from two distinct lanes contribute to the sealed crate.
 if(!box.special&&selectedIndex!==LOCKED_BOX_INDEX&&column!==LOCKED_BOX_COLUMN){
  const openedFrom=[...new Set(state.lockProgressColumns||[])];if(!openedFrom.includes(column))openedFrom.push(column);
  state.lockProgressColumns=openedFrom;if(openedFrom.length>=2){state.lockedBoxOpen=true;state.message="Щёлк! Пломба снята — закрытый бокс открыт!";}
 }
 shiftColumn(column);normalizeLinkedTray(state);state.pendingLinkedIndex=null;
 state.message=`${box.role==="builder"?"Муравьи-строители":box.role==="warrior"?"Муравьи-воины":COLORS[box.color].name}: бокс отправлен в стартовый отсек ${freeSlot+1}`;
 return true;
}
export function findNextMove(state){
 const targets=getExposedTargets(state);
 for(let slot=0;slot<SLOT_COUNT;slot++){
  const box=state.slots[slot];
  if(box&&box.ants>0&&box.status!=="departing"){
   const target=targets.find(item=>box.role?item.kind==="obstacle"&&item.role===box.role:item.kind==="pixel"&&item.color===box.color);
   if(target)return{slot,target:target.kind==="pixel"?{x:target.x,y:target.y}:target};
  }
 }
 return null;
}
export function applyAntMove(state,slot,target){
 const box=state.slots[slot];
 if(!box||box.ants<=0||box.status==="departing")return false;
 if(target.kind==="obstacle"){
  const obstacle=state.obstacles?.find(item=>item.x===target.x&&item.y===target.y&&item.role===box.role);
  if(!obstacle)return false;
  obstacle.hp--;
  if(obstacle.hp<=0)state.obstacles=state.obstacles.filter(item=>item!==obstacle);
 }else{
  if(box.role||state.board[target.y]?.[target.x]!==box.color)return false;
  state.board[target.y][target.x]="";state.remaining--;
 }
 box.ants--;
 state.resolutionLog.push({slot,color:box.color,role:box.role||null,x:target.x,y:target.y,kind:target.kind||"pixel"});
 if(state.resolutionLog.length>300)state.resolutionLog.splice(0,100);
 if(box.ants<=0){
  if(box.pairId){
   const partner=state.slots.find((other,index)=>index!==slot&&other?.pairId===box.pairId);
   if(partner&&partner.ants>0)box.status="waiting-linked";
   else{
    box.status="departing";
    if(partner&&partner.ants<=0)partner.status="departing";
   }
  }else box.status="departing";
 }
 if(box.pairId&&box.ants<=0){
  const partner=state.slots.find((other,index)=>index!==slot&&other?.pairId===box.pairId);
  if(partner&&partner.ants<=0){box.status="departing";partner.status="departing";}
 }
 return true;
}
/** Browser runtime pickup: the ant count was already deducted when it left its box. */
export function applyAntPickup(state,slot,target,color,role=null){
 if(target.kind==="obstacle"){
  const obstacle=state.obstacles?.find(item=>item.x===target.x&&item.y===target.y&&item.role===role);
  if(!obstacle)return false;
  obstacle.hp--;
  if(obstacle.hp<=0)state.obstacles=state.obstacles.filter(item=>item!==obstacle);
  state.resolutionLog.push({slot,color,role,x:target.x,y:target.y,kind:"obstacle"});
 }else{
  if(role||state.board[target.y]?.[target.x]!==color)return false;
  state.board[target.y][target.x]="";state.remaining--;
  state.resolutionLog.push({slot,color,x:target.x,y:target.y,kind:"pixel"});
 }
 if(state.resolutionLog.length>300)state.resolutionLog.splice(0,100);
 return true;
}
export function completeBoxDeparture(state,slot){
 const box=state.slots[slot];if(!box||box.ants>0)return false;
 if(box.pairId){
  const partnerSlot=state.slots.findIndex((other,index)=>index!==slot&&other?.pairId===box.pairId);
  if(partnerSlot<0){state.slots[slot]=null;state.sortedBoxes=(state.sortedBoxes||0)+1;return true;}
  const partner=state.slots[partnerSlot];
  if(!partner||partner.ants>0)return false;
  box.status="departing";partner.status="departing";
  state.slots[slot]=null;state.slots[partnerSlot]=null;state.sortedBoxes=(state.sortedBoxes||0)+2;
  return true;
 }
 state.slots[slot]=null;state.sortedBoxes=(state.sortedBoxes||0)+1;return true;
}
export function isDefeat(state){
 if(freeSlotCount(state)>0||isGameComplete(state))return false;
 return !findNextMove(state);
}
export function resolveAll(state){
 if(state.won||state.lost)return state;
 let move=findNextMove(state);
 while(move&&!isGameComplete(state)){
  applyAntMove(state,move.slot,move.target);
  const box=state.slots[move.slot];if(box?.status==="departing")completeBoxDeparture(state,move.slot);
  move=findNextMove(state);
 }
 if(isGameComplete(state)){state.won=true;state.message="Победа! Большой пиксельный портрет собран ✨";}
 else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, ходов больше нет.";}
 return state;
}
export function serializeGame(state){
 return {levelId:state.levelId||"meadow-01",board:state.board,obstacles:state.obstacles||[],slots:state.slots,tray:state.tray,nextContainer:state.nextContainer,
  remaining:state.remaining,won:state.won,lost:state.lost,sortedBoxes:state.sortedBoxes||0,
  lockedBoxOpen:!!state.lockedBoxOpen,lockProgressColumns:[...(state.lockProgressColumns||[])],pendingLinkedIndex:state.pendingLinkedIndex??null,resolutionLog:state.resolutionLog.slice(-300)};
}
export function restoreGame(saved){
 const fresh=createGame(saved?.levelId||"meadow-01"),incoming=getIncoming(fresh.levelId);
 if(!saved||!Array.isArray(saved.board)||saved.board.length!==SIZE||!saved.board.every(row=>Array.isArray(row)&&row.length===SIZE)||!Array.isArray(saved.slots)||saved.slots.length!==SLOT_COUNT)return fresh;
 let tray=saved.tray;
 if(!Array.isArray(tray)||tray.length!==TRAY_SIZE||!tray.every(row=>Array.isArray(row)&&row.length===TRAY_SIZE)){
  const legacy=Array.isArray(saved.candidates)?saved.candidates:[];
  let next=saved.nextContainer??0;
  tray=Array.from({length:TRAY_SIZE},(_,r)=>Array.from({length:TRAY_SIZE},(_,c)=>{
   const old=legacy[r*TRAY_SIZE+c];if(old!==undefined)return old;
   return next<incoming.length?next++:null;
  }));
 }
 return {...fresh,...saved,tray,obstacles:Array.isArray(saved.obstacles)?saved.obstacles.map(item=>({...item})):fresh.obstacles,sortedBoxes:saved.sortedBoxes||0,
  lockedBoxOpen:!!saved.lockedBoxOpen,lockProgressColumns:[...new Set((saved.lockProgressColumns||[]).filter(column=>column===0||column===1))],
  pendingLinkedIndex:null,
  slots:(()=>{const restored=saved.slots.map(box=>box?{...box}:null);for(let i=0;i<restored.length;i++){const box=restored[i];if(!box||box.ants>0)continue;if(box.pairId){const partner=restored.find((other,index)=>index!==i&&other?.pairId===box.pairId);if(partner&&partner.ants>0)box.status="waiting-linked";else{box.status="departing";if(partner&&partner.ants<=0)partner.status="departing";}}else box.status="departing";}return restored;})(),
  resolving:false,activeSlot:-1,activeTarget:null,activeSlots:[],
  message:saved.won?"Победа! Полянка собрана ✨":saved.lost?"Поражение: пять стартовых отсеков заняты, ходов больше нет.":"Выбери бокс — каждый муравей унесёт один крупный цветной блок"};
}
