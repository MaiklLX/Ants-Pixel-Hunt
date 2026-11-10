export const SIZE = 7;
export const SLOT_COUNT = 5;
export const TRAY_SIZE = 3;
export const COLORS = {
  red:{hex:"#ef756e",name:"Коралловые",short:"КР"},
  blue:{hex:"#72b9ef",name:"Голубые",short:"ГЛ"},
  yellow:{hex:"#f5d36e",name:"Жёлтые",short:"ЖЛ"},
  green:{hex:"#83cf9b",name:"Зелёные",short:"ЗЛ"},
  purple:{hex:"#b99be8",name:"Сиреневые",short:"СР"}
};
export const INITIAL_BOARD=[
 ["green","green","red","green","purple","yellow","green"],
 ["red","purple","purple","blue","yellow","red","red"],
 ["red","purple","green","red","yellow","yellow","red"],
 ["purple","yellow","blue","blue","blue","red","red"],
 ["purple","blue","green","blue","purple","yellow","red"],
 ["yellow","red","red","blue","red","purple","green"],
 ["purple","red","blue","green","yellow","yellow","green"]
];
export const INCOMING=[
 {color:"yellow",ants:3},{color:"blue",ants:4},{color:"purple",ants:2},
 {color:"blue",ants:2},{color:"red",ants:6},{color:"purple",ants:6},
 {color:"blue",ants:1},{color:"green",ants:3},{color:"purple",ants:1},
 {color:"yellow",ants:1},{color:"green",ants:1},{color:"green",ants:5},
 {color:"yellow",ants:1},{color:"red",ants:2},{color:"yellow",ants:4},
 {color:"blue",ants:1},{color:"red",ants:6}
];
export function createGame(){
 return {board:INITIAL_BOARD.map(row=>[...row]),slots:Array(SLOT_COUNT).fill(null),
  tray:Array.from({length:TRAY_SIZE},(_,row)=>Array.from({length:TRAY_SIZE},(_,col)=>row*TRAY_SIZE+col)),
  nextContainer:TRAY_SIZE*TRAY_SIZE,remaining:SIZE*SIZE,won:false,lost:false,resolving:false,
  activeSlot:-1,activeTarget:null,message:"Выбери бокс в верхнем ряду — остальные в колонке сдвинутся вверх",resolutionLog:[]};
}
export function isAccessible(board,x,y){
 const size=board.length;
 if(!board[y]?.[x])return false;
 return [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>{
  const nx=x+dx,ny=y+dy;
  return nx<0||nx>=size||ny<0||ny>=size||board[ny][nx]==="";
 });
}
export function findAccessiblePixel(board,color){
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(board[y][x]===color&&isAccessible(board,x,y))return{x,y};
 return null;
}
export function findAccessiblePixels(board,color,limit=Infinity){
 const found=[];
 for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){
  if(board[y][x]===color&&isAccessible(board,x,y)){found.push({x,y});if(found.length>=limit)return found;}
 }
 return found;
}
export function freeSlotCount(state){return state.slots.filter(slot=>slot===null).length;}
export function canChoose(state){
 return !state.won&&!state.lost&&freeSlotCount(state)>0&&state.tray[0].some(index=>index!==null);
}
/** Select only from the top row; that column collapses upward and receives the next deck box at its bottom. */
export function chooseTopColumn(state,column){
 if(!canChoose(state)||!Number.isInteger(column)||column<0||column>=TRAY_SIZE)return false;
 const selectedIndex=state.tray[0][column];
 if(selectedIndex===null||selectedIndex===undefined)return false;
 const freeSlot=state.slots.findIndex(slot=>slot===null);
 const box=INCOMING[selectedIndex];
 if(freeSlot<0||!box)return false;
 state.slots[freeSlot]={...box,sourceIndex:selectedIndex};
 state.tray[0][column]=state.tray[1][column];
 state.tray[1][column]=state.tray[2][column];
 state.tray[2][column]=state.nextContainer<INCOMING.length?state.nextContainer:null;
 if(state.nextContainer<INCOMING.length)state.nextContainer++;
 state.message=`${COLORS[box.color].name}: бокс отправлен в стартовый отсек ${freeSlot+1}`;
 return true;
}
export function findNextMove(state){
 for(let slot=0;slot<SLOT_COUNT;slot++){
  const box=state.slots[slot];
  if(box&&box.ants>0){
   const target=findAccessiblePixel(state.board,box.color);
   if(target)return{slot,target};
  }
 }
 return null;
}
export function applyAntMove(state,slot,target){
 const box=state.slots[slot];
 if(!box||box.ants<=0||state.board[target.y]?.[target.x]!==box.color)return false;
 state.board[target.y][target.x]="";
 box.ants--;state.remaining--;
 state.resolutionLog.push({slot,color:box.color,x:target.x,y:target.y});
 if(box.ants<=0)state.slots[slot]=null;
 return true;
}
export function isDefeat(state){
 if(freeSlotCount(state)>0||state.remaining<=0)return false;
 return !findNextMove(state);
}
export function resolveAll(state){
 if(state.won||state.lost)return state;
 let move=findNextMove(state);
 while(move&&state.remaining>0){applyAntMove(state,move.slot,move.target);move=findNextMove(state);}
 if(state.remaining===0){state.won=true;state.message="Победа! Поле полностью очищено ✨";}
 else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, ходов больше нет.";}
 return state;
}
export function serializeGame(state){
 return {board:state.board,slots:state.slots,tray:state.tray,nextContainer:state.nextContainer,
  remaining:state.remaining,won:state.won,lost:state.lost,resolutionLog:state.resolutionLog};
}
export function restoreGame(saved){
 const fresh=createGame();
 if(!saved||!Array.isArray(saved.board)||saved.board.length!==SIZE||!Array.isArray(saved.slots)||saved.slots.length!==SLOT_COUNT)return fresh;
 let tray=saved.tray;
 if(!Array.isArray(tray)||tray.length!==TRAY_SIZE||!tray.every(row=>Array.isArray(row)&&row.length===TRAY_SIZE)){
  const legacy=Array.isArray(saved.candidates)?saved.candidates:[];
  let next=saved.nextContainer??0;
  tray=Array.from({length:TRAY_SIZE},(_,r)=>Array.from({length:TRAY_SIZE},(_,c)=>{
   const old=legacy[r*TRAY_SIZE+c];
   if(old!==undefined)return old;
   return next<INCOMING.length?next++:null;
  }));
 }
 return {...fresh,...saved,tray,resolving:false,activeSlot:-1,activeTarget:null,
  message:saved.won?"Победа! Поле полностью очищено ✨":saved.lost?"Поражение: все пять стартовых отсеков заняты, ходов больше нет.":"Выбери бокс в верхнем ряду — остальные в колонке сдвинутся вверх"};
}
