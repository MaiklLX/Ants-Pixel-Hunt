import test from "node:test";
import assert from "node:assert/strict";
import {getAntTripFrame} from "../src/ant-animation.js";

test("ant trip waits for its staggered launch without starting motion early",()=>{
 assert.deepEqual(getAntTripFrame(120,150,2000,1800),{
  waiting:true,picked:false,returningNow:false,progress:0,finished:false
 });
});

test("ant trip smoothly reaches pickup after outbound travel",()=>{
 const outbound=getAntTripFrame(1149,150,1000,900);
 assert.equal(outbound.waiting,false);
 assert.equal(outbound.picked,false);
 assert.equal(outbound.returningNow,false);
 assert.ok(outbound.progress>0.99);
 assert.equal(outbound.finished,false);
 const pickup=getAntTripFrame(1150,150,1000,900);
 assert.equal(pickup.picked,true);
 assert.equal(pickup.returningNow,true);
 assert.equal(pickup.progress,0);
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

import {getAntLaunchDelay} from "../src/ant-animation.js";
test("ant launch stagger repeats in short bounded waves instead of growing for the whole level",()=>{
 assert.equal(getAntLaunchDelay(0,0),0);assert.equal(getAntLaunchDelay(1,0),48);
 assert.equal(getAntLaunchDelay(7,0),336);assert.equal(getAntLaunchDelay(8,0),0);
 assert.equal(getAntLaunchDelay(500,0),getAntLaunchDelay(500%14,0));
 assert.ok(getAntLaunchDelay(987654,1)<=364);
});
