import test from "node:test";
import assert from "node:assert/strict";
import {COLORS,createGame,LEVELS,getLevel,getIncoming,createArtworkBoard,resolveAll,INITIAL_BOARD,INCOMING,isAccessible,getExposedPixels,findAccessiblePixel,findAccessiblePixels,findAntWave,chooseTopColumn,findNextMove,applyAntMove,completeBoxDeparture,freeSlotCount,isDefeat,SIZE,GRID_SIZE,BLOCK_SIZE,BOX_CAPACITY,SLOT_COUNT,TRAY_SIZE,canChoose,restoreGame,serializeGame,countOutboundBySlot,countSlotWorkers,canDepartSlot,isLockedBox,getLinkedPair,LOCKED_BOX_INDEX,LOCKED_BOX_COLUMN} from "../src/game.js";
const smallBoard=()=>Array.from({length:5},()=>Array(5).fill("green"));

test("the authored frog is built from large collectible blocks on a 350x350 display grid",()=>{
 const s=createGame();
 assert.equal(GRID_SIZE,350);assert.equal(BLOCK_SIZE,10);assert.equal(SIZE,35);
 assert.equal(INITIAL_BOARD.length,SIZE);assert.ok(INITIAL_BOARD.every(r=>r.length===SIZE));
 assert.equal(s.board.length,SIZE);assert.equal(s.slots.length,SLOT_COUNT);
 assert.equal(s.tray.length,TRAY_SIZE);assert.ok(s.tray.every(r=>r.length===TRAY_SIZE));
 const colors=new Set(INITIAL_BOARD.flat().filter(Boolean));assert.deepEqual([...colors].sort(),["blue","green","purple","red","yellow"]);
 assert.ok(s.remaining>400&&s.remaining<900);assert.ok(INITIAL_BOARD.some(row=>row.includes("")));
});
test("the box deck contains exactly enough ants to collect every pixel by color",()=>{
 const totals={red:0,blue:0,yellow:0,green:0,purple:0};
 for(const row of INITIAL_BOARD)for(const color of row)if(color)totals[color]++;
 const deckTotals={red:0,blue:0,yellow:0,green:0,purple:0};
 for(const box of INCOMING)deckTotals[box.color]+=box.ants;
 assert.deepEqual(deckTotals,totals);assert.ok(INCOMING.length>9);assert.equal(BOX_CAPACITY,60);
 assert.deepEqual(INCOMING.slice(0,5).map(box=>box.color),["green","blue","purple","yellow","red"]);
});
test("only top-row boxes can be selected; chosen column shifts upward and refills at bottom",()=>{
 const s=createGame();assert.deepEqual(s.tray,[[0,1,2],[3,4,5],[6,7,8]]);
 assert.equal(chooseTopColumn(s,1),true);assert.equal(s.slots[0].sourceIndex,1);
 assert.deepEqual(s.tray.map(r=>r[1]),[4,7,9]);assert.equal(s.nextContainer,10);
});
test("selection fills the first free start compartment, not a player-selected location",()=>{
 const s=createGame();chooseTopColumn(s,2);chooseTopColumn(s,0);
 assert.equal(s.slots[0].sourceIndex,2);assert.equal(s.slots[1].sourceIndex,0);assert.equal(s.slots[2],null);
});
test("player can fill every remaining start slot with rapid choices during an active ant trip",()=>{
 const s=createGame();s.resolving=true;
 for(const column of [0,1,2,0,1])assert.equal(chooseTopColumn(s,column),true);
 assert.equal(freeSlotCount(s),0);assert.deepEqual(s.slots.map(box=>box.sourceIndex),[0,1,2,3,4]);assert.equal(canChoose(s),false);
});
test("accessibility checks use actual board dimensions",()=>{
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
 board[12][12]="red";board[0][SIZE-1]="red";
 assert.equal(isAccessible(board,12,12),false);assert.equal(isAccessible(board,SIZE-1,0),true);
 board[12][11]="";assert.equal(isAccessible(board,12,12),false,"an enclosed pocket must not expose an inner block");
 for(let x=0;x<11;x++)board[12][x]="";
 assert.equal(isAccessible(board,12,12),true,"opening a corridor to the outside exposes the next layer");
});
test("legacy 7x7 save starts the new authored level instead of stretching old pixels",()=>{
 const old=Array.from({length:7},()=>Array(7).fill("green"));
 const restored=restoreGame({board:old,slots:Array(5).fill(null),remaining:49});
 assert.equal(restored.board.length,SIZE);assert.equal(restored.remaining,createGame().remaining);
});
test("35x35 collectible block board survives save restoration for the 350x350 display grid",()=>{
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));board[0][0]="red";
 const saved={board,slots:Array(5).fill(null),tray:[[0,1,2],[3,4,5],[6,7,8]],nextContainer:9,remaining:SIZE*SIZE};
 const restored=restoreGame(saved);assert.equal(restored.board.length,SIZE);assert.equal(restored.board[SIZE-1].length,SIZE);
 assert.deepEqual(findAccessiblePixel(restored.board,"red"),{x:0,y:0});
});
test("swarm planner sends eligible ants together and reserves targets left-to-right",()=>{
 const s=createGame();s.board=smallBoard();s.board[0][0]="red";s.board[0][1]="red";s.board[0][2]="red";s.remaining=25;
 s.slots[0]={color:"red",ants:2};s.slots[3]={color:"red",ants:2};
 const wave=findAntWave(s);
 assert.deepEqual(wave.map(m=>[m.slot,m.target.x,m.target.y]),[[0,0,0],[0,1,0],[3,2,0]]);
 assert.equal(new Set(wave.map(m=>m.target.x+","+m.target.y)).size,wave.length);
 const pending=findAntWave(s,new Set(["0,0"]),new Map([[0,1]]));
 assert.deepEqual(pending.map(m=>[m.slot,m.target.x,m.target.y]),[[0,1,0],[3,2,0]]);
});
test("findAccessiblePixels returns a bounded wave of exposed matching pixels",()=>{
 const board=smallBoard();board[2][2]="";board[2][3]="red";board[3][3]="red";board[3][4]="";
 assert.deepEqual(findAccessiblePixels(board,"red",1),[{x:3,y:3}]);
 assert.deepEqual(findAccessiblePixels(board,"red",5),[{x:3,y:3}]);
 assert.deepEqual(findAccessiblePixels(board,"blue",5),[]);
});
test("pixel stays accounted for until ant delivery, then empty box departs to sorting",()=>{
 const s=createGame();s.board=smallBoard();s.board[2][2]="";s.board[2][3]="red";s.remaining=24;
 s.slots[0]={color:"red",ants:1};
 assert.equal(applyAntMove(s,0,{x:3,y:2}),true);assert.equal(s.remaining,23);
 assert.equal(s.slots[0].status,"departing");assert.equal(freeSlotCount(s),4);
 assert.equal(completeBoxDeparture(s,0),true);assert.equal(freeSlotCount(s),5);assert.equal(s.sortedBoxes,1);
});
test("a returned empty box frees its slot immediately so a new box can be chosen",()=>{
 const s=createGame();
 s.slots=Array.from({length:SLOT_COUNT},(_,index)=>({color:"red",ants:index===0?0:3,status:index===0?"departing":"waiting"}));
 const workers=new Map([[41,{slot:0,phase:"returning"}]]);
 assert.equal(canChoose(s),false);
 workers.delete(41);
 assert.equal(canDepartSlot(workers,0),true);
 assert.equal(completeBoxDeparture(s,0),true);
 assert.equal(freeSlotCount(s),1);
 assert.equal(canChoose(s),true);
 assert.equal(chooseTopColumn(s,0),true);
});

