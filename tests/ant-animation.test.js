import test from "node:test";
import assert from "node:assert/strict";
import {getAntTripFrame} from "../src/ant-animation.js";

test("ant trip waits for its staggered launch without starting motion early",()=>{
 assert.deepEqual(getAntTripFrame(120,150,2000,1800),{
  waiting:true,picked:false,returningNow:false,progress:0,finished:false
 });
});

test("ant trip smoothly reaches pickup after outbound travel",()=>{
 const frame=getAntTripFrame(1150,150,1000,900);
 assert.equal(frame.waiting,false);
 assert.equal(frame.picked,true);
 assert.equal(frame.returningNow,false);
 assert.equal(frame.progress,1);
 assert.equal(frame.finished,false);
});

test("ant trip returns along its own route and completes only after return duration",()=>{
 const returning=getAntTripFrame(1650,150,1000,900);
 assert.equal(returning.returningNow,true);
 assert.ok(returning.progress>0&&returning.progress<1);
 assert.equal(returning.finished,false);
 const done=getAntTripFrame(2050,150,1000,900);
 assert.equal(done.finished,true);
 assert.equal(done.picked,true);
});
