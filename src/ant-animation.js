export function getAntTripFrame(elapsed,delay,outbound,returning){
 if(elapsed<delay)return{waiting:true,picked:false,returningNow:false,progress:0,finished:false};
 const tripElapsed=elapsed-delay;
 const returningNow=tripElapsed>=outbound;
 const duration=returningNow?returning:outbound;
 const raw=Math.min(1,Math.max(0,(tripElapsed-(returningNow?outbound:0))/duration));
 const progress=raw*raw*(3-2*raw);
 return{waiting:false,picked:tripElapsed>=outbound,returningNow,progress,finished:tripElapsed>=outbound+returning};
}
