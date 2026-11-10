import {COLORS,SIZE,GRID_SIZE,BLOCK_SIZE,SLOT_COUNT,TRAY_SIZE,LEVELS,getLevel,getIncoming,createGame,canChoose,chooseTopColumn,findAntWave,applyAntMove,completeBoxDeparture,isDefeat,getExposedPixels,countOutboundBySlot,countSlotWorkers,canDepartSlot} from "./game.js";
import {getAntTripFrame,getAntLaunchDelay} from "./ant-animation.js";
import {isCampaignLevelUnlocked,getNextCampaignLevel} from "./campaign.js";
const $=id=>document.getElementById(id);
const shell=$("app-shell"),boardEl=$("board"),slotsEl=$("slots"),choicesEl=$("choices"),antLayer=$("ant-layer"),conveyorEl=$("conveyor");
const boardCtx=boardEl.getContext("2d"),antCtx=antLayer.getContext("2d");
let state=createGame(),resolverRunning=false,resetting=false,resetAfterMenu=false,antFrame=0,antCanvasWidth=0,antCanvasHeight=0,gameStarted=false,totalBlocks=state.remaining;
const CAMPAIGN_KEY="ants-campaign-progress";
function completedLevels(){try{return new Set(JSON.parse(localStorage.getItem(CAMPAIGN_KEY)||"[]"));}catch{return new Set();}}
function markLevelComplete(levelId){const done=completedLevels();done.add(levelId);try{localStorage.setItem(CAMPAIGN_KEY,JSON.stringify([...done]));}catch{}}
function isLevelUnlocked(level){return isCampaignLevelUnlocked(LEVELS,completedLevels(),level.id);}
function nextLevel(){return getNextCampaignLevel(LEVELS,state.levelId);}
const loadingSlots=new Set(),workerPromises=new Map(),reservedTargets=new Set(),activeAnts=new Map();
let workerSequence=0,lastAntFrameAt=0,lastExposedPixels=new Set();
const MAX_ACTIVE_ANTS=36,ANT_FRAME_INTERVAL=1000/30;
const colorRGB=Object.fromEntries(Object.entries(COLORS).map(([key,value])=>[key,value.hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16))]));
let boardEmptyGradient=null;
function updateBoardProgress(){
 $("board-status").textContent=`Осталось кубиков: ${state.remaining.toLocaleString("ru-RU")}`;
 const collected=totalBlocks-state.remaining,percent=Math.round(collected/totalBlocks*100);
 const progress=$("progress-fill"),track=progress?.parentElement;
 if(progress)progress.style.width=percent+"%";
 if(track)track.setAttribute("aria-valuenow",String(percent));
}
function drawBoardTile(x,y,exposed,cell){
 const color=state.board[y][x];if(!color)return;
 const px=x*cell,py=y*cell,size=cell-1.25,rgb=COLORS[color].hex;
 boardCtx.save();
 boardCtx.shadowColor="#35513b38";boardCtx.shadowBlur=2.1;boardCtx.shadowOffsetY=1.7;
 const face=boardCtx.createLinearGradient(px,py,px+size,py+size);
 face.addColorStop(0,"#ffffff");face.addColorStop(.12,rgb);face.addColorStop(.72,rgb);face.addColorStop(1,"#456b4a");
 boardCtx.fillStyle=face;boardCtx.beginPath();boardCtx.roundRect(px+.7,py+.5,size,size,1.9);boardCtx.fill();
 boardCtx.shadowColor="transparent";boardCtx.shadowBlur=0;boardCtx.shadowOffsetY=0;
 boardCtx.strokeStyle="#ffffffa8";boardCtx.lineWidth=.65;boardCtx.stroke();
 boardCtx.strokeStyle="#35513b35";boardCtx.lineWidth=.7;
 boardCtx.beginPath();boardCtx.moveTo(px+2,py+size-1);boardCtx.lineTo(px+size-1,py+size-1);boardCtx.lineTo(px+size-1,py+2);boardCtx.stroke();
 boardCtx.fillStyle="#ffffff55";boardCtx.beginPath();boardCtx.roundRect(px+2,py+1.6,size-4,1.15,.7);boardCtx.fill();
 if(exposed){boardCtx.strokeStyle="#fff3c9cc";boardCtx.lineWidth=.85;boardCtx.beginPath();boardCtx.roundRect(px+1.25,py+1.1,size-2.3,size-2.3,1.5);boardCtx.stroke();}
 boardCtx.restore();
}
function renderBoard(){
 const width=boardEl.width,height=boardEl.height,cell=width/SIZE;
 boardCtx.clearRect(0,0,width,height);
 boardEmptyGradient=boardCtx.createLinearGradient(0,0,width,height);
 boardEmptyGradient.addColorStop(0,"#f5f2df");boardEmptyGradient.addColorStop(1,"#dcebdc");
 boardCtx.fillStyle=boardEmptyGradient;boardCtx.fillRect(0,0,width,height);
 lastExposedPixels=new Set(getExposedPixels(state.board).map(point=>point.x+","+point.y));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)drawBoardTile(x,y,lastExposedPixels.has(x+","+y),cell);
 updateBoardProgress();
}
function renderBoardAfterPickup(target){
 const cell=boardEl.width/SIZE,px=target.x*cell,py=target.y*cell;
 boardCtx.save();boardCtx.beginPath();boardCtx.rect(px-2,py-2,cell+4,cell+4);boardCtx.clip();
 boardCtx.fillStyle=boardEmptyGradient||"#e8eddd";boardCtx.fillRect(px-2,py-2,cell+4,cell+4);boardCtx.restore();
 const nextExposed=new Set(getExposedPixels(state.board).map(point=>point.x+","+point.y));
 for(const key of nextExposed){
  if(lastExposedPixels.has(key))continue;
  const [x,y]=key.split(",").map(Number);drawBoardTile(x,y,true,cell);
 }
 lastExposedPixels=nextExposed;updateBoardProgress();
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
   const count=document.createElement("strong");count.className="ant-count";count.textContent=box.status==="departing"?(countSlotWorkers(workerPromises,index)?`↩ ${countSlotWorkers(workerPromises,index)} в пути`:"ГОТОВ К ОТГРУЗКЕ"):`🐜 ${box.ants.toLocaleString("ru-RU")}`;
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
 for(const node of choicesEl.querySelectorAll(".choice-card[data-box-index]")){const r=node.getBoundingClientRect();oldPositions.set(node.dataset.boxIndex,{left:r.left,top:r.top});}
 choicesEl.replaceChildren();
 for(let col=0;col<TRAY_SIZE;col++){
  const lane=document.createElement("div");lane.className="queue-lane";
  const index=state.tray[0][col],box=index===null||index===undefined?null:getIncoming(state.levelId)[index];
  const button=document.createElement("button");button.type="button";button.className="choice-card"+(box?" selectable":" empty-box");
  if(index!==null&&index!==undefined)button.dataset.boxIndex=String(index);
  button.disabled=!box||resetting||resetAfterMenu||state.won||state.lost||!canChoose(state);
  if(box){button.style.setProperty("--ant-color",COLORS[box.color].hex);
   const crate=document.createElement("span");crate.className="choice-crate";crate.setAttribute("aria-hidden","true");
   const gem=document.createElement("i");gem.style.setProperty("--gem-color",COLORS[box.color].hex);crate.append(gem);
   const name=document.createElement("strong");name.textContent=COLORS[box.color].name;
   const count=document.createElement("small");count.textContent=`${box.ants.toLocaleString("ru-RU")} муравьёв`;
   button.append(crate,name,count);button.setAttribute("aria-label",`Выбрать бокс: ${COLORS[box.color].name}, ${box.ants} муравьёв`);
  }else{button.textContent="Очередь закончилась";button.setAttribute("aria-label","В этой колонке больше нет боксов");}
  button.addEventListener("click",()=>onChoose(col));lane.append(button);
  const preview=document.createElement("div");preview.className="queue-preview";preview.setAttribute("aria-label","Следующие боксы в колонке");
  for(let row=1;row<TRAY_SIZE;row++){const nextIndex=state.tray[row][col],nextBox=nextIndex===null||nextIndex===undefined?null:getIncoming(state.levelId)[nextIndex];
   const peek=document.createElement("span");peek.className="queue-peek"+(nextBox?"":" empty");
   if(nextBox){peek.style.setProperty("--peek-color",COLORS[nextBox.color].hex);peek.title=`Далее: ${COLORS[nextBox.color].name}, ${nextBox.ants} кубиков`;}else peek.title="Очередь закончилась";
   preview.append(peek);
  }
  lane.append(preview);choicesEl.append(lane);
  const old=oldPositions.get(button.dataset.boxIndex);
  if(old&&button.dataset.boxIndex!==undefined){const r=button.getBoundingClientRect(),dx=old.left-r.left,dy=old.top-r.top;if((dx||dy)&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)button.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"translate(0,0)"}],{duration:320,easing:"cubic-bezier(.2,.75,.25,1)"});}
 }
 $("choice-status").textContent=`Открытый слой: ${getExposedPixels(state.board).length} блоков · собирай снаружи внутрь`;
 $("queue-count").textContent=`${Math.max(0,getIncoming(state.levelId).length-state.nextContainer)} в запасе`;
}
function render(){
 const level=getLevel(state.levelId);
 $("level-number").textContent=`ПОЛЯНКА № ${level.number}`;
 $("level-title").textContent=level.name;
 $("board").setAttribute("aria-label",`${level.name}: цветная пиксельная картина на сетке 35 на 35`);
 renderBoard();renderSlots();renderChoices();renderConveyor();
 $("message").textContent=state.message;$("restart").disabled=resetting||resolverRunning||loadingSlots.size>0;
 updateResultOverlay();
}
function resizeAntLayer(){
 const rect=shell.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1);
 antCanvasWidth=rect.width;antCanvasHeight=rect.height;
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
 if(carrying){
  ctx.fillStyle="#24352c";ctx.fillRect(-9,0,6,6);
  ctx.fillStyle=body;ctx.fillRect(-9.5,-.5,5,5);
  ctx.fillStyle="#ffffff99";ctx.fillRect(-9,-.5,3,1.2);
  ctx.fillStyle="#00000033";ctx.fillRect(-5.5,1,1,3.5);
 }
 antSpriteCache.set(key,sprite);return sprite;
}
function drawAnt(ctx,point,color,carrying,index,direction=0){
 const phase=performance.now()*.008+index*1.73,gait=Math.floor(phase/1.7)%4;
 const bob=Math.sin(phase*1.7+index*.31)*.8;
 ctx.save();ctx.translate(point.x,point.y+bob);
 ctx.fillStyle="#36523d26";ctx.beginPath();ctx.ellipse(0,7,8,2.6,0,0,Math.PI*2);ctx.fill();
 ctx.rotate(direction+Math.sin(phase*.31+index)*.055);
 ctx.drawImage(createAntSprite(color,carrying,gait),-13,-12);
 if(carrying){ctx.globalAlpha=.32+.18*Math.sin(phase*2);ctx.fillStyle=COLORS[color].hex;ctx.beginPath();ctx.arc(-8,-7,4.2,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
function makeAntTrail(start,end,seed,spread=1){
 const dx=end.x-start.x,dy=end.y-start.y,len=Math.max(1,Math.hypot(dx,dy));
 const nx=-dy/len,ny=dx/len;
 let value=Math.floor(seed*2147483647)%2147483647;
 const random=()=>{value=(value*48271)%2147483647;return value/2147483647;};
 // More waypoints and overlapping waves create a wandering colony trail, not a single broad bend.
 const count=Math.max(8,Math.min(13,Math.round(len/62)+5));
 const phase=random()*Math.PI*2,frequency=1.25+random()*.9;
 const amplitude=(25+random()*27)*spread;
 const points=[start];
 for(let i=1;i<count;i++){
  const t=i/count;
  const irregular=Math.sin(t*Math.PI)*(Math.sin(t*Math.PI*frequency+phase)*.62+(random()-.5)*.8);
  const lateral=irregular*amplitude;
  const along=(random()-.5)*Math.min(25,len*.055);
  points.push({
   x:start.x+dx*t+nx*lateral+dx/len*along,
   y:start.y+dy*t+ny*lateral+dy/len*along
  });
 }
 points.push(end);return points;
}
function trailPoint(points,t){
 const scaled=Math.max(0,Math.min(.999999,t))*(points.length-1),i=Math.floor(scaled),u=scaled-i;
 const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
 const calc=(a,b,c,d)=>.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);
 return{x:calc(p0.x,p1.x,p2.x,p3.x),y:calc(p0.y,p1.y,p2.y,p3.y)};
}
function renderAntFrame(timestamp){
 if(timestamp-lastAntFrameAt<ANT_FRAME_INTERVAL){antFrame=requestAnimationFrame(renderAntFrame);return;}
 lastAntFrameAt=timestamp;
 antCtx.clearRect(0,0,antCanvasWidth,antCanvasHeight);
 for(const [workerId,ant] of activeAnts){
  const phase=getAntTripFrame(timestamp-ant.startTime,ant.delay,ant.outbound,ant.returning);
  if(phase.waiting)continue;
  if(phase.picked&&!ant.picked){
   ant.picked=true;
   if(applyAntMove(state,ant.move.slot,ant.move.target))ant.onPickup();
   renderBoardAfterPickup(ant.move.target);renderSlots();
   $("message").textContent="Муравьишки собирают кубики по извилистым тропинкам";
   kickColony();
  }
  if(phase.finished){
   activeAnts.delete(workerId);
   ant.resolve();
   continue;
  }
  const trail=phase.returningNow?ant.returnTrail:ant.outboundTrail;
  const point=trailPoint(trail,phase.progress);
  const before=trailPoint(trail,Math.max(0,phase.progress-.012));
  const after=trailPoint(trail,Math.min(1,phase.progress+.012));
  const tangent={x:after.x-before.x,y:after.y-before.y};
  drawAnt(antCtx,point,ant.move.color,phase.returningNow,workerId,Math.atan2(tangent.y,tangent.x));
 }
 if(activeAnts.size)antFrame=requestAnimationFrame(renderAntFrame);
 else antFrame=0;
}
function animateAntTrip(move,index,onPickup=()=>{}){
 const shellRect=shell.getBoundingClientRect();
 const start=slotCenter(move.slot),end=cellCenter(move.target.x,move.target.y);
 const seed=(index*9301+move.target.x*49297+move.target.y*233)%9973/9973;
 const outboundTrail=makeAntTrail(start,end,seed,1),returnTrail=makeAntTrail(end,start,(seed+.371)%1,.72);
 const distance=Math.hypot(end.x-start.x,end.y-start.y);
 const delay=getAntLaunchDelay(index,seed),outbound=2050+distance*.82,returning=1800+distance*.68;
 return new Promise(resolve=>{
  activeAnts.set(index,{move,onPickup,resolve,startTime:performance.now(),delay,outbound,returning,outboundTrail,returnTrail});
  if(!antFrame)antFrame=requestAnimationFrame(renderAntFrame);
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
 const duration=1250,startTime=performance.now();
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
 const shellRect=shell.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 const layer=document.createElement("canvas");layer.className="flight-layer";
 layer.width=Math.max(1,Math.round(shellRect.width*dpr));layer.height=Math.max(1,Math.round(shellRect.height*dpr));
 layer.style.width=shellRect.width+"px";layer.style.height=shellRect.height+"px";shell.append(layer);
 const ctx=layer.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
 const starts=slotIndices.map(slot=>({slot,start:slotCenter(slot),color:state.slots[slot]?.color||"yellow"}));
 const belt=pointFor(conveyorEl),startTime=performance.now(),duration=1750;
 return new Promise(resolve=>{
  const frame=timestamp=>{
   const elapsed=timestamp-startTime;ctx.clearRect(0,0,shellRect.width,shellRect.height);
   let finished=0;
   starts.forEach((item,index)=>{
    const delay=index*170,t=Math.max(0,Math.min(1,(elapsed-delay)/duration));
    if(elapsed<delay){finished++;return;}if(t>=1){finished++;return;}
    const lift=quadPoint(item.start,{x:item.start.x-22,y:(item.start.y+belt.y)/2},{x:item.start.x,y:belt.y},Math.min(1,t*2.2));
    const progress=Math.max(0,(t-.42)/.58);
    drawTransportBox(ctx,{x:lift.x+(shellRect.width+35-lift.x)*progress,y:lift.y+(belt.y-lift.y)*progress},item.color);
   });
   if(finished===starts.length){layer.remove();resolve();return;}
   requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
 });
}
async function runSlotWorker(slot,target,workerId){
 const key=target.x+","+target.y;
 try{
  await animateAntTrip({slot,color:state.slots[slot]?.color,target},workerId,()=>{
   const worker=workerPromises.get(workerId);if(worker)worker.phase="returning";
   reservedTargets.delete(key);
  });
 }catch(error){console.error("Ant worker interrupted",slot,error);}
 finally{
  reservedTargets.delete(key);workerPromises.delete(workerId);
  if(!resetting&&canDepartSlot(workerPromises,slot)&&state.slots[slot]?.status==="departing"){
   await animateBoxDepartures([slot]);completeBoxDeparture(state,slot);
   renderSlots();renderConveyor();
  }
  resolverRunning=workerPromises.size>0;
  state.activeSlots=[...new Set([...workerPromises.values()].map(worker=>worker.slot))];
  renderSlots();
  if(!resetting&&!resetAfterMenu){kickColony();settleColony();}
  maybeFinalizeMenuExit();
 }
}
function updateResultOverlay(){
 const overlay=$("result-overlay");
 if(!overlay)return;
 const complete=state.won,failed=state.lost;
 const next=nextLevel();
 $("result-next").hidden=!complete||!next||!isLevelUnlocked(next);
 if(next)$("result-next").textContent=`Следующая полянка: ${next.name} →`;
 overlay.hidden=!(complete||failed);
 if(!complete&&!failed)return;
 $("result-emoji").textContent=complete?"🏆":"🐜";
 $("result-title").textContent=complete?"Портрет собран!":"Колония остановилась";
 $("result-copy").textContent=complete
  ?"Все цветные кубики нашли своё место. Отличная работа, команда!"
  :"Все пять отсеков заняты, а доступных кубиков нужных цветов больше нет. Попробуй другой порядок боксов.";
 $("result-retry").textContent=complete?"Собрать портрет ещё раз":"Попробовать снова";
}
function settleColony(){
 if(resolverRunning||workerPromises.size||loadingSlots.size||resetting)return;
 if(state.remaining===0){if(!state.won)markLevelComplete(state.levelId);state.won=true;state.message="Победа! Портрет собран ✨";}
 else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, доступных пикселей нет.";}
 else state.message=`Колония ждёт подходящий цвет · свободно отсеков: ${state.slots.filter(box=>!box).length}`;
 render();
}
function kickColony(){
 if(resetting||resetAfterMenu||state.won||state.lost)return;
 const pendingBySlot=countOutboundBySlot(workerPromises);
 const dispatchCapacity=Math.max(0,MAX_ACTIVE_ANTS-workerPromises.size);
 const wave=findAntWave(state,reservedTargets,pendingBySlot,dispatchCapacity);
 for(const move of wave){
  const workerId=++workerSequence,key=move.target.x+","+move.target.y;
  reservedTargets.add(key);
  workerPromises.set(workerId,{slot:move.slot,phase:"outbound"});
  void runSlotWorker(move.slot,move.target,workerId);
 }
 resolverRunning=workerPromises.size>0;
 state.activeSlots=[...new Set([...workerPromises.values()].map(worker=>worker.slot))];
 renderSlots();if(!resolverRunning)settleColony();
}
async function onChoose(column){
 if(resetting||resetAfterMenu||!canChoose(state))return;
 const selectedIndex=state.tray[0][column],sourceNode=choicesEl.querySelector('[data-box-index="'+selectedIndex+'"]');
 if(!sourceNode)return;
 const sourceRect=sourceNode.getBoundingClientRect(),shellRect=shell.getBoundingClientRect();
 const source={x:sourceRect.left+sourceRect.width/2-shellRect.left,y:sourceRect.top+sourceRect.height/2-shellRect.top};
 const freeSlot=state.slots.findIndex(box=>box===null),box=getIncoming(state.levelId)[selectedIndex];
 if(freeSlot<0||!box||!chooseTopColumn(state,column))return;
 loadingSlots.add(freeSlot);
 state.message="Бокс "+COLORS[box.color].name.toLowerCase()+" подан на ленту и едет в отсек "+(freeSlot+1);
 render();
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
  if(!resetting&&loadingSlots.size===0){if(resetAfterMenu)maybeFinalizeMenuExit();else kickColony();}
 }
}
async function restart(){
 if(resetting||resetAfterMenu||workerPromises.size>0||loadingSlots.size>0)return;
 resetting=true;renderChoices();state=createGame(state.levelId);totalBlocks=state.remaining;resetting=false;render();
 $("save-status").textContent="Новая партия · прогресс уровня не сохраняется";
}
function updateMainMenu(){
 const primary=$("start-game"),fresh=$("new-game"),progress=$("menu-progress"),level=getLevel(state.levelId);
 $("menu-level-name").textContent=level.name;$("menu-level-number").textContent=`ПОЛЯНКА ${String(level.number).padStart(2,"0")}`;$("menu-level-emoji").textContent=level.emoji;
 const list=$("campaign-levels");
 if(list){list.replaceChildren();for(const item of LEVELS){const unlocked=isLevelUnlocked(item),button=document.createElement("button");button.type="button";button.className="campaign-level"+(item.id===state.levelId?" current":"")+(unlocked?"":" locked");button.disabled=!unlocked;button.innerHTML=`<span class="campaign-emoji">${item.emoji}</span><span class="campaign-copy"><small>${item.chapter} · ${String(item.number).padStart(2,"0")}</small><strong>${item.name}</strong></span><span class="campaign-state">${completedLevels().has(item.id)?"✓":unlocked?"›":"🔒"}</span>`;button.addEventListener("click",()=>{if(unlocked)void startFreshGame(item.id);});list.append(button);}}

 primary.textContent=gameStarted?"Вернуться на полянку":"Начать охоту";
 primary.disabled=resetAfterMenu;
 primary.querySelector("span")?.remove();
 const arrow=document.createElement("span");arrow.setAttribute("aria-hidden","true");arrow.textContent="→";primary.append(arrow);
 fresh.hidden=true;
 progress.textContent=`${level.chapter} · ${level.hint}`;
}
function showMainMenu(){
 shell.classList.add("menu-open");
 if(gameStarted){resetAfterMenu=true;maybeFinalizeMenuExit();}
 updateMainMenu();
}
function maybeFinalizeMenuExit(){
 if(!resetAfterMenu||workerPromises.size||loadingSlots.size||resetting)return;
 resetting=true;cancelAnimationFrame(antFrame);antFrame=0;activeAnts.clear();reservedTargets.clear();
 state=createGame(state.levelId);totalBlocks=state.remaining;gameStarted=false;resetAfterMenu=false;resetting=false;
 render();$("save-status").textContent="Партия сброшена · открытые полянки сохранены";updateMainMenu();
}
function startGame(){
 if(resetAfterMenu)return;
 shell.classList.remove("menu-open");gameStarted=true;updateMainMenu();
 kickColony();
}
async function startFreshGame(levelId=state.levelId){
 if(workerPromises.size>0||loadingSlots.size>0||resetAfterMenu)return;
 resetting=true;cancelAnimationFrame(antFrame);activeAnts.clear();reservedTargets.clear();state=createGame(levelId);totalBlocks=state.remaining;resetting=false;
 gameStarted=true;render();$("save-status").textContent="Новая партия · прогресс уровня не сохраняется";shell.classList.remove("menu-open");updateMainMenu();kickColony();
}
async function boot(){
 totalBlocks=state.remaining;
 render();resizeAntLayer();updateMainMenu();
 if("serviceWorker"in navigator){
  try{
   navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(!window.__antsWorkerReloading){window.__antsWorkerReloading=true;window.location.reload();}
   });
   const registration=await navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"});
   await registration.update();
   if(registration.waiting)registration.waiting.postMessage({type:"SKIP_WAITING"});
  }catch(error){console.warn("PWA update check failed",error);}
 }
 $("save-status").textContent="Партия не сохраняется · открытые полянки сохраняются";
}
$("restart").addEventListener("click",restart);
$("menu-toggle").addEventListener("click",showMainMenu);
$("start-game").addEventListener("click",startGame);
$("new-game").addEventListener("click",()=>startFreshGame(state.levelId));
$("result-retry").addEventListener("click",()=>startFreshGame(state.levelId));
$("result-next").addEventListener("click",()=>{const index=LEVELS.findIndex(level=>level.id===state.levelId),next=LEVELS[index+1];if(next&&isLevelUnlocked(next))void startFreshGame(next.id);});
$("result-menu").addEventListener("click",showMainMenu);
$("how-to-play").addEventListener("click",()=>{
 const panel=$("how-panel");panel.hidden=!panel.hidden;
 $("how-to-play").textContent=panel.hidden?"Как играть?":"Свернуть правила";
});
window.addEventListener("resize",()=>{resizeAntLayer();renderBoard();});
boot();
