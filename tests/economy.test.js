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

test("meadow victory counter counts completed runs, including a replay",()=>{
 let state=createEconomy();state=completeMeadow(state);state=completeMeadow(state);
 assert.equal(state.completed,2);
 assert.equal(state.nectar,24);
});

test("nursery upgrades add a real nectar reward for each completed meadow",()=>{
 let state={...createEconomy(),nectar:60};
 const bought=purchaseBuilding(state,"nursery");assert.equal(bought.ok,true);state=bought.economy;
 state=completeMeadow(state);
 assert.equal(state.nectar,15);
 assert.equal(state.buildings.nursery,1);
});

test("Zen pending nectar is temporary and respects the nectar garden level",()=>{
 const colony={...createEconomy(),nectar:23,buildings:{garden:2,granary:1,nursery:1}};
 assert.equal(zenRunPendingReward(9,colony),0);
 assert.equal(zenRunPendingReward(10,colony),3);
 assert.equal(zenRunPendingReward(29,colony),6);
 assert.equal(colony.nectar,23,"calculating pending reward must not touch the permanent balance");
});

test("only a completed Zen run transfers pending nectar into the permanent colony balance",()=>{
 const colony={...createEconomy(),nectar:23,completed:4,buildings:{garden:2,granary:1,nursery:2}};
 const result=completeZenRun(colony,6);
 assert.equal(result.reward,27);
 assert.equal(result.economy.nectar,50);
 assert.equal(result.economy.completed,5);
 assert.equal(colony.nectar,23,"completion must not mutate the previous economy snapshot");
 assert.equal(colony.completed,4);
});

test("a failed Zen attempt discards temporary reward without changing permanent resources",()=>{
 const colony={...createEconomy(),nectar:41,completed:3,buildings:{garden:1,granary:0,nursery:0}};
 const pending=zenRunPendingReward(80,colony);
 const discardedPending=0;
 assert.equal(pending,16);
 assert.equal(discardedPending,0);
 assert.equal(colony.nectar,41);
 assert.equal(colony.completed,3);
});
