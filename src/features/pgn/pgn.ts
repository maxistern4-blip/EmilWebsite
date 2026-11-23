import { Chess } from "chess.js";
export function parsePgn(text:string){const game=new Chess();game.loadPgn(text);return game;}
export function exportPgn(game:Chess){return game.pgn();}
export async function readPgnFile(file:File){return file.text();}
