import {COLORS,SIZE,GRID_SIZE,BLOCK_SIZE,SLOT_COUNT,TRAY_SIZE,LEVELS,getLevel,getIncoming,createGame,setArtworkBoard,canChoose,chooseTopColumn,canLaunchBox,isLockedBox,getLinkedPartner,findAntWave,applyAntPickup,completeBoxDeparture,isDefeat,isGameComplete,getExposedTargets,getExposedPixels,countQueuedBySlot,countDispatchingWorkers,countSlotWorkers} from "./game.js";
import {createArtworkSvg} from "./artwork-renderer.js";
import {getAntTripFrame,getAntLaunchDelay,getAntQueueDelay,createPausableClock,getTrailPose,getAntTravelDurations,getAntGaitFrame} from "./ant-animation.js";
import {isCampaignLevelUnlocked,getNextCampaignLevel} from "./campaign.js";
import {BUILDINGS,createEconomy,normalizeEconomy,collectCube,completeMeadow,purchaseBuilding,buildingCost} from "./economy.js";
const $=id=>document.getElementById(id);
const shell=$("app-shell"),boardEl=$("board"),slotsEl=$("slots"),choicesEl=$("choices"),antLayer=$("ant-layer"),nestEntrance=$("nest-entrance");
const boardCtx=boardEl.getContext("2d"),antCtx=antLayer.getContext("2d");
let state=createGame(),resolverRunning=false,resetting=false,resetAfterMenu=false,antFrame=0,antCanvasWidth=0,antCanvasHeight=0,gameStarted=false,totalBlocks=state.remaining+(state.obstacles||[]).reduce((sum,item)=>sum+item.hp,0);
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
 const scene=$("nest-scene");
 if(scene){
  const garden=colony.buildings.garden,granary=colony.buildings.granary,nursery=colony.buildings.nursery;
  scene.dataset.gardenLevel=String(garden);scene.dataset.granaryLevel=String(granary);
  scene.dataset.nurseryLevel=String(nursery);scene.dataset.colonyStage=String(Math.min(4,Math.floor(colony.lifetime/150)));
  scene.setAttribute("aria-label",`Подземный дом колонии. Сад нектара: уровень ${garden} из 3. Хранилище: уровень ${granary} из 3. Питомник: уровень ${nursery} из 3.`);
 }
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
 if(upgrades)upgrades.textContent=String(colony.buildings.garden+colony.buildings.granary+colony.buildings.nursery)+" / 9";
 const list=$("nest-buildings");if(!list)return;list.replaceChildren();
 const group=document.createElement("div");group.className="nest-building-group";
 const title=document.createElement("p");title.className="nest-group-label";title.textContent="Развитие колонии";group.append(title);
 for(const building of BUILDINGS){
  const level=colony.buildings[building.id],cost=buildingCost(building,level),card=document.createElement("article");
  card.className="nest-building";
  const icon=document.createElement("span");icon.className="nest-building-icon";icon.textContent=building.icon;
  const copy=document.createElement("div");copy.className="nest-building-copy";
  const name=document.createElement("strong");name.textContent=building.name;
  const desc=document.createElement("small");desc.textContent=building.description;
  const rank=document.createElement("span");rank.textContent=level>=3?"Максимум · 3/3":`Уровень ${level}/3`;copy.append(name,desc,rank);
  const pips=document.createElement("span");pips.className="nest-level-pips";pips.setAttribute("aria-label",`Уровень ${level} из 3`);
  for(let step=0;step<3;step++){const pip=document.createElement("i");if(step<level)pip.classList.add("filled");pips.append(pip);}
  copy.append(pips);
  const buy=document.createElement("button");buy.type="button";buy.className="nest-buy";buy.disabled=level>=3||colony.nectar<cost;
  buy.textContent=level>=3?"Готово":`🌼 ${cost}`;
  buy.setAttribute("aria-label",level>=3?`${building.name}: максимальный уровень`:`Улучшить ${building.name} за ${cost} нектара`);
  buy.addEventListener("click",()=>{const result=purchaseBuilding(colony,building.id);if(result.ok){colony=result.economy;updateEconomy();}else renderNest();});
  card.append(icon,copy,buy);group.append(card);
 }
 list.append(group);
}
function openNest(){renderNest();$("nest-overlay").hidden=false;}
function closeNest(){$("nest-overlay").hidden=true;}
function openMap(){renderMap();$("map-overlay").hidden=false;const nextStop=$("campaign-levels").querySelector(".next-stop");if(nextStop)requestAnimationFrame(()=>nextStop.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));}
function renderMap(){
 const done=completedLevels(),summary=$("map-summary"),list=$("campaign-levels");
 const finished=LEVELS.filter(level=>done.has(level.id)).length;
 const nextPlayable=LEVELS.find(level=>isLevelUnlocked(level)&&!done.has(level.id))||null;
 summary.replaceChildren();
 const stat=document.createElement("div");stat.className="map-summary-main";
 const count=document.createElement("strong");count.textContent=`${finished} / ${LEVELS.length}`;
 const copy=document.createElement("span");copy.textContent="уровней пройдено";stat.append(count,copy);
 const track=document.createElement("div");track.className="map-summary-track";track.setAttribute("role","progressbar");track.setAttribute("aria-label","Прогресс кампании");track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(LEVELS.length));track.setAttribute("aria-valuenow",String(finished));track.setAttribute("aria-valuetext",`${finished} из ${LEVELS.length} уровней пройдено`);
 const fill=document.createElement("span");fill.style.width=(finished/LEVELS.length*100)+"%";track.append(fill);
 const next=document.createElement("small");next.className="map-summary-next";next.textContent=finished===LEVELS.length?"Все 500 уровней пройдены — можно возвращаться к любимым":nextPlayable?"Следующий шаг · "+nextPlayable.name:"Кампания открыта";
 const continueButton=document.createElement("button");continueButton.type="button";continueButton.className="map-continue";continueButton.textContent=nextPlayable?"Продолжить · уровень "+nextPlayable.number:"Все уровни пройдены";continueButton.disabled=!nextPlayable;
 continueButton.setAttribute("aria-label",nextPlayable?"Начать следующий уровень: "+nextPlayable.name:"Все уровни пройдены");
 if(nextPlayable)continueButton.addEventListener("click",()=>{closeMap();void startFreshGame(nextPlayable.id);});
 summary.append(stat,track,next,continueButton);
 list.replaceChildren();
 const intro=document.querySelector(".map-intro");if(intro)intro.hidden=true;
 for(const item of LEVELS){
  const unlocked=isLevelUnlocked(item),completed=done.has(item.id),isNext=nextPlayable?.id===item.id;
  const button=document.createElement("button");button.type="button";
  button.className="campaign-level trail-node"+(item.id===state.levelId?" current":"")+(completed?" completed":"")+(isNext?" next-stop":"")+(unlocked?"":" locked");
  button.disabled=!unlocked;button.dataset.levelId=String(item.id);button.dataset.levelNumber=String(item.number);
  button.dataset.levelState=completed?"completed":isNext?"next":unlocked?"available":"locked";
  if(isNext)button.setAttribute("aria-current","step");
  button.setAttribute("aria-label",`Уровень ${item.number}: ${item.name}. ${completed?"Пройден":unlocked?(isNext?"Следующий доступный":"Доступен"):"Закрыт"}`);
  const icon=document.createElement("span");icon.className="campaign-emoji";icon.textContent=completed?"✓":unlocked?item.emoji:"🔒";
  const number=document.createElement("span");number.className="trail-number";number.textContent=String(item.number).padStart(3,"0");
  const name=document.createElement("strong");name.className="trail-name";name.textContent=item.name;
  const status=document.createElement("span");status.className="campaign-state";status.textContent=completed?"✓":unlocked?isNext?"СТАРТ":"•":"🔒";
  button.append(icon,number,name,status);
  button.addEventListener("click",()=>{if(unlocked){closeMap();void startFreshGame(item.id);}});
  list.append(button);
 }
}
function closeMap(){$("map-overlay").hidden=true;}
function completedLevels(){try{return new Set(JSON.parse(localStorage.getItem(CAMPAIGN_KEY)||"[]"));}catch{return new Set();}}
function markLevelComplete(levelId){const done=completedLevels();done.add(levelId);try{localStorage.setItem(CAMPAIGN_KEY,JSON.stringify([...done]));}catch{}}
function isLevelUnlocked(level){return isCampaignLevelUnlocked(LEVELS,completedLevels(),level.id);}
function nextLevel(){return getNextCampaignLevel(LEVELS,state.levelId);}
const loadingSlots=new Set(),workerPromises=new Map(),reservedTargets=new Set(),slotNextLaunchAt=new Map(),activeAnts=new Map(),pickupEffects=[],deliveryEffects=[];
let workerSequence=0,lastAntFrameAt=0,lastExposedPixels=new Set();
const MAX_ACTIVE_ANTS=36,ANT_FRAME_INTERVAL=1000/60;
const colorRGB=Object.fromEntries(Object.entries(COLORS).map(([key,value])=>[key,value.hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16))]));
let boardEmptyGradient=null,boardArtworkKey="";
function rasterizeArtworkToBlocks(image){
 const canvas=document.createElement("canvas");canvas.width=450;canvas.height=450;
 const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.clearRect(0,0,450,450);ctx.drawImage(image,0,0,450,450);
 const pixels=ctx.getImageData(0,0,450,450).data;
 const toLab=(r,g,b)=>{
  const linear=value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;};
  r=linear(r);g=linear(g);b=linear(b);
  const x=(r*.4124564+g*.3575761+b*.1804375)/.95047;
  const y=(r*.2126729+g*.7151522+b*.0721750);
  const z=(r*.0193339+g*.1191920+b*.9503041)/1.08883;
  const f=value=>value>.008856?Math.cbrt(value):7.787*value+16/116;
  const fx=f(x),fy=f(y),fz=f(z);
  return{l:116*fy-16,a:500*(fx-fy),b:200*(fy-fz)};
 };
 const palette=Object.entries(COLORS).filter(([key])=>key!=="black"&&key!=="gray").map(([key,value])=>{
  const hex=value.hex,r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return{key,...toLab(r,g,b)};
 });
 const board=Array.from({length:SIZE},()=>Array(SIZE).fill(""));
 for(let gy=0;gy<SIZE;gy++)for(let gx=0;gx<SIZE;gx++){
  let r=0,g=0,b=0,alpha=0,weight=0;
  for(let py=gy*10;py<(gy+1)*10;py++)for(let px=gx*10;px<(gx+1)*10;px++){
   const index=(py*450+px)*4,a=pixels[index+3]/255;
   if(a<.08)continue;
   r+=pixels[index]*a;g+=pixels[index+1]*a;b+=pixels[index+2]*a;alpha+=a;weight++;
  }
  if(!weight||alpha/100<.22)continue;
  r/=alpha;g/=alpha;b/=alpha;
  const sample=toLab(r,g,b);
  let nearest=palette[0],best=Infinity;
  for(const color of palette){
   const dl=sample.l-color.l,da=sample.a-color.a,db=sample.b-color.b;
   const distance=dl*dl+da*da+db*db;
   if(distance<best){best=distance;nearest=color;}
  }
  board[gy][gx]=nearest.key;
 }
 return board;
}
function ensureBoardArtwork(){
 const key=state.levelId;
 if(boardArtworkKey===key)return;
 boardArtworkKey=key;
 const image=new Image();
 image.onload=()=>{
  if(boardArtworkKey!==key||state.levelId!==key)return;
  const untouched=state.slots.every(slot=>!slot)&&state.nextContainer===TRAY_SIZE*TRAY_SIZE;
  if(!untouched)return;
  const board=rasterizeArtworkToBlocks(image);
  setArtworkBoard(key,board);
  // The SVG is never shown as an overlay: its sampled pigments now are the
  // actual collectible cells, so ants remove the visible image tile by tile.
  state=createGame(key);
  totalBlocks=state.remaining+(state.obstacles||[]).reduce((sum,item)=>sum+item.hp,0);
  lastExposedPixels=new Set();
  render();
 };
 image.onerror=()=>{if(boardArtworkKey===key)boardArtworkKey="";};
 image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(createArtworkSvg(Number(getLevel(key).number)));
}
function tasksRemaining(){
 return state.remaining+(state.obstacles||[]).reduce((sum,item)=>sum+item.hp,0);
}
function updateBoardProgress(){
 const obstacleCount=(state.obstacles||[]).length;
 $("board-status").textContent=obstacleCount
  ? `Осталось: ${state.remaining.toLocaleString("ru-RU")} блоков · преград: ${obstacleCount}`
  : `Осталось: ${state.remaining.toLocaleString("ru-RU")}`;
 const collected=totalBlocks-tasksRemaining(),percent=Math.round(collected/Math.max(1,totalBlocks)*100);
 const progress=$("progress-fill"),track=progress?.parentElement;
 if(progress)progress.style.width=percent+"%";
 if(track)track.setAttribute("aria-valuenow",String(percent));
}
function drawBoardGridCell(x,y,cell){
 const px=x*cell,py=y*cell;
 boardCtx.save();boardCtx.strokeStyle="#a6c3a044";boardCtx.lineWidth=.65;
 boardCtx.strokeRect(px+.35,py+.35,cell-.7,cell-.7);boardCtx.restore();
}
function drawBoardGroundCell(x,y,cell){
 const px=x*cell,py=y*cell,seed=(x*374761393+y*668265263)>>>0,span=Math.max(1,cell-4);
 const fx=px+2+(seed%997)/997*span,fy=py+2+((seed>>>8)%991)/991*span;
 boardCtx.save();boardCtx.globalAlpha=.12;boardCtx.fillStyle=(seed&1)?"#a9bd83":"#c2a777";
 boardCtx.beginPath();boardCtx.ellipse(fx,fy,.55+(seed%3)*.12,.34+((seed>>>4)%3)*.08,((seed>>>7)%9)*.19,0,Math.PI*2);boardCtx.fill();
 if((seed>>>4)%3===0){
  boardCtx.globalAlpha=.075;boardCtx.fillStyle="#d8c58e";
  boardCtx.beginPath();boardCtx.ellipse(px+cell*.7,py+cell*.3,.42,.28,-.55,0,Math.PI*2);boardCtx.fill();
 }
 if(seed%7===0){
  boardCtx.globalAlpha=.065;boardCtx.strokeStyle="#b9c58b";boardCtx.lineWidth=.45;
  boardCtx.beginPath();boardCtx.moveTo(px+cell*.28,py+cell*.72);boardCtx.lineTo(px+cell*.42,py+cell*.63);boardCtx.stroke();
 }
 boardCtx.restore();
}
function obstacleAt(x,y){
 return (state.obstacles||[]).find(item=>item.x===x&&item.y===y)||null;
}

