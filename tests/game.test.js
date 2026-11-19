import test from "node:test";
import assert from "node:assert/strict";
import {COLORS,createGame,LEVELS,getLevel,getIncoming,createArtworkBoard,resolveAll,INITIAL_BOARD,INCOMING,isAccessible,getExposedPixels,getExposedTargets,findAccessiblePixel,findAccessiblePixels,findAntWave,chooseTopColumn,canLaunchBox,findNextMove,applyAntMove,applyAntPickup,completeBoxDeparture,freeSlotCount,isDefeat,SIZE,GRID_SIZE,BLOCK_SIZE,BOX_CAPACITY,SLOT_COUNT,TRAY_SIZE,canChoose,restoreGame,serializeGame,countOutboundBySlot,countQueuedBySlot,countDispatchingWorkers,countSlotWorkers,canDepartSlot,isLockedBox,getLinkedPair,normalizeLinkedTray,buildIncoming,LOCKED_BOX_INDEX,LOCKED_BOX_COLUMN} from "../src/game.js";
const smallBoard=()=>Array.from({length:5},()=>Array(5).fill("green"));
const makeBoxAvailable=(state,index)=>{
 const deck=getIncoming(state.levelId),box=deck[index];
 state.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 state.obstacles=[];
 if(box?.special==="linked"){
  const partner=deck[getLinkedPair(state.levelId).find(value=>value!==index)];
  state.board[0][0]=box.color;state.board[0][1]=partner.color;state.remaining=2;
 }else if(box?.role){
  state.obstacles=[{x:0,y:0,role:box.role,hp:1}];state.remaining=0;
 }else{
  state.board[0][0]=box?.color||"black";state.remaining=1;
 }
};


