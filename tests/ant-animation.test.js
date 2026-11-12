import test from "node:test";
import assert from "node:assert/strict";
import {createPausableClock,getAntLaunchDelay,getAntTripFrame,getTrailPose} from "../src/ant-animation.js";

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


function legacyTrailPoint(points, progress) {
 const scaled = Math.max(0, Math.min(0.999999, progress)) * (points.length - 1);
 const index = Math.floor(scaled), u = scaled - index;
 const p0 = points[Math.max(0, index - 1)], p1 = points[index];
 const p2 = points[index + 1], p3 = points[Math.min(points.length - 1, index + 2)];
 const calc = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
 return { x: calc(p0.x, p1.x, p2.x, p3.x), y: calc(p0.y, p1.y, p2.y, p3.y) };
}

test("trail pose preserves Catmull–Rom positions and derives a stable heading", () => {
 const points = [{x: 12, y: 18}, {x: 42, y: 8}, {x: 66, y: 54}, {x: 108, y: 36}, {x: 144, y: 80}];
 for (const progress of [0, 0.05, 0.17, 0.33, 0.51, 0.76, 0.94, 0.999]) {
  const pose = getTrailPose(points, progress);
  const expected = legacyTrailPoint(points, progress);
  assert.ok(Math.abs(pose.x - expected.x) < 1e-9, "x position must remain unchanged");
  assert.ok(Math.abs(pose.y - expected.y) < 1e-9, "y position must remain unchanged");
  assert.ok(Number.isFinite(pose.angle), "heading must be finite");
  if (progress > 0.01 && progress < 0.99) {
   const before = legacyTrailPoint(points, progress - 0.0001);
   const after = legacyTrailPoint(points, progress + 0.0001);
   const expectedAngle = Math.atan2(after.y - before.y, after.x - before.x);
   const difference = Math.atan2(Math.sin(pose.angle - expectedAngle), Math.cos(pose.angle - expectedAngle));
   assert.ok(Math.abs(difference) < 0.02, "analytic tangent must follow the sampled path");
  }
 }
});

test("trail pose safely handles empty and single-point paths", () => {
 assert.deepEqual(getTrailPose([], 0.5), {x: 0, y: 0, angle: 0});
 assert.deepEqual(getTrailPose([{x: 7, y: 9}], 0.5), {x: 7, y: 9, angle: 0});
});


test("ant trip frame reuses one caller-owned buffer across every phase",()=>{
 const frame={};
 assert.strictEqual(getAntTripFrame(0,100,200,180,frame),frame);
 assert.deepEqual(frame,{waiting:true,picked:false,returningNow:false,progress:0,finished:false});
 assert.strictEqual(getAntTripFrame(150,100,200,180,frame),frame);
 assert.deepEqual(frame,{waiting:false,picked:false,returningNow:false,progress:0.15625,finished:false});
 assert.strictEqual(getAntTripFrame(300,100,200,180,frame),frame);
 assert.deepEqual(frame,{waiting:false,picked:true,returningNow:true,progress:0,finished:false});
 assert.strictEqual(getAntTripFrame(480,100,200,180,frame),frame);
 assert.deepEqual(frame,{waiting:false,picked:true,returningNow:true,progress:1,finished:true});
});

test("trail pose reuses its output object and resets it for degenerate paths",()=>{
 const points=[{x:10,y:20},{x:40,y:5},{x:75,y:55},{x:110,y:30}];
 const buffer={x:-1,y:-1,angle:-1};
 const first=getTrailPose(points,.2,buffer);
 assert.strictEqual(first,buffer);
 const firstValues={...buffer};
 const second=getTrailPose(points,.8,buffer);
 assert.strictEqual(second,buffer);
 assert.notDeepEqual(buffer,firstValues);
 assert.equal(Number.isFinite(buffer.x)&&Number.isFinite(buffer.y)&&Number.isFinite(buffer.angle),true);
 assert.strictEqual(getTrailPose([],0.5,buffer),buffer);
 assert.deepEqual(buffer,{x:0,y:0,angle:0});
 assert.strictEqual(getTrailPose([{x:7,y:9}],0.5,buffer),buffer);
 assert.deepEqual(buffer,{x:7,y:9,angle:0});
});
