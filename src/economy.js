export const BUILDINGS=[
 {id:"garden",name:"Сад нектара",icon:"🌼",description:"Больше нектара за каждые 10 собранных кубиков.",baseCost:30},
 {id:"granary",name:"Большое хранилище",icon:"🧺",description:"Больше награда за полностью собранную полянку.",baseCost:45},
 {id:"nursery",name:"Питомник героев",icon:"🐣",description:"Готовит колонию к появлению особых муравьёв.",baseCost:60}
];
export function createEconomy(){return{nectar:0,progress:0,lifetime:0,completed:0,buildings:{garden:0,granary:0,nursery:0}};}
export function normalizeEconomy(value){
 const base=createEconomy();if(!value||typeof value!=="object")return base;
 base.nectar=Math.max(0,Math.floor(Number(value.nectar)||0));base.progress=Math.max(0,Math.floor(Number(value.progress)||0))%10;
 base.lifetime=Math.max(0,Math.floor(Number(value.lifetime)||0));base.completed=Math.max(0,Math.floor(Number(value.completed)||0));
 for(const item of BUILDINGS)base.buildings[item.id]=Math.max(0,Math.min(3,Math.floor(Number(value.buildings?.[item.id])||0)));
 return base;
}
export function collectCube(economy){
 const next=normalizeEconomy(economy);next.progress++;next.lifetime++;
 if(next.progress>=10){next.progress=0;next.nectar+=1+next.buildings.garden;}
 return next;
}
export function completeMeadow(economy){
 const next=normalizeEconomy(economy);next.completed++;next.nectar+=12+next.buildings.granary*5;return next;
}
export function buildingCost(building,level){return building.baseCost*(level+1);}
export function purchaseBuilding(economy,id){
 const next=normalizeEconomy(economy),building=BUILDINGS.find(item=>item.id===id);
 if(!building)return{ok:false,economy:next,reason:"unknown"};
 const level=next.buildings[id],cost=buildingCost(building,level);
 if(level>=3)return{ok:false,economy:next,reason:"max"};
 if(next.nectar<cost)return{ok:false,economy:next,reason:"funds",cost};
 next.nectar-=cost;next.buildings[id]++;return{ok:true,economy:next,cost};
}
