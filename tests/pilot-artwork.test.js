import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PILOT_ARTWORK} from "../src/pilot-artwork-data.js";
import {LEVELS} from "../src/game.js";

const expected=[
 [501,"ПИЛОТНЫЙ 1","Слон на полянке","elephant-detailed.png"],
 [502,"ПИЛОТНЫЙ 2","Жираф на полянке","giraffe-detailed.png"],
 [503,"ПИЛОТНЫЙ 3","Бегемот на полянке","hippo-detailed.png"],
 [504,"ПИЛОТНЫЙ 4","Обезьянка на полянке","monkey-detailed.png"]
];

test("the four campaign pilots have explicit labels and matching animal names",()=>{
 assert.deepEqual(Object.keys(PILOT_ARTWORK).map(Number).sort(),[501,502,503,504]);
 for(const [number,label,name,sourceFile] of expected){
  const artwork=PILOT_ARTWORK[number],level=LEVELS.find(item=>item.number===number);
  assert.ok(artwork, String(number));
  assert.equal(artwork.label,label);
  assert.equal(artwork.name,name);
  assert.equal(artwork.sourceFile,sourceFile);
  assert.equal(level?.name,name);
  assert.equal(artwork.sourceUrl,"generated:pilot-artwork-kt306");
 }
});

test("detailed pilot PNGs are embedded indexed-color sources for offline use",()=>{
 const signature=[137,80,78,71,13,10,26,10],seen=new Set();
 for(const [number] of expected){
  const dataUrl=PILOT_ARTWORK[number].dataUrl;
  assert.match(dataUrl,/^data:image\/png;base64,/);
  assert.equal(dataUrl.includes("\n"),false,"embedded base64 must stay on one valid JS string line");
  const bytes=Buffer.from(dataUrl.slice(dataUrl.indexOf(",")+1),"base64");
  assert.deepEqual([...bytes.subarray(0,8)],signature);
  assert.equal(bytes[25],3,"PNG must use a compact indexed color palette");
  const paletteChunk=bytes.indexOf(Buffer.from("PLTE"));
  assert.ok(paletteChunk>0,"PNG must contain a color palette");
  assert.ok(bytes.readUInt32BE(paletteChunk-4)>=24,"pilot art must retain at least eight distinct palette colors");
  assert.ok(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0);
  assert.ok(bytes.length>1500);
  seen.add(bytes.toString("base64"));
 }
 assert.equal(seen.size,4,"each pilot must use a different source sprite");
});

test("starting a campaign level loads its artwork before ants can launch",async()=>{
 const app=await readFile(new URL("../src/app.js",import.meta.url),"utf8");
 const start=app.slice(app.indexOf("async function startFreshGame"),app.indexOf("function readZenPayload"));
 assert.match(start,/if\(!boardArtworkKey\)boardArtworkPromise=ensureBoardArtwork\(\)/);
 assert.ok(start.indexOf("ensureBoardArtwork()")<start.indexOf("await boardArtworkPromise"));
 assert.match(start,/if\(!artworkReady&&PILOT_ARTWORK\[getLevel\(levelId\)\.number\]\)/);
 assert.match(start,/Не удалось загрузить изображение пилотного уровня/);
});

test("pilot rasterizer preserves all 16 game colors and samples the full 35x35 source",async()=>{
 const app=await readFile(new URL("../src/app.js",import.meta.url),"utf8");
 assert.match(app,/const palette=Object\.entries\(COLORS\)\.map/);
 assert.doesNotMatch(app,/filter\(\(\[key\]\)=>key!==["']black["']&&key!==["']gray["']\)/);
 assert.match(app,/Math\.floor\(gx\*450\/SIZE\)/);
 assert.match(app,/Math\.floor\(gy\*450\/SIZE\)/);
 assert.match(app,/alpha\/sampleCount<\.22/);
});

test("pilot images are converted to the actual collectible board before dispatch",async()=>{
 const app=await readFile(new URL("../src/app.js",import.meta.url),"utf8");
 assert.match(app,/PILOT_ARTWORK\[item\.number\]\?\.dataUrl/);
 assert.match(app,/await boardArtworkPromise/);
 assert.match(app,/drawImage\(image,\(450-drawWidth\)\/2,\(450-drawHeight\)\/2,drawWidth,drawHeight\)/);
 assert.match(app,/PILOT_ARTWORK\[resultLevel\.number\]\?\.label/);
 assert.match(app,/PILOT_ARTWORK\[launchLevel\.number\]\?\.label/);
 assert.match(app,/await boardArtworkPromise/);
});


test("pilot PNG rasterization keeps small accent colors instead of merging them into the body color",async()=>{
 const app=await readFile(new URL("../src/app.js",import.meta.url),"utf8");
 const game=await readFile(new URL("../src/game.js",import.meta.url),"utf8");
 assert.match(app,/setArtworkBoard\(key,board,pilotArtwork\?3:18\)/);
 assert.match(game,/setArtworkBoard\(levelId,board,minimumColorCount=18\)/);
 assert.match(game,/mergeSparseArtworkColors\(board\.map\(row=>row\.slice\(\)\),minimumColorCount\)/);
});

test("main menu progress reset clears campaign and colony progression only after confirmation",async()=>{
 const app=await readFile(new URL("../src/app.js",import.meta.url),"utf8");
 const handler=app.slice(app.indexOf('$("reset-progress").addEventListener'),app.indexOf('$("how-to-play").addEventListener'));
 assert.match(handler,/window\.confirm\(/);
 assert.match(handler,/localStorage\.removeItem\(CAMPAIGN_KEY\)/);
 assert.match(handler,/localStorage\.removeItem\(ECONOMY_STORAGE_KEY\)/);
 assert.match(handler,/location\.reload\(\)/);
 assert.doesNotMatch(handler,/localStorage\.clear\(/);
});