test("leftmost eligible start compartment receives the next ant turn",()=>{
 const s=createGame();s.board=Array.from({length:5},()=>Array(5).fill(""));
 s.board[0][0]="red";s.board[4][4]="blue";s.remaining=2;
 s.slots[0]={color:"red",ants:1};s.slots[4]={color:"blue",ants:1};
 resolveAll(s);assert.deepEqual(s.resolutionLog.map(x=>x.slot),[0,4]);assert.equal(s.won,true);
});
test("defeat requires all five start slots occupied and no available matching move",()=>{
 const s=createGame();s.slots=Array.from({length:5},()=>({color:"purple",ants:1}));
 s.tray[0]=[null,null,null];s.board=Array.from({length:5},()=>Array(5).fill(""));
 s.board[2][2]="red";s.remaining=1;assert.equal(freeSlotCount(s),0);assert.equal(isDefeat(s),true);
 s.slots[4]=null;assert.equal(isDefeat(s),false);
});
test("saved tray, selected slots and sorting counter survive restore",()=>{
 const s=createGame();chooseTopColumn(s,1);s.sortedBoxes=7;
 const restored=restoreGame(serializeGame(s));assert.deepEqual(restored.tray,s.tray);
 assert.equal(restored.slots[0].sourceIndex,1);assert.equal(restored.sortedBoxes,7);
});
test("legacy save with three candidates can be upgraded to a 3x3 tray",()=>{
 const restored=restoreGame({board:INITIAL_BOARD,slots:Array(5).fill(null),candidates:[2,1,0],nextContainer:3,remaining:createGame().remaining});
 assert.deepEqual(restored.tray,[[2,1,0],[3,4,5],[6,7,8]]);
});

