export type GradeKind = "best"|"excellent"|"good"|"inaccuracy"|"mistake"|"blunder"|"brilliant"|"great"|"book";
export type MoveGrade = { ply:number; kind:GradeKind; loss:number; bestMove?:string; playedMove?:string; accuracy?:number; evaluation?:number; side?:"w"|"b"; phase?:"opening"|"middlegame"|"endgame" };
export function evaluateLoss(expectedCp:number, actualCp:number, ply:number):MoveGrade {
  const loss=Math.max(0,Math.round(expectedCp-actualCp));
  const kind:GradeKind=loss>=300?"blunder":loss>=150?"mistake":loss>=60?"inaccuracy":loss<12?"best":loss<28?"excellent":"good";
  return {ply,kind,loss};
}