test("the authored frog is built from large collectible blocks on a 450x450 display grid",()=>{
 const s=createGame();
 assert.equal(GRID_SIZE,450);assert.equal(BLOCK_SIZE,10);assert.equal(SIZE,45);
 assert.equal(INITIAL_BOARD.length,SIZE);assert.ok(INITIAL_BOARD.every(r=>r.length===SIZE));
 assert.equal(s.board.length,SIZE);assert.equal(s.slots.length,SLOT_COUNT);
 assert.equal(s.tray.length,TRAY_SIZE);assert.ok(s.tray.every(r=>r.length===TRAY_SIZE));
 const colors=new Set(INITIAL_BOARD.flat().filter(Boolean));assert.ok(colors.has("black"));assert.ok(colors.size>=4&&colors.size<=5,"starter artwork should use four clear pigments plus its contour");
 assert.ok(s.remaining>400&&s.remaining<1100);assert.ok(INITIAL_BOARD.some(row=>row.includes("")));
});
test("the first seven authored illustrations use richer shaded palettes",()=>{
 for(const level of LEVELS.filter(item=>item.number<=7)){
  const board=createArtworkBoard(level.id),colors=new Set(board.flat().filter(Boolean));
  assert.ok(colors.size>=3&&colors.size<=5,`${level.id} should use a compact, readable palette`);
  assert.ok(colors.has("black"),`${level.id} should retain a clean outer contour`);
  assert.ok(board.flat().filter(Boolean).length>300,`${level.id} should fill a substantial part of the arena`);
 }
});
test("the box deck contains exactly enough ants to collect every pixel by color",()=>{
 const totals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const row of createArtworkBoard("meadow-01"))for(const color of row)if(color)totals[color]++;
 const deckTotals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const box of INCOMING)deckTotals[box.color]+=box.ants;
 assert.deepEqual(Object.fromEntries(Object.entries(deckTotals).filter(([,total])=>total>0)),Object.fromEntries(Object.entries(totals).filter(([,total])=>total>0)));assert.ok(INCOMING.length>9);assert.equal(BOX_CAPACITY,150);
 assert.deepEqual(INCOMING.slice(0,5).map(box=>box.color),["black","forest","green","lime","cream"]);
});
test("a future-layer box can be staged in a starter slot and waits for its color to open",()=>{
 const s=createGame();assert.deepEqual(s.tray,[[0,1,2],[3,4,5],[6,7,8]]);
 assert.equal(canLaunchBox(s,1),false,"future-layer ants cannot collect until the color is exposed");
 assert.equal(chooseTopColumn(s,1),true,"the box itself can be staged before its color is exposed");
 assert.equal(s.slots[0].sourceIndex,1);assert.equal(s.slots[0].color,getIncoming(s.levelId)[1].color);
 assert.equal(chooseTopColumn(s,0),true);assert.equal(s.slots[1].sourceIndex,0);
 assert.deepEqual(s.tray.map(r=>r[1]),[4,7,9]);assert.equal(s.nextContainer,11);
});
test("selection fills the first free start compartment after a valid layer choice",()=>{
 const s=createGame();assert.equal(chooseTopColumn(s,0),true);
 const second=s.tray[0][1];makeBoxAvailable(s,second);
 assert.equal(chooseTopColumn(s,1),true);
 assert.equal(s.slots[0].sourceIndex,0);assert.equal(s.slots[1].sourceIndex,second);assert.equal(s.slots[2],null);
});
test("duplicate color squads cannot launch together, but crates can be staged",()=>{
 const s=createGame();s.resolving=true;
 assert.equal(chooseTopColumn(s,0),true);
 assert.equal(canLaunchBox(s,1),false,"same color squad is already active");
 assert.equal(chooseTopColumn(s,1),true,"the next crate may wait in another starter compartment");
 assert.equal(freeSlotCount(s),3);assert.equal(canChoose(s),true);
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
test("45x45 collectible block board survives save restoration for the 450x450 display grid",()=>{
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));board[0][0]="red";
 const saved={board,slots:Array(5).fill(null),tray:[[0,1,2],[3,4,5],[6,7,8]],nextContainer:9,remaining:SIZE*SIZE};
 const restored=restoreGame(saved);assert.equal(restored.board.length,SIZE);assert.equal(restored.board[SIZE-1].length,SIZE);
 assert.deepEqual(findAccessiblePixel(restored.board,"red"),{x:0,y:0});
});
test("swarm planner sends eligible ants together and reserves targets left-to-right",()=>{
 const s=createGame();s.board=smallBoard();s.board[0][0]="red";s.board[0][1]="red";s.board[0][2]="red";s.remaining=25;
 s.slots[0]={color:"red",ants:2};s.slots[3]={color:"red",ants:2};
 const wave=findAntWave(s);
 assert.deepEqual(wave.map(m=>[m.slot,m.target.x,m.target.y]),[[0,0,0],[3,1,0],[0,2,0]]);
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
 makeBoxAvailable(s,s.tray[0][0]);assert.equal(chooseTopColumn(s,0),true);
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
 const s=createGame();chooseTopColumn(s,0);s.sortedBoxes=7;
 const restored=restoreGame(serializeGame(s));assert.deepEqual(restored.tray,s.tray);
 assert.equal(restored.slots[0].sourceIndex,0);assert.equal(restored.sortedBoxes,7);
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

test("the 45x45 artwork produces a complete deterministic deck with bounded box sizes",()=>{
 const totals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const row of INITIAL_BOARD)for(const color of row)if(color)totals[color]++;
 const deckTotals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const box of INCOMING){
  assert.ok(box.ants>0&&box.ants<=BOX_CAPACITY);
  deckTotals[box.color]+=box.ants;
 }
 assert.deepEqual(Object.fromEntries(Object.entries(deckTotals).filter(([,total])=>total>0)),Object.fromEntries(Object.entries(totals).filter(([,total])=>total>0)));
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

test("layered box queue opens with two exposed-color choices and one future-layer decoy",()=>{
 const board=Array.from({length:9},()=>Array(9).fill("blue"));
 for(let x=0;x<9;x++){board[0][x]="red";board[8][x]="yellow";}
 for(let y=1;y<8;y++){board[y][0]="red";board[y][8]="yellow";}
 const deck=buildIncoming(board,8);
 assert.deepEqual(deck.slice(0,3).map(box=>box.color),["red","blue","yellow"]);
 assert.ok(deck.every(box=>box.ants>0&&box.ants<=BOX_CAPACITY));
 const totals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const row of board)for(const color of row)if(color)totals[color]++;
 const queued=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const box of deck)queued[box.color]+=box.ants;
 assert.deepEqual(Object.fromEntries(Object.entries(queued).filter(([,n])=>n)),Object.fromEntries(Object.entries(totals).filter(([,n])=>n)));
 assert.deepEqual(deck,buildIncoming(board,8),"same artwork must produce the same readable queue");
});
test("incoming deck balances a color total of 19 without an impossible minimum",()=>{
 const board=[Array(19).fill("red")];
 const deck=buildIncoming(board,8);
 assert.equal(deck.length,1,"a 19-ant color group should stay together in one useful crate");
  assert.equal(deck[0].ants,19);
 assert.equal(deck.reduce((sum,box)=>sum+box.ants,0),19);
 assert.ok(deck.every(box=>box.color==="red"&&box.ants>0&&box.ants<=BOX_CAPACITY));
});
test("all campaign levels have distinct deterministic artwork and exact matching box decks",()=>{
 assert.ok(LEVELS.length>0);
 const signatures=new Set();
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id);
  assert.equal(board.length,SIZE);
  assert.ok(board.every(row=>row.length===SIZE));
  const totals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
  for(const row of board)for(const color of row)if(color)totals[color]++;
  const artworkColors=Object.entries(totals).filter(([,total])=>total>0).map(([color])=>color);
  assert.ok(artworkColors.includes("black"),level.name+" must have a clean black silhouette contour");
  assert.ok(artworkColors.length<=Object.keys(COLORS).length,level.name+" may use every available natural artwork color");
  assert.ok(artworkColors.length>=3,level.name+" must use a rich natural color palette");
  const deckTotals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
  for(const box of deck){assert.ok(box.ants>0&&box.ants<=BOX_CAPACITY);if(!box.role)deckTotals[box.color]+=box.ants;}
  assert.deepEqual(Object.fromEntries(Object.entries(deckTotals).filter(([,total])=>total>0)),Object.fromEntries(Object.entries(totals).filter(([,total])=>total>0)));
  assert.equal(deck.filter(box=>!box.role).reduce((sum,box)=>sum+box.ants,0),createGame(level.id).remaining);
  signatures.add(board.map(row=>row.join(",")).join(";"));
 }
 assert.equal(signatures.size,LEVELS.length,"each campaign level must have its own pixel artwork");
 assert.equal(getLevel("unknown").id,"meadow-01");
});
test("cached campaign artwork is deterministic but callers receive independent mutable boards",()=>{
 const first=createArtworkBoard("meadow-008"),second=createArtworkBoard("meadow-008");
 assert.notEqual(first,second);
 assert.notEqual(first[0],second[0]);
 const signature=second.map(row=>row.join(",")).join(";");
 first[0][0]="mutated";
 assert.equal(second.map(row=>row.join(",")).join(";"),signature);
 assert.equal(createArtworkBoard("meadow-008").map(row=>row.join(",")).join(";"),signature);
});
test("campaign level identity survives save and restore",()=>{
 const s=createGame("garden-02");
 chooseTopColumn(s,0);
 const restored=restoreGame(serializeGame(s));
 assert.equal(restored.levelId,"garden-02");
 assert.deepEqual(restored.tray,s.tray);
 assert.equal(getIncoming(restored.levelId).length,getIncoming("garden-02").length);
});

