export const SIZE = 7;
export const SLOT_COUNT = 5;
export const CHOICE_COUNT = 3;
export const COLORS = {
  red: { hex: "#ef756e", name: "Коралловые", short: "КР" },
  blue: { hex: "#72b9ef", name: "Голубые", short: "ГЛ" },
  yellow: { hex: "#f5d36e", name: "Жёлтые", short: "ЖЛ" },
  green: { hex: "#83cf9b", name: "Зелёные", short: "ЗЛ" },
  purple: { hex: "#b99be8", name: "Сиреневые", short: "СР" }
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
    candidates: [0, 1, 2],
    nextContainer: 3,
    remaining: SIZE * SIZE,
    won: false, lost: false, resolving: false,
    activeSlot: -1, activeTarget: null,
    message: "Выбери бокс с муравьями — они отправятся на поиски пикселей",
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

export function canChoose(state) {
  return !state.won && !state.lost && !state.resolving &&
    state.candidates.length > 0 && freeSlotCount(state) > 0;
}

/** Choose a visible box; the game assigns it to the first free launch slot. */
export function chooseCandidate(state, candidateIndex) {
  if (!canChoose(state) || !state.candidates.includes(candidateIndex)) return false;
  const freeSlot = state.slots.findIndex(slot => slot === null);
  const next = INCOMING[candidateIndex];
  if (freeSlot < 0 || !next) return false;

  state.slots[freeSlot] = {...next, sourceIndex:candidateIndex};
  state.candidates = state.candidates.filter(index => index !== candidateIndex);
  if (state.nextContainer < INCOMING.length) {
    state.candidates.push(state.nextContainer);
    state.nextContainer += 1;
  }
  state.message = `${COLORS[next.color].name}: бокс отправлен в ячейку ${freeSlot + 1}`;
  return true;
}

/** Kept as a narrow compatibility helper for older tests/tools. */
export function placeNext(state, slotIndex) {
  if (slotIndex !== freeSlotCount(state) || slotIndex < 0 || slotIndex >= SLOT_COUNT) return false;
  const first = state.candidates[0];
  return first !== undefined && chooseCandidate(state, first);
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
    board: state.board, slots: state.slots, candidates:state.candidates,
    nextContainer: state.nextContainer, remaining: state.remaining,
    won: state.won, lost: state.lost, resolutionLog: state.resolutionLog
  };
}

export function restoreGame(saved) {
  const fresh = createGame();
  if (!saved || !Array.isArray(saved.board) || saved.board.length !== SIZE ||
      !Array.isArray(saved.slots) || saved.slots.length !== SLOT_COUNT) return fresh;
  const candidates = Array.isArray(saved.candidates) ? saved.candidates :
    [saved.nextContainer ?? 0, (saved.nextContainer ?? 0)+1, (saved.nextContainer ?? 0)+2]
      .filter(index => index < INCOMING.length);
  return {...fresh, ...saved, candidates, resolving:false, activeSlot:-1, activeTarget:null,
    message: saved.won ? "Победа! Поле полностью очищено ✨" :
      saved.lost ? "Поражение: все пять ячеек заняты, доступных ходов нет." :
      "Выбери бокс с муравьями — они отправятся на поиски пикселей"};
}
