import { del, get, set } from "idb-keyval";
const LAST_PGN="emil-chess:last-pgn"; const LAST_ANALYSIS="emil-chess:last-analysis";
export async function saveLastPgn(pgn:string){try{await set(LAST_PGN,pgn)}catch{/* Private browsing can disable IndexedDB; the current page remains usable. */}}
export async function readLastPgn():Promise<string>{try{return (await get<string>(LAST_PGN))??""}catch{return ""}}
export async function saveLastAnalysis(analysis:unknown){try{await set(LAST_ANALYSIS,analysis)}catch{/* Keep using the active session if storage is unavailable. */}}
export async function readLastAnalysis<T>():Promise<T|null>{try{return (await get<T>(LAST_ANALYSIS))??null}catch{return null}}
export async function clearLastAnalysis(){try{await del(LAST_ANALYSIS)}catch{/* no-op */}}