function drawBoardTile(x,y,exposed,cell){
 const color=state.board[y][x];if(!color||obstacleAt(x,y))return;
 const px=x*cell,py=y*cell,rgb=COLORS[color].hex;
 // The picture is the board: one clean, square pigment tile per collectible.
 // Tiny spacing and restrained light give a tactile block surface without
 // burying the pixel-art shapes under glossy effects or random decoration.
 const gap=Math.max(.22,cell*.035),left=px+gap,top=py+gap,size=cell-gap*2;
 const radius=Math.max(.35,cell*.075);
 boardCtx.save();
 boardCtx.shadowColor="#26352b30";
 boardCtx.shadowBlur=Math.max(.25,cell*.035);
 boardCtx.shadowOffsetY=Math.max(.25,cell*.045);
 boardCtx.beginPath();boardCtx.roundRect(left,top,size,size,radius);
 const face=boardCtx.createLinearGradient(left,top,left+size*.72,top+size);
 face.addColorStop(0,lightenHex(rgb,.13));
 face.addColorStop(.38,rgb);
 face.addColorStop(1,darkenHex(rgb,.12));
 boardCtx.fillStyle=face;boardCtx.fill();
 boardCtx.shadowColor="transparent";boardCtx.shadowBlur=0;boardCtx.shadowOffsetY=0;
 boardCtx.lineWidth=Math.max(.18,cell*.018);
 boardCtx.strokeStyle=darkenHex(rgb,.2)+"55";
 boardCtx.stroke();
 // A single soft top edge catches the light; no forced black perimeter.
 boardCtx.beginPath();boardCtx.moveTo(left+radius,top+cell*.11);boardCtx.lineTo(left+size-radius,top+cell*.11);
 boardCtx.strokeStyle="#ffffff35";boardCtx.lineWidth=Math.max(.25,cell*.035);boardCtx.stroke();
 if(exposed){
  boardCtx.beginPath();boardCtx.roundRect(left+.45,top+.45,size-.9,size-.9,Math.max(.25,radius*.7));
  boardCtx.strokeStyle="#fff0b5";boardCtx.lineWidth=Math.max(.55,cell*.055);boardCtx.stroke();
 }
 boardCtx.restore();
}
function lightenHex(hex,amount){
 const n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
 return "#"+[r,g,b].map(v=>Math.round(v+(255-v)*amount).toString(16).padStart(2,"0")).join("");
}
function darkenHex(hex,amount){
 const n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
 return "#"+[r,g,b].map(v=>Math.round(v*(1-amount)).toString(16).padStart(2,"0")).join("");
}

