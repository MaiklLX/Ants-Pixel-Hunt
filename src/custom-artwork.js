export function decodeSpriteArtwork(payload,colors){
 if(!payload||payload.width!==45||payload.height!==45||!Array.isArray(payload.palette)||payload.palette.length<1||payload.palette.length>36||typeof payload.data!=="string")throw new Error("Неверный формат. Нужна полянка 45×45 из мастерской спрайтов.");
 const rows=payload.data.split("/");
 if(rows.length!==45||rows.some(row=>row.length!==45))throw new Error("В файле должно быть ровно 45 строк по 45 клеток.");
 const palette=payload.palette.map(value=>{
  if(typeof value!=="string"||!/^#[0-9a-f]{6}$/i.test(value))throw new Error("В палитре обнаружен некорректный цвет.");
  const rgb=[1,3,5].map(index=>parseInt(value.slice(index,index+2),16));
  let best="green",distance=Infinity;
  for(const [name,color] of Object.entries(colors)){
   if(name==="black"||name==="gray")continue;
   const target=color.hex.slice(1).match(/../g).map(part=>parseInt(part,16));
   const d=rgb.reduce((sum,channel,index)=>sum+(channel-target[index])**2,0);
   if(d<distance){distance=d;best=name;}
  }
  return best;
 });
 return rows.map(row=>Array.from(row,char=>{
  if(char===".")return "";
  const index=parseInt(char,36);
  if(!Number.isInteger(index)||index<0||index>=palette.length)throw new Error("В рисунке есть ссылка на отсутствующий цвет.");
  return palette[index];
 }));
}
