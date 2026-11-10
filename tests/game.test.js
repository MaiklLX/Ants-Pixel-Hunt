import test from "node:test";
import assert from "node:assert/strict";
import {createGame,INITIAL_BOARD,INCOMING,isAccessible,findAccessiblePixel,chooseCandidate,resolvePass,resolveAll,freeSlotCount,isDefeat,SIZE,SLOT_COUNT,CHOICE_COUNT,canChoose} from "../src/game.js";

test("level data contains a 7x7 board and exactly five launch slots",()=>{
  assert.equal(INITIAL_BOARD.length,SIZE);
  assert.ok(INITIAL_BOARD.every(row=>row.length===SIZE));
  assert.equal(createGame().slots.length,SLOT_COUNT);
});
test("the three initial choices are visible and drawn from the deterministic container deck",()=>{
  const state=createGame();
  assert.equal(state.candidates.length,CHOICE_COUNT);
  assert.deepEqual(state.candidates,[0,1,2]);
  assert.equal(state.nextContainer,3);
});
test("a pixel is accessible at an edge or beside an empty orthogonal cell",()=>{
  const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
  board[0][0]="red";board[3][3]="purple";
  assert.equal(isAccessible(board,0,0),true);
  assert.equal(isAccessible(board,3,3),false);
  board[3][2]="";
  assert.equal(isAccessible(board,3,3),true);
});
test("a pixel becomes accessible after its same-color neighbor is removed",()=>{
  const state=createGame();
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
  state.board[2][2]="";state.board[2][3]="red";state.board[3][3]="red";state.remaining=48;
  state.slots[0]={color:"red",ants:2};
  assert.deepEqual(findAccessiblePixel(state.board,"red"),{x:3,y:2});
  resolvePass(state);
  assert.equal(state.remaining,46);
  assert.equal(state.board[2][3],"");assert.equal(state.board[3][3],"");
  assert.deepEqual(state.resolutionLog.map(x=>[x.x,x.y]),[[3,2],[3,3]]);
});
test("player chooses a box, and it automatically occupies the first free slot",()=>{
  const state=createGame();
  assert.equal(chooseCandidate(state,1),true);
  assert.equal(state.slots[0].color,"blue");
  assert.equal(state.slots[0].sourceIndex,1);
  assert.equal(state.slots[1],null);
  assert.deepEqual(state.candidates,[0,2,3]);
  assert.equal(state.nextContainer,4);
});
test("a chosen candidate cannot be selected twice and remaining offers stay visible",()=>{
  const state=createGame();
  assert.equal(chooseCandidate(state,2),true);
  assert.equal(chooseCandidate(state,2),false);
  assert.deepEqual(state.candidates,[0,1,3]);
});
test("the next offer refills the tray without discarding unchosen boxes",()=>{
  const state=createGame();
  chooseCandidate(state,1);
  assert.deepEqual(state.candidates,[0,2,3]);
  chooseCandidate(state,3);
  assert.deepEqual(state.candidates,[0,2,4]);
  assert.equal(state.slots[0].color,"blue");
  assert.equal(state.slots[1].color,"purple");
});
test("resolver gives the first turn to the leftmost occupied slot",()=>{
  const state=createGame();
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  state.board[0][0]="red";state.board[6][6]="blue";state.remaining=2;
  state.slots[0]={color:"red",ants:1};state.slots[4]={color:"blue",ants:1};
  resolveAll(state);
  assert.deepEqual(state.resolutionLog.map(x=>x.slot),[0,4]);
  assert.equal(state.won,true);
});
test("defeat requires all five slots occupied and no available matching move",()=>{
  const state=createGame();
  state.slots=[{color:"purple",ants:1},{color:"purple",ants:1},{color:"purple",ants:1},{color:"purple",ants:1},{color:"purple",ants:1}];
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  state.board[3][3]="red";state.remaining=1;
  assert.equal(freeSlotCount(state),0);assert.equal(isDefeat(state),true);
  state.slots[4]=null;assert.equal(isDefeat(state),false);
});
test("win state is reached when the board has no remaining pixels",()=>{
  const state=createGame();
  state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
  state.remaining=0;state.slots[0]={color:"red",ants:0};
  resolveAll(state);assert.equal(state.won,true);assert.equal(state.remaining,0);
});
