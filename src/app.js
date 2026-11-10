import {COLORS,INCOMING,SIZE,SLOT_COUNT,TRAY_SIZE,createGame,canChoose,chooseTopColumn,findNextMove,applyAntMove,serializeGame,restoreGame,isDefeat} from "./game.js";
import {loadLocal,saveLocal,clearLocal} from "./storage.js";
const $=id=>document.getElementById(id);
const boardEl=$("board"),slotsEl=$("slots"),choicesEl=$("choices"),antLayer=$("ant-layer");
let state=createGame(),resolverRunning=false,resetting=false;
function renderBoard(){
 boardEl.replaceChildren();
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const color=state.board[y][x],cell=document.createElement("div");
  cell.className="pixel"+(!color?" empty":"")+(color?" accessible":"");
  if(color)cell.style.background=COLORS[color].hex;
  if(state.activeTarget?.x===x&&state.activeTarget?.y===y)cell.classList.add("target");
  cell.setAttribute("role","gridcell");cell.setAttribute("aria-label",color?COLORS[color].name:"Пустая клетка");boardEl.append(cell);
 }
 $("board-status").textContent=`Пикселей осталось: ${state.remaining}`;
}
function renderSlots(){
 slotsEl.replaceChildren();
 state.slots.forEach((box,index)=>{
  const slot=document.createElement("div");slot.className="slot"+(box?" filled":"")+(state.activeSlot===index?" active":"");
  const number=document.createElement("span");number.className="slot-number";number.textContent=`СТАРТ ${index+1}`;slot.append(number);
  if(box){const stripe=document.createElement("span");stripe.className="slot-color";stripe.style.background=COLORS[box.color].hex;
   const count=document.createElement("strong");count.className="ant-count";count.textContent=`● ${box.ants}`;slot.append(stripe,count);
  }else{const plus=document.createElement("span");plus.className="slot-plus";plus.textContent="＋";slot.append(plus);}
  slotsEl.append(slot);
 });
}
function renderChoices(){
 // Keep old card positions so the three rows visibly cascade upward after a pick.
 const oldPositions=new Map();
 for(const node of choicesEl.querySelectorAll("[data-box-index]")){
  const rect=node.getBoundingClientRect();oldPositions.set(node.dataset.boxIndex,{left:rect.left,top:rect.top});
 }
 choicesEl.replaceChildren();
 for(let row=0;row<TRAY_SIZE;row++)for(let col=0;col<TRAY_SIZE;col++){
  const index=state.tray[row][col],box=index===null?null:INCOMING[index],button=document.createElement("button");
  button.type="button";button.className="choice-card"+(row===0?" selectable":" locked");
  if(index!==null&&index!==undefined)button.dataset.boxIndex=String(index);
  // Deliberately do not disable the rack while an ant is travelling: the player can
  // fill all remaining start compartments during the same animation.
  button.disabled=row!==0||!box||resetting||state.won||state.lost||!canChoose(state);
  if(box){
   button.style.setProperty("--ant-color",COLORS[box.color].hex);
   const pos=document.createElement("span");pos.className="choice-number";pos.textContent=`РЯД ${row+1} · КОЛОНКА ${col+1}`;
   const dots=document.createElement("span");dots.className="ant-dots";dots.textContent=Array.from({length:Math.min(box.ants,8)},()=>"●").join(" ");
   const name=document.createElement("strong");name.textContent=COLORS[box.color].name;
   const count=document.createElement("small");count.textContent=`${box.ants} ${box.ants===1?"муравей":box.ants<5?"муравья":"муравьёв"}`;
   button.append(pos,dots,name,count);
   button.setAttribute("aria-label",row===0?`Выбрать верхний бокс: ${COLORS[box.color].name}, ${box.ants} муравьёв`:`Закрытый бокс ряда ${row+1}: ${COLORS[box.color].name}, ${box.ants} муравьёв`);
  }else{button.classList.add("empty-box");button.textContent="Очередь пуста";}
  if(row===0)button.addEventListener("click",()=>onChoose(col));
  choicesEl.append(button);
  const previous=oldPositions.get(button.dataset.boxIndex);
  if(previous&&button.dataset.boxIndex!==undefined){
   const rect=button.getBoundingClientRect(),dx=previous.left-rect.left,dy=previous.top-rect.top;
   if((dx||dy)&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    button.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"translate(0,0)"}],{duration:210,easing:"cubic-bezier(.2,.75,.25,1)"});
   }
  }
 }
 $("choice-status").textContent="Выбирай верхний ряд · каждый столбец сдвигается вверх";
 $("queue-count").textContent=`${Math.max(0,INCOMING.length-state.nextContainer)} в очереди`;
}
function render(){
 renderBoard();renderSlots();renderChoices();
 $("message").textContent=state.message;
 $("restart").disabled=resetting||resolverRunning;
}
function cellCenter(x,y){
 const cell=boardEl.children[y*SIZE+x],frame=antLayer.getBoundingClientRect(),rect=cell.getBoundingClientRect();
 return{x:rect.left+rect.width/2-frame.left,y:rect.top+rect.height/2-frame.top};
}
function slotCenter(index){
 const slot=slotsEl.children[index],frame=antLayer.getBoundingClientRect(),rect=slot.getBoundingClientRect();
 return{x:rect.left+rect.width/2-frame.left,y:rect.top+rect.height/2-frame.top};
}
function makeAnt(){
 const wrap=document.createElement("div");wrap.className="ant-runner";
 wrap.innerHTML='<svg viewBox="0 0 64 48" aria-hidden="true"><g stroke="#263d2d" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M26 25 17 13 10 10M27 29 15 35 9 42M36 25 43 13 51 10M37 30 48 36 55 42M27 17Q20 5 14 6M38 17Q45 5 51 6"/></g><ellipse cx="17" cy="25" rx="8" ry="7" fill="#b77736" stroke="#263d2d" stroke-width="2"/><ellipse cx="32" cy="25" rx="10" ry="9" fill="#d18a3d" stroke="#263d2d" stroke-width="2"/><circle cx="48" cy="23" r="9" fill="#e3a34e" stroke="#263d2d" stroke-width="2"/><circle cx="51" cy="20" r="2" fill="#fff"/><circle cx="52" cy="20" r="1" fill="#263d2d"/></svg>';
 return wrap;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function animateAnt(slot,x,y){
 const start=slotCenter(slot),end=cellCenter(x,y),ant=makeAnt();
 antLayer.append(ant);ant.style.left=start.x+"px";ant.style.top=start.y+"px";
 await ant.animate([{left:start.x+"px",top:start.y+"px",transform:"translate(-50%,-50%) scale(.8)"},{left:end.x+"px",top:end.y+"px",transform:"translate(-50%,-50%) scale(1.1)"}],{duration:230,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"}).finished;
 await sleep(65);
 const back=slotCenter(slot);
 await ant.animate([{left:end.x+"px",top:end.y+"px"},{left:back.x+"px",top:back.y+"px"}],{duration:190,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"}).finished;
 ant.remove();
 const cargo=document.createElement("span");cargo.textContent="✦";cargo.style.cssText=`position:absolute;left:${back.x}px;top:${back.y}px;color:#e4ad4b;font-size:17px;transform:translate(-50%,-50%);animation:cargo-pop .24s ease-out forwards`;
 antLayer.append(cargo);setTimeout(()=>cargo.remove(),260);
}
async function save(){
 const ok=await saveLocal(serializeGame(state));
 $("save-status").textContent=ok?"Прогресс сохранён на устройстве":"Не удалось сохранить прогресс";
}
async function runResolver(){
 if(resolverRunning||state.won||state.lost)return;
 resolverRunning=true;
 try{
  // Selection remains live during each trip. After the ant returns, the next move
  // is recalculated from the current board and all newly filled slots.
  while(!resetting&&state.remaining>0){
   const move=findNextMove(state);
   if(!move)break;
   const box=state.slots[move.slot];
   state.activeSlot=move.slot;state.activeTarget=move.target;renderBoard();renderSlots();
   await animateAnt(move.slot,move.target.x,move.target.y);
   if(resetting)break;
   if(state.slots[move.slot]===box)applyAntMove(state,move.slot,move.target);
   state.activeTarget=null;state.activeSlot=-1;
   if(state.remaining%3===0||state.remaining===0)await save();
   renderBoard();renderSlots();renderChoices();
  }
 }catch(error){console.error("Ant animation interrupted",error);}
 finally{
  resolverRunning=false;state.activeTarget=null;state.activeSlot=-1;
  if(!resetting){
   if(state.remaining===0){state.won=true;state.message="Победа! Поле полностью очищено ✨";}
   else if(isDefeat(state)){state.lost=true;state.message="Поражение: пять отсеков заняты, доступных ходов нет.";}
   else state.message=`Можно выбрать следующий бокс · свободно отсеков: ${state.slots.filter(box=>!box).length}`;
   render();await save();
   if(findNextMove(state)&&!state.lost)queueMicrotask(runResolver);
  }
 }
}
function onChoose(column){
 if(resetting||!canChoose(state)||!chooseTopColumn(state,column))return;
 render();
 void save();
 // If an animation is active, its resolver loop will pick up this new box on
 // the next turn. Otherwise start the resolver immediately.
 if(!resolverRunning)void runResolver();
}
async function restart(){
 if(resetting||resolverRunning)return;
 resetting=true;renderChoices();
 state=createGame();await clearLocal();resetting=false;render();
 $("save-status").textContent="Новая игра";
}
async function boot(){
 const saved=await loadLocal();if(saved)state=restoreGame(saved);
 render();
 if("serviceWorker"in navigator){try{await navigator.serviceWorker.register("./service-worker.js");}catch(error){console.warn("PWA offline registration failed",error);}}
 $("save-status").textContent=saved?"Продолжили сохранённую игру":"Сохранение на устройстве";
 if(findNextMove(state))runResolver();
}
$("restart").addEventListener("click",restart);
$("sound-toggle").addEventListener("click",()=>{$("sound-toggle").textContent="♫";$("sound-toggle").title="Звук пока не подключён";});
window.addEventListener("pagehide",()=>{if(!resetting)saveLocal(serializeGame(state));});
boot();