test("each color layer can expose new pixels without duplicate reservations",()=>{
 const board=Array.from({length:9},()=>Array(9).fill(""));
 // Nested layers: two green rings, then blue, then a purple core.
 for(let y=1;y<=7;y++)for(let x=1;x<=7;x++){
  const d=Math.min(x-1,y-1,7-x,7-y);
  board[y][x]=d<=1?"green":d===2?"blue":"purple";
 }
 const removed=new Set();
 const takeWave=(color,limit)=>{
  const found=findAccessiblePixels(board,color,limit);
  for(const p of found){const key=p.x+","+p.y;assert.equal(removed.has(key),false);removed.add(key);board[p.y][p.x]="";}
  return found.length;
 };
 assert.ok(takeWave("green",900)>0);
 assert.ok(takeWave("green",900)>0);
 assert.equal(findAccessiblePixels(board,"purple",900).length,0);
 assert.ok(takeWave("blue",900)>0);
 assert.ok(takeWave("purple",900)>0);
 assert.equal(removed.size,49);
});
test("a full wave never assigns the same board cell to two ants",()=>{
 const s=createGame();s.board=Array.from({length:9},()=>Array(9).fill(""));
 for(let x=0;x<9;x++){s.board[0][x]="red";s.board[8][x]="blue";}
 for(let y=1;y<8;y++){s.board[y][0]="red";s.board[y][8]="blue";}
 s.remaining=32;s.slots[0]={color:"red",ants:20};s.slots[1]={color:"blue",ants:20};
 const wave=findAntWave(s),keys=wave.map(m=>m.target.x+","+m.target.y);
 assert.equal(new Set(keys).size,keys.length);
 assert.ok(wave.every(m=>s.board[m.target.y][m.target.x]===m.color));
});

test("the 35x35 artwork produces a complete deterministic deck with bounded box sizes",()=>{
 const totals={red:0,blue:0,yellow:0,green:0,purple:0};
 for(const row of INITIAL_BOARD)for(const color of row)if(color)totals[color]++;
 const deckTotals={red:0,blue:0,yellow:0,green:0,purple:0};
 for(const box of INCOMING){
  assert.ok(box.ants>0&&box.ants<=BOX_CAPACITY);
  deckTotals[box.color]+=box.ants;
 }
 assert.deepEqual(deckTotals,totals);
 assert.equal(INCOMING.reduce((sum,box)=>sum+box.ants,0),createGame().remaining);
 assert.ok(INCOMING.length>=10&&INCOMING.length<=25);
});

