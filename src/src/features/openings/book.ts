const lines:{name:string;eco:string;san:string[]}[]=[
  {name:"Italienische Partie",eco:"C50",san:["e4","e5","Nf3","Nc6","Bc4","Bc5"]},
  {name:"Spanische Partie",eco:"C60",san:["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6"]},
  {name:"Sizilianische Verteidigung",eco:"B20",san:["e4","c5","Nf3","d6","d4","cxd4","Nxd4"]},
  {name:"Französische Verteidigung",eco:"C00",san:["e4","e6","d4","d5","Nc3","Nf6"]},
  {name:"Caro-Kann-Verteidigung",eco:"B10",san:["e4","c6","d4","d5","Nc3","dxe4"]},
  {name:"Damengambit",eco:"D06",san:["d4","d5","c4","e6","Nc3","Nf6"]},
  {name:"Londoner System",eco:"D02",san:["d4","d5","Bf4","Nf6","e3","e6"]},
];
export function isKnownBookMove(history:string[],ply:number){return ply<history.length&&lines.some(line=>ply<line.san.length&&line.san.slice(0,ply+1).every((move,index)=>move===history[index]));}
export function detectOpening(history:string[]){
  if(history.length>=5&&history.slice(0,5).join(" ")==="e4 e5 Nf3 Nc6 Bc4")return lines[0];
  if(history.length>=5&&history.slice(0,5).join(" ")==="e4 e5 Nf3 Nc6 Bb5")return lines[1];
  const line=lines.filter(candidate=>history.length>=2&&candidate.san.slice(0,history.length).every((move,index)=>move===history[index])).sort((a,b)=>b.san.length-a.san.length)[0];
  return line??null;
}
