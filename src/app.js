import {COLORS,INCOMING,SIZE,SLOT_COUNT,CHOICE_COUNT,createGame,canChoose,chooseCandidate,serializeGame,restoreGame,isAccessible,findAccessiblePixel,isDefeat} from "./game.js";
import {loadLocal,saveLocal,clearLocal} from "./storage.js";

const $ = id => document.getElementById(id);
const boardEl=$("board"), slotsEl=$("slots"), choicesEl=$("choices"), antLayer=$("ant-layer");
let state=createGame();
let busy=false;

function renderBoard(){
  boardEl.replaceChildren();
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
    const color=state.board[y][x], cell=document.createElement("div");
    cell.className="pixel"+(!color?" empty":"")+(color&&isAccessible(state.board,x,y)?" accessible":"");
    if(color) cell.style.background=COLORS[color].hex;
    if(state.activeTarget?.x===x&&state.activeTarget?.y===y) cell.classList.add("target");
    cell.setAttribute("role","gridcell");
    cell.setAttribute("aria-label",color?COLORS[color].name:"Пустая клетка");
    boardEl.append(cell);
  }
  $("board-status").textContent=`Пикселей осталось: ${state.remaining}`;
}
function renderSlots(){
  slotsEl.replaceChildren();
  state.slots.forEach((container,index)=>{
    const slot=document.createElement("div");
    slot.className="slot"+(container?" filled":"")+(state.activeSlot===index?" active":"");
    if(container){
      const stripe=document.createElement("span");stripe.className="slot-color";stripe.style.background=COLORS[container.color].hex;
      const count=document.createElement("strong");count.className="ant-count";count.textContent=`● ${container.ants}`;
      const number=document.createElement("span");number.className="slot-number";number.textContent=`СТАРТ ${index+1}`;
      slot.append(stripe,count,number);
    }else{
      const number=document.createElement("span");number.className="slot-number";number.textContent=`СТАРТ ${index+1}`;
      const plus=document.createElement("span");plus.className="slot-plus";plus.textContent="＋";
      slot.append(number,plus);
    }
    slotsEl.append(slot);
  });
}
function renderChoices(){
  choicesEl.replaceChildren();
  const visible=state.candidates.map(index=>({index,...INCOMING[index]}));
  visible.forEach((candidate,choiceIndex)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="choice-card";
    button.disabled=busy||!canChoose(state);
    button.style.setProperty("--ant-color",COLORS[candidate.color].hex);
    const number=document.createElement("span");number.className="choice-number";number.textContent=`ВЫБОР ${choiceIndex+1}`;
    const antDots=document.createElement("span");antDots.className="ant-dots";
    antDots.textContent=Array.from({length:Math.min(candidate.ants,8)},()=>"●").join(" ");
    const name=document.createElement("strong");name.textContent=COLORS[candidate.color].name;
    const count=document.createElement("small");count.textContent=`${candidate.ants} ${candidate.ants===1?"муравей":candidate.ants<5?"муравья":"муравьёв"}`;
    button.append(number,antDots,name,count);
    button.setAttribute("aria-label",`Выбрать бокс: ${COLORS[candidate.color].name}, ${candidate.ants} муравьёв`);
    button.addEventListener("click",()=>onChoose(candidate.index));
    choicesEl.append(button);
  });
  $("choice-status").textContent=visible.length?"Выбери один из трёх боксов":"Все боксы использованы";
  $("queue-count").textContent=`${state.nextContainer} / ${INCOMING.length}`;
}
function render(){
  renderBoard();renderSlots();renderChoices();
  $("message").textContent=state.message;
  $("restart").disabled=busy;
}
function cellCenter(x,y){
  const cell=boardEl.children[y*SIZE+x],frame=antLayer.getBoundingClientRect(),rect=cell.getBoundingClientRect();
  return {x:rect.left+rect.width/2-frame.left,y:rect.top+rect.height/2-frame.top};
}
function slotCenter(index){
  const slot=slotsEl.children[index],frame=antLayer.getBoundingClientRect(),rect=slot.getBoundingClientRect();
  return {x:rect.left+rect.width/2-frame.left,y:rect.top+rect.height/2-frame.top};
}
function makeAnt(){
  const wrap=document.createElement("div");wrap.className="ant-runner";
  wrap.innerHTML='<svg viewBox="0 0 64 48" aria-hidden="true"><g stroke="#263d2d" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M26 25 17 13 10 10M27 29 15 35 9 42M36 25 43 13 51 10M37 30 48 36 55 42M27 17Q20 5 14 6M38 17Q45 5 51 6"/></g><ellipse cx="17" cy="25" rx="8" ry="7" fill="#b77736" stroke="#263d2d" stroke-width="2"/><ellipse cx="32" cy="25" rx="10" ry="9" fill="#d18a3d" stroke="#263d2d" stroke-width="2"/><circle cx="48" cy="23" r="9" fill="#e3a34e" stroke="#263d2d" stroke-width="2"/><circle cx="51" cy="20" r="2" fill="#fff"/><circle cx="52" cy="20" r="1" fill="#263d2d"/><path d="M45 15Q40 5 42 4M51 14Q55 4 59 5" stroke="#263d2d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  return wrap;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function animateAnt(slot,x,y){
  const start=slotCenter(slot),end=cellCenter(x,y),ant=makeAnt();
  antLayer.append(ant);ant.style.left=start.x+"px";ant.style.top=start.y+"px";
  await ant.animate([{left:start.x+"px",top:start.y+"px",transform:"translate(-50%,-50%) scale(.85)"},{left:end.x+"px",top:end.y+"px",transform:"translate(-50%,-50%) scale(1.12)"}],{duration:260,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"}).finished;
  await sleep(100);const back=slotCenter(slot);
  await ant.animate([{left:end.x+"px",top:end.y+"px"},{left:back.x+"px",top:back.y+"px"}],{duration:230,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"}).finished;
  ant.remove();
  const cargo=document.createElement("span");cargo.textContent="✦";cargo.style.cssText=`position:absolute;left:${back.x}px;top:${back.y}px;color:#f4bd51;font-size:18px;transform:translate(-50%,-50%);animation:cargo-pop .24s ease-out forwards`;
  antLayer.append(cargo);setTimeout(()=>cargo.remove(),260);
}
async function save(){
  const ok=await saveLocal(serializeGame(state));
  $("save-status").textContent=ok?"Прогресс сохранён на устройстве":"Не удалось сохранить прогресс";
}
async function onChoose(candidateIndex){
  if(busy||!chooseCandidate(state,candidateIndex))return;
  const slotIndex=state.slots.findIndex((slot,index)=>slot?.sourceIndex===candidateIndex);
  busy=true;state.resolving=true;render();state.resolving=false;
  let changed=true;
  while(changed&&state.remaining>0){
    changed=false;
    for(let i=0;i<SLOT_COUNT;i++){
      const container=state.slots[i];if(!container)continue;
      state.activeSlot=i;renderSlots();
      while(container.ants>0){
        const target=findAccessiblePixel(state.board,container.color);
        if(!target)break;
        state.activeTarget=target;renderBoard();
        await animateAnt(i,target.x,target.y);
        state.board[target.y][target.x]="";container.ants--;state.remaining--;
        state.resolutionLog.push({slot:i,color:container.color,x:target.x,y:target.y});
        state.activeTarget=null;changed=true;renderBoard();await save();await sleep(45);
      }
      if(container.ants<=0)state.slots[i]=null;
      state.activeSlot=-1;renderSlots();
    }
  }
  state.activeTarget=null;state.activeSlot=-1;state.resolving=false;busy=false;
  if(state.remaining===0){state.won=true;state.message="Победа! Поле полностью очищено ✨";}
  else if(isDefeat(state)){state.lost=true;state.message="Поражение: все пять ячеек заняты, доступных ходов нет.";}
  else state.message=`Свободных стартовых отсеков: ${state.slots.filter(x=>!x).length} из ${SLOT_COUNT}`;
  render();await save();
}
async function restart(){
  if(busy)return;
  state=createGame();await clearLocal();render();$("save-status").textContent="Новая игра";
}
async function boot(){
  const saved=await loadLocal();if(saved)state=restoreGame(saved);
  render();
  if("serviceWorker" in navigator){try{await navigator.serviceWorker.register("./service-worker.js");}catch(error){console.warn("PWA offline registration failed",error);}}
  $("save-status").textContent=saved?"Продолжили сохранённую игру":"Сохранение на устройстве";
}
$("restart").addEventListener("click",restart);
$("sound-toggle").addEventListener("click",()=>{$("sound-toggle").textContent="♫";$("sound-toggle").title="Звук пока не подключён";});
window.addEventListener("beforeunload",()=>{if(!busy)saveLocal(serializeGame(state));});
window.addEventListener("pagehide",()=>{if(!busy)saveLocal(serializeGame(state));});
boot();