test("a returning ant does not block the next dispatch after its pickup opens a new pixel",()=>{
 const s=createGame();s.board=Array.from({length:5},()=>Array(5).fill("green"));
 s.board[2][0]="red";s.board[2][1]="red";s.remaining=25;
 s.slots[0]={color:"red",ants:2};
 const first=findAntWave(s);
 assert.deepEqual(first.map(m=>m.target),[{x:0,y:2}]);
 const workers=new Map([[1,{slot:0,phase:"outbound"}]]);
 const reserved=new Set(["0,2"]);
 assert.equal(applyAntMove(s,0,first[0].target),true);
 workers.get(1).phase="returning";reserved.delete("0,2");
 const pending=countOutboundBySlot(workers);
 assert.equal(pending.has(0),false);
 const next=findAntWave(s,reserved,pending);
 assert.deepEqual(next.map(m=>m.target),[{x:1,y:2}]);
 assert.equal(workers.size,1,"the first ant is still returning while the next one can be dispatched");
});
test("a box cannot depart while any ant assigned to its slot is still travelling back",()=>{
 const workers=new Map([[1,{slot:2,phase:"returning"}],[2,{slot:2,phase:"returning"}],[3,{slot:1,phase:"outbound"}]]);
 assert.equal(countSlotWorkers(workers,2),2);
 assert.equal(canDepartSlot(workers,2),false);
 workers.delete(1);assert.equal(canDepartSlot(workers,2),false);
 workers.delete(2);assert.equal(canDepartSlot(workers,2),true);
 assert.equal(countOutboundBySlot(workers).get(1),1);
});

test("campaign levels have distinct deterministic artwork and exact matching box decks",()=>{
 assert.equal(LEVELS.length,6);
 const signatures=new Set();
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id);
  assert.equal(board.length,35);
  assert.ok(board.every(row=>row.length===35));
  const totals={red:0,blue:0,yellow:0,green:0,purple:0};
  for(const row of board)for(const color of row)if(color)totals[color]++;
  const deckTotals={red:0,blue:0,yellow:0,green:0,purple:0};
  for(const box of deck){assert.ok(box.ants>0&&box.ants<=BOX_CAPACITY);deckTotals[box.color]+=box.ants;}
  assert.deepEqual(deckTotals,totals);
  assert.equal(deck.reduce((sum,box)=>sum+box.ants,0),createGame(level.id).remaining);
  signatures.add(board.map(row=>row.join(",")).join(";"));
 }
 assert.equal(signatures.size,6,"each campaign level must have its own pixel artwork");
 assert.equal(getLevel("unknown").id,"meadow-01");
});
test("campaign level identity survives save and restore",()=>{
 const s=createGame("garden-02");
 chooseTopColumn(s,0);
 const restored=restoreGame(serializeGame(s));
 assert.equal(restored.levelId,"garden-02");
 assert.deepEqual(restored.tray,s.tray);
 assert.equal(getIncoming(restored.levelId).length,getIncoming("garden-02").length);
});

test("all six campaign levels start with accessible colors represented in their box deck",()=>{
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id);
  const accessibleColors=new Set();
  for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){
   if(board[y][x]&&isAccessible(board,x,y))accessibleColors.add(board[y][x]);
  }
  const deckColors=new Set(deck.map(box=>box.color));
  assert.ok(accessibleColors.size>0,level.name+" must have a valid opening move");
  for(const color of accessibleColors)assert.ok(deckColors.has(color),level.name+" must provide boxes for accessible color "+color);
  assert.equal(createGame(level.id).remaining,board.flat().filter(Boolean).length);
 }
});

test("only empty space connected to the outside can expose a block",()=>{
 const board=Array.from({length:7},()=>Array(7).fill("green"));
 board[3][3]="red";board[3][2]="";
 assert.equal(isAccessible(board,3,3),false,"a one-sided enclosed cavity is not an outer layer");
 board[3][1]="";board[3][0]="";
 assert.equal(isAccessible(board,3,3),true,"a tunnel reaching the outside opens the block");
});
test("choosing a butterfly box refills from the butterfly deck, not the frog deck length",()=>{
 const levelId="garden-02",s=createGame(levelId),deck=getIncoming(levelId);
 for(let i=0;i<deck.length;i++){
  let column=i%TRAY_SIZE;
  if(s.tray[0][column]===null)column=s.tray[0].findIndex(index=>index!==null);
  if(column<0)break;
  assert.equal(chooseTopColumn(s,column),true);
  const occupied=s.slots.findIndex(Boolean);assert.ok(occupied>=0);s.slots[occupied]=null;
 }
 assert.ok(s.nextContainer<=deck.length);
 assert.ok(s.tray.flat().every(index=>index===null||(index>=0&&index<deck.length)));
});

