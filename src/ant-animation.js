export function getAntTripFrame(elapsed,delay,outbound,returning){
 if(elapsed<delay)return{waiting:true,picked:false,returningNow:false,progress:0,finished:false};
 const tripElapsed=elapsed-delay;
 const returningNow=tripElapsed>=outbound;
 const duration=returningNow?returning:outbound;
 const raw=Math.min(1,Math.max(0,(tripElapsed-(returningNow?outbound:0))/duration));
 const progress=raw*raw*(3-2*raw);
 return{waiting:false,picked:tripElapsed>=outbound,returningNow,progress,finished:tripElapsed>=outbound+returning};
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
