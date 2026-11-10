import test from "node:test";
import assert from "node:assert/strict";
import {createGame,INITIAL_BOARD,INCOMING,isAccessible,findAccessiblePixel,findAccessiblePixels,chooseTopColumn,findNextMove,applyAntMove,resolveAll,freeSlotCount,isDefeat,SIZE,SLOT_COUNT,TRAY_SIZE,canChoose,restoreGame,serializeGame} from "../src/game.js";
test("level has a 7x7 board, five launch slots and a 3x3 box rack",()=>{
 const s=createGame();assert.equal(INITIAL_BOARD.length,SIZE);assert.ok(INITIAL_BOARD.every(r=>r.length===SIZE));
 assert.equal(s.slots.length,SLOT_COUNT);assert.equal(s.tray.length,TRAY_SIZE);assert.ok(s.tray.every(r=>r.length===TRAY_SIZE));
});
test("only top-row boxes can be selected; chosen column shifts upward and refills at bottom",()=>{
 const s=createGame();assert.deepEqual(s.tray,[[0,1,2],[3,4,5],[6,7,8]]);
 assert.equal(chooseTopColumn(s,1),true);assert.equal(s.slots[0].sourceIndex,1);
 assert.deepEqual(s.tray.map(r=>r[1]),[4,7,9]);assert.equal(s.nextContainer,10);
});
test("selection fills the first free start compartment, not a player-selected location",()=>{
 const s=createGame();chooseTopColumn(s,2);chooseTopColumn(s,0);
 assert.equal(s.slots[0].sourceIndex,2);assert.equal(s.slots[1].sourceIndex,0);
 assert.equal(s.slots[2],null);
});
test("player can fill every remaining start slot with rapid choices during an active ant trip",()=>{
 const s=createGame();s.resolving=true;
 for(const column of [0,1,2,0,1])assert.equal(chooseTopColumn(s,column),true);
 assert.equal(freeSlotCount(s),0);
 assert.deepEqual(s.slots.map(box=>box.sourceIndex),[0,1,2,3,4]);
 assert.equal(canChoose(s),false);
});
test("each column advances independently and exhausted columns show empty cells",()=>{
 const s=createGame();for(let i=0;i<5;i++)assert.equal(chooseTopColumn(s,0),true);
 assert.deepEqual(s.tray.map(r=>r[0]),[11,12,13]);assert.equal(s.nextContainer,14);
});
test("tray choices remain available while ants are resolving",()=>{
 const s=createGame();s.resolving=true;assert.equal(canChoose(s),true);assert.equal(chooseTopColumn(s,0),true);
});
test("accessibility checks use the actual board dimensions, including a 250x250 field",()=>{
 const board=Array.from({length:250},()=>Array(250).fill("green"));
 board[125][125]="red";board[0][249]="red";
 assert.equal(isAccessible(board,125,125),false);
 assert.equal(isAccessible(board,249,0),true);
 board[125][124]="";
 assert.equal(isAccessible(board,125,125),true);
});
test("250x250 board survives save restoration without falling back to the demo field",()=>{
 const board=Array.from({length:250},()=>Array(250).fill("green"));
 board[0][0]="red";
 const saved={board,slots:Array(5).fill(null),tray:[[0,1,2],[3,4,5],[6,7,8]],nextContainer:9,remaining:62500};
 const restored=restoreGame(saved);
 assert.equal(restored.board.length,250);
 assert.equal(restored.board[249].length,250);
 assert.deepEqual(findAccessiblePixel(restored.board,"red"),{x:0,y:0});
});
test("findAccessiblePixels returns a bounded wave of matching exposed pixels",()=>{
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
 board[2][2]="";board[2][3]="red";board[3][3]="red";board[4][4]="blue";
 assert.deepEqual(findAccessiblePixels(board,"red",1),[{x:3,y:2}]);
 assert.deepEqual(findAccessiblePixels(board,"red",5),[{x:3,y:2},{x:3,y:3}]);
 assert.deepEqual(findAccessiblePixels(board,"blue",5),[]);
});
test("pixels are accessible at the edge or beside an empty orthogonal neighbour",()=>{
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));board[0][0]="red";board[3][3]="purple";
 assert.equal(isAccessible(board,0,0),true);assert.equal(isAccessible(board,3,3),false);
 board[3][2]="";assert.equal(isAccessible(board,3,3),true);
});
test("each ant clears one matching accessible pixel and the resolver can recalculate",()=>{
 const s=createGame();s.board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
 s.board[2][2]="";s.board[2][3]="red";s.board[3][3]="red";s.remaining=48;s.slots[0]={color:"red",ants:2};
 const first=findNextMove(s);assert.deepEqual(first,{slot:0,target:{x:3,y:2}});
 applyAntMove(s,first.slot,first.target);const second=findNextMove(s);assert.deepEqual(second,{slot:0,target:{x:3,y:3}});
 applyAntMove(s,second.slot,second.target);assert.equal(s.remaining,46);assert.equal(s.slots[0],null);
});
test("leftmost eligible start compartment always gets the next ant turn",()=>{
 const s=createGame();s.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 s.board[0][0]="red";s.board[6][6]="blue";s.remaining=2;
 s.slots[0]={color:"red",ants:1};s.slots[4]={color:"blue",ants:1};
 resolveAll(s);assert.deepEqual(s.resolutionLog.map(x=>x.slot),[0,4]);assert.equal(s.won,true);
});
test("defeat requires all five start slots occupied and no available matching move",()=>{
 const s=createGame();s.slots=Array.from({length:5},()=>({color:"purple",ants:1}));
 s.tray[0]=[null,null,null];s.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 s.board[3][3]="red";s.remaining=1;assert.equal(freeSlotCount(s),0);assert.equal(isDefeat(s),true);
 s.slots[4]=null;assert.equal(isDefeat(s),false);
});
test("saved tray and selected slots survive restore",()=>{
 const s=createGame();chooseTopColumn(s,1);const restored=restoreGame(serializeGame(s));
 assert.deepEqual(restored.tray,s.tray);assert.equal(restored.slots[0].sourceIndex,1);
});
test("legacy save with three candidates can be upgraded to 3x3 tray",()=>{
 const restored=restoreGame({board:INITIAL_BOARD,slots:Array(5).fill(null),candidates:[2,1,0],nextContainer:3,remaining:49});
 assert.deepEqual(restored.tray,[[2,1,0],[3,4,5],[6,7,8]]);
});
