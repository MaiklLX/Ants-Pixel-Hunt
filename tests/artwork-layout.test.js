import test from "node:test";
import assert from "node:assert/strict";
import { createArtworkSvg } from "../src/artwork-renderer.js";

function transforms(level){
 return [...createArtworkSvg(level).matchAll(/transform="translate\(([^)]+)\) scale\(([^)]+)\)"/g)]
  .map(([,position,scale])=>({
   position:position.split(/\s+/).map(value=>Math.round(Number(value))),
   scale:scale.split(/\s+/).map(Number)
  }));
}

test("single artwork is enlarged and centred without distortion",()=>{
 const [item]=transforms(8);
 assert.deepEqual(item.position,[4,4]);
 assert.ok(Math.abs(item.scale[0]-item.scale[1])<1e-9);
 assert.ok(item.scale[0]>1);
});

test("two-piece artwork forms a horizontally balanced centred pair",()=>{
 const items=transforms(51);
 assert.equal(items.length,2);
 assert.deepEqual(items.map(item=>item.position),[[0,74],[158,74]]);
 assert.ok(items.every(item=>Math.abs(item.scale[0]-item.scale[1])<1e-9));
 const left=items[0].position[0],right=items[1].position[0];
 assert.equal(left+146,450-(right+146));
});

test("three-piece artwork forms a centred triangular composition",()=>{
 const items=transforms(301);
 assert.equal(items.length,3);
 assert.deepEqual(items.map(item=>item.position),[[0,0],[174,0],[87,174]]);
 assert.ok(items.every(item=>Math.abs(item.scale[0]-item.scale[1])<1e-9));
 const centerTop=(items[0].position[0]+138+items[1].position[0]+138)/2;
 assert.equal(centerTop,225);
 assert.equal(items[2].position[0]+138,225);
});