function drawBoardObstacle(obstacle,exposed,cell){
 const px=obstacle.x*cell,py=obstacle.y*cell,remaining=obstacle.hp;
 boardCtx.save();
 if(obstacle.role==="builder"&&obstacle.kind==="stone"){
  boardCtx.fillStyle="#78847a";boardCtx.strokeStyle="#c1c9b6";boardCtx.lineWidth=.8;
  boardCtx.beginPath();boardCtx.moveTo(px+1,py+cell*.28);boardCtx.lineTo(px+cell*.28,py+1);boardCtx.lineTo(px+cell*.78,py+1);boardCtx.lineTo(px+cell-1,py+cell*.42);boardCtx.lineTo(px+cell*.78,py+cell-1);boardCtx.lineTo(px+cell*.18,py+cell-1);boardCtx.closePath();boardCtx.fill();boardCtx.stroke();
  boardCtx.strokeStyle="#46564b";boardCtx.lineWidth=.8;boardCtx.beginPath();boardCtx.moveTo(px+cell*.35,py+cell*.18);boardCtx.lineTo(px+cell*.5,py+cell*.48);boardCtx.lineTo(px+cell*.36,py+cell*.77);boardCtx.stroke();
 }else if(obstacle.role==="builder"){
  boardCtx.fillStyle="#8b6240";boardCtx.strokeStyle="#d7b47a";boardCtx.lineWidth=.8;
  boardCtx.beginPath();boardCtx.roundRect(px+1,py+1,cell-2,cell-2,2);boardCtx.fill();boardCtx.stroke();
  boardCtx.strokeStyle="#5b3d2a";boardCtx.lineWidth=1;
  boardCtx.beginPath();boardCtx.moveTo(px+2,py+cell*.34);boardCtx.lineTo(px+cell-2,py+cell*.34);boardCtx.moveTo(px+2,py+cell*.68);boardCtx.lineTo(px+cell-2,py+cell*.68);boardCtx.stroke();
 }else if(obstacle.kind==="spider"){
  boardCtx.strokeStyle="#202b28";boardCtx.lineWidth=1;
  for(const side of [-1,1])for(let leg=0;leg<4;leg++){
   const y=py+cell*(.25+leg*.17);boardCtx.beginPath();boardCtx.moveTo(px+cell/2,py+cell*.5);boardCtx.lineTo(px+cell*(.5+side*.28),y);boardCtx.lineTo(px+cell*(.5+side*.43),y+side*.8);boardCtx.stroke();
  }
  boardCtx.fillStyle="#38423c";boardCtx.beginPath();boardCtx.arc(px+cell*.5,py+cell*.5,cell*.24,0,Math.PI*2);boardCtx.fill();
  boardCtx.fillStyle="#d6bd78";boardCtx.beginPath();boardCtx.arc(px+cell*.42,py+cell*.44,.8,0,Math.PI*2);boardCtx.arc(px+cell*.58,py+cell*.44,.8,0,Math.PI*2);boardCtx.fill();
 }else if(obstacle.kind==="wasp"){
  boardCtx.fillStyle="#d9b64d";boardCtx.strokeStyle="#473d27";boardCtx.lineWidth=.8;
  boardCtx.beginPath();boardCtx.ellipse(px+cell*.5,py+cell*.53,cell*.26,cell*.4,0,0,Math.PI*2);boardCtx.fill();boardCtx.stroke();
  boardCtx.strokeStyle="#3d3729";boardCtx.lineWidth=1.1;boardCtx.beginPath();boardCtx.moveTo(px+cell*.31,py+cell*.4);boardCtx.lineTo(px+cell*.69,py+cell*.4);boardCtx.moveTo(px+cell*.29,py+cell*.61);boardCtx.lineTo(px+cell*.71,py+cell*.61);boardCtx.stroke();
  boardCtx.fillStyle="#d7e3d3aa";boardCtx.beginPath();boardCtx.ellipse(px+cell*.25,py+cell*.31,cell*.2,cell*.11,-.5,0,Math.PI*2);boardCtx.ellipse(px+cell*.75,py+cell*.31,cell*.2,cell*.11,.5,0,Math.PI*2);boardCtx.fill();
 }else{
  boardCtx.fillStyle="#283b2d";boardCtx.strokeStyle="#d8a65c";boardCtx.lineWidth=.8;
  boardCtx.beginPath();boardCtx.ellipse(px+cell/2,py+cell/2,cell*.39,cell*.43,-.15,0,Math.PI*2);boardCtx.fill();boardCtx.stroke();
  boardCtx.fillStyle="#bd5949";boardCtx.beginPath();boardCtx.ellipse(px+cell/2,py+cell*.47,cell*.27,cell*.31,-.15,0,Math.PI*2);boardCtx.fill();
  boardCtx.strokeStyle="#1a2a20";boardCtx.lineWidth=.65;boardCtx.beginPath();boardCtx.moveTo(px+cell/2,py+cell*.2);boardCtx.lineTo(px+cell/2,py+cell*.76);boardCtx.stroke();
  boardCtx.fillStyle="#f6e2a7";boardCtx.beginPath();boardCtx.arc(px+cell*.38,py+cell*.38,.8,0,Math.PI*2);boardCtx.arc(px+cell*.62,py+cell*.38,.8,0,Math.PI*2);boardCtx.fill();
 }
 if(remaining<obstacle.maxHp){
  boardCtx.strokeStyle="#f4e5c4";boardCtx.lineWidth=.8;boardCtx.beginPath();boardCtx.moveTo(px+cell*.2,py+cell*.18);boardCtx.lineTo(px+cell*.45,py+cell*.45);boardCtx.lineTo(px+cell*.34,py+cell*.7);boardCtx.stroke();
 }
 if(exposed){boardCtx.strokeStyle="#f0c66f";boardCtx.lineWidth=1;boardCtx.strokeRect(px+.8,py+.8,cell-1.6,cell-1.6);}
 boardCtx.restore();
}
function drawBoardScenery(){
 const n=getLevel(state.levelId).number,w=boardEl.width,h=boardEl.height;
 const point=(u,v)=>({x:u*w,y:v*h});
 boardCtx.save();
 if(n===1){
  // A quiet pond behind the frog: broad water rings and lily pads are scenery,
  // not collectible cells, so they never change the ant puzzle or its counts.
  boardCtx.strokeStyle="#e4f4f0";boardCtx.lineWidth=Math.max(1,w*.002);boardCtx.globalAlpha=.16;
  for(const [u,v,rx,ry] of [[.17,.22,.12,.035],[.82,.36,.1,.028],[.72,.78,.14,.04],[.22,.82,.08,.025]]){
   const p=point(u,v);boardCtx.beginPath();boardCtx.ellipse(p.x,p.y,w*rx,h*ry,-.12,0,Math.PI*2);boardCtx.stroke();
  }
  for(const [u,v,scale] of [[.13,.72,1],[.86,.18,.82],[.83,.83,.7]]){
   const p=point(u,v);boardCtx.save();boardCtx.translate(p.x,p.y);boardCtx.rotate(-.22);
   boardCtx.globalAlpha=.2;boardCtx.fillStyle="#456f55";boardCtx.strokeStyle="#a5c18c";boardCtx.lineWidth=1.2;
   boardCtx.beginPath();boardCtx.ellipse(0,0,w*.055*scale,h*.027*scale,0,0,Math.PI*2);boardCtx.fill();boardCtx.stroke();
   boardCtx.globalAlpha=.18;boardCtx.strokeStyle="#d5e8bd";boardCtx.beginPath();boardCtx.moveTo(-w*.04*scale,0);boardCtx.lineTo(w*.035*scale,0);boardCtx.stroke();
   boardCtx.restore();
  }
  // Reeds frame the pond without competing with the frog's face.
  boardCtx.globalAlpha=.2;boardCtx.strokeStyle="#64865b";boardCtx.lineWidth=Math.max(1,w*.003);
  for(const [u,v,dir] of [[.035,.84,1],[.96,.72,-1],[.93,.91,-1]]){
   const p=point(u,v);boardCtx.beginPath();boardCtx.moveTo(p.x,p.y);boardCtx.quadraticCurveTo(p.x+dir*w*.015,p.y-h*.08,p.x+dir*w*.008,p.y-h*.13);boardCtx.stroke();
   boardCtx.beginPath();boardCtx.ellipse(p.x+dir*w*.009,p.y-h*.12,w*.012,h*.008,-.6,0,Math.PI*2);boardCtx.fillStyle="#789a67";boardCtx.fill();
  }
 }else{
  // A soft woodland floor gives each later portrait a sense of place.
  const flowers=n===2||n===3||n%6===0;
  boardCtx.globalAlpha=.16;boardCtx.strokeStyle="#78956b";boardCtx.lineWidth=Math.max(1,w*.0025);
  for(let i=0;i<14;i++){
   const u=((i*37+n*11)%97)/100+.015,v=((i*53+n*7)%89)/100+.04,p=point(u,v);
   boardCtx.beginPath();boardCtx.moveTo(p.x,p.y);boardCtx.quadraticCurveTo(p.x-w*.012,p.y-h*.018,p.x-w*.02,p.y-h*.035);boardCtx.stroke();
   boardCtx.beginPath();boardCtx.moveTo(p.x,p.y);boardCtx.quadraticCurveTo(p.x+w*.012,p.y-h*.02,p.x+w*.022,p.y-h*.03);boardCtx.stroke();
   if(flowers&&i%3===0){
    boardCtx.globalAlpha=.14;boardCtx.fillStyle=i%2?"#e9b5ce":"#f1d98b";
    boardCtx.beginPath();boardCtx.arc(p.x,p.y-h*.04,w*.006,0,Math.PI*2);boardCtx.fill();
    boardCtx.globalAlpha=.16;boardCtx.strokeStyle="#78956b";
   }
  }
  if(n===7||n%7===0){
   boardCtx.globalAlpha=.14;boardCtx.fillStyle="#f4d67e";
   for(const [u,v] of [[.2,.22],[.76,.3],[.62,.76],[.3,.84]]){const p=point(u,v);boardCtx.beginPath();boardCtx.arc(p.x,p.y,w*.012,0,Math.PI*2);boardCtx.fill();}
  }
 }
 boardCtx.restore();
}
function renderBoard(){
 ensureBoardArtwork();
 const width=boardEl.width,height=boardEl.height,cell=width/SIZE;
 boardCtx.clearRect(0,0,width,height);
 boardEmptyGradient=boardCtx.createLinearGradient(0,0,width,height);
 boardEmptyGradient.addColorStop(0,"#c6add4");boardEmptyGradient.addColorStop(.52,"#ad91c1");boardEmptyGradient.addColorStop(1,"#9478aa");
 boardCtx.fillStyle=boardEmptyGradient;boardCtx.fillRect(0,0,width,height);
 // Subtle woven diamond texture echoes the lavender playfield in the reference.
 boardCtx.save();boardCtx.strokeStyle="#f4e9ff18";boardCtx.lineWidth=.65;
 const weave=Math.max(8,cell*1.8);
 for(let p=-height;p<width+height;p+=weave){
  boardCtx.beginPath();boardCtx.moveTo(p,0);boardCtx.lineTo(p+height,height);boardCtx.stroke();
  boardCtx.beginPath();boardCtx.moveTo(p,0);boardCtx.lineTo(p-height,height);boardCtx.stroke();
 }
 boardCtx.restore();
 drawBoardScenery();
 const targets=getExposedTargets(state);
 lastExposedPixels=new Set(targets.filter(item=>item.kind==="pixel").map(point=>point.x+","+point.y));
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)drawBoardTile(x,y,lastExposedPixels.has(x+","+y),cell);
 const exposedObstacles=new Set(targets.filter(item=>item.kind==="obstacle").map(item=>item.x+","+item.y));
 for(const obstacle of state.obstacles||[])drawBoardObstacle(obstacle,exposedObstacles.has(obstacle.x+","+obstacle.y),cell);
 updateBoardProgress();
}
function renderBoardAfterPickup(target){
 if(target.kind==="obstacle"){renderBoard();return;}
 const cell=boardEl.width/SIZE,px=target.x*cell,py=target.y*cell;
 boardCtx.save();boardCtx.beginPath();boardCtx.rect(px-2,py-2,cell+4,cell+4);boardCtx.clip();
 boardCtx.fillStyle=boardEmptyGradient||"#20372c";boardCtx.fillRect(px-2,py-2,cell+4,cell+4);boardCtx.restore();
 boardCtx.save();boardCtx.beginPath();boardCtx.rect(px-2,py-2,cell+4,cell+4);boardCtx.clip();drawBoardScenery();boardCtx.restore();
 drawBoardGroundCell(target.x,target.y,cell);
 drawBoardGridCell(target.x,target.y,cell);
 const nextExposed=new Set(getExposedTargets(state).filter(item=>item.kind==="pixel").map(point=>point.x+","+point.y));
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
  const roleName=box?.role==="builder"?"строители":box?.role==="warrior"?"военные":null;
  slot.setAttribute("aria-label",box
   ? `Отсек ${index+1}: ${box.status==="departing"?"бокс отправляется":box.ants+" муравьёв, "+(roleName||("цвет "+box.color))}`
   : `Отсек ${index+1}: свободен`);
  slot.style.setProperty("--box-color",box?COLORS[box.color].hex:"#d8e5d2");
  slot.className="slot"+(box?" filled":"")+(box?.status==="departing"?" departing":"")+(box?.status==="waiting-linked"?" linked-waiting":"")+(box?.special==="linked"?" linked-member":"")+(loadingSlots.has(index)?" loading":"")+((state.activeSlots?.includes(index))?" active":"");
  if(box){
   const stripe=document.createElement("span");stripe.className="slot-color";stripe.style.background=COLORS[box.color].hex;
   if(box.role){const roleMark=document.createElement("span");roleMark.className="slot-role";roleMark.textContent=box.role==="builder"?"⚒":"⚔";slot.append(stripe,roleMark);}
   else slot.append(stripe);
   const count=document.createElement("strong");count.className="ant-count";count.textContent=box.status==="departing"?"…":box.ants.toLocaleString("ru-RU");slot.append(count);
  }else{const plus=document.createElement("span");plus.className="slot-plus";plus.textContent="＋";slot.append(plus);}
  slotsEl.append(slot);
 });
}
function renderConveyor(){}
function captureQueuePositions(){
 const positions=new Map();
 choicesEl.querySelectorAll("[data-queue-key]").forEach(element=>{
  const rect=element.getBoundingClientRect();
  positions.set(element.dataset.queueKey,{top:rect.top,left:rect.left,step:Number(element.dataset.queueStep||0)});
 });
 return positions;
}
function animateQueueReflow(previousPositions){
 if(!previousPositions.size||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 const moving=[];
 choicesEl.querySelectorAll("[data-queue-key]").forEach(element=>{
  const previous=previousPositions.get(element.dataset.queueKey);
  if(!previous)return;
  const rect=element.getBoundingClientRect(),dy=previous.top-rect.top,dx=previous.left-rect.left;
  if(Math.abs(dx)<1&&Math.abs(dy)<1)return;
  element.style.transition="none";
  element.style.transitionDelay="0ms";
  element.style.transform=`translate(${dx}px,${dy}px)`;
  moving.push({element,delay:Math.max(0,(previous.step-1)*55)});
 });
 if(!moving.length)return;
 choicesEl.getBoundingClientRect();
 requestAnimationFrame(()=>moving.forEach(({element,delay})=>{
  element.style.transition="transform 760ms cubic-bezier(.22,.72,.18,1)";
  element.style.transitionDelay=delay+"ms";
  element.style.transform="";
 }));
}
function renderChoices(){
 const previousPositions=captureQueuePositions();
 choicesEl.replaceChildren();
 for(let col=0;col<TRAY_SIZE;col++){
  const lane=document.createElement("div");lane.className="queue-lane";
  const index=state.tray[0][col],box=index===null||index===undefined?null:getIncoming(state.levelId)[index];
  const sealed=box&&isLockedBox(state,index),reveal=box&&state.lockedBoxOpen&&!state.lockedBoxRevealPlayed&&index===8;
  const button=document.createElement("button");button.type="button";button.className="choice-card"+(sealed?" sealed-box":box?" selectable":" empty-box")+(reveal?" sealed-reveal":"");
  if(reveal)state.lockedBoxRevealPlayed=true;
  if(index!==null&&index!==undefined){button.dataset.boxIndex=String(index);button.dataset.queueKey=`${col}:${index}`;}
  const frontierReady=box&&canLaunchBox(state,index);
  const linked=box?.special==="linked",partner=linked?getLinkedPartner(state.levelId,index):null;
  const waitingForPartner=linked&&state.pendingLinkedIndex!==index&&!state.tray[0].includes(partner),needsPairSlots=linked&&(state.pendingLinkedIndex===null||state.pendingLinkedIndex===undefined)&&state.slots.filter(slot=>slot===null).length<2;
  const blockedByPair=state.pendingLinkedIndex!==null&&state.pendingLinkedIndex!==undefined&&index!==state.pendingLinkedIndex;
  // A visible front-row box is always a legal strategic choice, even when
  // its color is buried. It occupies a slot and starts automatically later.
  button.disabled=!box||sealed||resetting||resetAfterMenu||state.won||state.lost||!canChoose(state)||blockedByPair||waitingForPartner||needsPairSlots;
  if(sealed){
   const crate=document.createElement("span");crate.className="choice-crate sealed-crate";crate.setAttribute("aria-hidden","true");
    for(let plank=0;plank<3;plank++){const board=document.createElement("i");board.className="sealed-plank";crate.append(board);}
    const wrap=document.createElement("b");wrap.className="sealed-wrap";crate.append(wrap);
    const lock=document.createElement("span");lock.className="sealed-lock";lock.textContent="●";crate.append(lock);
   const count=document.createElement("small");count.className="sealed-progress";count.textContent=`${(state.lockProgressColumns||[]).length}/2`;
   button.append(crate,count);button.title="Закрытый бокс откроется после размещения обычных боксов из двух других колонок";
   button.setAttribute("aria-label",`Закрытый бокс, прогресс открытия ${(state.lockProgressColumns||[]).length} из 2`);
  }else if(box){button.style.setProperty("--ant-color",COLORS[box.color].hex);if(!frontierReady)button.classList.add("waiting-box");
   if(linked){button.classList.add("linked-box");const chain=document.createElement("span");chain.className="linked-mark";chain.textContent="⛓";button.append(chain);button.title=blockedByPair?"Сначала выбери первый связанный бокс":waitingForPartner?"Связанный бокс появится в верхнем ряду позже":needsPairSlots?"Для пары нужны два свободных отсека":"Связанная пара: после этого бокса выбери второй";}
   const crate=document.createElement("span");crate.className="choice-crate"+(box.role?" specialist-crate":"");crate.setAttribute("aria-hidden","true");
   if(box.role){const mark=document.createElement("b");mark.textContent=box.role==="builder"?"⚒":"⚔";crate.append(mark);}
   else{const gem=document.createElement("i");gem.style.setProperty("--gem-color",COLORS[box.color].hex);crate.append(gem);}
   if(!frontierReady&&!linked)button.title="Можно поставить в стартовую зону заранее. Муравьи начнут сбор, когда этот цвет откроется на краю рисунка.";const colorName=document.createElement("span");colorName.className="box-color-name";colorName.textContent=box.role==="builder"?"Строители":box.role==="warrior"?"Военные":COLORS[box.color].name;
   const count=document.createElement("small");count.className="box-count";count.textContent=`${box.ants.toLocaleString("ru-RU")} 🐜`;
   button.append(crate,colorName,count);if(!frontierReady&&!linked)button.title="Бокс можно отправить сейчас. Муравьи начнут работу сразу, когда на открытом краю появится блок их цвета.";button.setAttribute("aria-label",`${linked?"Связанный бокс. ":""}${box.role?"Бокс: "+colorName.textContent+". ":"Выбрать бокс: "}${box.ants} муравьёв`);
  }else{button.textContent="Очередь закончилась";button.setAttribute("aria-label","В этой колонке больше нет боксов");}
  button.addEventListener("click",()=>onChoose(col));lane.append(button);
  const preview=document.createElement("div");preview.className="queue-preview";preview.setAttribute("aria-label","Следующие боксы в колонке");
  for(let row=1;row<TRAY_SIZE;row++){const nextIndex=state.tray[row][col],nextBox=nextIndex===null||nextIndex===undefined?null:getIncoming(state.levelId)[nextIndex];
   const peek=document.createElement("span");peek.className="queue-peek"+(nextBox?"":" empty");peek.dataset.queueStep=String(row);if(nextIndex!==null&&nextIndex!==undefined)peek.dataset.queueKey=`${col}:${nextIndex}`;
   const sealedPreview=nextBox&&isLockedBox(state,nextIndex),revealPreview=nextBox&&state.lockedBoxOpen&&!state.lockedBoxRevealPlayed&&nextIndex===8;
   if(revealPreview){peek.classList.add("sealed-reveal");state.lockedBoxRevealPlayed=true;}
   if(sealedPreview){
    peek.classList.add("sealed-peek");const lock=document.createElement("span");lock.className="peek-lock";lock.textContent="🔒";
    const progress=document.createElement("small");progress.className="peek-count";progress.textContent=`${(state.lockProgressColumns||[]).length}/2`;
    peek.append(lock,progress);peek.title="Закрытый бокс";peek.setAttribute("aria-label",`Закрытый бокс, прогресс ${(state.lockProgressColumns||[]).length} из 2`);
   }else if(nextBox){
    if(nextBox.special==="linked")peek.classList.add("linked-peek");
    const color=COLORS[nextBox.color],roleName=nextBox.role==="builder"?"Строители":nextBox.role==="warrior"?"Военные":null;peek.style.setProperty("--peek-color",color.hex);
    const miniCrate=document.createElement("i");miniCrate.className="peek-crate";miniCrate.setAttribute("aria-hidden","true");
    const meta=document.createElement("span");meta.className="peek-meta";
    const colorName=document.createElement("small");colorName.className="peek-color-name";colorName.textContent=roleName?roleName.slice(0,2).toUpperCase():color.short;
    const count=document.createElement("small");count.className="peek-count";count.textContent=String(nextBox.ants)+" 🐜";
    meta.append(colorName,count);peek.append(miniCrate,meta);
    peek.title=`Бокс в резерве: ${roleName||color.name}, ${nextBox.ants} муравьёв`;peek.setAttribute("aria-label",`Бокс в резервной очереди, цвет ${roleName||color.name}, ${nextBox.ants} муравьёв`);
   }else{
    const empty=document.createElement("span");empty.className="peek-empty-mark";empty.textContent="—";peek.append(empty);
    peek.title="Пустая позиция резервной очереди";peek.setAttribute("aria-label",peek.title);
   }
   preview.append(peek);
  }
  lane.append(preview);choicesEl.append(lane);
 }
 $("queue-count").textContent=`${Math.max(0,getIncoming(state.levelId).length-state.nextContainer)} ещё`;
 animateQueueReflow(previousPositions);
}
function render(){
 const level=getLevel(state.levelId);
 $("level-number").textContent=`ПОЛЯНКА № ${level.number}`;
 $("level-title").textContent=level.name;
 $("board").setAttribute("aria-label",`${level.name}: иллюстрация из цветных фрагментов на сетке 45 на 45`);
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
 const ctx=sprite.getContext("2d"),gaitPhase=gait*Math.PI/4;
 const body=COLORS[color].hex;
 ctx.translate(13,12);ctx.lineCap="round";ctx.lineJoin="round";
 // Six legs alternate in a slow tripod rhythm instead of moving in lockstep.
 ctx.strokeStyle="#24352c";ctx.lineWidth=1.05;
 for(const side of [-1,1])for(let leg=0;leg<3;leg++){
  const x=-1.2+leg*1.35,y=side*1.2;
  const groupPhase=(side===-1?0:Math.PI)+(leg===1?Math.PI:0);
  const swing=Math.sin(gaitPhase+groupPhase)*1.45;
  const lift=Math.max(0,Math.cos(gaitPhase+groupPhase))*.42;
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+(leg-1)*1.5+swing*.38,y+side*(2.3-lift));
  ctx.lineTo(x+(leg-1)*2.2+swing,y+side*(4.1-lift));ctx.stroke();
 }
 // Three clearly separated, softly highlighted body segments.
 ctx.fillStyle="#1b2b22";ctx.beginPath();ctx.ellipse(-3.1,.15,3.35,2.7,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(-3.1,-.25,2.62,2.02,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#ffffff55";ctx.lineWidth=.65;ctx.beginPath();ctx.arc(-3.45,-.35,1.8,Math.PI*1.08,Math.PI*1.82);ctx.stroke();
 ctx.strokeStyle="#17291f99";ctx.lineWidth=.55;ctx.beginPath();ctx.arc(-3.1,.15,2.9,-.9,.9);ctx.stroke();
 ctx.fillStyle="#1b2b22";ctx.beginPath();ctx.arc(.15,0,1.95,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=body;ctx.beginPath();ctx.arc(.15,-.2,1.38,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#ffffff55";ctx.beginPath();ctx.arc(-.1,-.8,.48,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#1b2b22";ctx.beginPath();ctx.arc(3.1,-.1,2.35,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=body;ctx.beginPath();ctx.arc(3.1,-.35,1.78,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#ffffff77";ctx.beginPath();ctx.ellipse(2.45,-1.15,.75,.38,-.35,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#26372d";ctx.lineWidth=.85;
 const feeler=Math.sin(gaitPhase)*.42;
 ctx.beginPath();ctx.moveTo(3.7,-1.6);ctx.quadraticCurveTo(4.2,-4.3+feeler,6.3,-4.1+feeler);ctx.moveTo(2.4,-1.8);ctx.quadraticCurveTo(1.8,-4.4-feeler,3.4,-5-feeler);ctx.stroke();
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(3.8,-.8,.72,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#24352c";ctx.beginPath();ctx.arc(4.02,-.8,.28,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#f3a29a";ctx.globalAlpha=.82;ctx.beginPath();ctx.arc(4.45,1.05,.62,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle="#ffffff88";ctx.beginPath();ctx.ellipse(-3.8,-1.15,.9,.45,-.25,0,Math.PI*2);ctx.fill();
 if(carrying){
  ctx.fillStyle="#17251d";ctx.fillRect(-10,0,7,7);
  ctx.fillStyle=body;ctx.fillRect(-9.5,-.5,5.8,5.8);
  ctx.fillStyle="#ffffffbb";ctx.fillRect(-9,-.5,3.5,1.35);
  ctx.fillStyle="#ffffff55";ctx.fillRect(-9,1,1,3);
  ctx.fillStyle="#00000044";ctx.fillRect(-5,1,1.2,4.5);
  ctx.strokeStyle="#f6edc5aa";ctx.lineWidth=.55;ctx.strokeRect(-9.5,-.5,5.8,5.8);
 }
 antSpriteCache.set(key,sprite);return sprite;
}
function drawAnt(ctx,point,color,carrying,index,direction=0,timestamp=animationClock.now()){
 const gaitState=getAntGaitFrame(timestamp,index),phase=gaitState.phase,gait=gaitState.frame;
 const bob=Math.sin(phase*2+index*.31)*.34;
 ctx.save();ctx.translate(point.x,point.y+bob);
 ctx.fillStyle="#36523d26";ctx.beginPath();ctx.ellipse(0,7,8,2.6,0,0,Math.PI*2);ctx.fill();
 ctx.rotate(direction+Math.sin(phase*.5+index)*.018);
 ctx.drawImage(createAntSprite(color,carrying,gait),-13,-12);
 if(carrying){ctx.globalAlpha=.32+.18*Math.sin(phase*2);ctx.fillStyle=COLORS[color].hex;ctx.beginPath();ctx.arc(-8,-7,4.2,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
function drawSpecialistGear(ctx,point,role){
 if(!role)return;
 ctx.save();ctx.translate(point.x,point.y);ctx.rotate(point.angle||0);
 if(role==="builder"){
  ctx.strokeStyle="#e6c17a";ctx.lineWidth=1.5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(7,-3);ctx.lineTo(10,-8);ctx.stroke();
  ctx.fillStyle="#d6b16d";ctx.fillRect(8,-10,5,2.5);
 }else if(role==="warrior"){
  ctx.fillStyle="#b7c5a0";ctx.strokeStyle="#344b3b";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(8,-10);ctx.lineTo(13,-8);ctx.lineTo(12,-2);ctx.lineTo(9,-.5);ctx.lineTo(6,-3);ctx.lineTo(6,-8);ctx.closePath();ctx.fill();ctx.stroke();
 }
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
function makePerimeterTrail(start,end,seed){
 const shellRect=shell.getBoundingClientRect(),boardRect=boardEl.getBoundingClientRect();
 const left=boardRect.left-shellRect.left+12,top=boardRect.top-shellRect.top+12;
 const right=boardRect.right-shellRect.left-12,bottom=boardRect.bottom-shellRect.top-12;
 const width=right-left,height=bottom-top,perimeter=2*(width+height);
 const project=point=>{
  const distances=[Math.abs(point.y-top),Math.abs(point.x-right),Math.abs(point.y-bottom),Math.abs(point.x-left)];
  const side=distances.indexOf(Math.min(...distances));
  if(side===0)return{x:Math.max(left,Math.min(right,point.x)),y:top,s:Math.max(0,Math.min(width,point.x-left))};
  if(side===1)return{x:right,y:Math.max(top,Math.min(bottom,point.y)),s:width+Math.max(0,Math.min(height,point.y-top))};
  if(side===2)return{x:Math.max(left,Math.min(right,point.x)),y:bottom,s:width+height+(right-Math.max(left,Math.min(right,point.x)))};
  return{x:left,y:Math.max(top,Math.min(bottom,point.y)),s:2*width+height+(bottom-Math.max(top,Math.min(bottom,point.y)))};
 };
 const pointAt=s=>{
  const p=((s%perimeter)+perimeter)%perimeter;
  if(p<=width)return{x:left+p,y:top};
  if(p<=width+height)return{x:right,y:top+(p-width)};
  if(p<=2*width+height)return{x:right-(p-width-height),y:bottom};
  return{x:left,y:bottom-(p-2*width-height)};
 };
 const a=project(start),b=project(end),clockwise=((b.s-a.s)%perimeter+perimeter)%perimeter;
 const counter=(perimeter-clockwise)%perimeter,forward=(clockwise<counter)||(Math.abs(clockwise-counter)<1&&seed<.5);
 const distance=forward?clockwise:counter,step=forward?1:-1;
 const corners=[width,width+height,2*width+height,perimeter,0];
 const points=[start,a];
 for(let travelled=0;travelled<distance;){
  let next=Infinity;
  for(const corner of corners){
   const delta=forward?((corner-a.s)%perimeter+perimeter)%perimeter:((a.s-corner)%perimeter+perimeter)%perimeter;
   if(delta>travelled+.5&&delta<next&&delta<distance-.5)next=delta;
  }
  if(!Number.isFinite(next))break;
  points.push(pointAt(a.s+step*next));travelled=next;
 }
 points.push(b,end);
 const trail=[];
 for(let i=1;i<points.length;i++){
  const segment=makeAntTrail(points[i-1],points[i],(seed+i*.173)%1,.22);
  if(i>1)segment.shift();
  trail.push(...segment);
 }
 return trail;
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
function drawDeliveryEffects(timestamp){
 for(let i=deliveryEffects.length-1;i>=0;i--){
  const effect=deliveryEffects[i],t=(timestamp-effect.startedAt)/680;
  if(t>=1){deliveryEffects.splice(i,1);continue;}
  const fade=1-t,breath=Math.sin(t*Math.PI);
  antCtx.save();antCtx.globalAlpha=fade*.62;
  antCtx.shadowColor="#b9a56c";antCtx.shadowBlur=7*breath;
  antCtx.strokeStyle="#b9a56c";antCtx.lineWidth=1.5*fade;
  for(let ring=0;ring<2;ring++){
   const radius=5+t*([14,21][ring]);
   antCtx.beginPath();antCtx.ellipse(effect.x,effect.y+ring*1.5,radius,radius*.48,0,0,Math.PI*2);antCtx.stroke();
  }
  antCtx.fillStyle="#c3ae72";antCtx.globalAlpha=fade*.55;
  antCtx.beginPath();antCtx.arc(effect.x,effect.y-2,1.4+breath*.7,0,Math.PI*2);antCtx.fill();
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
  if(!ant.launched){
   ant.launched=true;ant.onLaunch();
  }
  if(phase.picked&&!ant.picked){
   ant.picked=true;
   if(applyAntPickup(state,ant.move.slot,ant.move.target,ant.move.color,ant.move.role)){
    ant.onPickup();ant.delivered=true;
    const pickupPoint=cellCenter(ant.move.target.x,ant.move.target.y);
    pickupEffects.push({x:pickupPoint.x,y:pickupPoint.y,color:ant.move.color,startedAt:clockTime,seed:workerId*.618});
    renderBoardAfterPickup(ant.move.target);
    $("message").textContent="Муравьишки несут добычу в муравейник";
    kickColony();
   }
  }
  if(phase.finished){
   if(ant.delivered)deliveryEffects.push({x:ant.nestPoint.x,y:ant.nestPoint.y,startedAt:clockTime});
   activeAnts.delete(workerId);
   ant.resolve();
   continue;
  }
  const trail=phase.returningNow?ant.returnTrail:ant.outboundTrail;
  const pose=getTrailPose(trail,phase.progress,ant.pose);
  drawAnt(antCtx,pose,ant.move.color,phase.returningNow,workerId,pose.angle,clockTime);drawSpecialistGear(antCtx,pose,ant.move.role);
 }
 drawPickupEffects(clockTime);drawDeliveryEffects(clockTime);
 if(activeAnts.size||pickupEffects.length||deliveryEffects.length)antFrame=requestAnimationFrame(renderAntFrame);
 else antFrame=0;
}
function animateAntTrip(move,index,onPickup=()=>{},onLaunch=()=>{}){
 const start=slotCenter(move.slot),end=cellCenter(move.target.x,move.target.y),nest=pointFor(nestEntrance);
 const seed=(index*9301+move.target.x*49297+move.target.y*233)%9973/9973;
 const outboundTrail=makePerimeterTrail(start,end,seed),returnTrail=makePerimeterTrail(end,nest,(seed+.371)%1);
 const distance=outboundTrail.reduce((sum,point,i)=>i?sum+Math.hypot(point.x-outboundTrail[i-1].x,point.y-outboundTrail[i-1].y):0,0);
 const returnDistance=returnTrail.reduce((sum,point,i)=>i?sum+Math.hypot(point.x-returnTrail[i-1].x,point.y-returnTrail[i-1].y):0,0);
 const delay=move.launchDelay??getAntLaunchDelay(index,seed),{outbound,returning}=getAntTravelDurations(distance,returnDistance);
 return new Promise(resolve=>{
  activeAnts.set(index,{move,onPickup,onLaunch,resolve,startTime:animationClock.now(),delay,outbound,returning,outboundTrail,returnTrail,nestPoint:nest,phaseFrame:{},pose:{x:0,y:0,angle:0},launched:false});
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
 const duration=1380,startTime=animationClock.now();let lastFrame=0;
 const ease=t=>t*t*t*(t*(t*6-15)+10);
 return new Promise(resolve=>{const frame=timestamp=>{
  if(timestamp-lastFrame<1000/60){requestAnimationFrame(frame);return;}lastFrame=timestamp;
  const clockTime=animationClock.fromFrame(timestamp),t=Math.min(1,(clockTime-startTime)/duration),progress=ease(t),point=quadPoint(source,control,slot,progress);
  ctx.clearRect(0,0,shellRect.width,shellRect.height);
  const tilt=(1-progress)*-.055+Math.sin(progress*Math.PI)*.012,lift=Math.sin(progress*Math.PI)*5,scale=1+Math.sin(progress*Math.PI)*.035;
  const animatedPoint={x:point.x,y:point.y-lift};
  drawTransportBox(ctx,animatedPoint,color,scale,tilt);drawBoxSparkles(ctx,animatedPoint,color,t);
  if(t>=1){ctx.clearRect(0,0,shellRect.width,shellRect.height);flightLayer.remove();resolve();return;}
  requestAnimationFrame(frame);
 };requestAnimationFrame(frame);});
}
async function runSlotWorker(move,workerId){
 const {slot,target,color}=move,key=target.x+","+target.y;
 try{
  await animateAntTrip(move,workerId,()=>{
   const worker=workerPromises.get(workerId);if(worker)worker.phase="returning";
   colony=collectCube(colony);updateEconomy();
   reservedTargets.delete(key);
  },()=>{
   const worker=workerPromises.get(workerId);if(worker)worker.phase="outbound";
   const box=state.slots[slot];
   if(box&&box.ants>0){
    box.ants--;
    if(box.ants===0){
     if(box.pairId)box.status="waiting-linked";
     else box.status="departing";
     const slotFreed=completeBoxDeparture(state,slot);
     if(slotFreed)renderChoices();
    }
    state.activeSlots=[...new Set([...workerPromises.values()].map(worker=>worker.slot))];
    renderSlots();
   }
  });
 }catch(error){console.error("Ant worker interrupted",slot,error);}
 finally{
  reservedTargets.delete(key);workerPromises.delete(workerId);
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
 if(isGameComplete(state)){if(!state.won){markLevelComplete(state.levelId);colony=completeMeadow(colony);updateEconomy();}state.won=true;state.message="Победа! Портрет собран ✨";}
 else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять стартовых отсеков заняты, доступных пикселей нет.";}
 else state.message=`Колония ждёт подходящий цвет · свободно отсеков: ${state.slots.filter(box=>!box).length}`;
 render();
}
function kickColony(){
 if(resetting||resetAfterMenu||state.won||state.lost)return;
 const pendingBySlot=countQueuedBySlot(workerPromises);
 const dispatchCapacity=Math.max(0,MAX_ACTIVE_ANTS-countDispatchingWorkers(workerPromises));
 const wave=findAntWave(state,reservedTargets,pendingBySlot,dispatchCapacity);
 const now=animationClock.now();
 for(const move of wave){
  const workerId=++workerSequence,key=move.target.x+","+move.target.y;
  const nextLaunchAt=Math.max(now,slotNextLaunchAt.get(move.slot)??now);
  const seed=(workerId*9301+move.target.x*49297+move.target.y*233)%9973/9973;
  move.launchDelay=nextLaunchAt-now+getAntQueueDelay(0,seed);
  slotNextLaunchAt.set(move.slot,nextLaunchAt+340);
  reservedTargets.add(key);
  workerPromises.set(workerId,{slot:move.slot,phase:"queued"});
  void runSlotWorker(move,workerId);
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
 render();
 try{await Promise.all(flights.map(flight=>animateBoxLoading(flight.source,slotCenter(flight.slot),flight.color)));}
 finally{
  for(const flight of flights)loadingSlots.delete(flight.slot);renderSlots();
  if(resetting||resetAfterMenu)maybeFinalizeMenuExit();else{kickColony();settleColony();}
 }
}
function updateGameSpeed(value){
 const speed=animationClock.setSpeed(value);
 const label=$("speed-current"),button=$("speed-toggle");
 if(label)label.textContent=speed+"×";
 if(button){button.setAttribute("aria-label",`Скорость муравьишек: ${speed}×. Нажми, чтобы переключить скорость`);button.setAttribute("aria-valuetext",speed+"×");}
}
function cycleGameSpeed(){
 const current=animationClock.getSpeed();
 updateGameSpeed(current>=4?1:current+1);
}
function updateMainMenu(){
 const primary=$("start-game"),fresh=$("new-game"),progress=$("menu-progress");
 const completed=completedLevels(),completedCount=LEVELS.filter(item=>completed.has(item.id)).length;
 const latestAvailable=LEVELS.filter(item=>isLevelUnlocked(item)).at(-1)||LEVELS[0];
 const launchLevel=latestAvailable,total=LEVELS.length;
 const unlockedCount=LEVELS.filter(item=>isLevelUnlocked(item)).length;
 const percent=total?Math.round(completedCount/total*100):0;
 $("menu-level-name").textContent=launchLevel.name;
 $("menu-level-number").textContent=`УРОВЕНЬ ${String(launchLevel.number).padStart(3,"0")}`;
 $("menu-level-emoji").textContent=launchLevel.emoji;
 $("menu-progress-count").textContent=`${completedCount} / ${total}`;
 $("menu-progress-fill").style.width=percent+"%";
 $("menu-progress-bar").setAttribute("aria-valuemax",String(total));
 $("menu-progress-bar").setAttribute("aria-valuenow",String(completedCount));
 $("menu-progress-hint").textContent=completedCount===total?"Вся кампания пройдена":`Открыто уровней: ${unlockedCount}`;
 const currentButton=$("menu-current-level");
 const playMark=currentButton.querySelector(".level-play-mark");
 if(playMark)playMark.textContent="НАЧАТЬ →";
 currentButton.disabled=resetAfterMenu||!isLevelUnlocked(launchLevel);
 currentButton.dataset.levelId=launchLevel.id;
 currentButton.setAttribute("aria-label",`Начать последний доступный уровень ${launchLevel.number}: ${launchLevel.name}`);
 const list=$("campaign-levels");
 if(list){list.replaceChildren();for(const item of LEVELS){
  const unlocked=isLevelUnlocked(item),done=completed.has(item.id),button=document.createElement("button");button.type="button";
  button.className="campaign-level"+(item.id===launchLevel.id?" current":"")+(unlocked?"":" locked");button.disabled=!unlocked;
  const icon=document.createElement("span");icon.className="campaign-emoji";icon.textContent=unlocked?"📦":"🔒";
  const copy=document.createElement("span");copy.className="campaign-copy";
  const number=document.createElement("small");number.textContent=`${item.chapter} · ${String(item.number).padStart(3,"0")}`;
  const name=document.createElement("strong");name.textContent=unlocked?(done?"Пройдена":"Открыта"):"Ещё не открыта";copy.append(number,name);
  const status=document.createElement("span");status.className="campaign-state";status.textContent=done?"✓":unlocked?"›":"🔒";
  button.append(icon,copy,status);button.addEventListener("click",()=>{if(unlocked){closeMap();void startFreshGame(item.id);}});list.append(button);
 }}
 primary.textContent=`Начать уровень ${String(launchLevel.number).padStart(3,"0")}`;primary.disabled=resetAfterMenu;
 primary.querySelector("span")?.remove();const arrow=document.createElement("span");arrow.setAttribute("aria-hidden","true");arrow.textContent="→";primary.append(arrow);
 fresh.hidden=true;
 progress.textContent=completed.has(launchLevel.id)?"Кампания пройдена · можно повторить":`Последний доступный уровень · ${total} в кампании`;
}
function showMainMenu(){
 shell.classList.add("menu-open");
 if(gameStarted){resetAfterMenu=true;maybeFinalizeMenuExit();}
 updateMainMenu();
}
function maybeFinalizeMenuExit(){
 if(!resetAfterMenu||workerPromises.size||loadingSlots.size||resetting)return;
 resetting=true;cancelAnimationFrame(antFrame);antFrame=0;activeAnts.clear();pickupEffects.length=0;deliveryEffects.length=0;reservedTargets.clear();slotNextLaunchAt.clear();
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
 resetting=true;cancelAnimationFrame(antFrame);activeAnts.clear();pickupEffects.length=0;deliveryEffects.length=0;reservedTargets.clear();slotNextLaunchAt.clear();state=createGame(levelId);totalBlocks=tasksRemaining();resetting=false;
 gameStarted=true;render();$("save-status").textContent="Новая партия · прогресс уровня не сохраняется";shell.classList.remove("menu-open");updateMainMenu();kickColony();
}
async function boot(){
 totalBlocks=tasksRemaining();
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
$("speed-toggle").addEventListener("click",cycleGameSpeed);
updateGameSpeed(1);
$("menu-toggle").addEventListener("click",showMainMenu);
$("start-game").addEventListener("click",startGame);
 $("menu-current-level").addEventListener("click",()=>startFreshGame($("menu-current-level").dataset.levelId||state.levelId));
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