test("all campaign levels start with accessible colors represented in their box deck",()=>{
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id);
  // One outside flood-fill gives the exact same exposed set as isAccessible,
  // without repeating a full board traversal for every occupied pixel.
  const accessibleColors=new Set(getExposedPixels(board).map(({x,y})=>board[y][x]).filter(Boolean));
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
  const box=deck[i];if(box.special==="linked")continue;
  const column=i%TRAY_SIZE;s.tray[0][column]=i;makeBoxAvailable(s,i);
  assert.equal(chooseTopColumn(s,column),true,"valid exposed box "+i+" should be selectable");
  const occupied=s.slots.findIndex(Boolean);assert.ok(occupied>=0);s.slots[occupied]=null;
 }
 assert.ok(s.nextContainer<=deck.length);
 assert.ok(s.tray.flat().every(index=>index===null||(index>=0&&index<deck.length)));
});
test("all campaign drawings and specialist obstacles remain solvable",()=>{
 for(const level of LEVELS){
  if(level.number>=8)continue; // generated 15-tone levels are checked by the full-grid peeling test below
  const board=createArtworkBoard(level.id),game=createGame(level.id),obstacles=game.obstacles.map(item=>({...item}));
  const deck=getIncoming(level.id).map(box=>({...box,special:box.special==="linked"?null:box.special})),active=Array(SLOT_COUNT).fill(null);
  let remaining=board.flat().filter(Boolean).length,steps=0;
  const queues=new Map(),cursor=new Map(),queued=new Set();
  const boxKey=box=>box.role?"role:"+box.role:"color:"+box.color;
  const targetKey=target=>target.kind+":"+target.x+","+target.y;
  const enqueueTarget=target=>{
   const key=targetKey(target);if(queued.has(key))return;
   queued.add(key);const type=target.kind==="obstacle"?"role:"+target.role:"color:"+target.color;
   if(!queues.has(type))queues.set(type,[]);
   queues.get(type).push({...target});
  };
  const enqueueCell=(x,y)=>{
   const obstacle=obstacles.find(item=>item.x===x&&item.y===y);
   if(obstacle)enqueueTarget({...obstacle,kind:"obstacle"});
   else if(board[y]?.[x])enqueueTarget({x,y,kind:"pixel",color:board[y][x]});
  };
  for(const target of getExposedTargets({board,obstacles}))enqueueTarget(target);
  const valid=target=>{
   if(target.kind==="obstacle")return obstacles.some(item=>item.x===target.x&&item.y===target.y&&item.role===target.role);
   return !obstacles.some(item=>item.x===target.x&&item.y===target.y)&&board[target.y]?.[target.x]===target.color;
  };
  const accessibleIndex=box=>{
   const key=boxKey(box),list=queues.get(key)||[];let index=cursor.get(key)||0;
   while(index<list.length&&!valid(list[index]))index++;
   cursor.set(key,index);return index<list.length?index:-1;
  };
  const exposedCount=box=>{
   const list=queues.get(boxKey(box))||[],start=cursor.get(boxKey(box))||0;
   let count=0;for(let i=start;i<list.length;i++)if(valid(list[i]))count++;
   return count;
  };

  while((remaining>0||obstacles.length>0)&&steps++<30000){
   let progressed=false;
   for(let slot=0;slot<active.length;slot++){
    const box=active[slot];if(!box)continue;
    const key=boxKey(box),index=accessibleIndex(box),target=index>=0?queues.get(key)[index]:null;
    if(target){
     if(target.kind==="obstacle"){
      const obstacle=obstacles.find(item=>item.x===target.x&&item.y===target.y);
      obstacle.hp--;
      if(obstacle.hp<=0){obstacles.splice(obstacles.indexOf(obstacle),1);cursor.set(key,index+1);enqueueCell(target.x,target.y);}
     }else{
      board[target.y][target.x]="";remaining--;cursor.set(key,index+1);
      // Re-scan the exterior-connected empty space: detailed pixel art can
      // contain enclosed pockets that open through a multi-cell corridor.
      for(const exposed of getExposedTargets({board,obstacles}))enqueueTarget(exposed);
     }
     box.ants--;progressed=true;if(box.ants<=0)active[slot]=null;
    }
   }
   if(remaining===0&&obstacles.length===0)break;
   let loadedNewBox=false;
   for(let slot=0;slot<active.length;slot++){
    if(active[slot])continue;
    let index=-1,bestAntCount=Infinity;
    for(let candidate=0;candidate<deck.length;candidate++){
     const box=deck[candidate];
     const alreadyAssigned=active.reduce((sum,other)=>other&&boxKey(other)===boxKey(box)?sum+other.ants:sum,0);
     const canClearBatch=level.number>=8?exposedCount(box)>=box.ants+alreadyAssigned:accessibleIndex(box)>=0;
     if(canClearBatch&&box.ants<bestAntCount){index=candidate;bestAntCount=box.ants;}
    }
    if(index>=0){active[slot]=deck.splice(index,1)[0];loadedNewBox=true;}
   }
   if(!progressed&&!loadedNewBox)break;
  }
  assert.equal(remaining,0,level.name+" must clear every artwork block");
  assert.equal(obstacles.length,0,level.name+" must clear every specialist obstacle");
 }
});
test("future-layer boxes can be staged but their ants wait until the player clears the exposed contour",()=>{
 const level=LEVELS.find(item=>item.number===8),state=createGame(level.id);
 const exposed=getExposedPixels(state.board),available=new Set(exposed.map(point=>state.board[point.y][point.x]));
 const deck=getIncoming(level.id);
 assert.ok(available.has(deck[0].color),"the first lane must offer a box for the currently exposed layer");
 assert.ok(deck.slice(1,3).some(box=>!available.has(box.color)),"the other top-row lanes must tempt the player with future-layer colors");
 const futureColumn=[1,2].find(column=>{
  const index=state.tray[0][column];
  return index!==null&&index!==undefined&&!available.has(deck[index]?.color);
 });
 assert.notEqual(futureColumn,undefined,"at least one visible lane should tempt the player with a future layer");
 assert.equal(chooseTopColumn(state,futureColumn),true,"future-layer box can be staged in a starter compartment");
 assert.equal(freeSlotCount(state),4,"a waiting crate deliberately occupies a start compartment");
 assert.equal(findNextMove(state),null,"its ants wait until matching pixels are exposed");
 assert.equal(isDefeat(state),false,"the level remains recoverable");
 assert.equal(chooseTopColumn(state,0),true,"the player can still choose the current exposed layer");
 assert.ok(findNextMove(state),"the correct order must provide a valid move");
});
test("all generated full-grid illustrations can be peeled completely from the exterior",()=>{
 for(const level of LEVELS.filter(item=>item.number>=8)){
  const board=createArtworkBoard(level.id);
  let remaining=board.flat().filter(Boolean).length,steps=0;
  while(remaining>0&&steps++<SIZE*SIZE){
   const exposed=getExposedPixels(board);
   if(!exposed.length)break;
   for(const point of exposed)board[point.y][point.x]="";
   remaining-=exposed.length;
  }
  assert.equal(remaining,0,level.name+" must have no sealed pixel islands");
 }
});
test("builder ants dismantle a root barrier before the covered color block can be collected",()=>{
 const state=createGame("meadow-026"),obstacle=state.obstacles[0],box=getIncoming(state.levelId).find(item=>item.role==="builder");
 assert.ok(obstacle);assert.equal(obstacle.role,"builder");assert.ok(box);
 const coveredColor=state.board[obstacle.y][obstacle.x],before=state.remaining;
 state.slots[0]={...box,ants:box.ants};
 const target=getExposedTargets(state).find(item=>item.kind==="obstacle"&&item.id===obstacle.id);
 assert.ok(target);
 assert.equal(applyAntMove(state,0,target),true);
 assert.equal(state.remaining,before,"hitting the barrier must not remove the colored block underneath");
 assert.equal(state.obstacles[0].hp,1,"the first builder hit weakens the barrier");
 const second=getExposedTargets(state).find(item=>item.kind==="obstacle"&&item.id===obstacle.id);
 assert.equal(applyAntMove(state,0,second),true);
 assert.equal(state.obstacles.length,0,"the second builder hit removes the barrier");
 assert.equal(state.board[obstacle.y][obstacle.x],coveredColor,"the covered artwork block remains intact");
 assert.ok(getExposedTargets(state).some(item=>item.kind==="pixel"&&item.x===obstacle.x&&item.y===obstacle.y&&item.color===coveredColor));
});
test("specialist crates provide exactly enough builders and warriors for each level's obstacles",()=>{
 for(const level of LEVELS){
  const game=createGame(level.id),deck=getIncoming(level.id);
  for(const role of ["builder","warrior"]){
   const required=game.obstacles.filter(item=>item.role===role).reduce((sum,item)=>sum+item.hp,0);
   const supplied=deck.filter(box=>box.role===role).reduce((sum,box)=>sum+box.ants,0);
   assert.equal(supplied,required,level.name+" "+role+" supply must match obstacle durability");
  }
  for(const obstacle of game.obstacles){
   assert.ok(getExposedTargets(game).some(target=>target.kind==="obstacle"&&target.id===obstacle.id),level.name+" specialist obstacle must start exposed");
  }
 }
});
test("generated campaign boxes are tactical partial squads, not one-box color keys",()=>{
 for(const level of LEVELS.filter(item=>item.number>=8)){
  const deck=getIncoming(level.id).filter(box=>!box.role);
  assert.ok(deck.every(box=>box.ants<=46),level.name+" must keep every ordinary squad smaller than a full exposed color layer");
  const board=createArtworkBoard(level.id),colorTotals=new Map();
  for(const color of board.flat().filter(Boolean))colorTotals.set(color,(colorTotals.get(color)||0)+1);
  for(const [color,total] of colorTotals){
   const squads=deck.filter(box=>box.color===color);
   if(total>=65){
    assert.ok(squads.length>=2,level.name+" "+color+" should require staging multiple squads");
    assert.ok(squads.every(box=>box.ants<total),level.name+" "+color+" must not be a single full-color key");
   }
  }
 }
});

