import {COLORS,SIZE,GRID_SIZE,BLOCK_SIZE,SLOT_COUNT,TRAY_SIZE,LEVELS,getLevel,getIncoming,createGame,canChoose,chooseTopColumn,isLockedBox,getLinkedPartner,findAntWave,applyAntMove,completeBoxDeparture,isDefeat,getExposedPixels,countOutboundBySlot,countSlotWorkers,canDepartSlot} from "./game.js";
import {getAntTripFrame,getAntLaunchDelay,createPausableClock,getTrailPose} from "./ant-animation.js";
import {isCampaignLevelUnlocked,getNextCampaignLevel} from "./campaign.js";
import {BUILDINGS,createEconomy,normalizeEconomy,collectCube,completeMeadow,purchaseBuilding,buildingCost} from "./economy.js";
const $=id=>document.getElementById(id);
const shell=$("app-shell"),boardEl=$("board"),slotsEl=$("slots"),choicesEl=$("choices"),antLayer=$("ant-layer"),conveyorEl=$("conveyor");
const boardCtx=boardEl.getContext("2d"),antCtx=antLayer.getContext("2d");
let state=createGame(),resolverRunning=false,resetting=false,resetAfterMenu=false,antFrame=0,antCanvasWidth=0,antCanvasHeight=0,gameStarted=false,totalBlocks=state.remaining;
const animationClock=createPausableClock(()=>performance.now());
if(document.hidden)animationClock.pause();
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)animationClock.pause();
 else animationClock.resume();
});
const CAMPAIGN_KEY="ants-campaign-progress";
const ECONOMY_STORAGE_KEY="ants-colony-economy-v1";
function loadEconomy(){try{return normalizeEconomy(JSON.parse(localStorage.getItem(ECONOMY_STORAGE_KEY)||"null"));}catch{return createEconomy();}}
let colony=loadEconomy();
function updateEconomy(){try{localStorage.setItem(ECONOMY_STORAGE_KEY,JSON.stringify(colony));}catch{}const pill=$("nest-nectar");if(pill)pill.textContent=String(colony.nectar);if(!$("nest-overlay")?.hidden)renderNest();}
function renderNest(){
 const scene=$("nest-scene");if(scene){const garden=colony.buildings.garden,granary=colony.buildings.granary;scene.dataset.gardenLevel=String(garden);scene.dataset.granaryLevel=String(granary);scene.setAttribute("aria-label",`Подземный дом колонии. Сад нектара: уровень ${garden} из 3. Хранилище: уровень ${granary} из 3.`);}
 const balance=$("nest-balance");if(balance)balance.textContent=colony.nectar.toLocaleString("ru-RU");
 const progress=$("nest-progress"),bar=$("nest-progress-bar"),fill=$("nest-progress-fill"),label=$("nest-progress-label");
 const percent=Math.round(colony.progress/10*100);
 if(progress)progress.textContent=`Ещё ${10-colony.progress} кубиков до награды · за каждые 10 кубиков приходит нектар`;
 if(label)label.textContent=`${colony.progress} / 10 кубиков`;
 if(fill)fill.style.width=percent+"%";
 if(bar)bar.setAttribute("aria-valuenow",String(colony.progress));
 const total=$("nest-total-cubes"),meadows=$("nest-meadows-done"),upgrades=$("nest-upgrades");
 if(total)total.textContent=colony.lifetime.toLocaleString("ru-RU");
 if(meadows)meadows.textContent=colony.completed.toLocaleString("ru-RU");
 if(upgrades)upgrades.textContent=String(colony.buildings.garden+colony.buildings.granary)+" / 6";
 const list=$("nest-buildings");if(!list)return;list.replaceChildren();
 const activeGroup=document.createElement("div");activeGroup.className="nest-building-group";
 const futureGroup=document.createElement("div");futureGroup.className="nest-building-group future-group";
 const activeTitle=document.createElement("p");activeTitle.className="nest-group-label";activeTitle.textContent="Работают каждый день";activeGroup.append(activeTitle);
 const futureTitle=document.createElement("p");futureTitle.className="nest-group-label";futureTitle.textContent="Будущие открытия";futureGroup.append(futureTitle);
 for(const building of BUILDINGS){
  const level=colony.buildings[building.id],cost=buildingCost(building,level),comingSoon=building.id==="nursery",card=document.createElement("article");
  card.className="nest-building"+(comingSoon?" coming-soon":"");
  const icon=document.createElement("span");icon.className="nest-building-icon";icon.textContent=building.icon;
  const copy=document.createElement("div");copy.className="nest-building-copy";
  const title=document.createElement("strong");title.textContent=building.name;
  const desc=document.createElement("small");desc.textContent=comingSoon?"Особые муравьи появятся в одном из будущих обновлений. Нектар пока лучше сохранить.":building.description;
  const rank=document.createElement("span");rank.textContent=comingSoon?"Новое открытие готовится":level>=3?"Максимум · 3/3":`Уровень ${level}/3`;copy.append(title,desc,rank);
  if(!comingSoon){const levels=document.createElement("span");levels.className="nest-level-pips";levels.setAttribute("aria-label",`Уровень ${level} из 3`);for(let step=0;step<3;step++){const pip=document.createElement("i");if(step<level)pip.classList.add("filled");levels.append(pip);}copy.append(levels);}
  const buy=document.createElement("button");buy.type="button";buy.className="nest-buy";buy.disabled=comingSoon||level>=3||colony.nectar<cost;
  buy.textContent=comingSoon?"Скоро":level>=3?"Готово":`🌼 ${cost}`;
  buy.setAttribute("aria-label",comingSoon?"Питомник будет доступен в будущем":level>=3?`${building.name}: максимальный уровень`:`Улучшить ${building.name} за ${cost} нектара`);
  buy.addEventListener("click",()=>{const result=purchaseBuilding(colony,building.id);if(result.ok){colony=result.economy;updateEconomy();}else renderNest();});
  card.append(icon,copy,buy);(comingSoon?futureGroup:activeGroup).append(card);
 }
 list.append(activeGroup,futureGroup);
}
function openNest(){renderNest();$("nest-overlay").hidden=false;}
function closeNest(){$("nest-overlay").hidden=true;}
function openMap(){renderMap();$("map-overlay").hidden=false;}
function renderMap(){
 const done=completedLevels(),summary=$("map-summary"),list=$("campaign-levels");
 const finished=LEVELS.filter(level=>done.has(level.id)).length,open=LEVELS.filter(level=>isLevelUnlocked(level)).length;
 const nextPlayable=LEVELS.find(level=>isLevelUnlocked(level)&&!done.has(level.id))||null;
 summary.replaceChildren();
 const stat=document.createElement("div");stat.className="map-summary-main";
 const count=document.createElement("strong");count.textContent=`${finished} / ${LEVELS.length}`;
 const copy=document.createElement("span");copy.textContent="полянок пройдено";stat.append(count,copy);
 const track=document.createElement("div");track.className="map-summary-track";const fill=document.createElement("span");fill.style.width=(finished/LEVELS.length*100)+"%";track.append(fill);
 const next=document.createElement("small");next.className="map-summary-next";next.textContent=finished===LEVELS.length?"Все маршруты пройдены — можно вернуться на любимую полянку":nextPlayable?"Следующая остановка · "+nextPlayable.name:"Доступно "+open+" из "+LEVELS.length+" полянок";
 summary.append(stat,track,next);
 list.replaceChildren();
 const chapters=[];for(const level of LEVELS){let group=chapters.find(item=>item.name===level.chapter);if(!group){group={name:level.chapter,levels:[]};chapters.push(group);}group.levels.push(level);}
 for(let index=0;index<chapters.length;index++){
  const chapter=chapters[index],section=document.createElement("section");section.className="map-chapter";
  const heading=document.createElement("header");heading.className="map-chapter-heading";
  const title=document.createElement("strong");title.textContent=chapter.name;
  const chapterDone=chapter.levels.filter(level=>done.has(level.id)).length;
  const meta=document.createElement("small");meta.textContent=chapterDone===chapter.levels.length?"ГЛАВА ПРОЙДЕНА":chapterDone?`${chapterDone} / ${chapter.levels.length} · В ПУТИ`:`0 / ${chapter.levels.length} · ВПЕРЕДИ`;
  heading.append(title,meta);
  section.classList.add(chapterDone===chapter.levels.length?"chapter-complete":chapterDone?"chapter-active":"chapter-locked");
  const chapterTrack=document.createElement("div");chapterTrack.className="map-chapter-track";chapterTrack.setAttribute("aria-label","Прогресс главы: "+chapterDone+" из "+chapter.levels.length);
  const chapterFill=document.createElement("span");chapterFill.style.width=(chapterDone/chapter.levels.length*100)+"%";chapterTrack.append(chapterFill);
  section.append(heading,chapterTrack);
  const grid=document.createElement("div");grid.className="campaign-levels map-levels";
  for(const item of chapter.levels){
   const unlocked=isLevelUnlocked(item),completed=done.has(item.id),button=document.createElement("button");button.type="button";
   const isNext=nextPlayable?.id===item.id;
   button.className="campaign-level"+(item.id===state.levelId?" current":"")+(completed?" completed":"")+(isNext?" next-stop":"")+(unlocked?"":" locked");button.disabled=!unlocked;
   button.setAttribute("aria-label",`Полянка ${item.number}: ${item.name}. ${completed?"Пройдена":unlocked?(isNext?"Следующая доступная полянка":"Доступна"):"Пока закрыта"}`);
   const icon=document.createElement("span");icon.className="campaign-emoji";icon.textContent=completed?"✓":unlocked?item.emoji:"🔒";
   const copy=document.createElement("span");copy.className="campaign-copy";
   const number=document.createElement("small");number.textContent=`ПОЛЯНКА ${String(item.number).padStart(2,"0")}`;
   const name=document.createElement("strong");name.textContent=item.name;
   const hint=document.createElement("small");hint.className="map-level-hint";hint.textContent=unlocked?(completed?"Можно пройти ещё раз":isNext?"Следующая остановка · "+item.hint:item.hint):"Сначала заверши предыдущую полянку";
   copy.append(number,name,hint);
   const status=document.createElement("span");status.className="campaign-state";status.textContent=completed?"✓":unlocked?isNext?"СТАРТ":"›":"🔒";
   button.append(icon,copy,status);button.addEventListener("click",()=>{if(unlocked){closeMap();void startFreshGame(item.id);}});grid.append(button);
  }
  section.append(grid);list.append(section);
 }
}
function closeMap(){$("map-overlay").hidden=true;}
function completedLevels(){try{return new Set(JSON.parse(localStorage.getItem(CAMPAIGN_KEY)||"[]"));}catch{return new Set();}}
function markLevelComplete(levelId){const done=completedLevels();done.add(levelId);try{localStorage.setItem(CAMPAIGN_KEY,JSON.stringify([...done]));}catch{}}
function isLevelUnlocked(level){return isCampaignLevelUnlocked(LEVELS,completedLevels(),level.id);}
function nextLevel(){return getNextCampaignLevel(LEVELS,state.levelId);}
const loadingSlots=new Set(),workerPromises=new Map(),reservedTargets=new Set(),activeAnts=new Map(),pickupEffects=[];
let workerSequence=0,lastAntFrameAt=0,lastExposedPixels=new Set();
const MAX_ACTIVE_ANTS=36,ANT_FRAME_INTERVAL=1000/30;
const colorRGB=Object.fromEntries(Object.entries(COLORS).map(([key,value])=>[key,value.hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16))]));
let boardEmptyGradient=null;
function updateBoardProgress(){
 $("board-status").textContent=`Осталось: ${state.remaining.toLocaleString("ru-RU")}`;
 const collected=totalBlocks-state.remaining,percent=Math.round(collected/totalBlocks*100);
 const progress=$("progress-fill"),track=progress?.parentElement;
 if(progress)progress.style.width=percent+"%";
 if(track)track.setAttribute("aria-valuenow",String(percent));
}
function drawBoardGridCell(x,y,cell){
 const px=x*cell,py=y*cell;
 boardCtx.save();boardCtx.strokeStyle="#a6c3a044";boardCtx.lineWidth=.65;
 boardCtx.strokeRect(px+.35,py+.35,cell-.7,cell-.7);boardCtx.restore();
}
function drawBoardTile(x,y,exposed,cell){
 const color=state.board[y][x];if(!color)return;
 const px=x*cell,py=y*cell,size=cell-1.25,rgb=COLORS[color].hex;
 boardCtx.save();
 boardCtx.shadowColor="#07150f66";boardCtx.shadowBlur=2.3;boardCtx.shadowOffsetY=1.4;
 const face=boardCtx.createLinearGradient(px,py,px+size,py+size);
 face.addColorStop(0,"#ffffffb8");face.addColorStop(.13,rgb);face.addColorStop(.76,rgb);face.addColorStop(1,"#263b30");
 boardCtx.fillStyle=face;boardCtx.beginPath();boardCtx.roundRect(px+.7,py+.5,size,size,1.9);boardCtx.fill();
 boardCtx.shadowColor="transparent";boardCtx.shadowBlur=0;boardCtx.shadowOffsetY=0;
 boardCtx.strokeStyle="#d8e6d044";boardCtx.lineWidth=.65;boardCtx.stroke();
 boardCtx.strokeStyle="#14251d77";boardCtx.lineWidth=.7;
 boardCtx.beginPath();boardCtx.moveTo(px+2,py+size-1);boardCtx.lineTo(px+size-1,py+size-1);boardCtx.lineTo(px+size-1,py+2);boardCtx.stroke();
 boardCtx.fillStyle="#ffffff30";boardCtx.beginPath();boardCtx.roundRect(px+2,py+1.6,size-4,1.05,.7);boardCtx.fill();
 if(exposed){boardCtx.strokeStyle="#d6bd78cc";boardCtx.lineWidth=.85;boardCtx.beginPath();boardCtx.roundRect(px+1.25,py+1.1,size-2.3,size-2.3,1.5);boardCtx.stroke();}
 boardCtx.restore();
}
function renderBoard(){
 const width=boardEl.width,height=boardEl.height,cell=width/SIZE;
 boardCtx.clearRect(0,0,width,height);
 boardEmptyGradient=boardCtx.createLinearGradient(0,0,width,height);
 boardEmptyGradient.addColorStop(0,"#263e32");boardEmptyGradient.addColorStop(.55,"#20372c");boardEmptyGradient.addColorStop(1,"#182b23");
 boardCtx.fillStyle=boardEmptyGradient;boardCtx.fillRect(0,0,width,height);
 boardCtx.save();boardCtx.strokeStyle="#a6c3a02a";boardCtx.lineWidth=.55;
 for(let i=0;i<=SIZE;i++){const p=i*cell+.5;boardCtx.beginPath();boardCtx.moveTo(p,0);boardCtx.lineTo(p,height);boardCtx.stroke();boardCtx.beginPath();boardCtx.moveTo(0,p);boardCtx.lineTo(width,p);boardCtx.stroke();}
 boardCtx.restore();
 lastExposedPixels=new Set(getExposedPixels(state.board).map(point=>point.x+","+point.y));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)drawBoardTile(x,y,lastExposedPixels.has(x+","+y),cell);
 updateBoardProgress();
}
function renderBoardAfterPickup(target){
 const cell=boardEl.width/SIZE,px=target.x*cell,py=target.y*cell;
 boardCtx.save();boardCtx.beginPath();boardCtx.rect(px-2,py-2,cell+4,cell+4);boardCtx.clip();
 boardCtx.fillStyle=boardEmptyGradient||"#20372c";boardCtx.fillRect(px-2,py-2,cell+4,cell+4);boardCtx.restore();
 drawBoardGridCell(target.x,target.y,cell);
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
  slot.setAttribute("aria-label",box
   ? `Отсек ${index+1}: ${box.status==="departing"?"бокс отправляется":box.ants+" муравьёв, цвет "+box.color}`
   : `Отсек ${index+1}: свободен`);
  slot.style.setProperty("--box-color",box?COLORS[box.color].hex:"#d8e5d2");
  slot.className="slot"+(box?" filled":"")+(box?.status==="departing"?" departing":"")+(box?.status==="waiting-linked"?" linked-waiting":"")+(box?.special==="linked"?" linked-member":"")+(loadingSlots.has(index)?" loading":"")+((state.activeSlots?.includes(index))?" active":"");
  const number=document.createElement("span");number.className="slot-number";number.textContent=String(index+1);slot.append(number);
  if(box){
   const stripe=document.createElement("span");stripe.className="slot-color";stripe.style.background=COLORS[box.color].hex;
   const count=document.createElement("strong");count.className="ant-count";count.textContent=box.status==="departing"?"…":box.ants.toLocaleString("ru-RU");
   slot.append(stripe,count);
  }else{const plus=document.createElement("span");plus.className="slot-plus";plus.textContent="＋";slot.append(plus);}
  slotsEl.append(slot);
 });
}
function renderConveyor(){}
function renderChoices(){
 const oldPositions=new Map();
 for(const node of choicesEl.querySelectorAll(".choice-card[data-box-index]")){const r=node.getBoundingClientRect();oldPositions.set(node.dataset.boxIndex,{left:r.left,top:r.top});}
 choicesEl.replaceChildren();
 for(let col=0;col<TRAY_SIZE;col++){
  const lane=document.createElement("div");lane.className="queue-lane";
  const index=state.tray[0][col],box=index===null||index===undefined?null:getIncoming(state.levelId)[index];
  const sealed=box&&isLockedBox(state,index),reveal=box&&state.lockedBoxOpen&&!state.lockedBoxRevealPlayed&&index===8;
  const button=document.createElement("button");button.type="button";button.className="choice-card"+(sealed?" sealed-box":box?" selectable":" empty-box")+(reveal?" sealed-reveal":"");
  if(reveal)state.lockedBoxRevealPlayed=true;
  if(index!==null&&index!==undefined)button.dataset.boxIndex=String(index);
  const linked=box?.special==="linked",partner=linked?getLinkedPartner(state.levelId,index):null;
  const waitingForPartner=linked&&state.pendingLinkedIndex!==index&&!state.tray[0].includes(partner),needsPairSlots=linked&&(state.pendingLinkedIndex===null||state.pendingLinkedIndex===undefined)&&state.slots.filter(slot=>slot===null).length<2;
  const blockedByPair=state.pendingLinkedIndex!==null&&state.pendingLinkedIndex!==undefined&&index!==state.pendingLinkedIndex;
  button.disabled=!box||sealed||resetting||resetAfterMenu||state.won||state.lost||!canChoose(state)||blockedByPair||waitingForPartner||needsPairSlots;
  if(sealed){
   const crate=document.createElement("span");crate.className="choice-crate sealed-crate";crate.textContent="🔒";
   const count=document.createElement("small");count.className="sealed-progress";count.textContent=`${(state.lockProgressColumns||[]).length}/2`;
   button.append(crate,count);button.title="Закрытый бокс откроется после размещения обычных боксов из двух других колонок";
   button.setAttribute("aria-label",`Закрытый бокс, прогресс открытия ${(state.lockProgressColumns||[]).length} из 2`);
  }else if(box){button.style.setProperty("--ant-color",COLORS[box.color].hex);
   if(linked){button.classList.add("linked-box");const chain=document.createElement("span");chain.className="linked-mark";chain.textContent="↔";button.append(chain);button.title=blockedByPair?"Сначала выбери первый связанный бокс":waitingForPartner?"Связанный бокс появится в верхнем ряду позже":needsPairSlots?"Для пары нужны два свободных отсека":"Связанная пара: после этого бокса выбери второй";}
   const crate=document.createElement("span");crate.className="choice-crate";crate.setAttribute("aria-hidden","true");
   const gem=document.createElement("i");gem.style.setProperty("--gem-color",COLORS[box.color].hex);crate.append(gem);
   const count=document.createElement("small");count.textContent=`${box.ants.toLocaleString("ru-RU")} 🐜`;
   button.append(crate,count);button.setAttribute("aria-label",`${linked?"Связанный бокс. ":""}Выбрать бокс: ${box.ants} муравьёв`);
  }else{button.textContent="Очередь закончилась";button.setAttribute("aria-label","В этой колонке больше нет боксов");}
  button.addEventListener("click",()=>onChoose(col));lane.append(button);
  const preview=document.createElement("div");preview.className="queue-preview";preview.setAttribute("aria-label","Следующие боксы в колонке");
  for(let row=1;row<TRAY_SIZE;row++){const nextIndex=state.tray[row][col],nextBox=nextIndex===null||nextIndex===undefined?null:getIncoming(state.levelId)[nextIndex];
   const peek=document.createElement("span");peek.className="queue-peek"+(nextBox?"":" empty");peek.dataset.queueStep=String(row);
   const order=document.createElement("span");order.className="peek-order";order.textContent=String(row);peek.append(order);
   const sealedPreview=nextBox&&isLockedBox(state,nextIndex),revealPreview=nextBox&&state.lockedBoxOpen&&!state.lockedBoxRevealPlayed&&nextIndex===8;
   if(revealPreview){peek.classList.add("sealed-reveal");state.lockedBoxRevealPlayed=true;}
   if(sealedPreview){
    peek.classList.add("sealed-peek");const lock=document.createElement("span");lock.className="peek-lock";lock.textContent="🔒";
    const progress=document.createElement("small");progress.className="peek-count";progress.textContent=`${(state.lockProgressColumns||[]).length}/2`;
    peek.append(lock,progress);peek.title="Закрытый бокс";peek.setAttribute("aria-label",`Закрытый бокс, прогресс ${(state.lockProgressColumns||[]).length} из 2`);
   }else if(nextBox){
    if(nextBox.special==="linked")peek.classList.add("linked-peek");
    const color=COLORS[nextBox.color];peek.style.setProperty("--peek-color",color.hex);
    const chip=document.createElement("i");chip.className="peek-color-chip";chip.setAttribute("aria-hidden","true");
    const meta=document.createElement("span");meta.className="peek-meta";
    const count=document.createElement("small");count.className="peek-count";count.textContent=String(nextBox.ants)+" 🐜";
    meta.append(count);peek.append(chip,meta);
    peek.title=`Следующий бокс №${row}: ${nextBox.ants} муравьёв`;peek.setAttribute("aria-label",`Бокс в очереди номер ${row}, цвет ${color.name}, ${nextBox.ants} муравьёв`);
   }else{
    const empty=document.createElement("span");empty.className="peek-empty-mark";empty.textContent="—";peek.append(empty);
    peek.title=`Позиция ${row}: очередь закончилась`;peek.setAttribute("aria-label",peek.title);
   }
   preview.append(peek);
  }
  lane.append(preview);choicesEl.append(lane);
  const old=oldPositions.get(button.dataset.boxIndex);
  if(old&&button.dataset.boxIndex!==undefined){const r=button.getBoundingClientRect(),dx=old.left-r.left,dy=old.top-r.top;if((dx||dy)&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)button.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"translate(0,0)"}],{duration:320,easing:"cubic-bezier(.2,.75,.25,1)"});}
 }
 $("queue-count").textContent=`${Math.max(0,getIncoming(state.levelId).length-state.nextContainer)} ещё`;
}
function render(){
 const level=getLevel(state.levelId);
 $("level-number").textContent=`ПОЛЯНКА № ${level.number}`;
 $("level-title").textContent=level.name;
 $("board").setAttribute("aria-label",`${level.name}: цветная пиксельная картина на сетке 35 на 35`);
 renderBoard();renderSlots();renderChoices();renderConveyor();
 $("message").textContent=state.message;
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
function drawAnt(ctx,point,color,carrying,index,direction=0,timestamp=animationClock.now()){
 const phase=timestamp*.008+index*1.73,gait=Math.floor(phase/1.7)%4;
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
function drawPickupEffects(timestamp){
 for(let i=pickupEffects.length-1;i>=0;i--){
  const effect=pickupEffects[i],t=(timestamp-effect.startedAt)/460;
  if(t>=1){pickupEffects.splice(i,1);continue;}
  const alpha=1-t,radius=4+t*13;
  antCtx.save();antCtx.globalAlpha=alpha;
  antCtx.strokeStyle=COLORS[effect.color].hex;antCtx.lineWidth=1.8*(1-t);
  antCtx.beginPath();antCtx.arc(effect.x,effect.y,radius,0,Math.PI*2);antCtx.stroke();
  antCtx.fillStyle="#fff4c9";antCtx.shadowColor=COLORS[effect.color].hex;antCtx.shadowBlur=5;
  for(let n=0;n<5;n++){
   const angle=n*Math.PI*2/5+effect.seed,reach=radius*.78;
   const x=effect.x+Math.cos(angle)*reach,y=effect.y+Math.sin(angle)*reach;
   const size=(1.2+(n%2)*.6)*(1-t);
   antCtx.beginPath();antCtx.moveTo(x,y-size*2);antCtx.lineTo(x+size,y);antCtx.lineTo(x,y+size*2);antCtx.lineTo(x-size,y);antCtx.closePath();antCtx.fill();
  }
  antCtx.restore();
 }
}
function renderAntFrame(timestamp){
 if(timestamp-lastAntFrameAt<ANT_FRAME_INTERVAL){antFrame=requestAnimationFrame(renderAntFrame);return;}
 lastAntFrameAt=timestamp;
 const clockTime=animationClock.fromFrame(timestamp);
 antCtx.clearRect(0,0,antCanvasWidth,antCanvasHeight);
 for(const [workerId,ant] of activeAnts){
  const phase=getAntTripFrame(clockTime-ant.startTime,ant.delay,ant.outbound,ant.returning,ant.phaseFrame);
  if(phase.waiting)continue;
  if(phase.picked&&!ant.picked){
   ant.picked=true;
   if(applyAntMove(state,ant.move.slot,ant.move.target)){
    ant.onPickup();
    const pickupPoint=cellCenter(ant.move.target.x,ant.move.target.y);
    pickupEffects.push({x:pickupPoint.x,y:pickupPoint.y,color:ant.move.color,startedAt:clockTime,seed:workerId*.618});
   }
   renderBoardAfterPickup(ant.move.target);
   $("message").textContent="Муравьишки собирают кубики по извилистым тропинкам";
   kickColony();
  }
  if(phase.finished){
   activeAnts.delete(workerId);
   ant.resolve();
   continue;
  }
  const trail=phase.returningNow?ant.returnTrail:ant.outboundTrail;
  const pose=getTrailPose(trail,phase.progress,ant.pose);
  drawAnt(antCtx,pose,ant.move.color,phase.returningNow,workerId,pose.angle,clockTime);
 }
 drawPickupEffects(clockTime);
 if(activeAnts.size||pickupEffects.length)antFrame=requestAnimationFrame(renderAntFrame);
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
  activeAnts.set(index,{move,onPickup,resolve,startTime:animationClock.now(),delay,outbound,returning,outboundTrail,returnTrail,phaseFrame:{},pose:{x:0,y:0,angle:0}});
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
 ctx.fillStyle="#f8e8c6";ctx.strokeStyle="#9a794b";ctx.lineWidth=.75;ctx.beginPath();ctx.arc(0,5.2,2.2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#fff8df";ctx.beginPath();ctx.arc(0,5.2,.8,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#f6e4bd";for(const [x,y] of [[-16,-5],[16,-5],[-16,6],[16,6]]){ctx.beginPath();ctx.roundRect(x-1.1,y-1.6,2.2,3.2,.6);ctx.fill();}ctx.restore();
}
function drawBoxSparkles(ctx,point,color,progress){
 ctx.save();ctx.fillStyle="#fff8d9";ctx.shadowColor=COLORS[color].hex;ctx.shadowBlur=7;
 for(let i=0;i<3;i++){
  const phase=progress* Math.PI*5+i*Math.PI*2/3,reach=17+Math.sin(phase*1.4)*4;
  const x=point.x+Math.cos(phase)*reach,y=point.y+Math.sin(phase)*reach*.58;
  const alpha=.25+.55*(.5+.5*Math.sin(phase*1.7));ctx.globalAlpha=alpha;
  const size=1.1+(i%2)*.7;ctx.beginPath();ctx.moveTo(x,y-size*2);ctx.lineTo(x+size*.6,y);ctx.lineTo(x,y+size*2);ctx.lineTo(x-size*.6,y);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}
async function animateBoxLoading(source,slot,color){
 const shellRect=shell.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1);
 const flightLayer=document.createElement("canvas");
 flightLayer.className="flight-layer";flightLayer.width=Math.max(1,Math.round(shellRect.width*dpr));flightLayer.height=Math.max(1,Math.round(shellRect.height*dpr));
 flightLayer.style.width=shellRect.width+"px";flightLayer.style.height=shellRect.height+"px";shell.append(flightLayer);
 const ctx=flightLayer.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
 const control=curveControl(source,slot,Math.min(46,Math.max(24,Math.abs(slot.y-source.y)*.16)));
 const duration=1120,startTime=animationClock.now();let lastFrame=0;
 const ease=t=>t*t*(3-2*t);
 return new Promise(resolve=>{const frame=timestamp=>{
  if(timestamp-lastFrame<1000/30){requestAnimationFrame(frame);return;}lastFrame=timestamp;
  const clockTime=animationClock.fromFrame(timestamp),t=Math.min(1,(clockTime-startTime)/duration),progress=ease(t),point=quadPoint(source,control,slot,progress);
  ctx.clearRect(0,0,shellRect.width,shellRect.height);
  const tilt=(1-progress)*-.055+Math.sin(progress*Math.PI)*.012,lift=Math.sin(progress*Math.PI)*5,scale=1+Math.sin(progress*Math.PI)*.035;
  const animatedPoint={x:point.x,y:point.y-lift};
  drawTransportBox(ctx,animatedPoint,color,scale,tilt);drawBoxSparkles(ctx,animatedPoint,color,t);
  if(t>=1){ctx.clearRect(0,0,shellRect.width,shellRect.height);flightLayer.remove();resolve();return;}
  requestAnimationFrame(frame);
 };requestAnimationFrame(frame);});
}
async function animateBoxDepartures(slotIndices,simultaneous=false){
 const shellRect=shell.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1);
 const layer=document.createElement("canvas");layer.className="flight-layer";
 layer.width=Math.max(1,Math.round(shellRect.width*dpr));layer.height=Math.max(1,Math.round(shellRect.height*dpr));
 layer.style.width=shellRect.width+"px";layer.style.height=shellRect.height+"px";shell.append(layer);
 const ctx=layer.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
 const starts=slotIndices.map(slot=>({slot,start:slotCenter(slot),color:state.slots[slot]?.color||"yellow"}));
 const belt=pointFor(conveyorEl),startTime=animationClock.now(),duration=1900;let lastFrame=0;const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 return new Promise(resolve=>{
  const frame=timestamp=>{
   if(timestamp-lastFrame<1000/30){requestAnimationFrame(frame);return;}lastFrame=timestamp;
   const elapsed=animationClock.fromFrame(timestamp)-startTime;ctx.clearRect(0,0,shellRect.width,shellRect.height);
   let finished=0;
   starts.forEach((item,index)=>{
    const delay=simultaneous?0:index*170,t=Math.max(0,Math.min(1,(elapsed-delay)/duration));
    if(elapsed<delay){finished++;return;}if(t>=1){finished++;return;}
    const lift=quadPoint(item.start,{x:item.start.x-24,y:(item.start.y+belt.y)/2},{x:item.start.x,y:belt.y},ease(Math.min(1,t*2.1)));
    const progress=ease(Math.max(0,(t-.38)/.62));
    const travelX=lift.x+(shellRect.width+35-lift.x)*progress,travelY=lift.y+(belt.y-lift.y)*progress,rock=Math.sin(progress*Math.PI*5+index*.7)*.018*(1-progress);drawTransportBox(ctx,{x:travelX,y:travelY},item.color,1+Math.sin(progress*Math.PI)*.035,rock);
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
   colony=collectCube(colony);updateEconomy();
   reservedTargets.delete(key);
  });
 }catch(error){console.error("Ant worker interrupted",slot,error);}
 finally{
  reservedTargets.delete(key);workerPromises.delete(workerId);
  const completedBox=state.slots[slot];
  if(!resetting&&completedBox?.status==="departing"){
   if(completedBox.pairId){
    const partnerSlot=state.slots.findIndex((other,index)=>index!==slot&&other?.pairId===completedBox.pairId);
    const pairReady=partnerSlot>=0&&state.slots[partnerSlot]?.status==="departing"&&canDepartSlot(workerPromises,slot)&&canDepartSlot(workerPromises,partnerSlot);
    if(pairReady){
     // Both crates stay in their cells until both ant teams return, then depart as one unit.
     const departureAnimation=animateBoxDepartures([slot,partnerSlot],true);
     completeBoxDeparture(state,slot);
     resolverRunning=workerPromises.size>0;
     state.activeSlots=[...new Set([...workerPromises.values()].map(worker=>worker.slot))];
     renderSlots();renderChoices();renderConveyor();
     await departureAnimation;
    }
   }else if(canDepartSlot(workerPromises,slot)){
    const departureAnimation=animateBoxDepartures([slot]);
    completeBoxDeparture(state,slot);
    resolverRunning=workerPromises.size>0;
    state.activeSlots=[...new Set([...workerPromises.values()].map(worker=>worker.slot))];
    renderSlots();renderChoices();renderConveyor();
    await departureAnimation;
   }
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
 if(state.remaining===0){if(!state.won){markLevelComplete(state.levelId);colony=completeMeadow(colony);updateEconomy();}state.won=true;state.message="Победа! Портрет собран ✨";}
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
 const selectedIndex=state.tray[0][column],incoming=getIncoming(state.levelId),box=incoming[selectedIndex];
 if(selectedIndex===null||selectedIndex===undefined||!box||isLockedBox(state,selectedIndex))return;
 const placements=[{index:selectedIndex,column,crate:box}];
 if(box.special==="linked"){
  const partnerIndex=getLinkedPartner(state.levelId,selectedIndex),partnerColumn=state.tray[0].findIndex(index=>index===partnerIndex);
  if(partnerColumn<0||partnerColumn===column)return;
  placements.push({index:partnerIndex,column:partnerColumn,crate:incoming[partnerIndex]});
 }
 const freeSlots=state.slots.map((slot,index)=>slot===null?index:-1).filter(index=>index>=0).slice(0,placements.length);
 if(freeSlots.length!==placements.length)return;
 const shellRect=shell.getBoundingClientRect();
 const flights=placements.map((placement,index)=>{
  const node=choicesEl.querySelector('[data-box-index="'+placement.index+'"]');if(!node)return null;
  const rect=node.getBoundingClientRect();
  return {source:{x:rect.left+rect.width/2-shellRect.left,y:rect.top+rect.height/2-shellRect.top},slot:freeSlots[index],color:placement.crate.color};
 });
 if(flights.some(flight=>!flight)||!chooseTopColumn(state,column))return;
 for(const flight of flights)loadingSlots.add(flight.slot);
 state.message=placements.length===2?"Связанная пара направляется вместе в два стартовых отсека":"Бокс направляется прямо в стартовый отсек "+(freeSlots[0]+1);
 render();kickColony();
 try{await Promise.all(flights.map(flight=>animateBoxLoading(flight.source,slotCenter(flight.slot),flight.color)));}
 finally{
  for(const flight of flights)loadingSlots.delete(flight.slot);renderSlots();
  if(resetting||resetAfterMenu)maybeFinalizeMenuExit();else{kickColony();settleColony();}
 }
}
function updateMainMenu(){
 const primary=$("start-game"),fresh=$("new-game"),progress=$("menu-progress"),level=getLevel(state.levelId);
 const completed=completedLevels(),completedCount=LEVELS.filter(item=>completed.has(item.id)).length;
 const unlockedCount=LEVELS.filter(item=>isLevelUnlocked(item)).length,total=LEVELS.length;
 const percent=total?Math.round(completedCount/total*100):0;
 $("menu-level-name").textContent=level.name;$("menu-level-number").textContent=`ПОЛЯНКА ${String(level.number).padStart(2,"0")}`;$("menu-level-emoji").textContent=level.emoji;
 $("menu-progress-count").textContent=`${completedCount} / ${total}`;
 $("menu-progress-fill").style.width=percent+"%";
 $("menu-progress-bar").setAttribute("aria-valuemax",String(total));
 $("menu-progress-bar").setAttribute("aria-valuenow",String(completedCount));
 $("menu-progress-hint").textContent=completedCount===total?"Вся кампания пройдена":`Открыто полянок: ${unlockedCount}`;
 const currentButton=$("menu-current-level");
 currentButton.disabled=resetAfterMenu||!isLevelUnlocked(level);
 currentButton.setAttribute("aria-label",`Играть: полянка ${level.number}, ${level.name}`);
 const list=$("campaign-levels");
 if(list){list.replaceChildren();for(const item of LEVELS){
  const unlocked=isLevelUnlocked(item),done=completed.has(item.id),button=document.createElement("button");button.type="button";
  button.className="campaign-level"+(item.id===state.levelId?" current":"")+(unlocked?"":" locked");button.disabled=!unlocked;
  const icon=document.createElement("span");icon.className="campaign-emoji";icon.textContent=unlocked?"📦":"🔒";
  const copy=document.createElement("span");copy.className="campaign-copy";
  const number=document.createElement("small");number.textContent=`${item.chapter} · ${String(item.number).padStart(2,"0")}`;
  const name=document.createElement("strong");name.textContent=unlocked?(done?"Пройдена":"Открыта"):"Ещё не открыта";copy.append(number,name);
  const status=document.createElement("span");status.className="campaign-state";status.textContent=done?"✓":unlocked?"›":"🔒";
  button.append(icon,copy,status);button.addEventListener("click",()=>{if(unlocked){closeMap();void startFreshGame(item.id);}});list.append(button);
 }}
 primary.textContent=gameStarted?"Вернуться на полянку":"Начать охоту";primary.disabled=resetAfterMenu;
 primary.querySelector("span")?.remove();const arrow=document.createElement("span");arrow.setAttribute("aria-hidden","true");arrow.textContent="→";primary.append(arrow);
 fresh.hidden=true;
 progress.textContent=completed.has(level.id)?"Пройдена · можно повторить":isLevelUnlocked(level)?"Открыта · можно отправляться":"Полянка пока закрыта";
}
function showMainMenu(){
 shell.classList.add("menu-open");
 if(gameStarted){resetAfterMenu=true;maybeFinalizeMenuExit();}
 updateMainMenu();
}
function maybeFinalizeMenuExit(){
 if(!resetAfterMenu||workerPromises.size||loadingSlots.size||resetting)return;
 resetting=true;cancelAnimationFrame(antFrame);antFrame=0;activeAnts.clear();pickupEffects.length=0;reservedTargets.clear();
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
 $("save-status").textContent="Партия не сохраняется · прогресс колонии сохраняется";
 updateEconomy();
}
$("menu-toggle").addEventListener("click",showMainMenu);
$("start-game").addEventListener("click",startGame);
 $("menu-current-level").addEventListener("click",startGame);
$("new-game").addEventListener("click",()=>startFreshGame(state.levelId));
$("result-retry").addEventListener("click",()=>startFreshGame(state.levelId));
$("result-next").addEventListener("click",()=>{const index=LEVELS.findIndex(level=>level.id===state.levelId),next=LEVELS[index+1];if(next&&isLevelUnlocked(next))void startFreshGame(next.id);});
$("result-menu").addEventListener("click",showMainMenu);
$("nest-open").addEventListener("click",openNest);
$("map-open").addEventListener("click",openMap);
$("map-close").addEventListener("click",closeMap);
$("map-overlay").addEventListener("click",event=>{if(event.target===$("map-overlay"))closeMap();});
$("nest-close").addEventListener("click",closeNest);
$("nest-overlay").addEventListener("click",event=>{if(event.target===$("nest-overlay"))closeNest();});
$("how-to-play").addEventListener("click",()=>{
 const button=$("how-to-play");
 const panel=$("how-panel");
 panel.hidden=!panel.hidden;
 button.setAttribute("aria-expanded",String(!panel.hidden));
 button.textContent=panel.hidden?"Как играть?":"Свернуть правила";
});
window.addEventListener("resize",()=>{resizeAntLayer();renderBoard();});
boot();
