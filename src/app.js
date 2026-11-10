import {COLORS,INCOMING,SIZE,GRID_SIZE,BLOCK_SIZE,SLOT_COUNT,TRAY_SIZE,createGame,canChoose,chooseTopColumn,findNextMove,findAntWave,applyAntMove,completeBoxDeparture,serializeGame,restoreGame,isDefeat} from "./game.js";
import {loadLocal,saveLocal,clearLocal} from "./storage.js";
const $=id=>document.getElementById(id);
const shell=$("app-shell"),boardEl=$("board"),slotsEl=$("slots"),choicesEl=$("choices"),antLayer=$("ant-layer"),conveyorEl=$("conveyor");
const boardCtx=boardEl.getContext("2d"),antCtx=antLayer.getContext("2d");
let state=createGame(),resolverRunning=false,resetting=false,antFrame=0,hasSavedGame=false,gameStarted=false;
const loadingSlots=new Set();
const colorRGB=Object.fromEntries(Object.entries(COLORS).map(([key,value])=>[key,value.hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16))]));
function renderBoard(){
 const image=boardCtx.createImageData(GRID_SIZE,GRID_SIZE),empty=[231,240,228];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const color=state.board[y][x],rgb=color?colorRGB[color]:empty;
  for(let by=0;by<BLOCK_SIZE;by++)for(let bx=0;bx<BLOCK_SIZE;bx++){
   const index=((y*BLOCK_SIZE+by)*GRID_SIZE+x*BLOCK_SIZE+bx)*4;
   let tileColor=empty;
   if(color){
    const shade=(bx===BLOCK_SIZE-1||by===BLOCK_SIZE-1)?.62:(bx===0&&by===0)?1.38:by===0?1.24:bx===0?1.15:(bx===1&&by===1)?1.08:1;
    tileColor=rgb.map(channel=>Math.max(0,Math.min(255,Math.round(channel*shade))));
   }
   image.data[index]=tileColor[0];image.data[index+1]=tileColor[1];image.data[index+2]=tileColor[2];image.data[index+3]=255;
  }
 }
 boardCtx.putImageData(image,0,0);
 $("board-status").textContent=`Крупных блоков осталось: ${state.remaining.toLocaleString("ru-RU")}`;
}
function renderSlots(){
 slotsEl.replaceChildren();
 state.slots.forEach((box,index)=>{
  const slot=document.createElement("div");
  slot.style.setProperty("--box-color",box?COLORS[box.color].hex:"#d8e5d2");
  slot.className="slot"+(box?" filled":"")+(box?.status==="departing"?" departing":"")+(loadingSlots.has(index)?" loading":"")+((state.activeSlots?.includes(index))?" active":"");
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
   const count=document.createElement("small");count.textContent=`${box.ants.toLocaleString("ru-RU")} блоков`;
   button.append(pos,dots,name,count);
   button.setAttribute("aria-label",row===0?`Выбрать бокс: ${COLORS[box.color].name}, ${box.ants} крупных блоков`:`Закрытый бокс ряда ${row+1}: ${COLORS[box.color].name}, ${box.ants} крупных блоков`);
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
 $("message").textContent=state.message;$("restart").disabled=resetting||resolverRunning||loadingSlots.size>0;
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
function quadTangent(a,c,b,t){
 return{x:2*((1-t)*(c.x-a.x)+t*(b.x-c.x)),y:2*((1-t)*(c.y-a.y)+t*(b.y-c.y))};
}
const antSpriteCache=new Map();
function createAntSprite(color,carrying,gait){
 const key=color+":"+Number(carrying)+":"+gait;
 if(antSpriteCache.has(key))return antSpriteCache.get(key);
 const sprite=document.createElement("canvas");sprite.width=28;sprite.height=24;
 const ctx=sprite.getContext("2d"),step=[-1.2,0,1.2,0][gait];
 const body=COLORS[color].hex;
 ctx.translate(13,12);ctx.lineCap="round";ctx.lineJoin="round";
 // Six legs are baked into four gait poses; the animation loop only blits sprites.
 ctx.strokeStyle="#24352c";ctx.lineWidth=1.15;
 for(const side of [-1,1])for(let leg=0;leg<3;leg++){
  const x=-1.2+leg*1.35,y=side*1.2;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(leg-1)*1.5+step*side,y+side*(2.3+Math.abs(step)*.3));ctx.lineTo(x+(leg-1)*2.2+step*side,y+side*4.1);ctx.stroke();
 }
 ctx.fillStyle="#26372d";ctx.beginPath();ctx.ellipse(-3.1,0,3.15,2.55,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(-3.1,-.25,2.45,1.9,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#26372d";ctx.beginPath();ctx.arc(.15,0,1.8,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=body;ctx.beginPath();ctx.arc(.15,-.2,1.25,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#26372d";ctx.beginPath();ctx.arc(3.1,-.1,2.25,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=body;ctx.beginPath();ctx.arc(3.1,-.35,1.7,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#26372d";ctx.lineWidth=.85;
 ctx.beginPath();ctx.moveTo(3.7,-1.6);ctx.quadraticCurveTo(4.2,-4.3,6.3,-4.1);ctx.moveTo(2.4,-1.8);ctx.quadraticCurveTo(1.8,-4.4,3.4,-5);ctx.stroke();
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(3.8,-.8,.72,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#24352c";ctx.beginPath();ctx.arc(4.02,-.8,.28,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#f3a29a";ctx.globalAlpha=.82;ctx.beginPath();ctx.arc(4.45,1.05,.62,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle="#ffffff88";ctx.beginPath();ctx.ellipse(-3.8,-1.15,.9,.45,-.25,0,Math.PI*2);ctx.fill();
 if(carrying){ctx.fillStyle="#f6d36e";ctx.strokeStyle="#8e6c2d";ctx.lineWidth=.7;ctx.beginPath();ctx.arc(-6.3,2.2,1.8,0,Math.PI*2);ctx.fill();ctx.stroke();}
 antSpriteCache.set(key,sprite);return sprite;
}
function drawAnt(ctx,point,color,carrying,index,direction=0){
 const phase=performance.now()*.012+index*1.73;
 const gait=Math.floor(phase/2)%4;
 ctx.save();ctx.translate(point.x,point.y);
 ctx.rotate(direction+Math.sin(phase*.31+index)*.045);
 ctx.drawImage(createAntSprite(color,carrying,gait),-13,-12);
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
  return{move,start,end,control:curveControl(start,end,bend),returnControl:curveControl(end,start,-bend*.72),delivered:false,
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
    if(elapsed>=total){
     if(!runner.delivered){
      runner.delivered=true;
      applyAntMove(state,runner.move.slot,runner.move.target);
      boardCtx.fillStyle="#e7f0e4";boardCtx.fillRect(runner.move.target.x*BLOCK_SIZE,runner.move.target.y*BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
     }
     finished++;return;
    }
    let point,carrying=false,direction=0;
    if(elapsed<outboundEnd){
     const t=Math.min(1,elapsed/outboundEnd);point=quadPoint(runner.start,runner.control,runner.end,t);
     const tangent=quadTangent(runner.start,runner.control,runner.end,t);direction=Math.atan2(tangent.y,tangent.x);
    }else if(elapsed<returnStart){
     point=runner.end;carrying=true;
     const tangent=quadTangent(runner.start,runner.control,runner.end,1);direction=Math.atan2(tangent.y,tangent.x);
    }else{
     carrying=true;const t=Math.min(1,(elapsed-returnStart)/runner.returning);
     point=quadPoint(runner.end,runner.returnControl,runner.start,t);
     const tangent=quadTangent(runner.end,runner.returnControl,runner.start,t);direction=Math.atan2(tangent.y,tangent.x);
    }
    drawAnt(antCtx,point,runner.move.color,carrying,index,direction);
   });
   if(finished===runners.length){antCtx.clearRect(0,0,rect.width,rect.height);resolve();return;}
   antFrame=requestAnimationFrame(draw);
  };
  antFrame=requestAnimationFrame(draw);
 });
}
function drawTransportBox(ctx,point,color,scale=1,tilt=0){
 ctx.save();ctx.translate(point.x,point.y);ctx.rotate(tilt);ctx.scale(scale,scale);
 // A small open-top delivery crate: raised rim, visible color cargo and three shaded faces.
 ctx.shadowColor="#38594455";ctx.shadowBlur=10;ctx.shadowOffsetY=4;
 const front=ctx.createLinearGradient(0,-1,0,15);front.addColorStop(0,"#e6d3ad");front.addColorStop(1,"#b99b6b");
 const side=ctx.createLinearGradient(0,0,18,12);side.addColorStop(0,"#c6aa7d");side.addColorStop(1,"#96794f");
 ctx.fillStyle=front;ctx.strokeStyle="#806744";ctx.lineWidth=1.2;
 ctx.beginPath();ctx.moveTo(-18,-7);ctx.lineTo(0,0);ctx.lineTo(0,15);ctx.lineTo(-18,8);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle=side;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(18,-7);ctx.lineTo(18,8);ctx.lineTo(0,15);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 // Cargo is inset below the raised wooden rim, so the box reads as a container rather than a flat card.
 const cargo=ctx.createLinearGradient(-10,-11,10,2);cargo.addColorStop(0,"#fff");cargo.addColorStop(.25,COLORS[color].hex);cargo.addColorStop(1,"#52775a");
 ctx.fillStyle=cargo;ctx.beginPath();ctx.moveTo(-13,-8);ctx.lineTo(0,-13);ctx.lineTo(13,-8);ctx.lineTo(0,-3);ctx.closePath();ctx.fill();
 ctx.fillStyle="#ffffff55";ctx.beginPath();ctx.moveTo(-9,-8);ctx.lineTo(0,-11.5);ctx.lineTo(0,-8);ctx.lineTo(-7,-5.5);ctx.closePath();ctx.fill();
 // Thick rim and two folded lid flaps.
 ctx.fillStyle="#f4e7ca";ctx.strokeStyle="#9b8056";ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(-18,-7);ctx.lineTo(-11,-14);ctx.lineTo(11,-14);ctx.lineTo(18,-7);ctx.lineTo(12,-3);ctx.lineTo(0,-8);ctx.lineTo(-12,-3);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle="#e7d4ad";ctx.beginPath();ctx.moveTo(-18,-7);ctx.lineTo(-11,-14);ctx.lineTo(0,-9);ctx.lineTo(-7,-3);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle="#fff4d9";ctx.beginPath();ctx.moveTo(18,-7);ctx.lineTo(11,-14);ctx.lineTo(0,-9);ctx.lineTo(7,-3);ctx.closePath();ctx.fill();ctx.stroke();
 // A colored side badge, reinforced corners and tiny brass rivets.
 ctx.fillStyle=COLORS[color].hex;ctx.fillRect(-11,1,8,5);ctx.fillStyle="#ffffff66";ctx.fillRect(-10,1,6,1);
 ctx.fillStyle="#f7e9c9";ctx.fillRect(3,3,9,5);ctx.fillStyle="#8a7047";ctx.fillRect(5,4,5,1);ctx.fillRect(5,6,3,1);
 ctx.fillStyle="#f8e8c6";for(const [x,y] of [[-15,-4],[-15,5],[15,-4],[15,5]]){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle="#fff8";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-17,-6);ctx.lineTo(-11,-12);ctx.lineTo(10,-12);ctx.stroke();
 ctx.restore();
}
async function animateBoxLoading(source,slot,color){
 const shellRect=shell.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 const flightLayer=document.createElement("canvas");
 flightLayer.className="flight-layer";flightLayer.width=Math.max(1,Math.round(shellRect.width*dpr));flightLayer.height=Math.max(1,Math.round(shellRect.height*dpr));
 flightLayer.style.width=shellRect.width+"px";flightLayer.style.height=shellRect.height+"px";shell.append(flightLayer);
 const ctx=flightLayer.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
 const belt=conveyorEl.querySelector(".belt").getBoundingClientRect();
 const entry={x:belt.left+belt.width*.12-shellRect.left,y:belt.top+belt.height/2-shellRect.top};
 const exit={x:belt.left+belt.width*.88-shellRect.left,y:belt.top+belt.height/2-shellRect.top};
 const finish=slot,p1=curveControl(source,entry,Math.min(28,Math.max(12,Math.abs(entry.x-source.x)*.08)));
 const p3=curveControl(exit,finish,-Math.min(30,Math.max(14,Math.abs(finish.y-exit.y)*.16)));
 const duration=1750,startTime=performance.now();
 return new Promise(resolve=>{
  const frame=timestamp=>{
   const t=Math.min(1,(timestamp-startTime)/duration);
   let point;
   if(t<.36){point=quadPoint(source,p1,entry,t/.36);}
   else if(t<.78){const u=(t-.36)/.42;point={x:entry.x+(exit.x-entry.x)*u,y:entry.y-Math.sin(u*Math.PI)*2};}
   else{point=quadPoint(exit,p3,finish,(t-.78)/.22);}
   ctx.clearRect(0,0,shellRect.width,shellRect.height);
   const beltTilt=t<.36?-.06*(1-t/.36):t<.78?Math.sin((t-.36)/.42*Math.PI)*.025:.07*(1-(t-.78)/.22);
   drawTransportBox(ctx,{x:point.x,y:point.y-Math.sin(t*Math.PI)*3},color,1+Math.sin(t*Math.PI)*.08,beltTilt);
   if(t>=1){ctx.clearRect(0,0,shellRect.width,shellRect.height);flightLayer.remove();resolve();return;}
   requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
 });
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
    drawTransportBox(antCtx,point,item.color);
   });
   if(finished===starts.length){antCtx.clearRect(0,0,shellRect.width,shellRect.height);resolve();return;}
   antFrame=requestAnimationFrame(frame);
  };
  antFrame=requestAnimationFrame(frame);
 });
}
async function save(){
 const ok=await saveLocal(serializeGame(state));
 if(ok){hasSavedGame=true;updateMainMenu();}
 $("save-status").textContent=ok?"Прогресс сохранён на устройстве":"Не удалось сохранить прогресс";
}
async function runResolver(){
 if(resolverRunning||state.won||state.lost)return;
 resolverRunning=true;
 try{
  while(!resetting&&(state.remaining>0||state.slots.some(box=>box?.status==="departing"))){
   const departing=state.slots.map((box,index)=>box?.status==="departing"?index:-1).filter(index=>index>=0);
   if(departing.length){
    await animateBoxDepartures(departing);
    for(const slot of departing)completeBoxDeparture(state,slot);
    renderSlots();renderConveyor();await save();
   }
   const wave=findAntWave(state);if(!wave.length)break;
   state.activeSlots=[...new Set(wave.map(move=>move.slot))];
   state.message=`Муравьишки несут крупные блоки · в работе ${wave.length.toLocaleString("ru-RU")}`;
   renderSlots();$("message").textContent=state.message;
   await animateAntWave(wave);
   if(resetting)break;
   // Each pixel disappears at the exact moment its own ant reaches the box.
   state.activeSlots=[];renderBoard();renderSlots();renderChoices();
   if(state.remaining%100===0||state.remaining===0)await save();
  }
 }catch(error){console.error("Ant colony animation interrupted",error);}
 finally{
  cancelAnimationFrame(antFrame);antCtx.clearRect(0,0,antLayer.width,antLayer.height);
  resolverRunning=false;state.activeSlots=[];
  if(!resetting){
   if(state.remaining===0){state.won=true;state.message="Победа! Портрет собран ✨";}
   else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, доступных пикселей нет.";}
   else state.message=`Колония отдыхает и ждёт подходящий бокс · свободно отсеков: ${state.slots.filter(box=>!box).length}`;
   render();await save();
   if(findNextMove(state)||state.slots.some(box=>box?.status==="departing"))queueMicrotask(runResolver);
  }
 }
}
async function onChoose(column){
 if(resetting||!canChoose(state))return;
 const selectedIndex=state.tray[0][column],sourceNode=choicesEl.querySelector('[data-box-index="'+selectedIndex+'"]');
 if(!sourceNode)return;
 const sourceRect=sourceNode.getBoundingClientRect(),shellRect=shell.getBoundingClientRect();
 const source={x:sourceRect.left+sourceRect.width/2-shellRect.left,y:sourceRect.top+sourceRect.height/2-shellRect.top};
 const freeSlot=state.slots.findIndex(box=>box===null),box=INCOMING[selectedIndex];
 if(freeSlot<0||!box||!chooseTopColumn(state,column))return;
 loadingSlots.add(freeSlot);
 state.message="Бокс "+COLORS[box.color].name.toLowerCase()+" подан на ленту и едет в отсек "+(freeSlot+1);
 render();void save();
 try{await animateBoxLoading(source,slotCenter(freeSlot),box.color);}
 finally{
  loadingSlots.delete(freeSlot);renderSlots();
  const landedSlot=slotsEl.children[freeSlot];
  if(landedSlot&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
   landedSlot.animate(
    [{transform:"translateY(-5px) scale(.94)",filter:"brightness(1.08)"},{transform:"translateY(2px) scale(1.035)",filter:"brightness(1.03)"},{transform:"translateY(0) scale(1)",filter:"brightness(1)"}],
    {duration:430,easing:"cubic-bezier(.2,.8,.25,1)"}
   );
  }
  if(!resetting&&!resolverRunning&&loadingSlots.size===0)void runResolver();
 }
}
async function restart(){
 if(resetting||resolverRunning||loadingSlots.size>0)return;
 resetting=true;renderChoices();state=createGame();await clearLocal();resetting=false;render();
 $("save-status").textContent="Новая игра";
}
function updateMainMenu(){
 const primary=$("start-game"),fresh=$("new-game"),progress=$("menu-progress");
 primary.textContent=gameStarted?"Вернуться на полянку":hasSavedGame?"Продолжить охоту":"Начать охоту";
 primary.querySelector("span")?.remove();
 const arrow=document.createElement("span");arrow.setAttribute("aria-hidden","true");arrow.textContent="→";primary.append(arrow);
 fresh.hidden=!hasSavedGame&&!gameStarted;
 progress.textContent=hasSavedGame?(`Сохранено · осталось блоков: ${state.remaining.toLocaleString("ru-RU")}`):"Готов к сборке · первая полянка";
}
function showMainMenu(){shell.classList.add("menu-open");updateMainMenu();}
function startGame(){
 shell.classList.remove("menu-open");gameStarted=true;updateMainMenu();
 if(!resolverRunning&&(findNextMove(state)||state.slots.some(box=>box?.status==="departing")))queueMicrotask(runResolver);
}
async function startFreshGame(){
 if(resolverRunning||loadingSlots.size>0)return;
 resetting=true;cancelAnimationFrame(antFrame);state=createGame();await clearLocal();resetting=false;
 hasSavedGame=false;gameStarted=true;render();$("save-status").textContent="Новая игра";shell.classList.remove("menu-open");updateMainMenu();
}
async function boot(){
 const saved=await loadLocal();hasSavedGame=Boolean(saved);if(saved)state=restoreGame(saved);
 render();resizeAntLayer();updateMainMenu();
 if("serviceWorker"in navigator){try{await navigator.serviceWorker.register("./service-worker.js");}catch(error){console.warn("PWA offline registration failed",error);}}
 $("save-status").textContent=saved?"Сохранённый прогресс":"Сохранение на устройстве";
}
$("restart").addEventListener("click",restart);
$("menu-toggle").addEventListener("click",showMainMenu);
$("start-game").addEventListener("click",startGame);
$("new-game").addEventListener("click",startFreshGame);
$("how-to-play").addEventListener("click",()=>{
 const panel=$("how-panel");panel.hidden=!panel.hidden;
 $("how-to-play").textContent=panel.hidden?"Как играть?":"Свернуть правила";
});
window.addEventListener("resize",()=>{resizeAntLayer();renderBoard();});
window.addEventListener("pagehide",()=>{if(!resetting)saveLocal(serializeGame(state));});
boot();