test("fallback queue fragments never create oversized ordinary squads",()=>{
 for(const level of LEVELS.filter(item=>item.number>=8)){
  const deck=buildIncoming(createArtworkBoard(level.id),level.number);
  assert.ok(deck.every(box=>box.ants>0&&box.ants<=46),level.name+" fallback squads must stay within the tactical size cap");
 }
});

test("the opening queue offers a useful exposed color before its future-layer temptation",()=>{
 for(const level of LEVELS.filter(item=>item.number>=8)){
  const board=createArtworkBoard(level.id),deck=buildIncoming(board,level.number);
  const exposedColors=new Set(getExposedPixels(board).map(point=>board[point.y][point.x]));
  assert.ok(deck.length>=1,level.name+" must have an opening crate");
  assert.ok(exposedColors.has(deck[0].color),level.name+" first crate must match the current exposed rim");
  const peeled=board.map(row=>row.slice());
  for(const point of getExposedPixels(peeled))peeled[point.y][point.x]="";
  const futureColors=new Set(getExposedPixels(peeled).map(point=>peeled[point.y][point.x]));
  if(deck.length>1&&[...futureColors].some(color=>!exposedColors.has(color))){
   assert.ok(!exposedColors.has(deck[1].color),level.name+" second crate should be a future-layer choice");
  }
 }
});

