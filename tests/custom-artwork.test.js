import test from "node:test";
import assert from "node:assert/strict";
import {COLORS} from "../src/game.js";
import {decodeSpriteArtwork} from "../src/custom-artwork.js";
function payload(){
 const palette=["#e7c66d","#3977aa","#55b8ad"];
 const rows=Array.from({length:45},(_,y)=>Array.from({length:45},(_,x)=>x<15?".":x<30?"0":y%2?"1":"2").join(""));
 return {width:45,height:45,palette,data:rows.join("/")};
}
test("sprite import preserves exact source RGB colors as game colors",()=>{
 const source=payload(),board=decodeSpriteArtwork(source,COLORS);
 assert.equal(board.length,45);assert.ok(board.every(row=>row.length===45));
 assert.equal(board[0][0],"");assert.equal(COLORS[board[0][20]].hex,"#e7c66d");
 assert.equal(COLORS[board[0][35]].hex,"#55b8ad");
 assert.equal(COLORS[board[1][35]].hex,"#3977aa");
});
test("sprite import rejects wrong dimensions and malformed rows",()=>{
 const wrong=payload();wrong.width=35;
 assert.throws(()=>decodeSpriteArtwork(wrong,COLORS),/45×45/);
 const malformed=payload();malformed.data=malformed.data.slice(1);
 assert.throws(()=>decodeSpriteArtwork(malformed,COLORS),/45 строк/);
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
 assert.throws(()=>decodeSpriteArtwork(tooMany,COLORS),/45×45/);
});
