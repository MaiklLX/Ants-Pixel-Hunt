export function isCampaignLevelUnlocked(levels,completedIds,levelId){
 const index=levels.findIndex(level=>level.id===levelId);
 if(index<0)return false;
 return index===0||completedIds.has(levels[index-1].id);
}
export function getNextCampaignLevel(levels,levelId){
 const index=levels.findIndex(level=>level.id===levelId);
 return index>=0?levels[index+1]||null:null;
}
