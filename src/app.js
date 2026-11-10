import {COLORS,INCOMING,SIZE,SLOT_COUNT,TRAY_SIZE,createGame,canChoose,chooseTopColumn,findNextMove,findAntWave,applyAntMove,serializeGame,restoreGame,isDefeat} from "./game.js";
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
  const slot=document.createElement("div");slot.className="slot"+(box?" filled":"")+((state.activeSlot===index||state.activeSlots?.includes(index))?" active":"");
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
function makeAnt(color){
 const ant=document.createElement("span");ant.className="ant-runner";
 ant.style.setProperty("--ant-color",COLORS[color].hex);
 const cellSize=boardEl.getBoundingClientRect().width/SIZE;
 const dotSize=Math.max(2,Math.min(7,cellSize*.52));
 ant.style.width=dotSize+"px";ant.style.height=dotSize+"px";
 return ant;
}
function curveFrames(start,end,offset,from,to){
 const dx=end.x-start.x,dy=end.y-start.y,length=Math.max(1,Math.hypot(dx,dy));
 const bend=Math.min(34,length*.16)*offset;
 const control={x:(start.x+end.x)/2-(dy/length)*bend,y:(start.y+end.y)/2+(dx/length)*bend};
 const frames=[];
 for(let i=0;i<=8;i++){
  const t=i/8,u=1-t;
  const x=u*u*start.x+2*u*t*control.x+t*t*end.x;
  const y=u*u*start.y+2*u*t*control.y+t*t*end.y;
  frames.push({left:x+"px",top:y+"px",offset:from+(to-from)*t,transform:"translate(-50%,-50%) scale("+(0.86+Math.sin(t*Math.PI)*.18)+")"});
 }
 return frames;
}
async function animateAntWave(moves){
 const runners=moves.map((move,index)=>{
  const ant=makeAnt(move.color),start=slotCenter(move.slot),end=cellCenter(move.target.x,move.target.y);
  antLayer.append(ant);ant.style.left=start.x+"px";ant.style.top=start.y+"px";
  const bend=index%2===0?1:-1;
  const outbound=curveFrames(start,end,bend,0,.43);
  const inbound=curveFrames(end,start,-bend,.57,1);
  const frames=[...outbound,{...outbound[outbound.length-1],offset:.5},...inbound];
  const distance=Math.hypot(end.x-start.x,end.y-start.y);
  const duration=Math.max(520,Math.min(980,430+distance*1.35));
  return {ant,move,frames,duration,end};
 });
 await Promise.all(runners.map(async runner=>{
  const animation=runner.ant.animate(runner.frames,{duration:runner.duration,easing:"cubic-bezier(.38,.02,.2,1)",fill:"forwards"});
  await animation.finished;
  runner.ant.remove();
  const spark=document.createElement("span");spark.className="pickup-spark";spark.style.left=runner.end.x+"px";spark.style.top=runner.end.y+"px";
  antLayer.append(spark);setTimeout(()=>spark.remove(),360);
 }));
}
async function save(){
 const ok=await saveLocal(serializeGame(state));
 $("save-status").textContent=ok?"Прогресс сохранён на устройстве":"Не удалось сохранить прогресс";
}
async function runResolver(){
 if(resolverRunning||state.won||state.lost)return;
 resolverRunning=true;
 try{
  // One wave sends every currently eligible ant at once. Targets are reserved
  // left-to-right so two boxes can never claim the same pixel.
  while(!resetting&&state.remaining>0){
   const wave=findAntWave(state);
   if(!wave.length)break;
   state.activeSlot=-1;state.activeSlots=[...new Set(wave.map(move=>move.slot))];state.activeTarget=null;
   state.message=`В путь отправились ${wave.length} муравьишек!`;
   renderBoard();renderSlots();$("message").textContent=state.message;
   await animateAntWave(wave);
   if(resetting)break;
   for(const move of wave)applyAntMove(state,move.slot,move.target);
   state.activeSlots=[];
   if(state.remaining%3===0||state.remaining===0)await save();
   renderBoard();renderSlots();renderChoices();
  }
 }catch(error){console.error("Ant swarm animation interrupted",error);}
 finally{
  resolverRunning=false;state.activeTarget=null;state.activeSlot=-1;state.activeSlots=[];
  if(!resetting){
   if(state.remaining===0){state.won=true;state.message="Победа! Поле полностью очищено ✨";}
   else if(isDefeat(state)){state.lost=true;state.message="Поражение: пять отсеков заняты, доступных ходов нет.";}
   else state.message=`Муравьишки ждут новые открытые пиксели · свободно отсеков: ${state.slots.filter(box=>!box).length}`;
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
