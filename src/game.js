export const SIZE=35;
export const GRID_SIZE=350;
export const BLOCK_SIZE=GRID_SIZE/SIZE;
export const BOX_CAPACITY=60;
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
  const px=(x+.5)*250/SIZE,py=(y+.5)*250/SIZE;
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
 {type:"cloud",name:"Облачко",emoji:"☁️"}
];
const GENERATED_ART_PALETTES={
 flower:["green","pink","yellow","lime","orange"],
 tree:["brown","green","lime","yellow","red"],
 mushroom:["cream","red","cream","brown","green"],
 butterfly:["brown","blue","pink","yellow","purple"],
 house:["cream","red","brown","sky","green"],
 fish:["brown","turquoise","orange","yellow","black"],
 snail:["green","brown","orange","cream","black"],
 rocket:["orange","cream","red","blue","sky"],
 bird:["brown","sky","blue","orange","black"],
 acorn:["brown","brown","orange","green","yellow"],
 bee:["black","yellow","cream","black","brown"],
 cloud:["sky","sky","yellow","orange","cream"]
};
const GENERATED_CHAPTERS=[
 "Светлячковая роща","Тихий ручей","Солнечная опушка","Старый дуб",
 "Мшистые холмы","Лунный сад","Долина огоньков","Затерянная тропа",
 "Сказочная чаща","Большой лес"
];
function generatedPartCount(number){
 if(number<26)return 1;
 if(number<76)return 2;
 if(number<151)return number%3===0?3:2;
 if(number<301)return 3;
 return 4;
}
function generatedChapter(number){
 if(number<=50)return "Светлячковая роща";
 return GENERATED_CHAPTERS[Math.min(9,Math.floor((number-51)/50)+1)];
}
const GENERATED_LEVELS=Array.from({length:493},(_,index)=>{
 const number=index+8,count=generatedPartCount(number);
 const motifs=Array.from({length:count},(_,part)=>GENERATED_MOTIFS[(number*7+part*5+Math.floor(number/13))%GENERATED_MOTIFS.length]);
 const names=motifs.map(item=>item.name);
 const name=names.length===1?names[0]+" на полянке":names.slice(0,-1).join(", ")+" и "+names[names.length-1];
 const artworkHint=count===1?"Знакомимся с новым силуэтом и цветовыми слоями":count===2?"Две самостоятельные картинки на одном поле — следи за цветами обоих рисунков":count===3?"Три части общей картины: планируй очередь для каждой":"Четыре объекта на одном поле — продумывай порядок открытия";
 const obstacleHint=number>=301?"Корни, камни и осы: чередуй строителей и военных, у преград несколько уровней прочности":number>=151?"Корневые завалы и пауки-стражи: сначала расчисти путь специалистами":number>=51?"На рисунке есть жук-страж — военные прогонят его, строители разбирают корни":number>=26?"Корневой завал закрывает цветной блок — отправь к нему муравьёв-строителей":"";
 return {id:"meadow-"+String(number).padStart(3,"0"),number,chapter:generatedChapter(number),name,emoji:motifs[0].emoji,hint:obstacleHint?artworkHint+" · "+obstacleHint:artworkHint};
});
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
 }
 return -1;
}
function generatedSceneLayout(count,variant){
 const layouts={
  1:[[[5,3,25,29]]],
  2:[
   [[1,5,23,28],[23,15,12,17]],
   [[2,2,18,24],[19,15,15,18]],
   [[1,15,16,18],[16,2,18,25]]
  ],
  3:[
   [[8,7,19,24],[0,0,13,14],[22,0,13,14]],
   [[1,7,18,23],[20,0,15,14],[21,20,14,14]],
   [[16,7,18,23],[0,0,14,14],[0,20,14,14]]
  ],
  4:[
   [[9,7,17,21],[0,0,13,14],[22,0,13,14],[1,23,13,11]],
   [[1,7,18,23],[20,0,15,14],[21,20,14,14],[0,0,10,10]],
   [[9,7,18,22],[0,14,12,16],[23,14,12,16],[12,0,11,10]]
  ]
 };
 const choices=layouts[count]||layouts[4];
 return choices[variant%choices.length];
}
function createComposedArtworkBoard(number){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 const count=generatedPartCount(number),layoutVariant=(number+Math.floor(number/11))%3;
 const placements=generatedSceneLayout(count,layoutVariant);
 for(let part=0;part<count;part++){
  const motifIndex=(number*7+part*5+Math.floor(number/13))%GENERATED_MOTIFS.length;
  const motif=GENERATED_MOTIFS[motifIndex],variant=number*37+part*113;
  const palette=GENERATED_ART_PALETTES[motif.type]||GENERATED_ART_PALETTES.flower;
  const [ox,oy,width,height]=placements[part];
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
   const zone=generatedMotifZone(motif.type,(px+.5)/width,(py+.5)/height,variant);
   if(zone<0)continue;
   const x=ox+px,y=oy+py;
   if(x<0||y<0||x>=SIZE||y>=SIZE)continue;
   board[y][x]=palette[zone]||palette[0];
  }
 }
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
 // One deliberate dark contour around the silhouette; interior color clusters
 // remain intact so each object reads as a hand-built pixel illustration.
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  if(!source[y][x])continue;
  const edge=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([nx,ny])=>
   nx<0||ny<0||nx>=SIZE||ny>=SIZE||!source[ny][nx]
  );
  if(edge)board[y][x]="black";
 }
 return board;
}