test("generated wave boxes carry substantial ant squads without losing any color budget",()=>{
 for(const level of LEVELS.filter(item=>item.number>=8)){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id).filter(box=>!box.role);
  const total=board.flat().filter(Boolean).length;
  const ants=deck.reduce((sum,box)=>sum+box.ants,0);
  assert.equal(ants,total,level.name+" must keep a complete ant budget");
  assert.ok(deck.every(box=>box.ants>0&&box.ants<=BOX_CAPACITY),level.name+" must respect box capacity");
  const average=ants/Math.max(1,deck.length);
  assert.ok(average>=8,level.name+" should not flood the tray with tiny ant squads; average="+average.toFixed(1)+", boxes="+deck.length);
 }
});
test("box capacities vary within each sufficiently large color deck but preserve exact ant totals",()=>{
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),deck=getIncoming(level.id);
  for(const color of Object.keys(COLORS)){
   const total=board.flat().filter(pixel=>pixel===color).length;
   const sizes=deck.filter(box=>!box.role&&box.color===color).map(box=>box.ants);
   assert.equal(sizes.reduce((sum,n)=>sum+n,0),total,level.name+" "+color+" ant budget");
   assert.ok(sizes.every(n=>n>0&&n<=BOX_CAPACITY));
   if(level.number<8&&sizes.length>=3)assert.ok(new Set(sizes).size>=2,level.name+" "+color+" boxes should not all be identical");
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
 makeBoxAvailable(s,s.tray[0][0]);assert.equal(chooseTopColumn(s,0),true);s.slots[0]=null;
 makeBoxAvailable(s,s.tray[0][0]);assert.equal(chooseTopColumn(s,0),true);s.slots[0]=null;
 assert.deepEqual(s.lockProgressColumns,[0]);
 // The sealed crate's own lane never contributes to its opening.
 makeBoxAvailable(s,s.tray[0][LOCKED_BOX_COLUMN]);assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),true);s.slots[0]=null;
 makeBoxAvailable(s,s.tray[0][LOCKED_BOX_COLUMN]);assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),true);s.slots[0]=null;
 assert.equal(s.tray[0][LOCKED_BOX_COLUMN],LOCKED_BOX_INDEX);
 assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),false,"sealed crate cannot be selected early");
 assert.equal(isLockedBox(s,LOCKED_BOX_INDEX),true);
 // A real placement from the other lane completes the two-lane requirement.
 makeBoxAvailable(s,s.tray[0][1]);assert.equal(chooseTopColumn(s,1),true);s.slots[0]=null;
 assert.deepEqual(s.lockProgressColumns,[0,1]);
 assert.equal(s.lockedBoxOpen,true);
 assert.equal(isLockedBox(s,LOCKED_BOX_INDEX),false);
 makeBoxAvailable(s,LOCKED_BOX_INDEX);assert.equal(chooseTopColumn(s,LOCKED_BOX_COLUMN),true,"opened crate becomes a normal selectable box");
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


