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
 out.progress=raw*raw*raw*(raw*(raw*6-15)+10);
 out.finished=tripElapsed>=outbound+returning;
 return out;
}

/** A calm eight-pose alternating tripod gait for the tiny workers. */
export function getAntGaitFrame(timestamp,index=0){
 const phase=(Number(timestamp)||0)*.0045+(Number(index)||0)*1.73;
 const cycle=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
 return {phase:cycle,frame:Math.floor(cycle/(Math.PI/4))%8};
}

/** Slow, natural travel times for the full outbound and return journeys. */
export function getAntTravelDurations(outboundDistance,returnDistance){
 const outbound=Math.max(0,Number(outboundDistance)||0);
 const returning=Math.max(0,Number(returnDistance)||0);
 return {outbound:5200+outbound*1.25,returning:4800+returning*1.15};
}

/** Keep the legacy bounded stagger for compatibility with earlier animation callers. */
export function getAntLaunchDelay(sequence,seed=0){
 const order=Math.max(0,Math.floor(Number(sequence)||0))%8;
 const jitter=Math.max(0,Math.min(1,Number(seed)||0))*28;
 return order*48+jitter;
}
/** Per-box queue: each worker exits after the previous one, without waiting for its return. */
export function getAntQueueDelay(order,seed=0){
 const position=Math.max(0,Math.floor(Number(order)||0));
 const jitter=Math.max(0,Math.min(1,Number(seed)||0))*24;
 return position*340+jitter;
}


/** A monotonic animation clock that stops advancing while the document is hidden. */
export function createPausableClock(readNow=()=>performance.now()){
 let pausedAt=null,realStart=readNow(),activeStart=0,speed=1;
 const activeTime=timestamp=>pausedAt===null?activeStart+(timestamp-realStart)*speed:activeStart;
 const setSpeed=(next,timestamp=readNow())=>{
  const value=[1,2,3,4].includes(Number(next))?Number(next):1;
  if(value===speed)return speed;
  if(pausedAt===null){activeStart=activeTime(timestamp);realStart=timestamp;}
  speed=value;
  return speed;
 };
 return{
  now(){return activeTime(readNow());},
  fromFrame(timestamp){return activeTime(timestamp);},
  getSpeed(){return speed;},
  setSpeed,
  pause(timestamp=readNow()){
   if(pausedAt===null){activeStart=activeTime(timestamp);pausedAt=timestamp;}
  },
  resume(timestamp=readNow()){
   if(pausedAt!==null){realStart=timestamp;pausedAt=null;}
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
