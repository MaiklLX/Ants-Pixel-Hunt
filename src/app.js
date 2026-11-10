import {COLORS,INCOMING,SIZE,SLOT_COUNT,TRAY_SIZE,createGame,canChoose,chooseTopColumn,findNextMove,findAntWave,applyAntMove,completeBoxDeparture,serializeGame,restoreGame,isDefeat} from "./game.js";
import {loadLocal,saveLocal,clearLocal} from "./storage.js";
const $=id=>document.getElementById(id);
const shell=$("app-shell"),boardEl=$("board"),slotsEl=$("slots"),choicesEl=$("choices"),antLayer=$("ant-layer"),conveyorEl=$("conveyor");
const boardCtx=boardEl.getContext("2d"),antCtx=antLayer.getContext("2d");
let state=createGame(),resolverRunning=false,resetting=false,antFrame=0;
const colorRGB=Object.fromEntries(Object.entries(COLORS).map(([key,value])=>[key,value.hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16))]));
function renderBoard(){
 const image=boardCtx.createImageData(SIZE,SIZE),empty=[231,240,228];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const color=state.board[y][x],rgb=color?colorRGB[color]:empty,index=(y*SIZE+x)*4;
  image.data[index]=rgb[0];image.data[index+1]=rgb[1];image.data[index+2]=rgb[2];image.data[index+3]=255;
 }
 boardCtx.putImageData(image,0,0);
 $("board-status").textContent=`Пикселей осталось: ${state.remaining.toLocaleString("ru-RU")}`;
}
function renderSlots(){
 slotsEl.replaceChildren();
 state.slots.forEach((box,index)=>{
  const slot=document.createElement("div");
  slot.className="slot"+(box?" filled":"")+(box?.status==="departing"?" departing":"")+((state.activeSlots?.includes(index))?" active":"");
  const number=document.createElement("span");number.className="slot-number";number.textContent=`ОТСЕК ${index+1}`;slot.append(number);
  if(box){
   const stripe=document.createElement("span");stripe.className="slot-color";stripe.style.background=COLORS[box.color].hex;
   const count=document.createElement("strong");count.className="ant-count";count.textContent=box.status==="departing"?"ГОТОВ К ОТГРУЗКЕ":`● ${box.ants.toLocaleString("ru-RU")}`;
   slot.append(stripe,count);
  }else{const plus=document.createElement("span");plus.className="slot-plus";plus.textContent="＋";slot.append(plus);}
  slotsEl.append(slot);
 });
}
function renderConveyor(){
 $("sorted-count").textContent=`Отгружено боксов: ${(state.sortedBoxes||0).toLocaleString("ru-RU")}`;
}
function renderChoices(){
 const oldPositions=new Map();
 for(const node of choicesEl.querySelectorAll("[data-box-index]")){
  const rect=node.getBoundingClientRect();oldPositions.set(node.dataset.boxIndex,{left:rect.left,top:rect.top});
 }
 choicesEl.replaceChildren();
 for(let row=0;row<TRAY_SIZE;row++)for(let col=0;col<TRAY_SIZE;col++){
  const index=state.tray[row][col],box=index===null?null:INCOMING[index],button=document.createElement("button");
  button.type="button";button.className="choice-card"+(row===0?" selectable":" locked");
  if(index!==null&&index!==undefined)button.dataset.boxIndex=String(index);
  button.disabled=row!==0||!box||resetting||state.won||state.lost||!canChoose(state);
  if(box){
   button.style.setProperty("--ant-color",COLORS[box.color].hex);
   const pos=document.createElement("span");pos.className="choice-number";pos.textContent=`РЯД ${row+1} · КОЛОНКА ${col+1}`;
   const dots=document.createElement("span");dots.className="ant-dots";dots.textContent=Array.from({length:Math.min(box.ants,8)},()=>"●").join(" ");
   const name=document.createElement("strong");name.textContent=COLORS[box.color].name;
   const count=document.createElement("small");count.textContent=`${box.ants.toLocaleString("ru-RU")} муравьёв`;
   button.append(pos,dots,name,count);
   button.setAttribute("aria-label",row===0?`Выбрать бокс: ${COLORS[box.color].name}, ${box.ants} муравьёв`:`Закрытый бокс ряда ${row+1}: ${COLORS[box.color].name}, ${box.ants} муравьёв`);
  }else{button.classList.add("empty-box");button.textContent="Очередь пуста";}
  if(row===0)button.addEventListener("click",()=>onChoose(col));
  choicesEl.append(button);
  const previous=oldPositions.get(button.dataset.boxIndex);
  if(previous&&button.dataset.boxIndex!==undefined){
   const rect=button.getBoundingClientRect(),dx=previous.left-rect.left,dy=previous.top-rect.top;
   if((dx||dy)&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    button.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"translate(0,0)"}],{duration:360,easing:"cubic-bezier(.2,.75,.25,1)"});
  }
 }
 $("choice-status").textContent="Выбирай верхний ряд · боксы едут по колонкам";
 $("queue-count").textContent=`${Math.max(0,INCOMING.length-state.nextContainer)} в очереди`;
}
function render(){
 renderBoard();renderSlots();renderChoices();renderConveyor();
 $("message").textContent=state.message;$("restart").disabled=resetting||resolverRunning;
}
function resizeAntLayer(){
 const rect=shell.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 antLayer.width=Math.max(1,Math.round(rect.width*dpr));antLayer.height=Math.max(1,Math.round(rect.height*dpr));
 antCtx.setTransform(dpr,0,0,dpr,0,0);
}
function pointFor(element){
 const r=element.getBoundingClientRect(),s=shell.getBoundingClientRect();
 return{x:r.left+r.width/2-s.left,y:r.top+r.height/2-s.top};
}
function cellCenter(x,y){
 const r=boardEl.getBoundingClientRect(),s=shell.getBoundingClientRect();
 return{x:r.left-s.left+(x+.5)*r.width/SIZE,y:r.top-s.top+(y+.5)*r.height/SIZE};
}
function slotCenter(index){return pointFor(slotsEl.children[index]);}
function quadPoint(a,c,b,t){
 const u=1-t;return{x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y};
}
function curveControl(a,b,bend){
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(1,Math.hypot(dx,dy));
 return{x:(a.x+b.x)/2-(dy/len)*bend,y:(a.y+b.y)/2+(dx/len)*bend};
}
function drawAnt(ctx,point,color,carrying,index){
 const pulse=.8+Math.sin(index*.7+performance.now()*.002)*.12;
 ctx.save();ctx.translate(point.x,point.y);
 ctx.shadowColor=COLORS[color].hex;ctx.shadowBlur=carrying?9:4;
 ctx.fillStyle=COLORS[color].hex;ctx.beginPath();ctx.arc(0,0,2.45*pulse,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(1.25,-1.1,1,0,Math.PI*2);ctx.fill();
 if(carrying){ctx.fillStyle="#f6d36e";ctx.beginPath();ctx.arc(-3,1,1.8,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
async function animateAntWave(moves){
 resizeAntLayer();
 const now=performance.now();
 const runners=moves.map((move,index)=>{
  const start=slotCenter(move.slot),end=cellCenter(move.target.x,move.target.y);
  const distance=Math.hypot(end.x-start.x,end.y-start.y),seed=(index*9301+move.target.x*49297+move.target.y*233)%9973/9973;
  const bend=(seed-.5)*Math.min(72,Math.max(18,distance*.18));
  const delay=(index%23)*58+seed*90;
  return{move,start,end,control:curveControl(start,end,bend),returnControl:curveControl(end,start,-bend*.72),
   delay,outbound:2700+distance*1.65+(seed-.5)*450,pause:520+seed*330,
   returning:2350+distance*1.35+(seed-.5)*380};
 });
 return new Promise(resolve=>{
  const draw=timestamp=>{
   const rect=shell.getBoundingClientRect();
   antCtx.clearRect(0,0,rect.width,rect.height);
   let finished=0;
   runners.forEach((runner,index)=>{
    const elapsed=timestamp-now-runner.delay;
    if(elapsed<0)return;
    const outboundEnd=runner.outbound,returnStart=outboundEnd+runner.pause,total=returnStart+runner.returning;
    if(elapsed>=total){finished++;return;}
    let point,carrying=false;
    if(elapsed<outboundEnd){
     const t=Math.min(1,elapsed/outboundEnd);point=quadPoint(runner.start,runner.control,runner.end,t);
    }else if(elapsed<returnStart){point=runner.end;carrying=true;}
    else{
     carrying=true;const t=Math.min(1,(elapsed-returnStart)/runner.returning);
     point=quadPoint(runner.end,runner.returnControl,runner.start,t);
    }
    drawAnt(antCtx,point,runner.move.color,carrying,index);
   });
   if(finished===runners.length){antCtx.clearRect(0,0,rect.width,rect.height);resolve();return;}
   antFrame=requestAnimationFrame(draw);
  };
  antFrame=requestAnimationFrame(draw);
 });
}
function drawTransportBox(point,color){
 antCtx.save();antCtx.translate(point.x,point.y);
 antCtx.shadowColor="#54724c55";antCtx.shadowBlur=8;antCtx.fillStyle="#f7f0dc";
 antCtx.strokeStyle="#947342";antCtx.lineWidth=1.5;antCtx.beginPath();antCtx.roundRect(-15,-10,30,20,4);antCtx.fill();antCtx.stroke();
 antCtx.shadowBlur=0;antCtx.fillStyle=COLORS[color].hex;antCtx.fillRect(-11,-6,22,12);
 antCtx.strokeStyle="#fff8";antCtx.beginPath();antCtx.moveTo(-5,-6);antCtx.lineTo(-5,6);antCtx.moveTo(5,-6);antCtx.lineTo(5,6);antCtx.stroke();
 antCtx.restore();
}
async function animateBoxDepartures(slotIndices){
 resizeAntLayer();
 const starts=slotIndices.map(slot=>({slot,start:slotCenter(slot),color:state.slots[slot]?.color||"yellow"}));
 const belt=pointFor(conveyorEl),shellRect=shell.getBoundingClientRect(),startTime=performance.now(),duration=2600;
 return new Promise(resolve=>{
  const frame=timestamp=>{
   const elapsed=timestamp-startTime;
   antCtx.clearRect(0,0,shellRect.width,shellRect.height);
   let finished=0;
   starts.forEach((item,index)=>{
    const delay=index*260,t=Math.max(0,Math.min(1,(elapsed-delay)/duration));
    if(elapsed<delay){finished++;return;}
    if(t>=1){finished++;return;}
    const lift=quadPoint(item.start,{x:item.start.x-22,y:(item.start.y+belt.y)/2},{x:item.start.x,y:belt.y},Math.min(1,t*2.2));
    const progress=Math.max(0,(t-.42)/.58);
    const point={x:lift.x+(shellRect.width+35-lift.x)*progress,y:lift.y+(belt.y-lift.y)*progress};
    drawTransportBox(point,item.color);
   });
   if(finished===starts.length){antCtx.clearRect(0,0,shellRect.width,shellRect.height);resolve();return;}
   antFrame=requestAnimationFrame(frame);
  };
  antFrame=requestAnimationFrame(frame);
 });
}
async function save(){
 const ok=await saveLocal(serializeGame(state));
 $("save-status").textContent=ok?"Прогресс сохранён на устройстве":"Не удалось сохранить прогресс";
}
async function runResolver(){
 if(resolverRunning||state.won||state.lost)return;
 resolverRunning=true;
 try{
  while(!resetting&&state.remaining>0){
   const departing=state.slots.map((box,index)=>box?.status==="departing"?index:-1).filter(index=>index>=0);
   if(departing.length){
    await animateBoxDepartures(departing);
    for(const slot of departing)completeBoxDeparture(state,slot);
    renderSlots();renderConveyor();await save();
   }
   const wave=findAntWave(state);if(!wave.length)break;
   state.activeSlots=[...new Set(wave.map(move=>move.slot))];
   state.message=`Рой неспешно собирает ресурсы · в работе ${wave.length.toLocaleString("ru-RU")} муравьёв`;
   renderSlots();$("message").textContent=state.message;
   await animateAntWave(wave);
   if(resetting)break;
   // A pixel is removed only after its ant has carried it back to its own box.
   for(const move of wave)applyAntMove(state,move.slot,move.target);
   state.activeSlots=[];renderBoard();renderSlots();renderChoices();
   if(state.remaining%100===0||state.remaining===0)await save();
  }
 }catch(error){console.error("Ant colony animation interrupted",error);}
 finally{
  cancelAnimationFrame(antFrame);antCtx.clearRect(0,0,antLayer.width,antLayer.height);
  resolverRunning=false;state.activeSlots=[];
  if(!resetting){
   if(state.remaining===0){state.won=true;state.message="Победа! Бабочка и цветочная поляна собраны ✨";}
   else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, доступных пикселей нет.";}
   else state.message=`Колония отдыхает и ждёт подходящий бокс · свободно отсеков: ${state.slots.filter(box=>!box).length}`;
   render();await save();
   if(findNextMove(state)||state.slots.some(box=>box?.status==="departing"))queueMicrotask(runResolver);
  }
 }
}
function onChoose(column){
 if(resetting||!canChoose(state)||!chooseTopColumn(state,column))return;
 render();void save();
 if(!resolverRunning)void runResolver();
}
async function restart(){
 if(resetting||resolverRunning)return;
 resetting=true;renderChoices();state=createGame();await clearLocal();resetting=false;render();
 $("save-status").textContent="Новая игра";
}
async function boot(){
 const saved=await loadLocal();if(saved)state=restoreGame(saved);
 render();resizeAntLayer();
 if("serviceWorker"in navigator){try{await navigator.serviceWorker.register("./service-worker.js");}catch(error){console.warn("PWA offline registration failed",error);}}
 $("save-status").textContent=saved?"Продолжили сохранённую игру":"Сохранение на устройстве";
 if(findNextMove(state)||state.slots.some(box=>box?.status==="departing"))runResolver();
}
$("restart").addEventListener("click",restart);
$("sound-toggle").addEventListener("click",()=>{$("sound-toggle").textContent="♫";$("sound-toggle").title="Звук пока не подключён";});
window.addEventListener("resize",()=>{resizeAntLayer();renderBoard();});
window.addEventListener("pagehide",()=>{if(!resetting)saveLocal(serializeGame(state));});
boot();
