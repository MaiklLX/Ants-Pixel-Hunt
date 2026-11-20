import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const catalog=JSON.parse(await readFile(new URL("../assets/catalog/pilot-batch-01.json",import.meta.url),"utf8"));

test("Tiddybub pilot batch targets the current 35x35 game board",()=>{
 assert.deepEqual(catalog.target,{width:35,height:35,paletteLimit:16,boardCellCount:1225});
 assert.equal(catalog.target.width*catalog.target.height,catalog.target.boardCellCount);
});

test("pilot packs and individual PNG files have concrete upstream paths",()=>{
 assert.equal(catalog.packs.length,3);
 assert.equal(new Set(catalog.packs.map(pack=>pack.id)).size,catalog.packs.length);
 let count=0;
 for(const pack of catalog.packs){
  assert.ok(pack.path.startsWith(pack.genre+"/"),pack.id+" must live in its declared genre");
  assert.equal(pack.verifiedInUpstreamIndex,true);
  assert.equal(pack.verifiedPngDirectory,true);
  assert.match(pack.url,/^https:\/\/github\.com\/Tiddybub\/2d-assets\/tree\/main\//);
  assert.match(pack.sourceFile,/\/SOURCE\.md$/);
  assert.match(pack.licenseFile,/\/License\.txt$/);
  assert.ok(pack.spriteFiles.length>0);
  for(const sprite of pack.spriteFiles){
   assert.match(sprite.url,/^https:\/\/raw\.githubusercontent\.com\/Tiddybub\/2d-assets\/main\//);
   assert.ok(sprite.url.endsWith("/"+sprite.name));
   assert.match(sprite.name,/\.png$/);
   count++;
  }
 }
 assert.ok(count>=25,"the first pilot should contain a useful set of individual source sprites");
});

test("pilot metadata distinguishes source PNGs from imported game artwork",()=>{
 assert.match(catalog.policy,/other candidates remain unimported/);
 assert.equal(catalog.source.license,"CC0");
});
