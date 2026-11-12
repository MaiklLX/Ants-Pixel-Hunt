export function getAntTripFrame(elapsed,delay,outbound,returning,out={}){
 if(elapsed<delay){
  out.waiting=true;out.picked=false;out.returningNow=false;out.progress=0;out.finished=false;
  return out;
 }
 const tripElapsed=elapsed-delay;
 const returningNow=tripElapsed>=outbound;
 const duration=returningNow?returning:outbound;
 const raw=Math.min(1,Math.max(0,(tripElapsed-(returningNow?outbound:0))/duration));
 out.waiting=false;
 out.picked=tripElapsed>=outbound;
 out.returningNow=returningNow;
 out.progress=raw*raw*(3-2*raw);
 out.finished=tripElapsed>=outbound+returning;
 return out;
}

/** Keep launch staggering bounded; lifetime worker IDs must not create longer waits. */
export function getAntLaunchDelay(sequence,seed=0){
 const order=Math.max(0,Math.floor(Number(sequence)||0))%8;
 const jitter=Math.max(0,Math.min(1,Number(seed)||0))*28;
 return order*48+jitter;
}


/** A monotonic animation clock that stops advancing while the document is hidden. */
export function createPausableClock(readNow=()=>performance.now()){
 let pausedAt=null,pausedDuration=0;
 const toActiveTime=timestamp=>timestamp-pausedDuration-(pausedAt===null?0:Math.max(0,timestamp-pausedAt));
 return{
  now(){return toActiveTime(readNow());},
  fromFrame(timestamp){return toActiveTime(timestamp);},
  pause(timestamp=readNow()){if(pausedAt===null)pausedAt=timestamp;},
  resume(timestamp=readNow()){
   if(pausedAt!==null){pausedDuration+=Math.max(0,timestamp-pausedAt);pausedAt=null;}
  }
 };
}


/**
 * Sample a Catmull–Rom trail position and tangent in one pass.
 * The position matches the former trailPoint() interpolation exactly; the
 * analytic derivative supplies the ant heading without two extra samples.
 */
export function getTrailPose(points, progress, out = {}) {
 if (!Array.isArray(points) || points.length === 0) {
  out.x = 0; out.y = 0; out.angle = 0;
  return out;
 }
 if (points.length === 1) {
  out.x = points[0].x; out.y = points[0].y; out.angle = 0;
  return out;
 }

 const last = points.length - 1;
 const t = Number.isFinite(progress) ? Math.max(0, Math.min(0.999999, progress)) : 0;
 const scaled = t * last;
 const index = Math.floor(scaled);
 const u = scaled - index;
 const p0 = points[Math.max(0, index - 1)];
 const p1 = points[index];
 const p2 = points[Math.min(last, index + 1)];
 const p3 = points[Math.min(last, index + 2)];
 const sample = (a, b, c, d) =>
  0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
 const derivative = (a, b, c, d) =>
  0.5 * ((-a + c) + 2 * (2 * a - 5 * b + 4 * c - d) * u + 3 * (-a + 3 * b - 3 * c + d) * u * u);
 out.x = sample(p0.x, p1.x, p2.x, p3.x);
 out.y = sample(p0.y, p1.y, p2.y, p3.y);
 const dx = derivative(p0.x, p1.x, p2.x, p3.x);
 const dy = derivative(p0.y, p1.y, p2.y, p3.y);
 out.angle = Math.atan2(dy, dx);
 return out;
}
