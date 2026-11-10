export const SIZE = 7;
export const SLOT_COUNT = 5;
export const COLORS = {
  red: { hex: "#ef665f", name: "Красные", short: "КР" },
  blue: { hex: "#5da8ed", name: "Синие", short: "СН" },
  yellow: { hex: "#f2c85b", name: "Жёлтые", short: "ЖЛ" },
  green: { hex: "#65c58b", name: "Зелёные", short: "ЗЛ" },
  purple: { hex: "#b18ae8", name: "Фиолетовые", short: "ФЛ" }
};

export const INITIAL_BOARD = [
  ["green","green","red","green","purple","yellow","green"],
  ["red","purple","purple","blue","yellow","red","red"],
  ["red","purple","green","red","yellow","yellow","red"],
  ["purple","yellow","blue","blue","blue","red","red"],
  ["purple","blue","green","blue","purple","yellow","red"],
  ["yellow","red","red","blue","red","purple","green"],
  ["purple","red","blue","green","yellow","yellow","green"]
];

export const INCOMING = [
  {color:"yellow",ants:3},{color:"blue",ants:4},
  {color:"purple",ants:2},{color:"blue",ants:2},
  {color:"red",ants:6},{color:"purple",ants:6},
  {color:"blue",ants:1},{color:"green",ants:3},
  {color:"purple",ants:1},{color:"yellow",ants:1},
  {color:"green",ants:1},{color:"green",ants:5},
  {color:"yellow",ants:1},{color:"red",ants:2},
  {color:"yellow",ants:4},{color:"blue",ants:1},
  {color:"red",ants:6}
];

export function createGame() {
  return {
    board: INITIAL_BOARD.map(row => [...row]),
    slots: Array(SLOT_COUNT).fill(null),
    nextContainer: 0,
    remaining: SIZE * SIZE,
    won: false,
    lost: false,
    resolving: false,
    activeSlot: -1,
    activeTarget: null,
    message: "Свободных пусковых ячеек: 5 из 5",
    resolutionLog: []
  };
}

export function isAccessible(board, x, y) {
  if (!board[y]?.[x]) return false;
  return [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE || board[ny][nx] === "";
  });
}

export function findAccessiblePixel(board, color) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x] === color && isAccessible(board,x,y)) return {x,y};
    }
  }
  return null;
}

export function freeSlotCount(state) {
  return state.slots.filter(slot => slot === null).length;
}

export function canPlace(state) {
  return !state.won && !state.lost && !state.resolving &&
    state.nextContainer < INCOMING.length && freeSlotCount(state) > 0;
}

export function placeNext(state, slotIndex) {
  if (!canPlace(state) || slotIndex < 0 || slotIndex >= SLOT_COUNT || state.slots[slotIndex]) return false;
  const next = INCOMING[state.nextContainer];
  if (!next) return false;
  state.slots[slotIndex] = {...next};
  state.nextContainer += 1;
  state.message = "Контейнер установлен — муравьи отправились за пикселями!";
  return true;
}

/** Pure one-turn resolver: strictly left-to-right, recalculating access after every pixel. */
export function resolvePass(state) {
  let changed = false;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const container = state.slots[i];
    if (!container) continue;
    while (container.ants > 0) {
      const target = findAccessiblePixel(state.board, container.color);
      if (!target) break;
      state.activeSlot = i;
      state.activeTarget = target;
      state.resolutionLog.push({slot:i,color:container.color,x:target.x,y:target.y});
      state.board[target.y][target.x] = "";
      container.ants -= 1;
      state.remaining -= 1;
      changed = true;
    }
    if (container.ants <= 0) state.slots[i] = null;
  }
  state.activeSlot = -1;
  state.activeTarget = null;
  return changed;
}

export function isDefeat(state) {
  if (freeSlotCount(state) > 0 || state.remaining <= 0) return false;
  return state.slots.every(slot => !slot || slot.ants <= 0 || !findAccessiblePixel(state.board,slot.color));
}

export function resolveAll(state) {
  if (state.resolving || state.won || state.lost) return state;
  state.resolving = true;
  let changed = true;
  while (changed && state.remaining > 0) changed = resolvePass(state);
  state.resolving = false;
  if (state.remaining === 0) {
    state.won = true;
    state.message = "Победа! Поле полностью очищено ✨";
  } else if (isDefeat(state)) {
    state.lost = true;
    state.message = "Поражение: все пять ячеек заняты, доступных ходов нет.";
  } else {
    state.message = `Свободных пусковых ячеек: ${freeSlotCount(state)} из ${SLOT_COUNT}`;
  }
  return state;
}

export function serializeGame(state) {
  return {
    board: state.board, slots: state.slots, nextContainer: state.nextContainer,
    remaining: state.remaining, won: state.won, lost: state.lost,
    resolutionLog: state.resolutionLog
  };
}

export function restoreGame(saved) {
  const fresh = createGame();
  if (!saved || !Array.isArray(saved.board) || saved.board.length !== SIZE ||
      !Array.isArray(saved.slots) || saved.slots.length !== SLOT_COUNT) return fresh;
  return {...fresh, ...saved, resolving:false, activeSlot:-1, activeTarget:null,
    message: saved.won ? "Победа! Поле полностью очищено ✨" :
      saved.lost ? "Поражение: все пять ячеек заняты, доступных ходов нет." :
      `Свободных пусковых ячеек: ${saved.slots.filter(x=>x===null).length} из ${SLOT_COUNT}`};
}
