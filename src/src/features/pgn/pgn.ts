import { Chess, type Move } from "chess.js";
export type PgnCommentMap=Record<number,string>;
export function parsePgn(text:string){const game=new Chess();game.loadPgn(text);return game;}
export function extractComments(game:Chess):PgnCommentMap{
  const comments:PgnCommentMap={};const history=game.history({verbose:true});
  for(const item of game.getComments()){const match=history.findIndex(move=>move.after===item.fen);const ply=item.fen===new Chess().fen()?0:match>=0?match+1:-1;if(ply>=0)comments[ply]=item.comment;}
  return comments;
}
export function exportPgn(text:string,comments:PgnCommentMap={}){
  const game=parsePgn(text);const moves=game.history({verbose:true});const result=new Chess();
  for(let i=0;i<moves.length;i++){result.move(moves[i] as Move);const comment=comments[i+1];if(comment?.trim())result.setComment(comment.trim());}
  return result.pgn();
}
export async function readPgnFile(file:File){return file.text();}
