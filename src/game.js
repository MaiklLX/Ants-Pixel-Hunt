export const SIZE=250;
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
export function createArtworkBoard(){
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  // A large, front-facing frog portrait, composed as crisp colored pixel cells.
  const head=ellipse(x,y,125,126,87,91);
  const headRim=ellipse(x,y,125,126,94,98);
  if(headRim)board[y][x]="purple";
  if(head)board[y][x]="green";
  // Raised eye sockets and golden eyes.
  const leftSocket=ellipse(x,y,83,65,35,38),rightSocket=ellipse(x,y,167,65,35,38);
  if(leftSocket||rightSocket)board[y][x]="purple";
  if(ellipse(x,y,83,65,29,31)||ellipse(x,y,167,65,29,31))board[y][x]="green";
  if(ellipse(x,y,83,63,20,21)||ellipse(x,y,167,63,20,21))board[y][x]="yellow";
  if(ellipse(x,y,88,65,9,13)||ellipse(x,y,162,65,9,13))board[y][x]="purple";
  if(circle(x,y,88,60,3)||circle(x,y,162,60,3))board[y][x]="blue";
  if(circle(x,y,91,57,2)||circle(x,y,165,57,2))board[y][x]="yellow";
  // Bright cheek patches and small spots add the layered, hand-built look.
  if(ellipse(x,y,62,119,17,12)||ellipse(x,y,188,119,17,12))board[y][x]="blue";
  if(circle(x,y,55,92,5)||circle(x,y,195,92,5)||circle(x,y,70,151,4)||circle(x,y,180,151,4))board[y][x]="purple";
  if(circle(x,y,63,99,3)||circle(x,y,187,99,3)||circle(x,y,76,143,2)||circle(x,y,174,143,2))board[y][x]="yellow";
  // Wide smiling mouth with a pink-red lower lip / tongue.
  const mouth=ellipse(x,y,125,158,59,25);
  if(mouth)board[y][x]="purple";
  if(ellipse(x,y,125,154,52,17))board[y][x]="red";
  if(ellipse(x,y,125,165,33,8))board[y][x]="yellow";
  // Nose highlights and a few darker pixel accents.
  if(circle(x,y,112,128,3)||circle(x,y,138,128,3))board[y][x]="purple";
  if(circle(x,y,111,127,1)||circle(x,y,137,127,1))board[y][x]="yellow";
  // Lower neck and a pair of simple shoulder shapes complete the portrait.
  if(ellipse(x,y,125,220,54,23))board[y][x]="blue";
  if(ellipse(x,y,125,216,43,15))board[y][x]="green";
 }
 return board;
}
export const INITIAL_BOARD=createArtworkBoard();
function buildIncoming(board){
 const totals={red:0,blue:0,yellow:0,green:0,purple:0};
 for(const row of board)for(const color of row)if(color)totals[color]++;
 const colors=["green","blue","purple","yellow","red"],queues={};
 for(const color of colors){
  queues[color]=[];let left=totals[color];
  while(left>0){const ants=Math.min(900,left);queues[color].push({color,ants});left-=ants;}
 }
 const deck=[];
 // Interleave colors instead of locking the first nine choices to one color.
 // This lets the player keep several color layers represented in the five live slots.
 let pending=true;
 while(pending){pending=false;for(const color of colors){const box=queues[color].shift();if(box){deck.push(box);pending=true;}}}
 return deck;
}
export const INCOMING=buildIncoming(INITIAL_BOARD);
export function createGame(){
 return {board:INITIAL_BOARD.map(row=>[...row]),slots:Array(SLOT_COUNT).fill(null),
  tray:Array.from({length:TRAY_SIZE},(_,row)=>Array.from({length:TRAY_SIZE},(_,col)=>row*TRAY_SIZE+col)),
  nextContainer:TRAY_SIZE*TRAY_SIZE,remaining:INITIAL_BOARD.reduce((sum,row)=>sum+row.filter(Boolean).length,0),won:false,lost:false,resolving:false,
  activeSlot:-1,activeTarget:null,activeSlots:[],sortedBoxes:0,
  message:"Выбери бокс в верхнем ряду — отправим муравьишек за ресурсами",resolutionLog:[]};
}
export function isAccessible(board,x,y){
 const size=board.length;
 if(!board[y]?.[x])return false;
 return x===0||y===0||x===size-1||y===size-1||
  board[y][x-1]===""||board[y][x+1]===""||board[y-1]?.[x]===""||board[y+1]?.[x]==="";
}
export function findAccessiblePixel(board,color){
 for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++)if(board[y][x]===color&&isAccessible(board,x,y))return{x,y};
 return null;
}
export function findAccessiblePixels(board,color,limit=Infinity){
 const found=[];
 for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){
  if(board[y][x]===color&&isAccessible(board,x,y)){found.push({x,y});if(found.length>=limit)return found;}
 }
 return found;
}
export function findAntWave(state){
 const byColor=new Map(),wave=[],cursor=new Map();
 for(let y=0;y<state.board.length;y++)for(let x=0;x<state.board[y].length;x++){
  const color=state.board[y][x];
  if(color&&isAccessible(state.board,x,y)){
   if(!byColor.has(color))byColor.set(color,[]);
   byColor.get(color).push({x,y});
  }
 }
 for(let slot=0;slot<state.slots.length;slot++){
  const box=state.slots[slot];if(!box||box.ants<=0||box.status==="departing")continue;
  const targets=byColor.get(box.color)||[];
  let index=cursor.get(box.color)||0,assigned=0;
  while(index<targets.length&&assigned<box.ants){wave.push({slot,color:box.color,target:targets[index++]});assigned++;}
  cursor.set(box.color,index);
 }
 return wave;
}
export function freeSlotCount(state){return state.slots.filter(slot=>slot===null).length;}
export function canChoose(state){
 return !state.won&&!state.lost&&freeSlotCount(state)>0&&state.tray[0].some(index=>index!==null);
}
export function chooseTopColumn(state,column){
 if(!canChoose(state)||!Number.isInteger(column)||column<0||column>=TRAY_SIZE)return false;
 const selectedIndex=state.tray[0][column];
 if(selectedIndex===null||selectedIndex===undefined)return false;
 const freeSlot=state.slots.findIndex(slot=>slot===null),box=INCOMING[selectedIndex];
 if(freeSlot<0||!box)return false;
 state.slots[freeSlot]={...box,sourceIndex:selectedIndex};
 state.tray[0][column]=state.tray[1][column];state.tray[1][column]=state.tray[2][column];
 state.tray[2][column]=state.nextContainer<INCOMING.length?state.nextContainer:null;
 if(state.nextContainer<INCOMING.length)state.nextContainer++;
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
 if(state.remaining===0){state.won=true;state.message="Победа! Портрет собран ✨";}
 else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, ходов больше нет.";}
 return state;
}
export function serializeGame(state){
 return {board:state.board,slots:state.slots,tray:state.tray,nextContainer:state.nextContainer,
  remaining:state.remaining,won:state.won,lost:state.lost,sortedBoxes:state.sortedBoxes||0,resolutionLog:state.resolutionLog.slice(-300)};
}
export function restoreGame(saved){
 const fresh=createGame();
 if(!saved||!Array.isArray(saved.board)||saved.board.length!==SIZE||!saved.board.every(row=>Array.isArray(row)&&row.length===SIZE)||!Array.isArray(saved.slots)||saved.slots.length!==SLOT_COUNT)return fresh;
 let tray=saved.tray;
 if(!Array.isArray(tray)||tray.length!==TRAY_SIZE||!tray.every(row=>Array.isArray(row)&&row.length===TRAY_SIZE)){
  const legacy=Array.isArray(saved.candidates)?saved.candidates:[];
  let next=saved.nextContainer??0;
  tray=Array.from({length:TRAY_SIZE},(_,r)=>Array.from({length:TRAY_SIZE},(_,c)=>{
   const old=legacy[r*TRAY_SIZE+c];if(old!==undefined)return old;
   return next<INCOMING.length?next++:null;
  }));
 }
 return {...fresh,...saved,tray,sortedBoxes:saved.sortedBoxes||0,
  slots:saved.slots.map(box=>box&&box.ants<=0?{...box,status:"departing"}:box),
  resolving:false,activeSlot:-1,activeTarget:null,activeSlots:[],
  message:saved.won?"Победа! Поляна собрана ✨":saved.lost?"Поражение: пять стартовых отсеков заняты, ходов больше нет.":"Выбери бокс в верхнем ряду — отправим муравьишек за ресурсами"};
}
