import test from "node:test";
import assert from "node:assert/strict";
import {createPausableClock,getAntLaunchDelay,getAntTripFrame} from "../src/ant-animation.js";

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

test("ant launch stagger repeats in short bounded waves instead of growing for the whole level",()=>{
 assert.equal(getAntLaunchDelay(0,0),0);assert.equal(getAntLaunchDelay(1,0),48);
 assert.equal(getAntLaunchDelay(7,0),336);assert.equal(getAntLaunchDelay(8,0),0);
 assert.equal(getAntLaunchDelay(500,0),getAntLaunchDelay(500%8,0));
 assert.ok(getAntLaunchDelay(987654,1)<=364);
});


test("pausable animation clock freezes ant and box timelines while the document is hidden",()=>{
 let now=1000;
 const clock=createPausableClock(()=>now);
 const startedAt=clock.now();
 now=1700;
 clock.pause();
 now=11700;
 const pausedAt=clock.fromFrame(now);
 assert.equal(pausedAt-startedAt,700);
 assert.equal(getAntTripFrame(pausedAt-startedAt,0,1000,1000).finished,false);
 assert.equal(clock.now(),pausedAt);
 now=12700;
 clock.resume();
 assert.equal(clock.now(),pausedAt);
 now=13000;
 assert.equal(clock.fromFrame(now)-startedAt,1000);
});

test("pausable animation clock ignores duplicate hide and show notifications",()=>{
 let now=0;
 const clock=createPausableClock(()=>now);
 now=50;clock.pause();
 now=75;clock.pause();
 now=175;clock.resume();
 now=200;clock.resume();
 assert.equal(clock.now(),75);
 now=225;
 assert.equal(clock.now(),100);
});
