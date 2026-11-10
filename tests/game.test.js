import test from "node:test";
import assert from "node:assert/strict";
import {createGame,LEVELS,getLevel,getIncoming,createArtworkBoard,INITIAL_BOARD,INCOMING,isAccessible,findAccessiblePixel,findAccessiblePixels,findAntWave,chooseTopColumn,findNextMove,applyAntMove,completeBoxDeparture,resolveAll,freeSlotCount,isDefeat,SIZE,GRID_SIZE,BLOCK_SIZE,BOX_CAPACITY,SLOT_COUNT,TRAY_SIZE,canChoose,restoreGame,serializeGame,countOutboundBySlot,countSlotWorkers,canDepartSlot} from "../src/game.js";
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
 board[12][11]="";assert.equal(isAccessible(board,12,12),true);
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
 assert.deepEqual(findAccessiblePixels(board,"red",1),[{x:3,y:2}]);
 assert.deepEqual(findAccessiblePixels(board,"red",5),[{x:3,y:2},{x:3,y:3}]);
 assert.deepEqual(findAccessiblePixels(board,"blue",5),[]);
});
test("pixel stays accounted for until ant delivery, then empty box departs to sorting",()=>{
 const s=createGame();s.board=smallBoard();s.board[2][2]="";s.board[2][3]="red";s.remaining=24;
 s.slots[0]={color:"red",ants:1};
 assert.equal(applyAntMove(s,0,{x:3,y:2}),true);assert.equal(s.remaining,23);
 assert.equal(s.slots[0].status,"departing");assert.equal(freeSlotCount(s),4);
 assert.equal(completeBoxDeparture(s,0),true);assert.equal(freeSlotCount(s),5);assert.equal(s.sortedBoxes,1);
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
 assert.equal(signatures.size,3,"each campaign level must have its own pixel artwork");
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
