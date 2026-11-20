export function decodeSpriteArtwork(payload,colors){
 if(!payload||(payload.width!==35&&payload.width!==45)||payload.height!==payload.width||!Array.isArray(payload.palette)||payload.palette.length<1||payload.palette.length>36||typeof payload.data!=="string")throw new Error("Неверный формат. Нужна полянка 35×35 из мастерской спрайтов.");
 const sourceRows=payload.data.split("/");
 if(sourceRows.length!==payload.height||sourceRows.some(row=>row.length!==payload.width))throw new Error(`В файле должно быть ровно ${payload.height} строк по ${payload.width} клеток.`);
 // Older 45×45 exports remain importable: reduce them to the new 35×35 board.
 const rows=payload.width===35?sourceRows:Array.from({length:35},(_,y)=>Array.from({length:35},(_,x)=>sourceRows[Math.floor(y*45/35)][Math.floor(x*45/35)]).join(""));
 const palette=payload.palette.map(value=>{
  if(typeof value!=="string"||!/^#[0-9a-f]{6}$/i.test(value))throw new Error("В палитре обнаружен некорректный цвет.");
  const hex=value.toLowerCase(),key="custom_"+hex.slice(1);
  // Keep the sprite's own RGB value. Do not remap it to one of the game's
  // decorative campaign colors: that second quantization visibly damages art.
  if(!colors[key])colors[key]={hex,name:"Авторский "+hex.toUpperCase(),short:hex.slice(1,3).toUpperCase()};
  return key;
 });
 return rows.map(row=>Array.from(row,char=>{
  if(char===".")return "";
  const index=parseInt(char,36);
  if(!Number.isInteger(index)||index<0||index>=palette.length)throw new Error("В рисунке есть ссылка на отсутствующий цвет.");
  return palette[index];
 }));
}
