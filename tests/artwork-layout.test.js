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

test("every generated level is one large centred illustration, not a collage",()=>{
 for(const level of [8,9,51,150,151,301,500]){
  const items=transforms(level);
  assert.equal(items.length,1,`level ${level} must have exactly one subject`);
  assert.deepEqual(items[0].position,[4,4]);
  assert.ok(Math.abs(items[0].scale[0]-items[0].scale[1])<1e-9);
  assert.ok(items[0].scale[0]>1);
 }
});

test("the first seven authored starter illustrations keep their original centred placement",()=>{
 for(const level of [1,2,3,4,5,6,7]){
  const [item]=transforms(level);
  assert.deepEqual(item.position,[50,50]);
  assert.ok(Math.abs(item.scale[0]-item.scale[1])<1e-9);
 }
});
