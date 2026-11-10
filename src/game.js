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
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  // Butterfly: four broad wings with a dark-blue rim and warm spots.
  if(inWing(x,y)){
   const wingEdge=
    (ellipse(x,y,86,88,48,43)&&!ellipse(x,y,86,88,42,37))||
    (ellipse(x,y,164,88,48,43)&&!ellipse(x,y,164,88,42,37))||
    (ellipse(x,y,94,137,36,43)&&!ellipse(x,y,94,137,30,37))||
    (ellipse(x,y,156,137,36,43)&&!ellipse(x,y,156,137,30,37));
   board[y][x]=wingEdge?"blue":"purple";
   if(circle(x,y,73,82,8)||circle(x,y,99,108,7)||circle(x,y,177,82,8)||circle(x,y,151,108,7))board[y][x]="yellow";
   if(circle(x,y,86,137,5)||circle(x,y,164,137,5))board[y][x]="blue";
  }
  // Body, head and antennae.
  if(ellipse(x,y,125,111,6,57)||circle(x,y,125,52,9))board[y][x]="red";
  if(lineDistance(x,y,122,47,109,31)<1.7||lineDistance(x,y,128,47,141,31)<1.7)board[y][x]="red";
  // A bright flower under the butterfly makes the level read as one scene.
  if(flowerPetals.some(p=>ellipse(x,y,p.x,p.y,10,16)))board[y][x]="yellow";
  if(circle(x,y,125,211,12))board[y][x]="red";
  // Two leaves on the stem.
  if(ellipse(x,y,105,233,17,7)&&x<112)board[y][x]="blue";
  if(ellipse(x,y,145,232,17,7)&&x>138)board[y][x]="blue";
 }
 return board;
}
export const INITIAL_BOARD=createArtworkBoard();
function buildIncoming(board){
 const totals={red:0,blue:0,yellow:0,green:0,purple:0};
 for(const row of board)for(const color of row)totals[color]++;
 const colors=["green","purple","blue","yellow","red"],queues={};
 for(const color of colors){
  queues[color]=[];let left=totals[color];
  while(left>0){const ants=Math.min(900,left);queues[color].push({color,ants});left-=ants;}
 }
 const deck=[];
 for(let round=0;colors.some(color=>queues[color].length);round++)
  for(const color of colors)if(queues[color][round])deck.push(queues[color][round]);
 return deck;
}
export const INCOMING=buildIncoming(INITIAL_BOARD);
export function createGame(){
 return {board:INITIAL_BOARD.map(row=>[...row]),slots:Array(SLOT_COUNT).fill(null),
  tray:Array.from({length:TRAY_SIZE},(_,row)=>Array.from({length:TRAY_SIZE},(_,col)=>row*TRAY_SIZE+col)),
  nextContainer:TRAY_SIZE*TRAY_SIZE,remaining:SIZE*SIZE,won:false,lost:false,resolving:false,
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
 if(state.remaining===0){state.won=true;state.message="Победа! Поляна собрана ✨";}
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
