import test from "node:test";
import assert from "node:assert/strict";
import {isCampaignLevelUnlocked,getNextCampaignLevel} from "../src/campaign.js";
const levels=[{id:"one"},{id:"two"},{id:"three"}];
test("only the first campaign level is unlocked at the beginning",()=>{
 const completed=new Set();
 assert.equal(isCampaignLevelUnlocked(levels,completed,"one"),true);
 assert.equal(isCampaignLevelUnlocked(levels,completed,"two"),false);
 assert.equal(isCampaignLevelUnlocked(levels,completed,"three"),false);
});
test("winning a level unlocks exactly the next level",()=>{
 const completed=new Set(["one"]);
 assert.equal(isCampaignLevelUnlocked(levels,completed,"two"),true);
 assert.equal(isCampaignLevelUnlocked(levels,completed,"three"),false);
 completed.add("two");
 assert.equal(isCampaignLevelUnlocked(levels,completed,"three"),true);
});
test("campaign progression safely handles unknown ids and the final level",()=>{
 assert.equal(isCampaignLevelUnlocked(levels,new Set(),"missing"),false);
 assert.equal(getNextCampaignLevel(levels,"one"),levels[1]);
 assert.equal(getNextCampaignLevel(levels,"three"),null);
 assert.equal(getNextCampaignLevel(levels,"missing"),null);
});