test("all six campaign drawings remain solvable when only the true outer layer is collectible",()=>{
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id).map(box=>({...box}));
  const active=Array(SLOT_COUNT).fill(null);let remaining=board.flat().filter(Boolean).length,steps=0;
  while(remaining>0&&steps++<20000){
   let progressed=false;
   for(let slot=0;slot<active.length;slot++){
    const box=active[slot];if(!box)continue;
    const target=findAccessiblePixel(board,box.color);
    if(target){board[target.y][target.x]="";box.ants--;remaining--;progressed=true;if(box.ants<=0)active[slot]=null;}
   }
   if(remaining===0)break;
   for(let slot=0;slot<active.length;slot++){
    if(active[slot])continue;
    const available=new Set(getExposedPixels(board).map(({x,y})=>board[y][x]).filter(Boolean));
    const index=deck.findIndex(box=>available.has(box.color)&&!active.some(other=>other?.color===box.color));
    if(index>=0)active[slot]=deck.splice(index,1)[0];
   }
   if(!progressed&&!active.some(Boolean))break;
  }
  assert.equal(remaining,0,level.name+" must be solvable with its authored color deck");
 }
});

test("box capacities vary within each sufficiently large color deck but preserve exact ant totals",()=>{
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id);
  for(const color of Object.keys(COLORS)){
   const total=board.flat().filter(pixel=>pixel===color).length;
   const sizes=deck.filter(box=>box.color===color).map(box=>box.ants);
   assert.equal(sizes.reduce((sum,n)=>sum+n,0),total,level.name+" "+color+" ant budget");
   assert.ok(sizes.every(n=>n>0&&n<=BOX_CAPACITY));
   if(sizes.length>=3)assert.ok(new Set(sizes).size>=2,level.name+" "+color+" boxes should not all be identical");
  }
  assert.deepEqual(deck,getIncoming(level.id),"deck generation must be deterministic");
 }
});
test("ant wave planner can cap simultaneous workers without reserving extra targets",()=>{
 const s=createGame();s.board=Array.from({length:9},()=>Array(9).fill("")); 
 for(let x=0;x<9;x++)for(let y=0;y<9;y++)if((x+y)%2===0)s.board[y][x]="red";
 s.remaining=s.board.flat().filter(Boolean).length;s.slots[0]={color:"red",ants:40};
 const wave=findAntWave(s,new Set(),new Map(),7);
 assert.equal(wave.length,7);
 assert.equal(new Set(wave.map(move=>move.target.x+","+move.target.y)).size,7);
 assert.deepEqual(findAntWave(s,new Set(),new Map(),0),[]);
});

test("a large ant box can wait while a smaller matching box clears and frees its slot",()=>{
 const s=createGame();s.board=Array.from({length:7},()=>Array(7).fill("green"));
 s.board[0][0]="red";s.board[0][1]="red";s.board[1][0]="red";
 s.board[6][6]="blue";s.board[6][5]="blue";s.remaining=49;
 s.slots[0]={color:"red",ants:4};s.slots[1]={color:"blue",ants:2};
 resolveAll(s);
 assert.equal(s.slots[0].ants,1,"the larger red box waits for another exposed red block");
 assert.equal(s.slots[1],null,"the smaller blue box is exhausted and frees its slot");
 assert.equal(freeSlotCount(s),4);
 assert.equal(s.won,false);
 assert.equal(isDefeat(s),false,"waiting alone is not a loss while a slot remains free");
});


