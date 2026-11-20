import test from "node:test";
import assert from "node:assert/strict";
import {COLORS} from "../src/game.js";
import {decodeSpriteArtwork} from "../src/custom-artwork.js";
function payload(){
 const palette=["#e7c66d","#3977aa","#55b8ad"];
 const rows=Array.from({length:35},(_,y)=>Array.from({length:35},(_,x)=>x<15?".":x<30?"0":y%2?"1":"2").join(""));
 return {width:35,height:35,palette,data:rows.join("/")};
}
test("sprite import preserves exact source RGB colors as game colors",()=>{
 const source=payload(),board=decodeSpriteArtwork(source,COLORS);
 assert.equal(board.length,35);assert.ok(board.every(row=>row.length===35));
 assert.equal(board[0][0],"");assert.equal(COLORS[board[0][20]].hex,"#e7c66d");
 assert.equal(COLORS[board[0][30]].hex,"#55b8ad");
 assert.equal(COLORS[board[1][30]].hex,"#3977aa");
});
test("sprite import rejects unsupported dimensions and malformed rows",()=>{
 const wrong=payload();wrong.width=40;wrong.height=40;
 assert.throws(()=>decodeSpriteArtwork(wrong,COLORS),/35×35/);
 const malformed=payload();malformed.data=malformed.data.slice(1);
 assert.throws(()=>decodeSpriteArtwork(malformed,COLORS),/35 строк/);
});
test("sprite import rejects unknown palette indexes and invalid colors",()=>{
 const unknown=payload();unknown.data=unknown.data.replace("0","z");
 assert.throws(()=>decodeSpriteArtwork(unknown,COLORS),/отсутствующий цвет/);
 const invalid=payload();invalid.palette[0]="red";
 assert.throws(()=>decodeSpriteArtwork(invalid,COLORS),/некорректный цвет/);
});
test("sprite import keeps transparent cells empty and caps palette size",()=>{
 const board=decodeSpriteArtwork(payload(),COLORS);
 assert.ok(board.flat().some(color=>color===""));
 const tooMany=payload();tooMany.palette=Array(37).fill("#ffffff");
 assert.throws(()=>decodeSpriteArtwork(tooMany,COLORS),/35×35/);
});

test("legacy 45×45 sprite exports are reduced to the new 35×35 board",()=>{
 const old=payload();old.width=45;old.height=45;old.data=Array.from({length:45},(_,y)=>Array.from({length:45},(_,x)=>x<15?".":x<30?"0":y%2?"1":"2").join("")).join("/");
 const board=decodeSpriteArtwork(old,COLORS);
 assert.equal(board.length,35);assert.ok(board.every(row=>row.length===35));
});
