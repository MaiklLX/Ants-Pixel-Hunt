import test from "node:test";
import assert from "node:assert/strict";
import {createEconomy,normalizeEconomy,collectCube,completeMeadow,purchaseBuilding,BUILDINGS,buildingCost} from "../src/economy.js";

test("nectar is awarded for every ten collected cubes and progress carries over",()=>{
 let state=createEconomy();for(let i=0;i<9;i++)state=collectCube(state);
 assert.equal(state.nectar,0);assert.equal(state.progress,9);
 state=collectCube(state);assert.equal(state.nectar,1);assert.equal(state.progress,0);
});
test("nectar garden increases cube rewards",()=>{
 let state={...createEconomy(),nectar:30};const bought=purchaseBuilding(state,"garden");
 assert.equal(bought.ok,true);state=bought.economy;
 for(let i=0;i<10;i++)state=collectCube(state);
 assert.equal(state.nectar,2);
});
test("granary increases completed meadow reward",()=>{
 let state={...createEconomy(),nectar:45};state=purchaseBuilding(state,"granary").economy;
 state=completeMeadow(state);assert.equal(state.nectar,17);assert.equal(state.completed,1);
});
test("building purchases enforce balance and three-level cap",()=>{
 let state={...createEconomy(),nectar:1000};
 for(let i=0;i<3;i++){const result=purchaseBuilding(state,"nursery");assert.equal(result.ok,true);state=result.economy;}
 assert.equal(purchaseBuilding(state,"nursery").reason,"max");
 assert.equal(state.buildings.nursery,3);
 assert.equal(buildingCost(BUILDINGS[0],2),90);
});
test("economy save normalization rejects invalid values and clamps upgrades",()=>{
 const state=normalizeEconomy({nectar:-2,progress:23,lifetime:"12",buildings:{garden:9,granary:-1,nursery:2}});
 assert.deepEqual(state,{nectar:0,progress:3,lifetime:12,completed:0,buildings:{garden:3,granary:0,nursery:2}});
});