test("the sealed crate stays hidden until ordinary boxes are placed from both other lanes",()=>{
 const s=createGame();
 assert.equal(isLockedBox(s,LOCKED_BOX_INDEX),true);
 assert.equal(getIncoming(s.levelId).length>LOCKED_BOX_INDEX,true);
 // Repeating the same lane does not satisfy the second requirement.
 assert.equal(chooseTopColumn(s,0),true);s.slots[0]=null;
 assert.equal(chooseTopColumn(s,0),true);s.slots[0]=null;
 assert.deepEqual(s.lockProgressColumns,[0]);
 // The sealed crate's own lane never contributes to its opening.
 assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),true);s.slots[0]=null;
 assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),true);s.slots[0]=null;
 assert.equal(s.tray[0][LOCKED_BOX_COLUMN],LOCKED_BOX_INDEX);
 assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),false,"sealed crate cannot be selected early");
 assert.equal(isLockedBox(s,LOCKED_BOX_INDEX),true);
 // A real placement from the other lane completes the two-lane requirement.
 assert.equal(chooseTopColumn(s,1),true);
 assert.deepEqual(s.lockProgressColumns,[0,1]);
 assert.equal(s.lockedBoxOpen,true);
 assert.equal(isLockedBox(s,LOCKED_BOX_INDEX),false);
 assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),true,"opened crate becomes a normal selectable box");
});
test("sealed crate progress is normalized and preserved by save data",()=>{
 const s=createGame();s.lockProgressColumns=[0,0,2,1];s.lockedBoxOpen=false;
 const restored=restoreGame(serializeGame(s));
 assert.deepEqual(restored.lockProgressColumns,[0,1]);
 assert.equal(restored.lockedBoxOpen,false);
 const opened=createGame();opened.lockedBoxOpen=true;opened.lockProgressColumns=[0,1];
 const restoredOpened=restoreGame(serializeGame(opened));
 assert.equal(restoredOpened.lockedBoxOpen,true);
});
test("every campaign deck has a crate at the sealed-box position",()=>{
 for(const level of LEVELS)assert.ok(getIncoming(level.id).length>LOCKED_BOX_INDEX,level.name+" needs a sealed crate position");
});


test("linked crates require two free slots and the paired crate to be visible",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);
 assert.equal(pair.length,2);
 s.tray[0][0]=pair[0];
 s.tray[0][1]=null;
 assert.equal(chooseTopColumn(s,0),false,"the first linked crate waits until its partner reaches the top");
 assert.equal(s.pendingLinkedIndex,null);
 s.tray[0][1]=pair[1];
 s.slots[0]={color:"red",ants:1};
 s.slots[1]={color:"blue",ants:1};
 s.slots[2]={color:"green",ants:1};
 s.slots[3]={color:"yellow",ants:1};
 assert.equal(chooseTopColumn(s,0),false,"a linked pair cannot start with fewer than two free slots");
});
test("linked crates are selected consecutively and block every unrelated choice",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);
 s.tray[0][0]=pair[0];s.tray[0][1]=pair[1];
 assert.equal(chooseTopColumn(s,0),true);
 assert.equal(s.pendingLinkedIndex,pair[1]);
 assert.equal(chooseTopColumn(s,2),false,"no unrelated crate can interrupt a linked pair");
 assert.equal(chooseTopColumn(s,1),true);
 assert.equal(s.pendingLinkedIndex,null);
 assert.equal(s.slots[0].special,"linked");
 assert.equal(s.slots[1].special,"linked");
});
test("linked-pair selection state survives save and restore",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);
 s.tray[0][0]=pair[0];s.tray[0][1]=pair[1];
 assert.equal(chooseTopColumn(s,0),true);
 const restored=restoreGame(serializeGame(s));
 assert.equal(restored.pendingLinkedIndex,pair[1]);
 assert.equal(chooseTopColumn(restored,1),true);
 assert.equal(restored.pendingLinkedIndex,null);
});
test("every campaign deck places its linked pair outside the sealed-box position",()=>{
 for(const level of LEVELS){
  const pair=getLinkedPair(level.id);
  assert.equal(pair.length,2,level.name+" needs exactly one linked pair");
  assert.ok(pair.every(index=>index!==LOCKED_BOX_INDEX));
  assert.notEqual(pair[0]%TRAY_SIZE,pair[1]%TRAY_SIZE,"linked crates must be in different lanes");
 }
});