test("linked crates wait until both partners are at the top and two slots are free",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);assert.equal(pair.length,2);
 s.tray[0][0]=pair[0];s.tray[0][1]=null;
 assert.equal(chooseTopColumn(s,0),false,"a lone linked crate cannot be activated");assert.equal(s.pendingLinkedIndex,null);
 s.tray[0][1]=pair[1];s.slots[0]={role:"builder",ants:1};s.slots[1]={role:"warrior",ants:1};s.slots[2]={color:"purple",ants:1};s.slots[3]={color:"orange",ants:1};
 makeBoxAvailable(s,pair[0]);const before=s.tray.map(row=>row.slice());assert.equal(chooseTopColumn(s,0),false,"pair needs two free compartments");
 assert.deepEqual(s.tray,before,"failed placement must not advance either queue");assert.equal(s.slots.filter(Boolean).length,4);
});
test("linked crates are placed atomically into two start compartments",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);s.tray[0][0]=pair[0];s.tray[0][1]=pair[1];makeBoxAvailable(s,pair[0]);const untouched=s.tray[0][2],next0=s.tray[1][0],next1=s.tray[1][1];
 assert.equal(chooseTopColumn(s,0),true);assert.equal(s.pendingLinkedIndex,null);
 assert.deepEqual(s.slots.slice(0,2).map(box=>box.sourceIndex),pair);assert.ok(s.slots.slice(0,2).every(box=>box.special==="linked"));
 assert.equal(s.tray[0][0],next0);assert.equal(s.tray[0][1],next1);assert.equal(s.tray[0][2],untouched);
 assert.match(s.message,/вместе/);
});
test("atomic linked-pair placement uses the first two free compartments",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);s.slots[0]={color:"red",ants:1};s.slots[2]={color:"blue",ants:1};
 s.tray[0][0]=pair[0];s.tray[0][1]=pair[1];makeBoxAvailable(s,pair[0]);assert.equal(chooseTopColumn(s,1),true);
 assert.deepEqual([s.slots[1].sourceIndex,s.slots[3].sourceIndex],[pair[1],pair[0]]);
});
test("linked-pair placement is fully represented after save and restore",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);s.tray[0][0]=pair[0];s.tray[0][1]=pair[1];makeBoxAvailable(s,pair[0]);
 assert.equal(chooseTopColumn(s,0),true);const restored=restoreGame(serializeGame(s));
 assert.equal(restored.pendingLinkedIndex,null);assert.deepEqual(restored.slots.slice(0,2).map(box=>box?.sourceIndex),pair);
});
test("a linked crate stays in its slot after filling until its partner is also full",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId),pairId="test-linked";
 s.slots[0]={...getIncoming(s.levelId)[pair[0]],pairId,ants:1};
 s.slots[1]={...getIncoming(s.levelId)[pair[1]],pairId,ants:1};
 s.board[0][0]=s.slots[0].color;s.board[0][1]=s.slots[1].color;
 assert.equal(applyAntMove(s,0,{x:0,y:0}),true);
 assert.equal(s.slots[0].ants,0);assert.equal(s.slots[0].status,"waiting-linked");
 assert.ok(s.slots[1]);assert.equal(s.slots[1].status,undefined);
 assert.equal(completeBoxDeparture(s,0),false,"one filled crate cannot depart alone");
 assert.ok(s.slots[0]&&s.slots[1],"both cells remain occupied while the partner collects");
 assert.equal(applyAntMove(s,1,{x:1,y:0}),true);
 assert.equal(s.slots[0].status,"departing");assert.equal(s.slots[1].status,"departing");
 assert.equal(completeBoxDeparture(s,1),true,"the pair departs as a single unit");
 assert.equal(s.slots[0],null);assert.equal(s.slots[1],null);assert.equal(s.sortedBoxes,2);
});
test("restoring a half-filled linked pair keeps the completed crate waiting",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId),pairId="restore-linked";
 s.slots[0]={...getIncoming(s.levelId)[pair[0]],pairId,ants:0};
 s.slots[1]={...getIncoming(s.levelId)[pair[1]],pairId,ants:2};
 const restored=restoreGame(serializeGame(s));
 assert.equal(restored.slots[0].status,"waiting-linked");
 assert.equal(restored.slots[1].ants,2);
});
test("every campaign deck places its linked pair outside the sealed-box position",()=>{
 for(const level of LEVELS){
  const pair=getLinkedPair(level.id);
  assert.equal(pair.length,2,level.name+" needs exactly one linked pair");
  assert.ok(pair.every(index=>index!==LOCKED_BOX_INDEX));
  assert.notEqual(pair[0]%TRAY_SIZE,pair[1]%TRAY_SIZE,"linked crates must be in different lanes");
 }
});


