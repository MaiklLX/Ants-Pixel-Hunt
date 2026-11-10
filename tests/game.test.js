import test from "node:test";
import assert from "node:assert/strict";
import {createGame,INITIAL_BOARD,INCOMING,isAccessible,findAccessiblePixel,placeNext,resolveAll,freeSlotCount,isDefeat,SIZE,SLOT_COUNT} from "../src/game.js";

test("level data contains a 7x7 board and exactly five slots",()=>{
  assert.equal(INITIAL_BOARD.length,SIZE);
  assert.ok(INITIAL_BOARD.every(row=>row.length===SIZE));
  assert.equal(createGame().slots.length,SLOT_COUNT);
});
test("queue ant totals exactly match the number of pixels by color",()=>{
  const boardCounts={};
  INITIAL_BOARD.flat().forEach(color=>boardCounts[color]=(boardCounts[color]||0)+1);
  const antCounts={};
  INCOMING.forEach(item=>antCounts[item.color]=(antCounts[item.color]||0)+item.ants);
  assert.deepEqual(antCounts,boardCounts);
});
test("a pixel is accessible at an edge or beside an empty orthogonal cell",()=>{
  const board=[["red","blue"],["green","yellow"]];
  assert.equal(isAccessible(board,0,0),true);
  assert.equal(isAccessible(board,1,1),true);
  const enclosed=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
  enclosed[3][3]="purple";
  assert.equal(isAccessible(enclosed,3,3),false);
});
test("a pixel becomes accessible after its same-color neighbor is removed",()=>{
  const state=createGame();
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  state.board[2][3]="red";
  state.board[3][3]="red";
  state.remaining=2;
  state.slots[0]={color:"red",ants:2};
  assert.deepEqual(findAccessiblePixel(state.board,"red"),{x:3,y:2});
  resolveAll(state);
  assert.equal(state.remaining,0);
  assert.equal(state.won,true);
  assert.deepEqual(state.resolutionLog.map(x=>[x.x,x.y]),[[3,2],[3,3]]);
});
test("placement consumes one queue item and cannot reuse an occupied slot",()=>{
  const state=createGame();
  assert.equal(placeNext(state,2),true);
  assert.equal(state.nextContainer,1);
  assert.equal(placeNext(state,2),false);
  assert.equal(state.slots.filter(Boolean).length,1);
});
test("resolver gives the first turn to the leftmost occupied slot",()=>{
  const state=createGame();
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  state.board[0][0]="red";
  state.board[6][6]="blue";
  state.remaining=2;
  state.slots[0]={color:"red",ants:1};
  state.slots[4]={color:"blue",ants:1};
  resolveAll(state);
  assert.deepEqual(state.resolutionLog.map(x=>x.slot),[0,4]);
  assert.equal(state.won,true);
});
test("defeat requires all five slots occupied and no available matching move",()=>{
  const state=createGame();
  state.slots=[{color:"purple",ants:1},{color:"purple",ants:1},{color:"purple",ants:1},{color:"purple",ants:1},{color:"purple",ants:1}];
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  state.board[3][3]="red";state.remaining=1;
  assert.equal(freeSlotCount(state),0);
  assert.equal(isDefeat(state),true);
  state.slots[4]=null;
  assert.equal(isDefeat(state),false);
});
test("win state is reached when the board has no remaining pixels",()=>{
  const state=createGame();
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  state.remaining=0;
  state.slots[0]={color:"red",ants:0};
  resolveAll(state);
  assert.equal(state.won,true);
  assert.equal(state.remaining,0);
});
