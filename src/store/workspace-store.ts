import { create } from "zustand";
import { Chess } from "chess.js";
export type WorkspaceState={fen:string;pgn:string;selectedPly:number;setFen:(fen:string)=>void;setPgn:(pgn:string)=>void;setPly:(ply:number)=>void};
export const useWorkspace=create<WorkspaceState>((set)=>({fen:new Chess().fen(),pgn:"",selectedPly:0,setFen:(fen)=>set({fen}),setPgn:(pgn)=>set({pgn}),setPly:(selectedPly)=>set({selectedPly})}));