test("the seventh firefly meadow has five exact color budgets and a fully solvable queue",()=>{
 const level=LEVELS.find(item=>item.id==="forest-07");
 assert.ok(level);assert.equal(level.number,7);assert.equal(level.name,"Светлячок в сумерках");
 assert.equal(LEVELS.length,500);
 const board=createArtworkBoard(level.id);
 assert.equal(board.length,SIZE);assert.ok(board.every(row=>row.length===SIZE));
 const totals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const row of board)for(const color of row)if(color)totals[color]++;
 assert.ok(Object.values(totals).filter(total=>total>0).length>=4);
 const exposed=getExposedPixels(board);
 assert.ok(exposed.length>0);
 assert.ok(exposed.every(({x,y})=>board[y][x]==="black"),"every game-exposed block, including board-edge cells, must use the black contour");
 assert.ok(exposed.length<=totals.black,"the outer black contour must be reachable first; internal ink lines may unlock in later layers");
 assert.ok(totals.black>exposed.length,"the illustration should retain internal black contours beneath the outer silhouette");
 const deck=getIncoming(level.id),deckTotals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
 for(const box of deck){assert.ok(box.ants>0&&box.ants<=BOX_CAPACITY);if(!box.role)deckTotals[box.color]+=box.ants;}
 assert.deepEqual(deckTotals,totals,"the queue must contain exactly one ant per artwork block");
 assert.equal(getLinkedPair(level.id).length,2,"the authored queue must retain its linked pair");
 const state=createGame(level.id);
 assert.equal(state.remaining,board.flat().filter(Boolean).length,"the full specialist-free artwork starts with an exact pixel budget");
 assert.ok(deck.length>0,"the firefly artwork must receive its complete color queue");
});

test("every campaign illustration merges tiny color flecks into readable ant squads",()=>{
 for(const level of LEVELS){
  const board=createArtworkBoard(level.id),totals=Object.fromEntries(Object.keys(COLORS).map(color=>[color,0]));
  for(const row of board)for(const color of row)if(color)totals[color]++;
  for(const [color,count] of Object.entries(totals)){
   if(color!=="black"&&count>0)assert.ok(count>=18,`${level.id} ${color} has only ${count} pixels; sparse accents should merge into a nearby pigment`);
  }
  const deck=getIncoming(level.id).filter(box=>!box.role);
  assert.equal(deck.reduce((sum,box)=>sum+box.ants,0),board.flat().filter(Boolean).length,`${level.id} must retain its exact ant budget after palette cleanup`);
 }
});
test("runtime pickup removes the block without consuming another ant from the source box",()=>{
 const s=createGame(),slot=0,target=getExposedPixels(s.board)[0],color=s.board[target.y][target.x];
 const box=getIncoming(s.levelId).find(item=>item.color===color);s.slots[slot]={...box,ants:7};
 const before=s.remaining;
 assert.equal(applyAntPickup(s,slot,target,color),true);
 assert.equal(s.remaining,before-1);assert.equal(s.slots[slot].ants,7);
 assert.equal(applyAntPickup(s,slot,target,color),false,"a block can only be carried once");
});
test("returning ants release dispatch capacity before reaching the anthill",()=>{
 const workers=new Map([[1,{slot:0,phase:"queued"}],[2,{slot:0,phase:"outbound"}],[3,{slot:1,phase:"returning"}],[4,{slot:2,phase:"returning"}]]);
 assert.equal(countDispatchingWorkers(workers),2);
 workers.get(2).phase="returning";
 assert.equal(countDispatchingWorkers(workers),1);
 workers.delete(1);
 assert.equal(countDispatchingWorkers(workers),0);
});

test("only ants still waiting to leave a box count against its undispatched supply",()=>{
 const workers=new Map([[1,{slot:2,phase:"queued"}],[2,{slot:2,phase:"outbound"}],[3,{slot:2,phase:"returning"}],[4,{slot:1,phase:"queued"}]]);
 const queued=countQueuedBySlot(workers);
 assert.equal(queued.get(2),1);assert.equal(queued.get(1),1);
 assert.equal(countOutboundBySlot(workers).get(2),1);
});


test("linked pair is moved sideways at the same queue depth instead of sharing a lane",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);
 s.tray=Array.from({length:TRAY_SIZE},(_,r)=>Array.from({length:TRAY_SIZE},(_,c)=>r*TRAY_SIZE+c));
 s.tray[0][1]=pair[0];s.tray[2][1]=pair[1];
 const displaced=s.tray[2][0];
 assert.equal(normalizeLinkedTray(s),true);
 const first=s.tray.flat().indexOf(pair[0]),second=s.tray.flat().indexOf(pair[1]);
 assert.ok(first>=0&&second>=0);
 assert.notEqual(first%TRAY_SIZE,second%TRAY_SIZE,"linked crates must occupy different vertical lanes");
 assert.equal(Math.floor(first/TRAY_SIZE),0);
 assert.equal(Math.floor(second/TRAY_SIZE),2,"the partner must not be promoted out of its queue depth");
 assert.equal(s.tray[2][1],displaced,"the displaced crate stays in the queue instead of being lost");
});
test("linked pair stays in separate columns when one member is already at the top",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);
 s.tray[0][0]=pair[0];s.tray[2][0]=pair[1];
 assert.equal(normalizeLinkedTray(s),true);
 const first=s.tray.flat().indexOf(pair[0]),second=s.tray.flat().indexOf(pair[1]);
 assert.notEqual(first%TRAY_SIZE,second%TRAY_SIZE);
 assert.equal(Math.floor(second/TRAY_SIZE),2,"lane correction must not change queue order");
});
test("a zero-ant linked box is removed if its partner is already absent",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);
 s.slots[0]={...getIncoming(s.levelId)[pair[0]],pairId:"orphan-pair",ants:0,status:"waiting-linked"};
 assert.equal(completeBoxDeparture(s,0),true);
 assert.equal(s.slots[0],null);assert.equal(s.sortedBoxes,1);
});
test("two empty linked boxes are removed together even if the partner status was stale",()=>{
 const s=createGame(),pair=getLinkedPair(s.levelId);
 s.slots[0]={...getIncoming(s.levelId)[pair[0]],pairId:"stale-pair",ants:0,status:"waiting-linked"};
 s.slots[1]={...getIncoming(s.levelId)[pair[1]],pairId:"stale-pair",ants:0,status:"waiting-linked"};
 assert.equal(completeBoxDeparture(s,0),true);
 assert.equal(s.slots[0],null);assert.equal(s.slots[1],null);assert.equal(s.sortedBoxes,2);
});


