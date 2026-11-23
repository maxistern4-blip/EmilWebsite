const mainlines=[
  ["e4","e5","Nf3","Nc6","Bc4","Bc5"],
  ["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6"],
  ["e4","c5","Nf3","d6","d4","cxd4","Nxd4"],
  ["e4","e6","d4","d5","Nc3","Nf6"],
  ["e4","c6","d4","d5","Nc3","dxe4"],
  ["d4","d5","c4","e6","Nc3","Nf6"],
  ["d4","d5","Bf4","Nf6","e3","e6"],
];
export function isKnownBookMove(history:string[],ply:number){
  return ply<history.length&&mainlines.some(line=>ply<line.length&&line.slice(0,ply+1).every((move,index)=>move===history[index]));
}
