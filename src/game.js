export const SIZE=35;
export const GRID_SIZE=350;
export const BLOCK_SIZE=GRID_SIZE/SIZE;
export const BOX_CAPACITY=60;
export const SLOT_COUNT=5;
export const TRAY_SIZE=3;
export const COLORS={
 red:{hex:"#e96f67",name:"Коралловые",short:"КР"},
 blue:{hex:"#68b5e8",name:"Голубые",short:"ГЛ"},
 yellow:{hex:"#f2c95e",name:"Солнечные",short:"ЖЛ"},
 green:{hex:"#78b982",name:"Зелёные",short:"ЗЛ"},
 purple:{hex:"#9878d4",name:"Сиреневые",short:"СР"}
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

export const LEVELS=[
 {id:"meadow-01",number:1,chapter:"Зелёная поляна",name:"Портрет лягушонка",emoji:"🐸",hint:"Знакомство с цветными боксами и пятью отсеками"},
 {id:"garden-02",number:2,chapter:"Цветочный сад",name:"Бабочка на ветру",emoji:"🦋",hint:"Новые сочетания цветов и более длинная очередь"},
 {id:"garden-03",number:3,chapter:"Цветочный сад",name:"Солнечный цветок",emoji:"🌻",hint:"Учимся открывать центральные блоки постепенно"},
 {id:"forest-04",number:4,chapter:"Грибной лес",name:"Красная шляпка",emoji:"🍄",hint:"Новый силуэт и более плотные цветовые группы"},
 {id:"forest-05",number:5,chapter:"Грибной лес",name:"Жёлудь для запаса",emoji:"🌰",hint:"Собираем осеннюю находку из пяти цветов"},
 {id:"forest-06",number:6,chapter:"Грибной лес",name:"Улитка-путешественница",emoji:"🐌",hint:"Финальная картинка первой маленькой главы"}
];
export function getLevel(levelId="meadow-01"){
 return LEVELS.find(level=>level.id===levelId)||LEVELS[0];
}
export function createArtworkBoard(levelId="meadow-01"){
 const id=getLevel(levelId).id;
 if(id==="garden-02")return createButterflyBoard();
 if(id==="garden-03")return createFlowerBoard();
 if(id==="forest-04")return createMushroomBoard();
 if(id==="forest-05")return createAcornBoard();
 if(id==="forest-06")return createSnailBoard();
 return createFrogBoard();
}

export const INITIAL_BOARD=createArtworkBoard();
function buildIncoming(board){
 const totals={red:0,blue:0,yellow:0,green:0,purple:0};
 for(const row of board)for(const color of row)if(color)totals[color]++;
 const colors=["green","blue","purple","yellow","red"],queues={};
 for(const color of colors){
  queues[color]=[];let left=totals[color];
  while(left>0){const blocks=Math.min(BOX_CAPACITY,left);queues[color].push({color,ants:blocks});left-=blocks;}
 }
 const deck=[];
 let pending=true;
 while(pending){pending=false;for(const color of colors){const box=queues[color].shift();if(box){deck.push(box);pending=true;}}}
 return deck;
}
const incomingCache=new Map();
export function getIncoming(levelId="meadow-01"){
 const id=getLevel(levelId).id;
 if(!incomingCache.has(id))incomingCache.set(id,buildIncoming(createArtworkBoard(id)));
 return incomingCache.get(id);
}
export const INCOMING=getIncoming();
export function createGame(levelId="meadow-01"){
 const board=createArtworkBoard(levelId);
 return {levelId:getLevel(levelId).id,board,slots:Array(SLOT_COUNT).fill(null),
  tray:Array.from({length:TRAY_SIZE},(_,row)=>Array.from({length:TRAY_SIZE},(_,col)=>row*TRAY_SIZE+col)),
  nextContainer:TRAY_SIZE*TRAY_SIZE,remaining:board.reduce((sum,row)=>sum+row.filter(Boolean).length,0),won:false,lost:false,resolving:false,
  activeSlot:-1,activeTarget:null,activeSlots:[],sortedBoxes:0,
  message:"Выбери бокс — каждый муравей унесёт один крупный цветной блок",resolutionLog:[]};
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
export function findAntWave(state,reservedTargets=new Set(),pendingBySlot=new Map()){
 const byColor=new Map(),wave=[],cursor=new Map(),exposed=new Set(getExposedPixels(state.board).map(point=>point.x+","+point.y));
 for(let y=0;y<state.board.length;y++)for(let x=0;x<state.board[y].length;x++){
  const color=state.board[y][x];
  if(color&&exposed.has(x+","+y)&&!reservedTargets.has(x+","+y)){
   if(!byColor.has(color))byColor.set(color,[]);
   byColor.get(color).push({x,y});
  }
 }
 for(let slot=0;slot<state.slots.length;slot++){
  const box=state.slots[slot];if(!box||box.ants<=0||box.status==="departing")continue;
  const targets=byColor.get(box.color)||[];
  let index=cursor.get(box.color)||0,assigned=0;
  while(index<targets.length&&assigned<Math.max(0,box.ants-(pendingBySlot.get(slot)||0))){wave.push({slot,color:box.color,target:targets[index++]});assigned++;}
  cursor.set(box.color,index);
 }
 return wave;
}
export function countOutboundBySlot(workers){
 const pending=new Map();
 for(const worker of workers.values())if(worker.phase==="outbound")pending.set(worker.slot,(pending.get(worker.slot)||0)+1);
 return pending;
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
export function chooseTopColumn(state,column){
 if(!canChoose(state)||!Number.isInteger(column)||column<0||column>=TRAY_SIZE)return false;
 const selectedIndex=state.tray[0][column],incoming=getIncoming(state.levelId);
 if(selectedIndex===null||selectedIndex===undefined)return false;
 const freeSlot=state.slots.findIndex(slot=>slot===null),box=incoming[selectedIndex];
 if(freeSlot<0||!box)return false;
 state.slots[freeSlot]={...box,sourceIndex:selectedIndex};
 state.tray[0][column]=state.tray[1][column];state.tray[1][column]=state.tray[2][column];
 state.tray[2][column]=state.nextContainer<incoming.length?state.nextContainer:null;
 if(state.nextContainer<incoming.length)state.nextContainer++;
 state.message=`${COLORS[box.color].name}: бокс отправлен в стартовый отсек ${freeSlot+1}`;
 return true;
}
export function findNextMove(state){
 for(let slot=0;slot<SLOT_COUNT;slot++){
  const box=state.slots[slot];
  if(box&&box.ants>0&&box.status!=="departing"){
   const target=findAccessiblePixel(state.board,box.color);
   if(target)return{slot,target};
  }
 }
 return null;
}
export function applyAntMove(state,slot,target){
 const box=state.slots[slot];
 if(!box||box.ants<=0||box.status==="departing"||state.board[target.y]?.[target.x]!==box.color)return false;
 state.board[target.y][target.x]="";box.ants--;state.remaining--;
 state.resolutionLog.push({slot,color:box.color,x:target.x,y:target.y});
 if(state.resolutionLog.length>300)state.resolutionLog.splice(0,100);
 if(box.ants<=0)box.status="departing";
 return true;
}
export function completeBoxDeparture(state,slot){
 const box=state.slots[slot];if(!box||box.status!=="departing")return false;
 state.slots[slot]=null;state.sortedBoxes=(state.sortedBoxes||0)+1;return true;
}
export function isDefeat(state){
 if(freeSlotCount(state)>0||state.remaining<=0)return false;
 return !findNextMove(state);
}
export function resolveAll(state){
 if(state.won||state.lost)return state;
 let move=findNextMove(state);
 while(move&&state.remaining>0){
  applyAntMove(state,move.slot,move.target);
  const box=state.slots[move.slot];if(box?.status==="departing")completeBoxDeparture(state,move.slot);
  move=findNextMove(state);
 }
 if(state.remaining===0){state.won=true;state.message="Победа! Большой пиксельный портрет собран ✨";}
 else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, ходов больше нет.";}
 return state;
}
export function serializeGame(state){
 return {levelId:state.levelId||"meadow-01",board:state.board,slots:state.slots,tray:state.tray,nextContainer:state.nextContainer,
  remaining:state.remaining,won:state.won,lost:state.lost,sortedBoxes:state.sortedBoxes||0,resolutionLog:state.resolutionLog.slice(-300)};
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
 return {...fresh,...saved,tray,sortedBoxes:saved.sortedBoxes||0,
  slots:saved.slots.map(box=>box&&box.ants<=0?{...box,status:"departing"}:box),
  resolving:false,activeSlot:-1,activeTarget:null,activeSlots:[],
  message:saved.won?"Победа! Полянка собрана ✨":saved.lost?"Поражение: пять стартовых отсеков заняты, ходов больше нет.":"Выбери бокс — каждый муравей унесёт один крупный цветной блок"};
}