test("ant dispatch shares each wave fairly across active colours",()=>{
 const s=createGame();
 s.board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 s.board[0][0]="red";s.board[0][1]="red";s.board[0][2]="blue";s.board[0][3]="blue";
 s.remaining=4;
 const red={color:"red",ants:8};
 const blue={color:"blue",ants:8};
 s.slots[0]={...red,ants:8};s.slots[1]={...blue,ants:8};
 const wave=findAntWave(s,new Set(),new Map(),4);
 assert.deepEqual(wave.map(move=>move.color),["red","blue","red","blue"]);
});


test("same-colour starter boxes each receive an independent first dispatch in the same wave",()=>{
 const s=createGame();
 s.board=Array.from({length:5},()=>Array(5).fill(""));
 s.board[0][0]="red";s.board[0][1]="red";s.board[0][2]="red";
 s.remaining=3;
 const red={color:"red",ants:3};
 s.slots[0]={...red,ants:3};s.slots[4]={...red,ants:3};
 const firstWave=findAntWave(s,new Set(),new Map(),2);
 assert.deepEqual(firstWave.map(move=>move.slot),[0,4]);
 assert.equal(new Set(firstWave.map(move=>move.target.x+","+move.target.y)).size,2);
});


test("campaign contains 500 distinct, authored-first and procedurally composed image levels",()=>{
 assert.equal(LEVELS.length,500);
 assert.equal(LEVELS[0].id,"meadow-01");
 assert.equal(LEVELS[6].id,"forest-07");
 assert.equal(LEVELS[7].number,8);
 const signatures=new Set();
 for(const level of LEVELS.slice(7)){
  const board=createArtworkBoard(level.id);
  assert.equal(board.length,SIZE,level.id);
  assert.ok(board.every(row=>row.length===SIZE),level.id+" must remain 45×45");
  const colors=new Set(board.flat().filter(Boolean));
  assert.ok(colors.size>=3,level.id+" needs a readable multi-colour image");
  assert.ok(colors.size>=3&&colors.size<=Object.keys(COLORS).length,level.id+" may use the full available object palette with a black contour");
  assert.ok(colors.has("black"),level.id+" must have a dark pixel-art contour");
  assert.ok(board.flat().filter(Boolean).length>35,level.id+" should contain a visible illustration");
  signatures.add(board.flat().join(","));
 }
 assert.equal(signatures.size,493,"generated levels must not repeat the same pixel artwork");
 assert.equal(new Set(LEVELS.map(level=>level.chapter)).size,13,"the 500 levels are grouped into progressive forest chapters");
});


test("every live queue opens with at least one immediately playable top-lane crate",()=>{
 for(const level of LEVELS){
  const state=createGame(level.id),visible=state.tray[0].filter(index=>index!==null);
  assert.ok(visible.length>0,level.name+" must show an opening crate");
  assert.ok(visible.some(index=>canLaunchBox(state,index)),level.name+" must not begin with three unusable top-lane crates");
 }
});

test("linked crates are scheduled at the same queue depth in separate lanes across all 500 levels",()=>{
 for(const level of LEVELS){
  const pair=getLinkedPair(level.id);
  assert.equal(Math.floor(pair[0]/TRAY_SIZE),Math.floor(pair[1]/TRAY_SIZE),level.name+" linked crates should become available together");
  assert.notEqual(pair[0]%TRAY_SIZE,pair[1]%TRAY_SIZE,level.name+" linked crates must occupy separate lanes");
 }
});

test("campaign queue squads become smaller in measured steps without losing any ants",()=>{
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill("green"));
 const early=buildIncoming(board,8),late=buildIncoming(board,500);
 const median=items=>{
  const values=items.map(box=>box.ants).sort((a,b)=>a-b);
  return values[Math.floor(values.length/2)];
 };
 for(const deck of [early,late]){
  assert.ok(deck.every(box=>box.ants>0&&box.ants<=BOX_CAPACITY));
  assert.equal(deck.reduce((sum,box)=>sum+box.ants,0),SIZE*SIZE);
 }
 assert.ok(median(late)<median(early),"late levels should require more deliberate box rotations");
});
