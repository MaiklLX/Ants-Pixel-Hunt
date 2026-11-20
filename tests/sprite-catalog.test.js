import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const catalog=JSON.parse(await readFile(new URL("../assets/catalog/pilot-batch-01.json",import.meta.url),"utf8"));

test("Tiddybub pilot batch targets the current 35x35 game board",()=>{
 assert.deepEqual(catalog.target,{width:35,height:35,paletteLimit:16,boardCellCount:1225});
 assert.equal(catalog.target.width*catalog.target.height,catalog.target.boardCellCount);
});

test("pilot batch contains diverse verified source packs with source metadata",()=>{
 assert.ok(catalog.packs.length>=8);
 assert.equal(new Set(catalog.packs.map(pack=>pack.id)).size,catalog.packs.length);
 for(const pack of catalog.packs){
  assert.ok(pack.path.startsWith(pack.genre+"/"),pack.id+" must live in its declared genre");
  assert.equal(pack.verifiedInUpstreamIndex,true);
  assert.match(pack.url,/^https:\/\/github\.com\/Tiddybub\/2d-assets\/tree\/main\//);
  assert.match(pack.sourceFile,/\/SOURCE\.md$/);
  assert.ok(pack.ideas.length>0);
 }
});

test("pilot metadata does not claim unimported sprites are already in the game",()=>{
 assert.match(catalog.policy,/не утверждение, что исходники уже импортированы/);
 assert.equal(catalog.source.license,"CC0");
});