export function createArtworkBoard(levelId="meadow-01"){
 const level=getLevel(levelId);
 if(!artworkBoardCache.has(level.id)){
  let board;
  if(level.number>=8)board=createComposedArtworkBoard(level.number);
  else if(level.id==="garden-02")board=createButterflyBoard();
  else if(level.id==="garden-03")board=createFlowerBoard();
  else if(level.id==="forest-04")board=createMushroomBoard();
  else if(level.id==="forest-05")board=createAcornBoard();
  else if(level.id==="forest-06")board=createSnailBoard();
  else if(level.id==="forest-07")board=createFireflyBoard();
  else board=createFrogBoard();
  board=applyPixelArtOutlines(board);
  artworkBoardCache.set(level.id,board);
 }
 // Return a fresh mutable board: gameplay clears cells in place, so cached
 // source artwork must never be shared with a running game or another caller.
 return artworkBoardCache.get(level.id).map(row=>row.slice());
}

export const INITIAL_BOARD=createArtworkBoard();
export function buildIncoming(board,levelNumber=1){
 const totals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 let boardSeed=2166136261;
 for(const row of board)for(const color of row){
  const code=color?Object.keys(COLORS).indexOf(color)+1:0;
  boardSeed=Math.imul(boardSeed^code,16777619)>>>0;
  if(color)totals[color]++;
 }
 const colors=Object.keys(COLORS),queues={};
 for(const color of colors){
  const total=totals[color];
  if(!total){queues[color]=[];continue;}
  const count=Math.max(1,Math.ceil(total/(levelNumber>=8?18:36))),base=Math.floor(total/count),minimum=Math.min(10,Math.max(1,Math.floor(total/count)));
  let seed=(boardSeed^color.charCodeAt(0)*2654435761)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const spread=Math.max(6,Math.min(22,Math.round(base*.58)));
  const sizes=Array.from({length:count},()=>Math.max(minimum,Math.min(BOX_CAPACITY,base+Math.round((random()*2-1)*spread))));
  let difference=total-sizes.reduce((sum,value)=>sum+value,0),cursor=Math.floor(random()*count);
  while(difference!==0){
   const index=cursor++%count;
   if(difference>0&&sizes[index]<BOX_CAPACITY){sizes[index]++;difference--;}
   else if(difference<0&&sizes[index]>minimum){sizes[index]--;difference++;}
  }
  if(sizes.length>=3&&new Set(sizes).size===1){sizes[0]++;sizes[1]--;}
  queues[color]=sizes.map(ants=>({color,ants}));
 }
 const deck=[];
 let pending=true,round=0;
 while(pending){
  pending=false;
  const order=round%2?colors.slice().reverse():colors;
  for(const color of order){const box=queues[color].shift();if(box){deck.push(box);pending=true;}}
  round++;
 }
 return deck;
}
function createLevelObstacles(levelId,board){
 const number=getLevel(levelId).number;
 if(number<26)return [];
 const count=number<51?1:number<151?2:number<301?3:4;
 const roles=count===1?["builder"]:count===2?["builder","warrior"]:count===3?["builder","warrior","builder"]:["builder","warrior","builder","warrior"];
 const hp=number>=151?3:2;
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
  message:"Собирай рисунок снаружи внутрь — внутренние блоки откроются следом",resolutionLog:[]};
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
  if(partnerColumn<0||partnerColumn===column||freeSlots.length<2)return false;
  const partnerBox=incoming[partnerIndex];
  if(!partnerBox||partnerBox.special!=="linked"||partnerBox.pairId!==box.pairId)return false;
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
